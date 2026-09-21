import { spawn } from 'node:child_process'
import type { ModelOption } from '../shared/types'

export function listGrokModels(binary: string): Promise<ModelOption[]> {
  return new Promise((resolve) => {
    const child = spawn(binary, ['models'], { env: process.env })
    let out = ''
    child.stdout?.on('data', (chunk: Buffer) => {
      out += chunk.toString('utf8')
    })
    child.on('error', () => resolve([]))
    child.on('close', () => {
      const models: ModelOption[] = []
      for (const line of out.split('\n')) {
        const match = line.match(/^\s*[*-]\s+([^\s(]+)/)
        if (!match?.[1]) continue
        models.push({
          id: match[1],
          isDefault: line.includes('(default)') || line.trim().startsWith('*')
        })
      }
      resolve(models)
    })
  })
}
