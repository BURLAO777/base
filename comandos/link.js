export default {
  name: 'link',
  group: true,
  botAdmin: true,
  admin: true,
  owner: true,

  run: async ({ sock, from }) => {
    try {
      const code = await sock.groupInviteCode(from)
      const link = `https://chat.whatsapp.com/${code}`

      await sock.sendMessage(from, {
        text: `🔗 *LINK DEL GRUPO*\n\n${link}`
      })

    } catch (err) {
      await sock.sendMessage(from, {
        text: '❌ No pude obtener el link del grupo'
      })
      console.log(err)
    }
  }
}