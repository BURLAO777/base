export default {
  name: 'hola',
  run: async ({ sock, from }) => {
    await sock.sendMessage(from, {
      text: '👋 Hola a todos gente desde comandos'
    })
  }
}