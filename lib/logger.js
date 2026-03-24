import { cleanJid } from './functions.js'

export const logGroupMessage = async (sock, msg) => {
  try {
    const from = msg.key.remoteJid
    if (!from.endsWith('@g.us')) return

    
    let groupName = from
    try {
      const meta = await sock.groupMetadata(from)
      groupName = meta.subject
    } catch {}

    
    let sender = msg.key.participant || msg.participant || ''

    if (!sender || sender.endsWith('@g.us')) {
      sender = msg.key.participant || ''
    }

    const senderClean = cleanJid(sender)

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      '[Mensaje no texto]'

    console.log(`
╭─〔 📩 MENSAJE GRUPO 〕
│ 👤 Usuario: ${senderClean || 'desconocido'}
│ 🏷️ Grupo: ${groupName}
│ 💬 Mensaje: ${body}
╰────────────
`)
  } catch (e) {
    console.error('Error log:', e)
  }
}