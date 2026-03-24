import { mentionUser, getUser, isAdmin } from '../lib/functions.js'

export default {
  name: 'demote',
  group: true,
  admin: true,
  botAdmin: true,

  run: async ({ sock, from, sender, msg, participants }) => {
    try {
      const m = mentionUser(msg, sender)

      const target =
        msg.message?.extendedTextMessage?.contextInfo?.participant ||
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
        msg.message?.contextInfo?.participant

      if (!target) {
        return sock.sendMessage(from, {
          text: `
╭━〔✧ 𝗔𝗖𝗖𝗜𝗢́𝗡 ✧〕━╮
┃
┃ ➤ *rᥱs⍴᥆ᥒძᥱ ᥆ mᥱᥒᥴі᥆ᥒᥲ
┃    ᥲᥣ ᥙsᥙᥲrі᥆ 𝗊ᥙᥱ ძᥱsᥱᥲs
┃    ძᥱgrᥲძᥲr*
┃
╰━〔 ✧𝗦𝗜𝗦𝗧𝗘𝗠𝗔✧ 〕━╯
`
        })
      }

      const targetUser = getUser(target)

      const targetIsAdmin = isAdmin(target, participants)

      if (!targetIsAdmin) {
        return sock.sendMessage(from, {
          text: '𖣯 Ese usuario no es administrador'
        })
      }

      
      await sock.groupParticipantsUpdate(from, [target], 'demote')

      
      await sock.sendMessage(from, {
        react: {
          text: '⬇️',
          key: msg.key
        }
      })

      const text = `
╭─〔⬇️ 𝗔𝗗𝗠𝗜𝗡 𝗥𝗘𝗠𝗢𝗩𝗜𝗗𝗢〕─╮
│
│ 👤 𝗘𝗷𝗲𝗰𝘂𝘁𝗮𝗱𝗼 𝗽𝗼𝗿:
│ ➤ ${m.tag}
│
│ 📉 𝗨𝘀𝘂𝗮𝗿𝗶𝗼:
│ ➤ @${targetUser}
│
│ 𖣯 𝗬𝗮 𝗻𝗼 𝗲𝘀 𝗮𝗱𝗺𝗶𝗻𝗶𝘀𝘁𝗿𝗮𝗱𝗼𝗿
╰────────────╯
`

      await sock.sendMessage(from, {
        text,
        mentions: [m.jid, target]
      })

    } catch (e) {
      console.error('❌ ERROR DEMOTE:', e)
      await sock.sendMessage(from, {
        text: '𖣯 Error al quitar administrador'
      })
    }
  }
}