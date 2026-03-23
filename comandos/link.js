export default {
  name: 'link',
  group: true,
  admin: true,
  botAdmin: true,

  run: async ({ sock, from, sender, isAdmin, isOwner, botAdmin }) => {
    console.log('📥 COMANDO LINK EJECUTADO')
    console.log({
      from,
      sender,
      isAdmin,
      isOwner,
      botAdmin
    })

    try {
      if (!botAdmin) {
        console.log('❌ BOT NO ES ADMIN')
        return await sock.sendMessage(from, {
          text: '❌ El bot debe ser administrador para obtener el link'
        })
      }

      const code = await sock.groupInviteCode(from)
      console.log('✅ CODE:', code)

      const link = `https://chat.whatsapp.com/${code}`

      await sock.sendMessage(from, {
        text: `🔗 LINK DEL GRUPO\n\n${link}`,
        mentions: [sender]
      })

    } catch (e) {
      console.error('❌ ERROR LINK:', e)
      await sock.sendMessage(from, {
        text: '❌ Error al obtener el link del grupo'
      })
    }
  }
}