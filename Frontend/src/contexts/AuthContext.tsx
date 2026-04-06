import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { setTokens, clearTokens, getAccessToken, getRefreshToken } from '../services/api.client'

interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  organization?: string
  status: 'active' | 'inactive'
  avatar?: string
}

interface LoginResponse {
  user: User
  token?: string
  access_token?: string
  refresh_token?: string
  expires_in?: number
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (userData: User, tokens?: { accessToken: string; refreshToken: string; expiresIn?: number }) => void
  loginWithResponse: (response: LoginResponse) => void
  logout: (reason?: string) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for stored user data on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('dataforge_user')
    const token = getAccessToken()
    const refreshToken = getRefreshToken()

    if (storedUser && (token || refreshToken)) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        localStorage.removeItem('dataforge_user')
        clearTokens()
      }
    } else if (storedUser && !token && !refreshToken) {
      // User data without tokens - clear everything
      localStorage.removeItem('dataforge_user')
    }
    setIsLoading(false)
  }, [])

  // Listen for auth:logout events (from API interceptor)
  useEffect(() => {
    const handleLogout = (event: CustomEvent) => {
      logout(event.detail?.reason)
    }

    window.addEventListener('auth:logout', handleLogout as EventListener)
    return () => {
      window.removeEventListener('auth:logout', handleLogout as EventListener)
    }
  }, [])

  const login = useCallback((
    userData: User,
    tokens?: { accessToken: string; refreshToken: string; expiresIn?: number }
  ) => {
    setUser(userData)
    localStorage.setItem('dataforge_user', JSON.stringify(userData))

    if (tokens) {
      setTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn)
    }
  }, [])

  const loginWithResponse = useCallback((response: LoginResponse) => {
    const accessToken = response.access_token || response.token
    const refreshToken = response.refresh_token

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken, response.expires_in)
    } else {
      throw new Error('Invalid authentication response. Please sign in again.')
    }

    setUser(response.user)
    localStorage.setItem('dataforge_user', JSON.stringify(response.user))
  }, [])

  const logout = useCallback((reason?: string) => {
    setUser(null)
    localStorage.removeItem('dataforge_user')
    clearTokens()

    // Also clear legacy token key
    localStorage.removeItem('token')

    // If reason provided, could show a toast or redirect with message
    if (reason) {
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      loginWithResponse,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
