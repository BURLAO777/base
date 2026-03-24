import fs from 'fs'
import path from 'path'

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
      const cmd = await import(`${path.resolve(file)}?update=${Date.now()}`)

      if (cmd?.default?.name) {
        commands.set(cmd.default.name, cmd.default)
      }
    }

    console.log(`✅ Comandos recargados: ${commands.size}`)
  } catch (e) {
    console.error('❌ Error cargando comandos:', e)
  }
}


fs.watch('./comandos', { recursive: true }, async () => {
  console.log('🔄 Cambios detectados, recargando...')
  await loadCommands()
})