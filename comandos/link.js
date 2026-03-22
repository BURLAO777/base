export default {
  name: 'link',
  group: true,
  admin: true,
  botAdmin: true,

  run: async ({ sock, from }) => {
    try {
      const code = await sock.groupInviteCode(from)
      const link = `https://chat.whatsapp.com/${code}`

      const text = 
`╭─〔 🔗 LINK DEL GRUPO 〕
│
│ 📎 ${link}
│
╰────────────`

      await sock.sendMessage(from, { text })

    } catch (e) {
      console.error('❌ Error en link:', e)
      await sock.sendMessage(from, {
        text: '❌ No se pudo obtener el link del grupo.'
      })
    }
  }
}