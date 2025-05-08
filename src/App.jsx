// src/App.jsx
import React from 'react'
import './App.css'
import Dashboard from './Dashboard'
import Auth from './components/Auth'
import { AuthProvider, useAuth } from './context/AuthContext'

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-text">Loading...</div>
      </div>
    )
  }
  
  return user ? children : <Auth />
}

function AppContent() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App