export const logGroupMessage = (msg) => {
  try {
    const from = msg.key.remoteJid
    const sender = msg.key.participant || msg.key.remoteJid

    const isGroup = from.endsWith('@g.us')
    if (!isGroup) return

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      '[Mensaje no texto]'

    console.log(`
╭─〔 📩 MENSAJE GRUPO 〕
│ 👤 Usuario: ${sender}
│ 📍 Grupo: ${from}
│ 💬 Mensaje: ${body}
╰────────────
`)
  } catch (e) {
    console.error('Error log:', e)
  }
}