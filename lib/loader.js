import fs from 'fs'
import path from 'path'

/**
 * Carga comandos desde carpetas y subcarpetas
 */
export const loadCommands = async (dir = './comandos') => {
  const commands = new Map()

  // Función recursiva para recorrer carpetas
  const walk = async (folder) => {
    const files = fs.readdirSync(folder)
    for (const file of files) {
      const fullPath = path.join(folder, file)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        // Si es carpeta, recorrer recursivamente
        await walk(fullPath)
      } else if (file.endsWith('.js')) {
        // Si es archivo JS, importarlo
        const cmd = await import(path.resolve(fullPath))
        if (cmd?.default?.name) {
          commands.set(cmd.default.name, cmd.default)
        }
      }
    }
  }

  await walk(dir)
  return commands
}
