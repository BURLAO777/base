export default {
  name: 'link',
  group: true,
  admin: true,
  botAdmin: true,

  run: async ({ sock, from, sender }) => {
    console.log('📥 COMANDO LINK EJECUTADO')

    try {
      const code = await sock.groupInviteCode(from)
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