/* CONFIG GLOBAL */

import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

// 👑 OWNER
global.owner = [
  '527732671011',
  '165043362652249'
]

// ⚙️ ROLES
global.mods = []
global.prems = []

// 🤖 BOT
global.emoji = '🔥'
global.emoji2 = '🔥'
global.namebot = '𝐉𝐈𝐑𝐄𝐍 𝐁𝐎𝐓 🔥'
global.botname = '𝐉𝐈𝐑𝐄𝐍 𝐁𝐎𝐓 🔥'

// 🖼️ MEDIA
global.banner = 'https://cdn.russellxz.click/addc9495.jpeg'
global.packname = '꡵ 𝕵𝑰𝑹𝑬𝑵 𝕭𝑶𝑻 ꡴'
global.author = '© 𝐂𝐫𝐞𝐚𝐝𝐨 𝐏𝐨𝐫 𝔍𝒖𝒂𝒏 𒀭'

// 🔐 SESSION
global.sessions = 'Jirenbots'

// 🔁 AUTO-RELOAD
const file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("♻️ Se actualizó config.js"))
  import(`file://${file}?update=${Date.now()}`)
})