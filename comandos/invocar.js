export default {
  name: 'invocar',
  run: async ({ sock, from, isGroup, participants, groupMetadata }) => {
    if (!isGroup) {
      return sock.sendMessage(from, { text: '❗ Este comando solo funciona en grupos.' })
    }

    try {
      const msg = arguments[0]?.msg
      const sender =
        msg?.key?.participant ||
        msg?.key?.remoteJid

      const senderNum = String(sender || "").replace(/\D/g, "")

      
      const owners = (global.owner || []).map(x => String(x).replace(/\D/g, ""))
      const isOwner = owners.includes(senderNum)

      
      let meta = groupMetadata
      if (!meta) meta = await sock.groupMetadata(from)

      const admins = (meta?.participants || [])
        .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
        .map(p => (p.jid || p.id))

      const isAdmin = admins.includes(sender)

      if (!isAdmin && !isOwner) {
        return sock.sendMessage(from, { text: '⛔ Solo administradores pueden usar este comando.' })
      }

      
      let members = []

      const raw = participants || meta?.participants || []

      members = raw
        .map(p => {
          if (typeof p === 'string') return p
          if (p?.jid) return p.jid
          if (p?.id && p.id.includes('@s.whatsapp.net')) return p.id
          return null
        })
        .filter(Boolean)

      if (!members.length) {
        const m = await sock.groupMetadata(from)
        members = (m?.participants || [])
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