export default {
  name: 'link',
  group: true,
  admin: true,
  botAdmin: true,

  run: async ({ sock, from, sender, msg }) => {
    try {
      const code = await sock.groupInviteCode(from)
      const link = `https://chat.whatsapp.com/${code}`

    
      const mentionJid = msg.key.participant || sender
      const user = mentionJid.split('@')[0]

      const text = `
╭━━〔🔗 𝗟𝗜𝗡𝗞 𝗗𝗘𝗟 𝗚𝗥𝗨𝗣𝗢〕━━╮
┃
┃ 👤 𝗦𝗼𝗹𝗶𝗰𝗶𝘁𝗮𝗱𝗼 𝗽𝗼𝗿:
┃ ➤ @${user}
┃
┃ 📎 𝗘𝗻𝗹𝗮𝗰𝗲:
┃ ${link}
┃
╰━━━━━━━━━━━━━━━╯
`

      await sock.sendMessage(from, {
        text,
        mentions: [mentionJid]
      })

    } catch (e) {
      console.error('❌ ERROR LINK:', e)
      await sock.sendMessage(from, {
        text: '❌ No se pudo obtener el link del grupo'
      })
    }
  }
}