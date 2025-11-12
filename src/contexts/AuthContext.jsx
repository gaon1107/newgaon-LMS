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
      if (!token) {
        // 토큰이 없으면 바로 로딩 종료 (로그인하지 않은 상태)
        setIsLoading(false)
        return
      }

      // 토큰이 있을 때만 사용자 정보 조회
      const userData = await authService.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('인증 상태 확인 실패:', error)

      // 401 에러 (비활성 계정 등)인 경우 토큰 제거하고 로그아웃
      if (error.response?.status === 401) {
        authService.removeTokens()
        setUser(null)

        // 비활성 계정 메시지 표시
        if (error.response?.data?.Message === 'ACCOUNT_DISABLED') {
          alert('탈퇴했거나 비활성화된 계정입니다.')
        }
      } else {
        // 다른 에러는 토큰만 제거
        authService.removeTokens()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      setIsLoading(true)

      // 자동 로그인 여부 추출
      const { rememberMe, ...loginCredentials } = credentials

      // 실제 API 호출 (rememberMe는 제외하고 전송)
      const response = await authService.login(loginCredentials)

      // 토큰 저장 (자동 로그인 여부 전달)
      authService.setTokens(response.accessToken, response.refreshToken, rememberMe)

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

      // 백엔드에서 반환된 에러 처리
      const errorCode = error.response?.data?.Message
      const errorMessage = error.response?.data?.Error

      // 비활성화된 계정
      if (errorCode === 'ACCOUNT_DISABLED') {
        return {
          success: false,
          message: '탈퇴했거나 비활성화된 계정입니다. 관리자에게 문의하세요.',
          errorCode: 'ACCOUNT_DISABLED'
        }
      }

      // 잘못된 로그인 정보
      if (errorCode === 'INVALID_CREDENTIALS') {
        return {
          success: false,
          message: '가입 되지 않은 아이디 또는 계정입니다.',
          errorCode: 'INVALID_CREDENTIALS'
        }
      }

      return {
        success: false,
        message: errorMessage || error.response?.data?.message || '로그인에 실패했습니다.'
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
