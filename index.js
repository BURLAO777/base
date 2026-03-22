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

        console.log('⚠️ Opción inválida. Usa 1 o 2.')
      }

      if (currentOption === '1') {
        process.stdout.write('📱 Número (573XXX sin +): ')
        const numeroRaw = await inputLine()
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
          connection &&
          currentOption === '1' &&
          currentNumber &&
          qr &&
          !pairingRequested
        ) {
          pairingRequested = true
          try {
            const code = await sock.requestPairingCode(currentNumber)
            console.log(`\n╔══════════════════════╗`)
            console.log('║ 🔗 CÓDIGO DE LINK    ║')
            console.log('╠══════════════════════╣')
            console.log(`║ ${code}`)
            console.log('╚══════════════════════╝\n')
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
