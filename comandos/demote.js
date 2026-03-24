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
          text: '➭ Responde o menciona al admin que deseas quitarle el rango'
        })
      }

      const targetUser = getUser(target)

      const targetIsAdmin = isAdmin(target, participants)

      if (!targetIsAdmin) {
        return sock.sendMessage(from, {
          text: '➭ Ese usuario no es administrador'
        })
      }

      const text = `
❏
┃ ⚙️ 𝗚𝗘𝗦𝗧𝗜𝗢́𝗡 𝗗𝗘 𝗥𝗔𝗡𝗚𝗢𝗦
┃
┃ 👤 Admin: ${m.tag}
┃ ⬇️ Usuario: @${targetUser}
┃
┃ ✦ Se removió el rango de administrador
❏
`

      await sock.sendMessage(from, {
        text,
        mentions: [m.jid, target]
      })

      await sock.groupParticipantsUpdate(from, [target], 'demote')

    } catch (e) {
      console.error('❌ ERROR DEMOTE:', e)
      await sock.sendMessage(from, {
        text: '➭ Error al quitar administrador'
      })
    }
  }
}