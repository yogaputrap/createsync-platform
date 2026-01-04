import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Kita membungkus <App /> dengan <BrowserRouter> 
      agar semua fitur navigasi tersedia di seluruh aplikasi.
    */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)