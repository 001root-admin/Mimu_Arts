import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { FollowProvider } from './context/FollowContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <FollowProvider>
          <App />
        </FollowProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
