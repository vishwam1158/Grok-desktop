import { useEffect } from 'react'
import { Composer } from './components/Composer'
import { Conversation } from './components/Conversation'
import { PermissionModal } from './components/PermissionModal'
import { SettingsModal } from './components/SettingsModal'
import { ShortcutsModal } from './components/ShortcutsModal'
import { Sidebar } from './components/Sidebar'
import { StatusBar } from './components/StatusBar'
import { Titlebar } from './components/Titlebar'
import { Toast } from './components/Toast'
import { useAppHotkeys } from './hooks/useAppHotkeys'
import { bindGrokEvents, useAppStore } from './store'

export default function App(): React.JSX.Element {
  const hydrate = useAppStore((state) => state.hydrate)
  useAppHotkeys()

  useEffect(() => {
    void hydrate()
    return bindGrokEvents()
  }, [hydrate])

  return (
    <div className="app-shell relative flex h-full flex-col overflow-hidden">
      <Titlebar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <Conversation />
          </div>
          <Composer />
        </main>
      </div>
      <StatusBar />
      <PermissionModal />
      <SettingsModal />
      <ShortcutsModal />
      <Toast />
    </div>
  )
}
