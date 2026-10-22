import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { SpeedInsights } from '@vercel/speed-insights/react'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
            <SpeedInsights />
        </AuthProvider>
    </React.StrictMode>,
)
