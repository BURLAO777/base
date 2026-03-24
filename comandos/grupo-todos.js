export default {
  name: 'todos',
  group: true,
  admin: true,

  run: async ({ sock, from, participants, groupMetadata, msg }) => {
    try {
      let members = (participants || groupMetadata?.participants || [])
        .map(p => p?.jid || (p?.id?.includes('@s.whatsapp.net') ? p.id : null))
        .filter(Boolean)

      if (!members.length) {
        const meta = await sock.groupMetadata(from)
        members = (meta?.participants || []).map(p => p.jid).filter(Boolean)
      }

      members = [...new Set(members)]

      if (!members.length) {
        return await sock.sendMessage(from, { 
          text: '⚠️ No se pudieron obtener miembros del grupo.' 
        }, { quoted: msg })
      }

      const header = `*!  MENCION GENERAL  !*\n*PARA ${members.length} MIEMBROS* 🗣️\n┏━━━━❏\n*👥 Miembros: ${members.length}*`
      const list = members.map(jid => `│ 🍷 ➭ @${jid.split('@')[0]}`).join('\n')
      const footer = `┗━━━━❏\n\n𝘚𝘶𝘱𝘦𝘳 𝘉𝘰𝘵 𝘞𝘩𝘢𝘵𝘴𝘈𝘱𝘱 🍷`
      const text = `${header}\n${list}\n${footer}`

      await sock.sendMessage(from, { 
        text: text, 
        mentions: members
      }, { quoted: msg })

    } catch (error) {
      console.error('❌ Error en invocar:', error)

      await sock.sendMessage(from, { 
        text: '❌ Error al invocar miembros.' 
      }, { quoted: msg })
    }
  }
}