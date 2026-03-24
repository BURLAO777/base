import { isOwner, isAdmin, cleanJid } from '../lib/functions.js'

export const handleMessage = async (sock, msg, commands) => {
  try {
    if (!commands || !(commands instanceof Map)) {
      console.error('❌ Commands no cargados correctamente')
      return
    }

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

    const groupMetadata = isGroup
      ? await sock.groupMetadata(from)
      : {}

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
        botAdmin = botInGroup.admin === 'admin' || botInGroup.admin === 'superadmin'
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
      return await sock.sendMessage(from, { text: '❌ Este comando es solo para grupos' })
    }

    if (command.admin && !admin && !owner) {
      return await sock.sendMessage(from, { text: '❌ Solo administradores pueden usar este comando' })
    }

    if (command.owner && !owner) {
      return await sock.sendMessage(from, { text: '❌ Solo el owner puede usar este comando' })
    }

    if (command.botAdmin && !botAdmin) {
      return await sock.sendMessage(from, { text: '❌ El bot debe ser administrador en el grupo' })
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