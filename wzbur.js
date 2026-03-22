// zinc.js (handler principal)

import { getGroupAdmins } from './lib/admins.js'

export default async function handler(sock, msg) {
  try {
    if (!msg.message) return

    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    const sender = msg.key.participant || msg.key.remoteJid

    // Obtener texto
    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ''

    const prefix = '.'
    if (!body.startsWith(prefix)) return

    const args = body.slice(prefix.length).trim().split(/ +/)
    const command = args.shift().toLowerCase()

    // ======================
    // SOLO GRUPOS
    // ======================
    if (!isGroup) {
      return sock.sendMessage(from, {
        text: '❌ Este comando solo funciona en grupos'
      })
    }

    // ======================
    // DATOS DEL GRUPO
    // ======================
    const groupMetadata = await sock.groupMetadata(from)
    const participants = groupMetadata.participants

    const groupAdmins = getGroupAdmins(participants)

    const isAdmin = groupAdmins.includes(sender)

    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net'
    const isBotAdmin = groupAdmins.includes(botNumber)

    // ======================
    // COMANDOS
    // ======================

    // 🔥 KICK
    if (command === 'kick') {
      if (!isAdmin) {
        return sock.sendMessage(from, {
          text: '❌ No eres administrador'
        })
      }

      if (!isBotAdmin) {
        return sock.sendMessage(from, {
          text: '❌ El bot no es administrador'
        })
      }

      const mentioned =
        msg.message.extendedTextMessage?.contextInfo?.mentionedJid

      if (!mentioned) {
        return sock.sendMessage(from, {
          text: '⚠️ Menciona al usuario a eliminar'
        })
      }

      await sock.groupParticipantsUpdate(from, mentioned, 'remove')
    }

    // 🔥 TAGALL
    if (command === 'tagall') {
      if (!isAdmin) {
        return sock.sendMessage(from, {
          text: '❌ No eres administrador'
        })
      }

      let text = '📢 *MENCIONANDO A TODOS:*\n\n'
      let mentions = []

      for (let p of participants) {
        text += `@${p.id.split('@')[0]}\n`
        mentions.push(p.id)
      }

      await sock.sendMessage(from, {
        text,
        mentions
      })
    }

    // 🔥 INFO GRUPO
    if (command === 'infogrupo') {
      await sock.sendMessage(from, {
        text: `📊 *INFO DEL GRUPO*
        
👥 Nombre: ${groupMetadata.subject}
👤 Participantes: ${participants.length}
👑 Admins: ${groupAdmins.length}`
      })
    }

  } catch (e) {
    console.log('❌ Error en zinc:', e)
  }
}