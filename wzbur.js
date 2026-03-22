import fs from 'fs'
import path from 'path'
import { getGroupAdmins } from './lib/admins.js'

// ✅ Mensajes predeterminados
global.messages = {
  rowner: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTA FUNCIÓN SOLO PUEDE SER USADA POR MI CREADOR!",
  owner: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTA FUNCIÓN SOLO PUEDE SER USADA POR MI DESARROLLADOR!",
  mods: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTA FUNCIÓN SOLO PUEDE SER USADA POR MIS DESARROLLADORES!",
  premium: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTA FUNCIÓN SOLO ES PARA USUARIOS PREMIUM!",
  group: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTA FUNCIÓN SOLO PUEDE SER EJECUTADA EN GRUPOS!",
  private: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTA FUNCIÓN SOLO PUEDE SER USADA EN CHAT PRIVADO!",
  admin: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTE COMANDO SOLO PUEDE SER USADO POR ADMINS!",
  botAdmin: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡PARA USAR ESTA FUNCIÓN DEBO SER ADMIN DEL GRUPO!",
  unreg: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡DEBES REGISTRARTE PARA USAR ESTE COMANDO!",
  restrict: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTE COMANDO ESTÁ RESTRINGIDO!"
}

// 🔹 Cargar comandos
const comandos = new Map()
const comandosPath = './comandos'

if (fs.existsSync(comandosPath)) {
  for (const file of fs.readdirSync(comandosPath)) {
    if (file.endsWith('.js')) {
      const cmd = await import(path.resolve(comandosPath, file))
      if (cmd?.default?.name && cmd.default.run) {
        comandos.set(cmd.default.name, cmd.default)
      }
    }
  }
} else {
  console.warn('⚠️ Carpeta comandos/ no encontrada. Crea comandos/hola.js con export default { name, run }.')
}

// 🔹 Handler principal
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

    // permisos rápidos
    const senderId = sender.split('@')[0]
    const isOwner = (global.owner || []).includes(senderId)
    const isMod = (global.mods || []).includes(senderId) || isOwner
    const isPremium = (global.prems || []).includes(senderId) || isOwner

    if (command?.rowner && !isOwner) return sock.sendMessage(from, { text: global.messages.rowner })
    if (command?.owner && !isOwner) return sock.sendMessage(from, { text: global.messages.owner })
    if (command?.mods && !isMod) return sock.sendMessage(from, { text: global.messages.mods })
    if (command?.premium && !isPremium) return sock.sendMessage(from, { text: global.messages.premium })

    if (command?.group && !isGroup) return sock.sendMessage(from, { text: global.messages.group })
    if (command?.private && isGroup) return sock.sendMessage(from, { text: global.messages.private })
    if (command?.admin && !isAdmin) return sock.sendMessage(from, { text: global.messages.admin })
    if (command?.botAdmin && !isBotAdmin) return sock.sendMessage(from, { text: global.messages.botAdmin })
    if (command?.unreg) return sock.sendMessage(from, { text: global.messages.unreg })
    if (command?.restrict) return sock.sendMessage(from, { text: global.messages.restrict })

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
