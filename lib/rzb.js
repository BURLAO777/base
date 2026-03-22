import { watchFile } from 'fs'
import { fileURLToPath } from 'url'

export function logGroupMessage(msg) {
  try {
    if (!msg?.key?.remoteJid) return
    if (!msg.key.remoteJid.endsWith('@g.us')) return

    const sender = msg.key.participant ?? msg.key.remoteJid
    const group = msg.key.remoteJid
    const messageType = msg.message ? Object.keys(msg.message)[0] : 'unknown'

    let text = ''
    if (msg.message?.conversation) text = msg.message.conversation
    else if (msg.message?.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text
    else if (msg.message?.imageMessage?.caption) text = msg.message.imageMessage.caption
    else if (msg.message?.videoMessage?.caption) text = msg.message.videoMessage.caption
    else if (msg.message?.stickerMessage) text = '[Sticker]'
    else if (msg.message?.audioMessage) text = '[Audio]'
    else if (msg.message?.documentMessage) text = '[Documento]'
    else if (msg.message?.contactMessage) text = '[Contacto]'
    else if (msg.message?.locationMessage) text = '[Ubicación]'

    const isCommand = typeof text === 'string' && text.startsWith('.')

    console.log('\n═════════════════════════════════════════')
    console.log('📣 Mensaje de grupo detectado')
    console.log('Grupo: ', group)
    console.log('Emisor:', sender)
    console.log('Tipo:  ', messageType, isCommand ? '(comando)' : '')
    console.log('Contenido:')
    console.log(text || '(sin texto)')
    console.log('═════════════════════════════════════════\n')

  } catch (e) {
    console.error('Error en rzb.logGroupMessage:', e)
  }
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  console.log("Update 'lib/rzb.js'")
})