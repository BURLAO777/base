import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import qrcode from 'qrcode-terminal'

// Prefijo
const prefix = '.'

// Cargar comandos
const comandos = new Map()
const comandosPath = './comandos'

fs.readdirSync(comandosPath).forEach(file => {
  if (file.endsWith('.js')) {
    const cmd = require(path.resolve(comandosPath, file))
    comandos.set(cmd.name, cmd)
  }
})

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false
  })

  // Conexión
  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update

    if (qr) {
      console.log('📲 Escanea el QR:')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ BOT CONECTADO')
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) startBot()
    }
  })

  sock.ev.on('creds.update', saveCreds)

  // Mensajes
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return
    if (msg.key.fromMe) return

    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ''

    if (!body.startsWith(prefix)) return

    const args = body.slice(prefix.length).trim().split(/ +/)
    const commandName = args.shift().toLowerCase()

    const command = comandos.get(commandName)
    if (!command) return

    try {
      await command.run({
        sock,
        msg,
        from,
        args,
        isGroup
      })
    } catch (e) {
      console.log('❌ Error en comando:', e)
    }
  })
}

startBot()