import { useState, useEffect } from 'react'
import Login from './components/Login.jsx'
import Dashboard from './components/Dashboard.jsx'
import AddUser from './components/AddUser.jsx'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('lc-user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  const handleLogin = (userData) => {
    sessionStorage.setItem('lc-user', JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('lc-user')
    setUser(null)
  }

  if (window.location.pathname === '/add-user') {
    return <AddUser />
  }

  return user
    ? <Dashboard user={user} onLogout={handleLogout} />
    : <Login onLogin={handleLogin} />
}

export default App
