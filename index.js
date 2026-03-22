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

const question = (text) => new Promise((resolve) => rl.question(text, resolve))

function normalizePhone(number) {
  let n = number.replace(/\D+/g, '')
  if (n.startsWith('0')) n = n.slice(1)
  return n
}

async function startBot() {
  try {
    const methodCodeQR = process.argv.includes('qr')
    const methodCode = process.argv.includes('code')
    const hasSavedSession = await existsAuthSession()

    if (!hasSavedSession) {
      if (methodCodeQR) {
        currentOption = '2'
      } else if (methodCode) {
        currentOption = '1'
      } else {
        console.log(`\n╔══════════════════════╗`)
        console.log('║   🔥 JUAN BOT 🔥     ║')
        console.log('╠══════════════════════╣')
        console.log('║ 1 ➤ Código de texto  ║')
        console.log('║ 2 ➤ Código QR        ║')
        console.log('╚══════════════════════╝\n')

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
    console.log('❌ Error en startBot:', error)
  }
}

async function existsAuthSession() {
  try {
    const authFolder = './auth'
    const fs = await import('fs')
    return fs.existsSync(authFolder)
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
      logger: pino({ level: 'silent' }),
      auth: state,
      printQRInTerminal: false
    })

    if (currentOption === '1' && currentNumber) {
      if (typeof sock.requestPairingCode === 'function') {
        try {
          const code = await sock.requestPairingCode(currentNumber)
          console.log(`\n╔══════════════════════╗\n║ 🔗 CÓDIGO DE LINK    ║\n╠══════════════════════╣\n║ ${code} \n╚══════════════════════╝\n`)
          console.log('✅ Se generó el código de conexión. Mantén el número en la app.')
        } catch (err) {
          console.log('❌ No se pudo generar el código de conexión:', err)
          console.log('📌 Usa QR opción 2 si la función no está disponible.')
        }
      } else {
        console.log('❌ requestPairingCode no disponible en esta versión de Baileys. Usa la opción 2 para QR.')
      }
    }

    sock.ev.on('connection.update', connectionUpdate)
    sock.ev.on('creds.update', saveCredsFn)

    sock.ev.on('messages.upsert', async ({ messages }) => {
      try {
        const msg = messages[0]
        if (!msg?.message) return
        if (msg.key?.fromMe) return
        await handler(sock, msg)
      } catch (e) {
        console.log('❌ Error en mensajes.upsert:', e)
      }
    })

    console.log('🚀 Bot iniciado. Espera la info de conexión en consola (QR / código).')
  } catch (error) {
    console.log('❌ Error en createSocket:', error)
  }
}

async function connectionUpdate(update) {
  const { connection, qr, lastDisconnect } = update
  const statusCode = lastDisconnect?.error?.output?.statusCode

  console.log('🔄 connection.update', connection ?? 'undefined', qr ? '(QR recibido)' : '', statusCode ?? '')

  if (qr) {
    console.clear()
    console.log('\n╔══════════════════════╗')
    console.log('║     📲 ESCANEA QR    ║')
    console.log('╚══════════════════════╝\n')
    qrcode.generate(qr, { small: true })
  }

  if (connection === 'open') {
    restartAttempts = 0
    console.log('✅ BOT CONECTADO')
    return
  }

  if (connection === 'close') {
    const shouldReconnect = statusCode !== DisconnectReason.loggedOut
    console.log('⚠️ Conexión cerrada', lastDisconnect?.error?.message || '', 'reason=', statusCode)

    if (!shouldReconnect) {
      console.log('🔒 Sesión cerrada. Elimina auth/ y reinicia.')
      return
    }

    if (restartAttempts >= MAX_RESTARTS) {
      console.log('❌ Límite de reintentos alcanzado. Reinicia manualmente.')
      return
    }

    restartAttempts += 1
    const wait = 5000
    console.log(`🔁 Reinicio ${restartAttempts}/${MAX_RESTARTS} en ${wait / 1000}s...`)
    setTimeout(async () => {
      if (sock?.ws?.socket) {
        try { sock.ws.close() } catch (e) {}
      }
      await createSocket()
    }, wait)
  }
}

startBot()
