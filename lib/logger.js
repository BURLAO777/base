import { cleanJid } from './functions.js'

const groupCache = new Map()
const userCache = new Map()

export const logGroupMessage = async (sock, msg) => {
  try {
    const from = msg.key.remoteJid
    if (!from.endsWith('@g.us')) return

    
    let groupName = groupCache.get(from)

    if (!groupName) {
      try {
        const meta = await sock.groupMetadata(from)
        groupName = meta.subject || from
        groupCache.set(from, groupName)
      } catch {
        groupName = from
      }
    }

    
    let sender = msg.key.participant || msg.participant || ''
    if (!sender || sender.endsWith('@g.us')) {
      sender = msg.key.participant || ''
    }

    let userName = userCache.get(sender)

    if (!userName) {
      try {
        const contact = await sock.onWhatsApp(sender)
        userName = contact?.[0]?.notify || cleanJid(sender)
        userCache.set(sender, userName)
      } catch {
        userName = cleanJid(sender)
      }
    }

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      '[Mensaje no texto]'

    console.log(`
╭─〔 📩 MENSAJE GRUPO 〕
│ 👤 Usuario: ${userName}
│ 🆔 Número: ${cleanJid(sender)}
│ 🏷️ Grupo: ${groupName}
│ 💬 Mensaje: ${body}
╰────────────
`)
  } catch (e) {
    console.error('❌ Error log:', e)
  }
}