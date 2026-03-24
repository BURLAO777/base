import { mentionUser, getUser, isAdmin, isOwner } from '../lib/functions.js'

export default {
  name: 'kick',
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
          text: '➭ Responde o menciona al usuario que deseas expulsar'
        })
      }

      const targetUser = getUser(target)

      const targetIsAdmin = isAdmin(target, participants)
      const senderIsOwner = isOwner(sender)

      if (targetIsAdmin && !senderIsOwner) {
        return sock.sendMessage(from, {
          text: '➭ No puedes expulsar a un administrador'
        })
      }

      const text = `
❏ ─ 𝗠𝗢𝗗𝗘𝗥𝗔𝗖𝗜𝗢́𝗡 ─ ❏
│
│ 👮 Admin: ${m.tag}
│ 🚷 Usuario: @${targetUser}
│
│ ✦ Usuario eliminado correctamente
❏ ─────────── ❏
`

      await sock.sendMessage(from, {
        text,
        mentions: [m.jid, target]
      })

      await sock.groupParticipantsUpdate(from, [target], 'remove')

    } catch (e) {
      console.error('❌ ERROR KICK:', e)
      await sock.sendMessage(from, {
        text: '➭ Error al expulsar usuario'
      })
    }
  }
}