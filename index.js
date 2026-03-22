import './config.js'
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'

import pino from 'pino'
import qrcode from 'qrcode-terminal'
import readline from 'readline'
import handler from './wzbur.js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const { version } = await fetchLatestBaileysVersion()

  console.log(`
╔══════════════════════╗
║   🔥 JUAN BOT 🔥     ║
╠══════════════════════╣
║ 1 ➤ Código conexión  ║
║ 2 ➤ Código QR        ║
╚══════════════════════╝
`)

  rl.question('👉 Elige (1 o 2): ', async (opcion) => {

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state
    })

    if (opcion === '1') {
      const numero = await new Promise(resolve => {
        rl.question('📱 Número (573...): ', resolve)
      })

      const code = await sock.requestPairingCode(numero)

      console.log(`
╔══════════════════════╗
║ 🔗 CÓDIGO DE LINK    ║
╠══════════════════════╣
║ ${code}              
╚══════════════════════╝
`)
    }

    sock.ev.on('connection.update', (update) => {
      const { connection, qr, lastDisconnect } = update

      if (qr && opcion === '2') {
        console.log(`
╔══════════════════════╗
║     📲 ESCANEA QR    ║
╚══════════════════════╝
`)
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

    sock.ev.on('messages.upsert', async ({ messages }) => {
      try {
        const msg = messages[0]
        if (!msg.message) return
        if (msg.key.fromMe) return

        await handler(sock, msg)

      } catch (e) {
        console.log('❌ Error:', e)
      }
    })

  })
}

startBot()