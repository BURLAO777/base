import fs from 'fs'
import path from 'path'

export const loadCommands = async () => {
  const commands = new Map()
  const files = fs.readdirSync('./comandos')

  for (const file of files) {
    const cmd = await import(`../comandos/${file}`)
    commands.set(cmd.default.name, cmd.default)
  }

  return commands
}