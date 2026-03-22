process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

let restartAttempts = 0
const MAX_RESTARTS = 3
let currentOption = null
let currentNumber = null
let sock = null
let saveCredsFn = null
let pairingRequested = false

const question = (text) => new Promise((resolve) => rl.question(text, resolve))

function normalizePhone(number) {
  let n = number.replace(/\D+/g, '')
  if (n.startsWith('0')) n = n.slice(1)
  return n
}

async function startBot() {
  try {
    console.log('🚀 Iniciando bot...')
    const methodCodeQR = process.argv.includes('qr')
    const methodCode = process.argv.includes('code')
    const hasSavedSession = await existsAuthSession()

    console.log('📦 Sesión existente:', hasSavedSession)

    if (!hasSavedSession) {
      console.log(`\n╔══════════════════════╗`)
      console.log('║   🔥 JUAN BOT 🔥     ║')
      console.log('╠══════════════════════╣')
      console.log('║ 1 ➤ Código de texto  ║')
      console.log('║ 2 ➤ Código QR        ║')
      console.log('╚══════════════════════╝\n')

      if (methodCode) {
        currentOption = '1'
      } else if (methodCodeQR) {
        currentOption = '2'
      } else {
        do {
          currentOption = (await question('👉 Elige (1 o 2): ')).trim()
          if (!/^[12]$/.test(currentOption)) {
            console.log('⚠️ Opción inválida. Usa 1 o 2.')
          }
        } while (!/^[12]$/.test(currentOption))
      }

      if (currentOption === '1') {
        const numeroRaw = (await question('📱 Número (573XXX sin +): ')).trim()
        currentNumber = normalizePhone(numeroRaw)
        console.log('🔗 Pedido de código de conexión para:', currentNumber)
      } else {
        console.log('📲 Opción QR elegida: espera el QR en pantalla.')
      }
    } else {
      console.log('✅ Ya existe sesión guardada. Usando auth existente.')
    }

    await createSocket()
  } catch (error) {
    console.error('❌ Error en startBot:', error)
  }
}

async function existsAuthSession() {
  try {
    const authFolder = './auth'
    const fs = await import('fs')
    return fs.existsSync(authFolder)
  } catch (e) {
    console.error('❌ Error verificando sesión:', e)
    return false
  }
}

async function createSocket() {
  try {
    console.log('🔌 Creando conexión...')
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    saveCredsFn = saveCreds

    const { version } = await fetchLatestBaileysVersion()
    console.log('📦 Versión Baileys:', version)

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
          console.log('\n╔══════════════════════╗')
          console.log('║     📲 ESCANEA QR    ║')
          console.log('╚══════════════════════╝\n')
          qrcode.generate(qr, { small: true })
        }

        if (
          connection === 'connecting' &&
          currentOption === '1' &&
          currentNumber &&
          !pairingRequested
        ) {
          pairingRequested = true
          try {
            const code = await sock.requestPairingCode(currentNumber)
            console.log(`\n╔══════════════════════╗\n║ 🔗 CÓDIGO DE LINK    ║\n╠══════════════════════╣\n║ ${code} \n╚══════════════════════╝\n`)
          } catch (err) {
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

          console.error('⚠️ Conexión cerrada:', {
            reason: statusCode,
            error: lastDisconnect?.error?.message
          })

          if (!shouldReconnect) {
            console.log('🔒 Sesión cerrada definitivamente')
            return
          }

          if (restartAttempts >= MAX_RESTARTS) {
            console.log('❌ Límite de reinicios alcanzado')
            return
          }

          restartAttempts++
          const wait = 5000

          console.log(`🔁 Reinicio ${restartAttempts}/${MAX_RESTARTS} en ${wait / 1000}s`)

          setTimeout(async () => {
            try {
              if (sock?.ws?.socket) sock.ws.close()
            } catch (e) {
              console.error('❌ Error cerrando socket:', e)
            }

            await createSocket()
          }, wait)
        }
      } catch (e) {
        console.error('❌ Error en connection.update:', e)
      }
    })

    sock.ev.on('creds.update', saveCredsFn)

    sock.ev.on('messages.upsert', async ({ messages }) => {
      try {
        const msg = messages[0]
        if (!msg?.message) return
        if (msg.key?.fromMe) return

        console.log('📩 Mensaje recibido de:', msg.key.remoteJid)

        await handler(sock, msg)
      } catch (e) {
        console.error('❌ Error en mensajes.upsert:', e)
      }
    })

    console.log('🚀 Bot iniciado correctamente')
  } catch (error) {
    console.error('❌ Error en createSocket:', error)
  }
}

startBot()
