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

      // 실제 API 호출
      const response = await authService.login(credentials)

      // 토큰 저장 (response 객체에서 직접 가져오기)
      authService.setTokens(response.accessToken, response.refreshToken)

      // 사용자 정보 설정 (API 응답에 포함됨)
      setUser(response.user)

      return { success: true }
    } catch (error) {
      console.error('로그인 실패:', error)

      // 백엔드 연결 실패 시 데모 계정 안내
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        return {
          success: false,
          message: '백엔드 서버가 실행되지 않았습니다. 데모용으로 admin/admin을 사용해보세요.'
        }
      }

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
