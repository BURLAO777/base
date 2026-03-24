import { mentionUser, getUser, isAdmin, isOwner } from '../lib/functions.js'

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
          text: '✦ Responde o menciona al administrador que deseas quitar'
        })
      }

      const targetUser = getUser(target)

      const targetIsAdmin = isAdmin(target, participants)
      const senderIsOwner = isOwner(sender)

      if (!targetIsAdmin) {
        return sock.sendMessage(from, {
          text: '✦ Ese usuario no es administrador'
        })
      }

      if (targetIsAdmin && !senderIsOwner) {
        return sock.sendMessage(from, {
          text: '✦ Solo el owner puede quitar admin a otro admin'
        })
      }

      const text = `
╭─〔⚠️ 𝗔𝗗𝗠𝗜𝗡 𝗥𝗘𝗠𝗢𝗩𝗜𝗗𝗢〕─╮
│
│ 👤 𝗘𝗷𝗲𝗰𝘂𝘁𝗮𝗱𝗼 𝗽𝗼𝗿:
│ ➤ ${m.tag}
│
│ 📉 𝗨𝘀𝘂𝗮𝗿𝗶𝗼:
│ ➤ @${targetUser}
│
│ ✦ Ya no es administrador
╰────────────╯
`

      await sock.sendMessage(from, {
        text,
        mentions: [m.jid, target]
      })

      await sock.groupParticipantsUpdate(from, [target], 'demote')

    } catch (e) {
      console.error('❌ ERROR DEMOTE:', e)
      await sock.sendMessage(from, {
        text: '✦ Error al quitar administrador'
      })
    }
  }
}