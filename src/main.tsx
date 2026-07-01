import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/lib/i18n'
import '@/index.css'
import { startRealtime } from '@/data/realtime'
import { installGlobalErrorHandlers } from '@/lib/reportError'

installGlobalErrorHandlers()
startRealtime()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
