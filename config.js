import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

// 👑 OWNER
global.owner = [
  '527732671011',
  '165043362652249'
]

global.messages = {
  rowner: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTA FUNCIÓN SOLO PUEDE SER USADA POR MI CREADOR!",
  owner: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTA FUNCIÓN SOLO PUEDE SER USADA POR MI DESARROLLADOR!",
  mods: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTA FUNCIÓN SOLO PUEDE SER USADA POR MIS DESARROLLADORES!",
  premium: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTA FUNCIÓN SOLO ES PARA USUARIOS PREMIUM!",
  group: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTA FUNCIÓN SOLO PUEDE SER EJECUTADA EN GRUPOS!",
  private: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTA FUNCIÓN SOLO PUEDE SER USADA EN CHAT PRIVADO!",
  admin: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTE COMANDO SOLO PUEDE SER USADO POR ADMINS!",
  botAdmin: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡PARA USAR ESTA FUNCIÓN DEBO SER ADMIN DEL GRUPO!",
  restrict: "⊱❕⊱ INFORMACIÓN ⊱❕⊱╮\n\n¡ESTA CARACTERÍSTICA ESTÁ DESACTIVADA!"
}


global.mods = []
global.prems = []


global.emoji = '🔥'
global.emoji2 = '🔥'
global.namebot = '𝐉𝐈𝐑𝐄𝐍 𝐁𝐎𝐓 🔥'
global.botname = '𝐉𝐈𝐑𝐄𝐍 𝐁𝐎𝐓 🔥'


global.banner = 'https://cdn.russellxz.click/addc9495.jpeg'
global.packname = '꡵ 𝕵𝑰𝑹𝑬𝑵 𝕭𝑶𝑻 ꡴'
global.author = '© 𝐂𝐫𝐞𝐚𝐝𝐨 𝐏𝐨𝐫 𝔍𝒖𝒂𝒏 𒀭'


const file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("♻️ Se actualizó config.js"))
  import(`file://${file}?update=${Date.now()}`)
})
