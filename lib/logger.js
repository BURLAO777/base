import { cleanJid } from './functions.js'

export const logGroupMessage = (msg) => {
  try {
    const from = msg.key.remoteJid
    if (!from.endsWith('@g.us')) return

    
    let sender = msg.key.participant || msg.participant || ''

    if (!sender || sender.endsWith('@g.us')) {
      sender = msg.key.participant || ''
    }

    const senderClean = cleanJid(sender)

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      '[Mensaje no texto]'

    console.log(`
╭─〔 📩 MENSAJE GRUPO 〕
│ 👤 Usuario: ${senderClean || 'desconocido'}
│ 📍 Grupo: ${from}
│ 💬 Mensaje: ${body}
╰────────────
`)
  } catch (e) {
    console.error('Error log:', e)
  }
}