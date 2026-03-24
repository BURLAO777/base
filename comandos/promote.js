import { mentionUser, getUser, isAdmin } from '../lib/functions.js'

export default {
  name: 'promote',
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
          text: '> ➤『 𝗥𝗲𝘀𝗽𝗼𝗻𝗱𝗲 𝗼 𝗺𝗲𝗻𝗰𝗶𝗼𝗻𝗮 𝗮𝗹 𝘂𝘀𝘂𝗮𝗿𝗶𝗼 𝗾𝘂𝗲 𝗱𝗲𝘀𝗲𝗮𝘀 𝗵𝗮𝗰𝗲𝗿 𝗽𝗿𝗼𝗺𝗼𝘃𝗲𝗿 』'
        })
      }

      const targetUser = getUser(target)

      const targetIsAdmin = isAdmin(target, participants)

      if (targetIsAdmin) {
        return sock.sendMessage(from, {
          text: '> 𖣯 𝘌𝘴𝘦 𝘶𝘴𝘶𝘢𝘳𝘪𝘰 𝘺𝘢 𝘦𝘴 𝘢𝘥𝘮𝘪𝘯𝘪𝘴𝘵𝘳𝘢𝘥𝘰𝘳'
        })
      }

      
      await sock.groupParticipantsUpdate(from, [target], 'promote')

      
      await sock.sendMessage(from, {
        react: {
          text: '✅',
          key: msg.key
        }
      })

      const text = `
╭─〔✅ 𝗡𝗨𝗘𝗩𝗢 𝗔𝗗𝗠𝗜𝗡〕─╮
│
│ 👤 𝗘𝗷𝗲𝗰𝘂𝘁𝗮𝗱𝗼 𝗽𝗼𝗿:
│ ➤ ${m.tag}
│
│ 📈 𝗨𝘀𝘂𝗮𝗿𝗶𝗼:
│ ➤ @${targetUser}
│
│ 𖣯 𝗔𝗵𝗼𝗿𝗮 𝗲𝘀 𝗮𝗱𝗺𝗶𝗻𝗶𝘀𝘁𝗿𝗮𝗱𝗼𝗿
╰────────────╯
`

      await sock.sendMessage(from, {
        text,
        mentions: [m.jid, target]
      })

    } catch (e) {
      console.error('❌ ERROR PROMOTE:', e)
      await sock.sendMessage(from, {
        text: '𖣯 Error al dar administrador'
      })
    }
  }
}