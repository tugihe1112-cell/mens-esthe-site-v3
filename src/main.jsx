import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AppProvider } from './context/AppContext' // ★ インポート

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider> { /* ★ <App /> を囲む */ }
      <App />
    </AppProvider> { /* ★ 閉じる */ }
  </React.StrictMode>,
)