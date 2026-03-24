import { mentionUser } from '../lib/functions.js'

export default {
  name: 'close',
  group: true,
  admin: true,
  botAdmin: true,

  run: async ({ sock, from, sender, msg }) => {
    try {
      const m = mentionUser(msg, sender)

      await sock.groupSettingUpdate(from, 'announcement')

      await sock.sendMessage(from, {
        react: {
          text: '🔒',
          key: msg.key
        }
      })

      const text = `
╭━〔✧ 𝗔𝗖𝗖𝗜𝗢́𝗡 ✧〕━╮
┃
┃ ➤ ᥱᥣ grᥙ⍴᥆ һᥲ ѕіძ᥆
┃    ᥴᥱrrᥲძ᥆ ρ᥆r
┃    ᥙᥒ ᥲძmіᥒ
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
      console.error('❌ ERROR CLOSE:', e)

      await sock.sendMessage(from, {
        text: '❌ Error al cerrar el grupo'
      }, { quoted: msg })
    }
  }
}