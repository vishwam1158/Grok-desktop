import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'
import { join } from 'node:path'
import { app } from 'electron'
import { DEFAULT_SETTINGS, type AppSettings, type ProjectRecord } from '../shared/types'

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function asProject(path: string, previous?: ProjectRecord): ProjectRecord {
  return {
    path,
    name: previous?.name || basename(path),
    lastSessionId: previous?.lastSessionId ?? null,
    addedAt: previous?.addedAt || new Date().toISOString()
  }
}

export function normalizeSettings(raw: Partial<AppSettings>): AppSettings {
  const recent = Array.isArray(raw.recentProjects) ? raw.recentProjects.filter(Boolean) : []
  let projects = Array.isArray(raw.projects)
    ? raw.projects.filter((project) => project && typeof project.path === 'string')
    : []
  if (projects.length === 0 && recent.length > 0) {
    projects = recent.map((path) => asProject(path))
  }
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    showThinking: raw.showThinking ?? DEFAULT_SETTINGS.showThinking,
    resumeLastProject: raw.resumeLastProject ?? DEFAULT_SETTINGS.resumeLastProject,
    projects,
    recentProjects: recent
  }
}

export function loadSettings(): AppSettings {
  const path = settingsPath()
  if (!existsSync(path)) return { ...DEFAULT_SETTINGS }
  try {
    return normalizeSettings(JSON.parse(readFileSync(path, 'utf8')) as Partial<AppSettings>)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  const path = settingsPath()
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, JSON.stringify(settings, null, 2), 'utf8')
}

export function rememberProject(
  settings: AppSettings,
  projectPath: string,
  lastSessionId?: string | null
): AppSettings {
  const previous = settings.projects.find((project) => project.path === projectPath)
  const project = {
    ...asProject(projectPath, previous),
    lastSessionId: lastSessionId === undefined ? (previous?.lastSessionId ?? null) : lastSessionId
  }
  const next: AppSettings = {
    ...settings,
    lastProjectPath: projectPath,
    projects: [project, ...settings.projects.filter((item) => item.path !== projectPath)],
    recentProjects: [
      projectPath,
      ...settings.recentProjects.filter((item) => item !== projectPath)
    ].slice(0, 16)
  }
  saveSettings(next)
  return next
}

export function forgetProject(settings: AppSettings, projectPath: string): AppSettings {
  const next: AppSettings = {
    ...settings,
    projects: settings.projects.filter((project) => project.path !== projectPath),
    recentProjects: settings.recentProjects.filter((item) => item !== projectPath),
    lastProjectPath: settings.lastProjectPath === projectPath ? null : settings.lastProjectPath
  }
  saveSettings(next)
  return next
}
