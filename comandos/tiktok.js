import axios from 'axios'
import { load as loadHtml } from 'cheerio'

const UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"


async function resolveViaTikWM(url) {
  const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
    headers: { "User-Agent": UA },
    timeout: 30000
  })

  const videoUrl = res?.data?.data?.play
  if (!videoUrl) throw new Error("TikWM falló")

  return videoUrl
}


async function resolveViaSnapTik(url) {
  const homeRes = await axios.get("https://snaptik.app/en2", {
    headers: { "User-Agent": UA },
    timeout: 30000
  })

  const tokenMatch = String(homeRes.data || "").match(/name="token"\s+value="([^"]+)"/)
  if (!tokenMatch) throw new Error("No token")

  const token = tokenMatch[1]

  const form = new URLSearchParams()
  form.append("url", url)
  form.append("token", token)
  form.append("lang", "en2")

  const submit = await axios.post("https://snaptik.app/abc2.php", form, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
      "Origin": "https://snaptik.app",
      "Referer": "https://snaptik.app/en2"
    },
    timeout: 40000
  })

  const html = String(submit.data || "")
  const $ = loadHtml(html)

  const videoUrl =
    $("a.button.download-file").attr("href") ||
    $("a.download-file").attr("href") ||
    $("a.btn-download").attr("href") ||
    (html.match(/https:\/\/[^"']+\.mp4[^"']*/i) || [])[0]

  if (!videoUrl) throw new Error("SnapTik falló")

  return videoUrl
}

export default {
  name: 'tiktok',
  alias: ['tt'],
  group: false,

  run: async ({ sock, from, msg, args }) => {
    try {
      const url = args[0]

      if (!url || !url.includes('tiktok.com')) {
        return await sock.sendMessage(from, {
          text: `
╭━〔✧ 𝗔𝗖𝗖𝗜𝗢́𝗡 ✧〕━╮
┃
┃ ➤ ᥱᥒ᥎іᥲ ᥙᥒ ᥣіᥒk
┃    ძᥱ 𝗍і𝗄𝗍᥆𝗄
┃
╰━〔 ✧𝗦𝗜𝗦𝗧𝗘𝗠𝗔✧ 〕━╯
`
        }, { quoted: msg })
      }

      await sock.sendMessage(from, {
        react: { text: '⏳', key: msg.key }
      })

      
      let video
      try {
        video = await resolveViaTikWM(url)
      } catch (e) {
        video = await resolveViaSnapTik(url)
      }

      const caption = `
╭━〔✧ 𝗧𝗜𝗞𝗧𝗢𝗞 ✧〕━╮
┃
┃ ➤ ᥲ𝗊ᥙі́ 𝗍іᥱᥒᥱs 𝗍ᥙ
┃    ᥎іძᥱ᥆ 
┃
╰━〔 ✧𝗦𝗜𝗦𝗧𝗘𝗠𝗔✧ 〕━╯
`

      await sock.sendMessage(from, {
        video: { url: video },
        caption
      }, { quoted: msg })

      await sock.sendMessage(from, {
        react: { text: '✅', key: msg.key }
      })

    } catch (e) {
      console.error('❌ ERROR TIKTOK:', e)

      await sock.sendMessage(from, {
        text: '❌ Error al descargar el video de TikTok'
      }, { quoted: msg })
    }
  }
}