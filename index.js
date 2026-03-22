process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'

import './config.js'
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'

import pino from 'pino'
import qrcode from 'qrcode-terminal'
import handler from './wzbur.js'

const logger = pino({ level: 'debug' })

process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err)
})

process.on('unhandledRejection', (reason) => {
  console.error('💥 UNHANDLED REJECTION:', reason)
})

process.on('warning', (warning) => {
  console.warn('⚠️ WARNING:', warning)
})


function createInput() {
  process.stdin.setEncoding("utf8")
  process.stdin.resume()

  const queue = []
  let resolver = null

  function onData(chunk) {
    const line = String(chunk).trim()
    if (!line) return

    if (resolver) {
      const r = resolver
      resolver = null
      r(line)
    } else {
      queue.push(line)
    }
  }

  process.stdin.on("data", onData)

  return async function inputLine() {
    if (queue.length) return queue.shift()
    return await new Promise((res) => (resolver = res))
  }
}
const inputLine = createInput()

let restartAttempts = 0
const MAX_RESTARTS = 3
let currentOption = null
let currentNumber = null
let sock = null
let saveCredsFn = null
let pairingRequested = false

function normalizePhone(number) {
  let n = number.replace(/\D+/g, '')
  if (n.startsWith('0')) n = n.slice(1)
  return n
}

async function startBot() {
  try {
    console.log('🚀 Iniciando bot...')
    const hasSavedSession = await existsAuthSession()

    console.log('📦 Sesión existente:', hasSavedSession)

    if (!hasSavedSession) {
      console.log(`\n╔══════════════════════╗`)
      console.log('║   🔥 JUAN BOT 🔥     ║')
      console.log('╠══════════════════════╣')
      console.log('║ 1 ➤ Código de texto  ║')
      console.log('║ 2 ➤ Código QR        ║')
      console.log('╚══════════════════════╝\n')

      while (true) {
        process.stdout.write('👉 Elige (1 o 2): ')
        const pick = (await inputLine()).trim()

        if (pick === "1" || pick === "2") {
          currentOption = pick
          break
        }

        console.log('⚠️ Opción inválida.')
      }

      if (currentOption === '1') {
        process.stdout.write('📱 Número (573XXX sin +): ')
        const numeroRaw = await inputLine()
        currentNumber = normalizePhone(numeroRaw)
        console.log('🔗 Número recibido:', currentNumber)
      } else {
        console.log('📲 Espera el QR...')
      }
    } else {
      console.log('✅ Usando sesión guardada.')
    }

    await createSocket()
  } catch (error) {
    console.error('❌ Error en startBot:', error)
  }
}

async function existsAuthSession() {
  try {
    const fs = await import('fs')
    return fs.existsSync('./auth')
  } catch {
    return false
  }
}

async function createSocket() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    saveCredsFn = saveCreds

    const { version } = await fetchLatestBaileysVersion()

    sock = makeWASocket({
      version,
      logger,
      auth: state,
      printQRInTerminal: false
    })

    pairingRequested = false

    sock.ev.on('connection.update', async (update) => {
      try {
        const { connection, qr, lastDisconnect } = update
        const statusCode = lastDisconnect?.error?.output?.statusCode

        console.log('🔄 connection.update:', {
          connection,
          hasQR: !!qr,
          statusCode
        })

        if (qr && currentOption === '2') {
          console.clear()
          console.log('\n📲 ESCANEA EL QR\n')
          qrcode.generate(qr, { small: true })
        }

        
        if (qr && currentOption === '1' && currentNumber && !pairingRequested) {
          pairingRequested = true
          try {
            console.log('⏳ Generando código...')

            const code = await sock.requestPairingCode(currentNumber)

            console.log('\n🔗 CÓDIGO:')
            console.log(code + '\n')

          } catch (err) {
            pairingRequested = false
            console.error('❌ Error generando código:', err)
          }
        }

        if (connection === 'open') {
          restartAttempts = 0
          console.log('✅ BOT CONECTADO')
          return
        }

        if (connection === 'close') {
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut

          console.error('⚠️ Conexión cerrada:', statusCode)

          if (!shouldReconnect) {
            console.log('🔒 Sesión cerrada')
            return
          }

          if (restartAttempts >= MAX_RESTARTS) {
            console.log('❌ Límite alcanzado')
            return
          }

          restartAttempts++
          setTimeout(createSocket, 5000)
        }
      } catch (e) {
        console.error('❌ connection.update error:', e)
      }
    })

    sock.ev.on('creds.update', saveCredsFn)

    sock.ev.on('messages.upsert', async ({ messages }) => {
      try {
        const msg = messages[0]
        if (!msg?.message) return
        if (msg.key?.fromMe) return

        console.log('📩', msg.key.remoteJid)

        await handler(sock, msg)
      } catch (e) {
        console.error('❌ Error mensajes:', e)
      }
    })

    console.log('🚀 Bot iniciado')
  } catch (error) {
    console.error('❌ Error en createSocket:', error)
  }
}

startBot()
