import { mentionUser, getUser, isAdmin, isOwner } from '../lib/functions.js'

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
          text: '✦ Responde o menciona al usuario que deseas hacer admin'
        })
      }

      const targetUser = getUser(target)

      const targetIsAdmin = isAdmin(target, participants)
      const senderIsOwner = isOwner(sender)

      if (targetIsAdmin) {
        return sock.sendMessage(from, {
          text: '✦ Ese usuario ya es administrador'
        })
      }

      if (!senderIsOwner) {
        return sock.sendMessage(from, {
          text: '✦ Solo el owner puede dar admin'
        })
      }

      // ✅ PROMOVER
      await sock.groupParticipantsUpdate(from, [target], 'promote')

      // ✅ REACCIÓN AL MENSAJE
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
│ ✦ Ahora es administrador
╰────────────╯
`

      await sock.sendMessage(from, {
        text,
        mentions: [m.jid, target]
      })

    } catch (e) {
      console.error('❌ ERROR PROMOTE:', e)
      await sock.sendMessage(from, {
        text: '✦ Error al dar administrador'
      })
    }
  }
}
