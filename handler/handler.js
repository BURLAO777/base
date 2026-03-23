import { isOwner, isAdmin, cleanJid } from '../lib/functions.js'

export const handleMessage = async (sock, msg, commands) => {
  try {
    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')

    let sender = msg.key.participant || from
    sender = cleanJid(sender)

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      ''

    if (!body.startsWith(global.bot.prefix)) return

    const args = body.slice(global.bot.prefix.length).trim().split(/ +/)
    const commandName = args.shift()?.toLowerCase()

    const command = commands.get(commandName)
    if (!command) return

    const groupMetadata = isGroup
      ? await sock.groupMetadata(from)
      : {}

    const participants = groupMetadata?.participants || []

    const botId = cleanJid(sock.user.id)

    const admin = isAdmin(sender, participants)
    const owner = isOwner(sender)
    const botAdmin = isGroup
      ? isAdmin(botId, participants)
      : false

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

    console.log('📥 Ejecutando comando:', commandName)
    console.log({ sender, admin, owner, botAdmin })

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

  } catch (e) {
    console.error('❌ Error handler:', e)
  }
}