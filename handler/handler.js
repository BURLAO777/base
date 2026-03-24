import { isOwner, isAdmin, cleanJid } from '../lib/functions.js'
import { commands } from '../lib/loader.js'

export const handleMessage = async (sock, msg) => {
  try {
    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')

    let sender = msg.key.participant || msg.participant || msg.key.remoteJid
    if (!sender || sender.endsWith('@g.us')) {
      sender = msg.key.participant || ''
    }

    sender = cleanJid(sender)

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      msg.message?.buttonsResponseMessage?.selectedButtonId ||
      msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      msg.message?.templateButtonReplyMessage?.selectedId ||
      ''

    if (!body.startsWith(global.bot.prefix)) return

    const args = body.slice(global.bot.prefix.length).trim().split(/ +/)
    const commandName = args.shift()?.toLowerCase()

    const command = commands.get(commandName)
    if (!command) {
      console.log(`⚠️ Comando no encontrado: ${commandName}`)
      return
    }

    const groupMetadata = isGroup ? await sock.groupMetadata(from) : {}
    const participants = groupMetadata?.participants || []

    const botRaw = sock.user.id || sock.user.jid
    const botId = cleanJid(botRaw)

    const admin = isAdmin(sender, participants)
    const owner = isOwner(sender)

    let botAdmin = false

    if (isGroup) {
      const botInGroup = participants.find(p => {
        const id = cleanJid(p.id || p.jid)
        return id === botId
      })

      if (botInGroup) {
        botAdmin =
          botInGroup.admin === 'admin' ||
          botInGroup.admin === 'superadmin'
      } else {
        botAdmin = true
      }
    }

    console.log('==============================')
    console.log('📥 COMANDO:', commandName)
    console.log('👤 SENDER:', sender)
    console.log('🤖 BOT:', botId)
    console.log('📍 GROUP:', from)
    console.log('🔐 RESULT:', { admin, owner, botAdmin })
    console.log('==============================')

    if (command.group && !isGroup) {
      return await sock.sendMessage(from, {
        text: '⚠️ 𝘌𝘴𝘵𝘦 𝘤𝘰𝘮𝘢𝘯𝘥𝘰 𝘦𝘴 𝘴𝘰𝘭𝘰 𝘱𝘢𝘳𝘢 𝘨𝘳𝘶𝘱𝘰𝘴'
      })
    }

    if (command.admin && !admin && !owner) {
      return await sock.sendMessage(from, {
        text: '⚠️ 𝘚𝘰𝘭𝘰 𝘢𝘥𝘮𝘪𝘯𝘪𝘴𝘵𝘳𝘢𝘥𝘰𝘳𝘦𝘴 𝘱𝘶𝘦𝘥𝘦𝘯 𝘶𝘴𝘢𝘳 𝘦𝘴𝘵𝘦 𝘤𝘰𝘮𝘢𝘯𝘥𝘰'
      })
    }

    if (command.owner && !owner) {
      return await sock.sendMessage(from, {
        text: '⚠️ 𝘚𝘰𝘭𝘰 𝘦𝘭 𝘰𝘸𝘯𝘦𝘳 𝘱𝘶𝘦𝘥𝘦 𝘶𝘴𝘢𝘳 𝘦𝘴𝘵𝘦 𝘤𝘰𝘮𝘢𝘯𝘥𝘰'
      })
    }

    if (command.botAdmin && !botAdmin) {
      return await sock.sendMessage(from, {
        text: '⚠️ 𝘌𝘭 𝘣𝘰𝘵 𝘥𝘦𝘣𝘦 𝘴𝘦𝘳 𝘢𝘥𝘮𝘪𝘯𝘪𝘴𝘵𝘳𝘢𝘥𝘰𝘳 𝘦𝘯 𝘦𝘭 𝘨𝘳𝘶𝘱𝘰'
      })
    }

    try {
      await command.run({
        sock,
        msg,
        from,
        sender,
        args,
        isGroup,
        isAdmin: admin,
        isOwner: owner,
        botAdmin,
        participants,
        groupMetadata
      })
    } catch (err) {
      console.error(`
╭━━━〔 ❌ ERROR EN COMANDO 〕━━━╮
│ 📦 Comando: ${commandName}
│ 👤 Usuario: ${sender}
│ 📍 Grupo: ${from}
│
│ 📄 Mensaje:
│ ${err.message}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`)
    }

  } catch (e) {
    console.error(`
╭━━━〔 ❌ ERROR HANDLER 〕━━━╮
│ ${e.message}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`)
  }
}