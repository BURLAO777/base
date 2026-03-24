import fs from 'fs'
import path from 'path'
import chokidar from 'chokidar'

export const commands = new Map()

const getFiles = (dir) => {
  let results = []
  const list = fs.readdirSync(dir)

  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      results = results.concat(getFiles(filePath))
    } else if (file.endsWith('.js')) {
      results.push(filePath)
    }
  }

  return results
}

export const loadCommands = async () => {
  try {
    commands.clear()

    const files = getFiles('./comandos')

    for (const file of files) {
      const fullPath = path.resolve(file)

      const cmd = await import(`file://${fullPath}?update=${Date.now()}`)

      if (cmd?.default?.name) {
        commands.set(cmd.default.name, cmd.default)
      }
    }

    console.log(`✅ Comandos recargados: ${commands.size}`)
  } catch (e) {
    console.error('❌ Error cargando comandos:', e)
  }
}

const watcher = chokidar.watch('./comandos', {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: true
})

let timeout

watcher.on('all', (event, filePath) => {
  clearTimeout(timeout)

  timeout = setTimeout(async () => {
    console.log(`
🔄 CAMBIO DETECTADO
📁 Archivo: ${filePath}
⚙️ Evento: ${event}
`)
    await loadCommands()
  }, 500)
})