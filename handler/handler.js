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

    const args = body.slice(1).trim().split(/ +/)
    const commandName = args.shift().toLowerCase()

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

    if (command.group && !isGroup) return
    if (command.admin && !admin && !owner) return
    if (command.owner && !owner) return
    if (command.botAdmin && !botAdmin) return

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
    console.error('Error handler:', e)
  }
}