export default {
  name: 'invocar',
  run: async ({ sock, from, isGroup, participants, groupMetadata }) => {
    if (!isGroup) {
      return sock.sendMessage(from, { text: '❗ Este comando solo funciona en grupos.' })
    }

    const members = (participants || groupMetadata?.participants || []).map((p) => {
      if (typeof p === 'string') return p
      if (p?.id) return p.id
      if (p?.jid) return p.jid
      return null
    }).filter(Boolean)

    if (members.length === 0) {
      return sock.sendMessage(from, { text: '⚠️ No pude obtener los miembros del grupo para mencionar.' })
    }

    const mentionStrings = members.map((jid) => jid.replace(/@s\.whatsapp\.net$/, '@s.whatsapp.net'))

    // Construir el texto con @menciones para que WhatsApp lo muestre bien
    const mentionText = mentionStrings.map((jid) => `@${jid.split('@')[0]}`).join(' ')
    const text = `📣 ¡Atención todos! ${mentionStrings.length} participantes invocados:\n${mentionText}`

    await sock.sendMessage(from, {
      text,
      mentions: mentionStrings
    })
  }
}
