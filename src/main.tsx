import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/lib/i18n'
import '@/index.css'
import { startRealtime } from '@/data/realtime'
import { installGlobalErrorHandlers } from '@/lib/reportError'
import { captureAcquisition } from '@/lib/acquisition'
import { initNative } from '@/lib/native'
import { initPosthog } from '@/lib/posthog'

installGlobalErrorHandlers()
startRealtime()
captureAcquisition()
initNative()
initPosthog()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
