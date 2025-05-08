import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent } from './ui/Card'
import { Button } from './ui/Button'

const Auth = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const { signIn, signUp } = useAuth()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      if (isSigningUp) {
        await signUp(email, password)
        alert('Check your email for the confirmation link!')
      } else {
        await signIn(email, password)
      }
    } catch (error) {
      setError(error.message || 'An error occurred during authentication')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="auth-container">
      <Card className="auth-card">
        <CardContent className="auth-content">
          <div className="auth-header">
            <h1 className="auth-title">
              {isSigningUp ? 'Create an Account' : 'Sign In to Your Account'}
            </h1>
            <p className="auth-subtitle">
              {isSigningUp
                ? 'Enter your details to create your account'
                : 'Enter your credentials to access your dashboard'}
            </p>
          </div>
          
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="auth-submit-button"
            >
              {loading
                ? 'Please wait...'
                : isSigningUp
                ? 'Create Account'
                : 'Sign In'}
            </Button>
            
            <div className="auth-toggle">
              <button
                type="button"
                onClick={() => setIsSigningUp(!isSigningUp)}
                className="auth-toggle-button"
              >
                {isSigningUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Auth