import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { supabase } from '@/lib/supabase'

// Disponibiliza globalmente para teste
window.supabase = supabase

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
