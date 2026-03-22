import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'

import pino from 'pino'
import readline from 'readline'
import qrcode from 'qrcode-terminal'

import { loadCommands } from './lib/loader.js'
import { handleMessage } from './handler/handler.js'

import './config.js'


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (text) => new Promise(resolve => rl.question(text, resolve))


const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const { version } = await fetchLatestBaileysVersion()

  console.clear()

  console.log(`
╭━━━━━━━━━━━━━━━━━━━━━━╮
│     🤖 JUAN BOT      │
├━━━━━━━━━━━━━━━━━━━━━━┤
│ 1. Conectar con QR   │
│ 2. Código (PAIRING)  │
╰━━━━━━━━━━━━━━━━━━━━━━╯
`)

  const option = await question('👉 Elige opción: ')

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: ['Juan Bot', 'Safari', '1.0.0']
  })

  sock.ev.on('creds.update', saveCreds)

  
  if (option === '2') {
    const number = await question('📞 Ingresa tu número (504XXXXXXXX): ')

    setTimeout(async () => {
      const code = await sock.requestPairingCode(number)
      console.log(`\n🔑 Código de vinculación: ${code}\n`)
    }, 3000)
  }

  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr && option === '1') {
      console.log('\n📲 Escanea el QR:\n')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log(`
╭━━━━━━━━━━━━━━━━━━━━━━╮
│   ✅ CONECTADO       │
│   🚀 Juan Bot listo  │
╰━━━━━━━━━━━━━━━━━━━━━━╯
`)
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode

      if (reason !== DisconnectReason.loggedOut) {
        console.log('🔄 Reconectando...')
        startBot()
      } else {
        console.log('❌ Sesión cerrada, elimina carpeta session')
      }
    }
  })

  
  const commands = await loadCommands()

  
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    await handleMessage(sock, msg, commands)
  })
}

startBot()