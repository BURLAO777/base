export default {
  name: 'todos',
  group: true,
  admin: true,

  run: async ({ sock, from, participants, groupMetadata, msg }) => {
    try {
      // Obtener miembros del grupo
      let members = (participants || groupMetadata?.participants || [])
        .map(p => p?.jid || (p?.id?.includes('@s.whatsapp.net') ? p.id : null))
        .filter(Boolean)

      // Si no hay miembros, obtener desde metadata
      if (!members.length) {
        const meta = await sock.groupMetadata(from)
        members = (meta?.participants || []).map(p => p.jid).filter(Boolean)
      }

      // Eliminar duplicados
      members = [...new Set(members)]

      if (!members.length) {
        return await sock.sendMessage(from, { 
          text: '⚠️ No se pudieron obtener miembros del grupo.' 
        }, { quoted: msg })
      }

      // Construir mensaje
      const header = `*!  MENCION GENERAL  !*\n*PARA ${members.length} MIEMBROS* 🗣️\n┏━━━━❏\n*👥 Miembros: ${members.length}*`
      const list = members.map(jid => `│ 🍷 ➭ @${jid.split('@')[0]}`).join('\n')
      const footer = `┗━━━━❏\n\n𝘚𝘶𝘱𝘦𝘳 𝘉𝘰𝘵 𝘞𝘩𝘢𝘵𝘴𝘈𝘱𝘱 🍷`
      const text = `${header}\n${list}\n${footer}`

      // Enviar mensaje con menciones
      await sock.sendMessage(from, { 
        text: text, 
        mentions: members,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363419404216418@newsletter',
            serverMessageId: 100,
            newsletterName: 'ꘓ ✧ 𝖩𝗎𝖺𝗇 𝖡𝗈𝗍𝗌 ┆𝖮𝖿𝗂𝖼𝗂𝖺𝗅 𝖢𝗁𝖺𝗇𝗇𝖾𝗅 ❖ 🍷 ꘔ'
          }
        }
      }, { quoted: msg })

    } catch (error) {
      console.error('❌ Error en invocar:', error)

      await sock.sendMessage(from, { 
        text: '❌ Error al invocar miembros.' 
      }, { quoted: msg })
    }
  }
}
