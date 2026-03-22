import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"

import qrcode from "qrcode-terminal"
import chalk from "chalk"
import handler from "./wzbur.js"


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
  console.log(`\n╔══════════════════════╗`)
  console.log('║   🔥 JUAN BOT 🔥     ║')
  console.log('╠══════════════════════╣')
  console.log('║ 1 ➤ Código de texto  ║')
  console.log('║ 2 ➤ Código QR        ║')
  console.log('╚══════════════════════╝\n')

  while (true) {
    process.stdout.write('👉 Elige (1 o 2): ')
    const pick = (await inputLine()).trim()

    if (pick === "1" || pick === "2") return pick

    console.log('⚠️ Opción inválida.')
  }
}

async function askPhone() {
  while (true) {
    console.log('\n📲 Ingresa tu número')
    console.log('Ejemplo: 504XXXXXXXX\n')

    process.stdout.write('📱 Número (sin +): ')
    const phone = (await inputLine()).trim()

    if (!phone) continue

    const clean = phone.replace(/\D/g, "")

    if (clean.length >= 10) return clean

    console.log('❌ Número inválido.\n')
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let RECONNECT_TRIES = 0

function nextBackoffMs() {
  const seq = [2000, 4000, 7000, 12000, 20000]
  return seq[Math.min(RECONNECT_TRIES, seq.length - 1)]
}

export async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState("sessions")
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
    console.log('✅ Sesión ya vinculada\n')
  }

  let waVersion = undefined
  try {
    const v = await fetchLatestBaileysVersion()
    waVersion = v?.version
  } catch {}

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.macOS("Chrome"),
    ...(Array.isArray(waVersion) ? { version: waVersion } : {})
  })

  sock.ev.on("creds.update", saveCreds)

  let pairingRequested = false

  sock.ev.on("connection.update", async (u) => {
    const { connection, lastDisconnect, qr } = u

    if (!alreadyLinked && mode === "qr" && qr) {
      console.clear()
      console.log('\n📲 ESCANEA EL QR\n')
      qrcode.generate(qr, { small: true })
    }

    if (!alreadyLinked && mode === "code" && qr && !pairingRequested) {
      pairingRequested = true
      try {
        console.log('\n⏳ Generando código...\n')
        const code = await sock.requestPairingCode(phone)
        console.log('🔗 CÓDIGO:\n' + code + '\n')
      } catch (e) {
        pairingRequested = false
        console.error('❌ Error código:', e)
      }
    }

    if (connection === "open") {
      RECONNECT_TRIES = 0
      console.log('✅ CONECTADO\n')
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode
      const isLoggedOut = code === DisconnectReason.loggedOut

      console.log('❌ Conexión cerrada:', code)

      if (isLoggedOut) {
        console.log('🔒 Sesión cerrada. Borra /sessions')
        return
      }

      RECONNECT_TRIES++
      const wait = nextBackoffMs()
      console.log(`🔁 Reconectando en ${wait / 1000}s...`)

      await sleep(wait)
      startSock()
    }
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages || []) {
      try { await handler(sock, msg) } catch {}
    }
  })

  return sock
}

startSock()