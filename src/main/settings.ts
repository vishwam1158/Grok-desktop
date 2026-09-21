import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import { DEFAULT_SETTINGS, type AppSettings } from '../shared/types'

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

export function loadSettings(): AppSettings {
  const path = settingsPath()
  if (!existsSync(path)) return { ...DEFAULT_SETTINGS }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Partial<AppSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      recentProjects: Array.isArray(parsed.recentProjects) ? parsed.recentProjects : []
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  const path = settingsPath()
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, JSON.stringify(settings, null, 2), 'utf8')
}

export function rememberProject(settings: AppSettings, projectPath: string): AppSettings {
  const recentProjects = [
    projectPath,
    ...settings.recentProjects.filter((item) => item !== projectPath)
  ].slice(0, 12)
  const next = { ...settings, recentProjects }
  saveSettings(next)
  return next
}
