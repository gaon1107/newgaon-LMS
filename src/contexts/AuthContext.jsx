import React, { createContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = authService.getAccessToken()
      if (token) {
        const userData = await authService.getCurrentUser()
        setUser(userData)
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error)
      authService.removeTokens()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      setIsLoading(true)
      const response = await authService.login(credentials)
      
      // 토큰 저장
      authService.setTokens(response.accessToken, response.refreshToken)
      
      // 사용자 정보 가져오기
      const userData = await authService.getCurrentUser()
      setUser(userData)
      
      return { success: true }
    } catch (error) {
      console.error('로그인 실패:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || '로그인에 실패했습니다.' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authService.removeTokens()
    setUser(null)
  }

  const value = {
    user,
    isLoading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
