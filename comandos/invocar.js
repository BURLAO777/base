export default {
  name: 'invocar',
  group: true,
  admin: true,
  run: async ({ sock, from, participants, groupMetadata }) => {
    let members = []

    try {
      const raw = participants || groupMetadata?.participants || []

      members = raw
        .map(p => {
          if (typeof p === 'string') return p
          if (p?.jid) return p.jid // ✅ USAR jid (FIX REAL)
          if (p?.id && p.id.includes('@s.whatsapp.net')) return p.id
          return null
        })
        .filter(Boolean)

      if (!members.length) {
        const meta = await sock.groupMetadata(from)
        members = (meta?.participants || [])
          .map(p => p.jid || p.id)
          .filter(jid => jid && jid.includes('@s.whatsapp.net'))
      }

      members = [...new Set(members)]

      if (!members.length) {
        return sock.sendMessage(from, { text: '⚠️ No se pudieron obtener miembros del grupo.' })
      }

      const header =
`╭─〔 📣 INVOCACIÓN TOTAL 〕
│ 👥 Miembros: ${members.length}
│
│ 🔔 Notificando a todos...
├────────────`

      const list = members
        .map((jid, i) => {
          const num = jid.split('@')[0]
          return `│ ${String(i + 1).padStart(2, '0')} ➤ @${num}`
        })
        .join('\n')

      const footer = `╰────────────`

      const text = `${header}\n${list}\n${footer}`

      await sock.sendMessage(from, {
        text,
        mentions: members
      })

    } catch (e) {
      console.error('❌ Error en invocar:', e)
      await sock.sendMessage(from, { text: '❌ Error al invocar miembros.' })
    }
  }
}
