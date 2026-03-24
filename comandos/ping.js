export default {
  name: 'p',
  run: async ({ sock, from }) => {
    try {
      const start = Date.now()

      const msg = await sock.sendMessage(from, { text: '🏓 Pong...' })

      const end = Date.now()
      const speed = end - start

      await sock.sendMessage(from, {
        text: `🏓 Pong!\n⚡ Velocidad: ${speed}ms`
      })

    } catch (e) {
      console.error(e)
    }
  }
}
