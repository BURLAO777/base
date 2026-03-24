import yts from 'yt-search'
import axios from 'axios'

export default {
  name: 'play',
  alias: ['p'],
  category: 'music',
  desc: 'Descargar música de YouTube',
  use: '.play nombre de la canción',

  run: async (m) => {
    try {
      const { sock, msg, args } = m
      const from = msg.key.remoteJid

      if (!args || args.length === 0) {
        return await sock.sendMessage(from, { text: '❌ Ingresa el nombre de la canción' }, { quoted: msg })
      }

      const text = args.join(' ')

      // 🔎 Buscar en YouTube
      const search = await yts(text)
      const video = search.videos[0]

      if (!video) return await sock.sendMessage(from, { text: '❌ No se encontró la canción' }, { quoted: msg })

      // 🔗 API Sylphy
      const api = `https://sylphy.xyz/download/v2/ytmp3?url=${encodeURIComponent(video.url)}&api_key=sylphy-856f00`
      const { data } = await axios.get(api)

      if (!data.status) return await sock.sendMessage(from, { text: '❌ Error al descargar la canción' }, { quoted: msg })

      // 🖼️ Enviar info + miniatura
      await sock.sendMessage(from, {
        image: { url: video.thumbnail },
        caption: `🎵 *${data.result.title}*\n⏱️ ${video.timestamp}\n👤 Autor: ${video.author.name}\n🔗 ${video.url}`
      }, { quoted: msg })

      // 🎧 Enviar audio
      await sock.sendMessage(from, {
        audio: { url: data.result.dl_url },
        mimetype: 'audio/mpeg',
        fileName: `${data.result.title}.mp3`
      }, { quoted: msg })

    } catch (e) {
      console.error(e)
      const from = m.msg.key.remoteJid
      await m.sock.sendMessage(from, { text: '❌ Ocurrió un error en el comando' }, { quoted: m.msg })
    }
  }
}
