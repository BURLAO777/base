import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"

import qrcode from "qrcode-terminal"
import pino from "pino"
import { exec } from "child_process"

import { loadCommands } from "./lib/loader.js"
import { handleMessage } from "./handler/handler.js"
import { logGroupMessage } from "./lib/logger.js"

import "./config.js"

const logError = (title, error, extra = {}) => {
  console.log(`
╭━━━〔 ❌ ERROR DETECTADO 〕━━━╮
│ 🧠 Tipo: ${title}
│ 📍 Lugar: ${extra.location || 'Desconocido'}
│ 👤 Usuario: ${extra.sender || 'N/A'}
│ 📦 Comando: ${extra.command || 'N/A'}
│
│ 📄 Mensaje:
│ ${error?.message || error}
│
│ 🧾 Stack:
${(error?.stack || '').split('\n').slice(0, 5).join('\n')}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`)
}

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

async function askMode() {
  console.clear()
  console.log(`╭━━━━━━━━━━━━━━━━━━━━━━╮`)
  console.log(`│     🤖 JUAN BOT      │`)
  console.log(`├━━━━━━━━━━━━━━━━━━━━━━┤`)
  console.log(`│ 1 ➤ Código de texto  │`)
  console.log(`│ 2 ➤ Código QR        │`)
  console.log(`╰━━━━━━━━━━━━━━━━━━━━━━╯\n`)

  while (true) {
    process.stdout.write("👉 Elige (1 o 2): ")
    const pick = (await inputLine()).trim()
    if (pick === "1" || pick === "2") return pick
    console.log("⚠️ Opción inválida.")
  }
}

async function askPhone() {
  while (true) {
    console.log("\n📲 Ingresa tu número")
    console.log("Ejemplo: 504XXXXXXXX\n")

    process.stdout.write("📱 Número: ")
    const phone = (await inputLine()).trim()

    const clean = phone.replace(/\D/g, "")
    if (clean.length >= 10) return clean

    console.log("❌ Número inválido.\n")
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function startSock() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const alreadyLinked = !!state?.creds?.registered

    let mode = "qr"
    let phone = ""

    if (!alreadyLinked) {
      const pick = await askMode()
      mode = pick === "1" ? "code" : "qr"

      if (mode === "code") {
        phone = await askPhone()
      }
    } else {
      console.log("✅ Sesión ya vinculada\n")
    }

    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.macOS("Chrome")
    })

    
    const originalSend = sock.sendMessage

    sock.sendMessage = async (jid, content, options = {}) => {
      try {
        const rcanal = {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363419404216418@newsletter',
            serverMessageId: 100,
            newsletterName: 'ꘓ ✧ 𝖩𝗎𝖺𝗇 𝖡𝗈𝗍𝗌 ┆𝖮𝖿𝗂𝖼𝗂𝖺𝗅 𝖢𝗁𝖺𝗇𝗇𝖾𝗅 ❖ 🍷 ꘔ'
          }
        }

        if (typeof content === 'object') {
          content.contextInfo = {
            ...(content.contextInfo || {}),
            ...rcanal
          }
        }

        return await originalSend(jid, content, options)
      } catch (e) {
        console.error('❌ RCANAL ERROR:', e)
        return await originalSend(jid, content, options)
      }
    }

    sock.ev.on("creds.update", saveCreds)

    let pairingRequested = false

    sock.ev.on("connection.update", async (u) => {
      const { connection, lastDisconnect, qr } = u

      if (!alreadyLinked && mode === "qr" && qr) {
        console.clear()
        console.log("\n📲 ESCANEA EL QR\n")
        qrcode.generate(qr, { small: true })
      }

      if (!alreadyLinked && mode === "code" && qr && !pairingRequested) {
        pairingRequested = true

        try {
          console.log("\n⏳ Generando código...\n")
          const code = await sock.requestPairingCode(phone)
          console.log("🔗 CÓDIGO:\n" + code + "\n")
        } catch (e) {
          pairingRequested = false
          logError('PAIRING CODE', e, { location: 'connection.update' })
        }
      }

      if (connection === "open") {
        console.log(`
╭━━━━━━━━━━━━━━━━━━━━━━╮
│   ✅ CONECTADO       │
│   🚀 Juan Bot listo  │
╰━━━━━━━━━━━━━━━━━━━━━━╯
`)
      }

      if (connection === "close") {
        const code = lastDisconnect?.error?.output?.statusCode
        const isLoggedOut = code === DisconnectReason.loggedOut

        console.log("❌ Conexión cerrada:", code)

        if (isLoggedOut) {
          console.log("🔒 Sesión cerrada. Borra /session")
          return
        }

        await sleep(3000)
        startSock()
      }
    })

    await loadCommands()

    setInterval(() => {
      exec('git pull', async (err, stdout) => {
        if (err) return

        if (
          stdout.includes('Updating') ||
          stdout.includes('changed') ||
          stdout.includes('Fast-forward')
        ) {
          console.log(`
🔄 ACTUALIZACIÓN DESDE GITHUB
${stdout}
`)
          await loadCommands()
        }
      })
    }, 15000)

    sock.ev.on("messages.upsert", async ({ messages }) => {
      for (const msg of messages || []) {
        try {
          if (!msg.message) continue

          await logGroupMessage(sock, msg)
          await handleMessage(sock, msg)

        } catch (e) {
          logError('MENSAJE', e, {
            location: 'messages.upsert',
            sender: msg?.key?.participant || msg?.key?.remoteJid
          })
        }
      }
    })

    return sock

  } catch (e) {
    logError('INICIO BOT', e, { location: 'startSock' })
  }
}

process.on('uncaughtException', (err) => {
  logError('UNCAUGHT EXCEPTION', err)
})

process.on('unhandledRejection', (err) => {
  logError('UNHANDLED PROMISE', err)
})

startSock()