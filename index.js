import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'

import pino from 'pino'
import qrcode from 'qrcode-terminal'
import handler from './zinc.js'

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state
  })

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
}

startBot()