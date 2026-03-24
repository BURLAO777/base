import { mentionUser } from '../lib/functions.js'

export default {
  name: 'open',
  group: true,
  admin: true,
  botAdmin: true,

  run: async ({ sock, from, sender, msg }) => {
    try {
      const m = mentionUser(msg, sender)

      await sock.groupSettingUpdate(from, 'not_announcement')

      await sock.sendMessage(from, {
        react: {
          text: '🔓',
          key: msg.key
        }
      })

      const text = `
╭━〔✧ 𝗔𝗖𝗖𝗜𝗢́𝗡 ✧〕━╮
┃
┃ ➤ ᥱᥣ grᥙ⍴᥆ һᥲ ѕіძ᥆
┃    ᥲᑲіᥱrt᥆ ᥲᥣ
┃    ρᥙᑲᥣіᥴ᥆
┃
┃ 👮 ${m.tag}
┃
╰━〔 ✧𝗦𝗜𝗦𝗧𝗘𝗠𝗔✧ 〕━╯
`

      await sock.sendMessage(from, {
        text,
        mentions: [m.jid]
      }, { quoted: msg })

    } catch (e) {
      console.error('❌ ERROR OPEN:', e)

      await sock.sendMessage(from, {
        text: '❌ Error al abrir el grupo'
      }, { quoted: msg })
    }
  }
}