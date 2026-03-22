export default {
  name: 'invocar',
  run: async ({ sock, from, isGroup, participants, groupMetadata }) => {
    if (!isGroup) {
      return sock.sendMessage(from, { text: '❗ Este comando solo funciona en grupos.' })
    }

    const rawMembers = participants || groupMetadata?.participants || []

    const members = rawMembers
      .map(p => {
        if (typeof p === 'string') return p
        if (p?.id) return p.id
        if (p?.jid) return p.jid
        return null
      })
      .filter(Boolean)
      .filter(jid => jid.endsWith('@s.whatsapp.net'))

    if (!members.length) {
      return sock.sendMessage(from, { text: '⚠️ No pude obtener los miembros del grupo.' })
    }

    const text = `📣 ¡Atención a todos!\n\n` +
      members.map(jid => `@${jid.split('@')[0]}`).join('\n')

    await sock.sendMessage(from, {
      text,
      mentions: members
    })
  }
}