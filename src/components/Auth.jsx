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
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-900">
      <Card className="w-full max-w-md overflow-hidden backdrop-blur-md border border-slate-700 bg-slate-800/70">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">
                {isSigningUp ? 'Create an Account' : 'Sign In to Your Account'}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                {isSigningUp
                  ? 'Enter your details to create your account'
                  : 'Enter your credentials to access your dashboard'}
              </p>
            </div>
            
            {error && (
              <div className="p-3 text-sm rounded-md bg-red-900/30 border border-red-800 text-red-200">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-white bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-white bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-2 rounded-md transition-all duration-300 shadow-lg"
              >
                {loading
                  ? 'Please wait...'
                  : isSigningUp
                  ? 'Create Account'
                  : 'Sign In'}
              </Button>
            </form>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSigningUp(!isSigningUp)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {isSigningUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Auth