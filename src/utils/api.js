import axios from 'axios'

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // 401 에러이고 재시도하지 않은 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const response = await axios.post('/api/auth/refresh', {
          refreshToken
        })

        const { accessToken } = response.data
        localStorage.setItem('accessToken', accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // 리프레시 토큰도 만료된 경우 로그아웃
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// 학생 API
export const studentAPI = {
  // 학생 목록 조회
  getStudents: (params = {}) => {
    return api.get('/students', { params })
  },

  // 학생 상세 조회
  getStudent: (id) => {
    return api.get(`/students/${id}`)
  },

  // 학생 추가
  createStudent: (data) => {
    return api.post('/students', data)
  },

  // 학생 수정
  updateStudent: (id, data) => {
    return api.put(`/students/${id}`, data)
  },

  // 학생 삭제
  deleteStudent: (id) => {
    return api.delete(`/students/${id}`)
  }
}

// 강의 API
export const lectureAPI = {
  // 강의 목록 조회
  getLectures: (params = {}) => {
    return api.get('/lectures', { params })
  },

  // 강의 상세 조회
  getLecture: (id) => {
    return api.get(`/lectures/${id}`)
  },

  // 강의 추가
  createLecture: (data) => {
    return api.post('/lectures', data)
  },

  // 강의 수정
  updateLecture: (id, data) => {
    return api.put(`/lectures/${id}`, data)
  },

  // 강의 삭제
  deleteLecture: (id) => {
    return api.delete(`/lectures/${id}`)
  }
}

export default api
