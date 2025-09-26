import axios from 'axios'
import Cookies from 'js-cookie'

// API 기본 설정
const API_BASE_URL = '/api' // Vite proxy를 통해 백엔드로 연결됨

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 토큰 관리
const TOKEN_KEYS = {
  ACCESS: 'accessToken',
  REFRESH: 'refreshToken'
}

// 요청 인터셉터 - 모든 요청에 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 401 에러 시 토큰 갱신 시도
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = getRefreshToken()
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          })
          
          const { accessToken, refreshToken: newRefreshToken } = response.data
          setTokens(accessToken, newRefreshToken)
          
          // 원래 요청에 새 토큰으로 재시도
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃
        removeTokens()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// 토큰 관리 함수들
export const getAccessToken = () => {
  return Cookies.get(TOKEN_KEYS.ACCESS) || localStorage.getItem(TOKEN_KEYS.ACCESS)
}

export const getRefreshToken = () => {
  return Cookies.get(TOKEN_KEYS.REFRESH) || localStorage.getItem(TOKEN_KEYS.REFRESH)
}

export const setTokens = (accessToken, refreshToken) => {
  // 쿠키에 저장 (보안상 httpOnly 설정이 이상적이나, JS에서 접근이 필요하므로 일반 쿠키 사용)
  Cookies.set(TOKEN_KEYS.ACCESS, accessToken, { 
    expires: 1, // 1일
    secure: window.location.protocol === 'https:',
    sameSite: 'strict'
  })
  
  if (refreshToken) {
    Cookies.set(TOKEN_KEYS.REFRESH, refreshToken, { 
      expires: 7, // 7일
      secure: window.location.protocol === 'https:',
      sameSite: 'strict'
    })
  }
  
  // localStorage에도 백업 저장
  localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken)
  if (refreshToken) {
    localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken)
  }
}

export const removeTokens = () => {
  Cookies.remove(TOKEN_KEYS.ACCESS)
  Cookies.remove(TOKEN_KEYS.REFRESH)
  localStorage.removeItem(TOKEN_KEYS.ACCESS)
  localStorage.removeItem(TOKEN_KEYS.REFRESH)
}

// 인증 관련 API 함수들
export const authService = {
  // 로그인
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  // 현재 사용자 정보 가져오기
  getCurrentUser: async () => {
    const response = await apiClient.get('/user')
    return response.data.data.userInfo
  },

  // 토큰 갱신
  refreshToken: async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }
    
    const response = await apiClient.post('/auth/refresh', { refreshToken })
    return response.data
  },

  // 토큰 관리 함수들 export
  getAccessToken,
  getRefreshToken,
  setTokens,
  removeTokens
}

export default apiClient
