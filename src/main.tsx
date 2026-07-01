import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/lib/i18n'
import '@/index.css'
import { startRealtime } from '@/data/realtime'

startRealtime()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
