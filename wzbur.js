import fs from 'fs'
import path from 'path'
import { getGroupAdmins } from './lib/admins.js'

// cargar comandos
const comandos = new Map()
const comandosPath = './comandos'

for (const file of fs.readdirSync(comandosPath)) {
  if (file.endsWith('.js')) {
    const cmd = await import(path.resolve(comandosPath, file))
    comandos.set(cmd.default.name, cmd.default)
  }
}

export default async function handler(sock, msg) {
  try {
    if (!msg.message) return

    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    const sender = msg.key.participant || msg.key.remoteJid

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ''

    const prefix = '.'
    if (!body.startsWith(prefix)) return

    const args = body.slice(prefix.length).trim().split(/ +/)
    const commandName = args.shift().toLowerCase()

    const command = comandos.get(commandName)
    if (!command) return

    let groupMetadata = {}
    let participants = []
    let groupAdmins = []
    let isAdmin = false
    let isBotAdmin = false

    if (isGroup) {
      groupMetadata = await sock.groupMetadata(from)
      participants = groupMetadata.participants
      groupAdmins = getGroupAdmins(participants)

      isAdmin = groupAdmins.includes(sender)

      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net'
      isBotAdmin = groupAdmins.includes(botNumber)
    }

    // ejecutar comando desde /comandos
    await command.run({
      sock,
      msg,
      from,
      args,
      isGroup,
      isAdmin,
      isBotAdmin,
      participants,
      groupMetadata
    })

  } catch (e) {
    console.log('❌ Error handler:', e)
  }
}