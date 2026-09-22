import { join } from 'node:path'
import { app, BrowserWindow, Menu, nativeImage, shell } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { registerIpc } from './ipc'
import { createMainWindow } from './window'

let mainWindow: BrowserWindow | null = null

app.setName('Grok Desktop')

function buildMenu(): void {
  const isMac = process.platform === 'darwin'
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Add Project…',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:open-project')
        },
        {
          label: 'New Chat',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:new-chat')
        },
        {
          label: 'Export Chat…',
          accelerator: 'Shift+CmdOrCtrl+E',
          click: () => mainWindow?.webContents.send('menu:export')
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Chat',
      submenu: [
        {
          label: 'Command Palette',
          accelerator: 'CmdOrCtrl+K',
          click: () => mainWindow?.webContents.send('menu:command-palette')
        },
        {
          label: 'Stop',
          accelerator: 'CmdOrCtrl+.',
          click: () => mainWindow?.webContents.send('menu:stop')
        },
        {
          label: 'Copy Last Reply',
          accelerator: 'Shift+CmdOrCtrl+C',
          click: () => mainWindow?.webContents.send('menu:copy-last')
        }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        {
          label: 'Commands and Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: () => mainWindow?.webContents.send('menu:shortcuts')
        },
        {
          label: 'Grok Build docs',
          click: () => shell.openExternal('https://docs.x.ai/build/overview')
        },
        {
          label: 'This repository',
          click: () => shell.openExternal('https://github.com/vishwam1158/Grok-desktop')
        }
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.vishwam.grokdesktop')
  if (process.platform === 'darwin') {
    const iconFile = app.isPackaged
      ? join(process.resourcesPath, 'icon.png')
      : join(__dirname, '../../resources/icon.png')
    const image = nativeImage.createFromPath(iconFile)
    if (!image.isEmpty()) app.dock?.setIcon(image)
  }
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  registerIpc(() => mainWindow)
  buildMenu()
  mainWindow = createMainWindow()
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
