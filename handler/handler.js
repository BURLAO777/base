import fs from 'fs'
import path from 'path'
import { isOwner, isAdmin, cleanJid } from '../lib/functions.js'

let commands = new Map()

export const loadCommands = async () => {
  commands.clear()

  const files = fs.readdirSync('./comandos', { recursive: true })

  for (const file of files) {
    if (!file.endsWith('.js')) continue

    const filePath = path.resolve(`./comandos/${file}`)
    const cmd = await import(`${filePath}?update=${Date.now()}`)

    commands.set(cmd.default.name, cmd.default)
  }
}

await loadCommands()


fs.watch('./comandos', async () => {
  console.log('🔄 Recargando comandos...')
  await loadCommands()
})

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
    if (!command) return

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

    if (command.group && !isGroup) {
      return sock.sendMessage(from, { text: '❌ Solo en grupos' })
    }

    if (command.admin && !admin && !owner) {
      return sock.sendMessage(from, { text: '❌ Solo admins' })
    }

    if (command.owner && !owner) {
      return sock.sendMessage(from, { text: '❌ Solo owner' })
    }

    if (command.botAdmin && !botAdmin) {
      return sock.sendMessage(from, { text: '❌ El bot debe ser admin' })
    }

    console.log(`⚡ ${commandName} → ${sender}`)

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