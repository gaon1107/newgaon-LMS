import axios from 'axios'
import { authService } from './authService'

// API 기본 설정
const API_BASE_URL = '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = authService.getRefreshToken()
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          })
          
          const { accessToken, refreshToken: newRefreshToken } = response.data
          authService.setTokens(accessToken, newRefreshToken)
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        authService.removeTokens()
        window.location.href = '/'
      }
    }

    return Promise.reject(error)
  }
)

// 출결 관리 API
export const attendanceService = {
  // 출결 데이터 조회
  getAttendance: async (date, classId = null) => {
    const params = { date }
    if (classId) params.classId = classId
    
    const response = await apiClient.get('/attendance', { params })
    return response.data
  },

  // 출결 상태 업데이트
  updateAttendanceStatus: async (studentId, date, status) => {
    const response = await apiClient.put(`/attendance/${studentId}`, {
      date,
      status
    })
    return response.data
  },

  // 출결 통계 조회
  getAttendanceStats: async (startDate, endDate, classId = null) => {
    const params = { startDate, endDate }
    if (classId) params.classId = classId
    
    const response = await apiClient.get('/attendance/stats', { params })
    return response.data
  }
}

// 학생 관리 API
export const studentService = {
  // 학생 목록 조회
  getStudents: async (page = 1, limit = 20, search = '') => {
    const response = await apiClient.get('/students', {
      params: { page, limit, search }
    })
    return response.data
  },

  // 학생 상세 조회
  getStudent: async (studentId) => {
    const response = await apiClient.get(`/students/${studentId}`)
    return response.data
  },

  // 학생 추가
  createStudent: async (studentData) => {
    const response = await apiClient.post('/students', studentData)
    return response.data
  },

  // 학생 정보 수정
  updateStudent: async (studentId, studentData) => {
    const response = await apiClient.put(`/students/${studentId}`, studentData)
    return response.data
  },

  // 학생 삭제
  deleteStudent: async (studentId) => {
    const response = await apiClient.delete(`/students/${studentId}`)
    return response.data
  },

  // 학생 일괄 등록 (엑셀)
  bulkImportStudents: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post('/students/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }
}

// 강사 관리 API
export const teacherService = {
  // 강사 목록 조회
  getTeachers: async (page = 1, limit = 20, search = '') => {
    const response = await apiClient.get('/teachers', {
      params: { page, limit, search }
    })
    return response.data
  },

  // 강사 추가
  createTeacher: async (teacherData) => {
    const response = await apiClient.post('/teachers', teacherData)
    return response.data
  },

  // 강사 정보 수정
  updateTeacher: async (teacherId, teacherData) => {
    const response = await apiClient.put(`/teachers/${teacherId}`, teacherData)
    return response.data
  },

  // 강사 삭제
  deleteTeacher: async (teacherId) => {
    const response = await apiClient.delete(`/teachers/${teacherId}`)
    return response.data
  }
}

// 강의 관리 API
export const lectureService = {
  // 강의 목록 조회
  getLectures: async (page = 1, limit = 20, search = '') => {
    const response = await apiClient.get('/lectures', {
      params: { page, limit, search }
    })
    return response.data
  },

  // 강의 추가
  createLecture: async (lectureData) => {
    const response = await apiClient.post('/lectures', lectureData)
    return response.data
  },

  // 강의 정보 수정
  updateLecture: async (lectureId, lectureData) => {
    const response = await apiClient.put(`/lectures/${lectureId}`, lectureData)
    return response.data
  },

  // 강의 삭제
  deleteLecture: async (lectureId) => {
    const response = await apiClient.delete(`/lectures/${lectureId}`)
    return response.data
  }
}

// 메시지 관리 API
export const messageService = {
  // 메시지 발송
  sendMessage: async (messageData) => {
    const response = await apiClient.post('/messages/send', messageData)
    return response.data
  },

  // 메시지 발송 기록 조회
  getMessageHistory: async (page = 1, limit = 20) => {
    const response = await apiClient.get('/messages/history', {
      params: { page, limit }
    })
    return response.data
  },

  // 메시지 비용 계산
  calculateMessageCost: async (content, recipientCount) => {
    const response = await apiClient.post('/messages/calculate-cost', {
      content,
      recipientCount
    })
    return response.data
  }
}

// 파일 관리 API
export const fileService = {
  // 파일 업로드
  uploadFile: async (file, type = 'general') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    const response = await apiClient.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  // 파일 목록 조회
  getFiles: async (type = null) => {
    const params = type ? { type } : {}
    const response = await apiClient.get('/files', { params })
    return response.data
  },

  // 파일 삭제
  deleteFile: async (fileId) => {
    const response = await apiClient.delete(`/files/${fileId}`)
    return response.data
  },

  // 파일 다운로드
  downloadFile: async (fileId) => {
    const response = await apiClient.get(`/files/${fileId}/download`, {
      responseType: 'blob'
    })
    return response
  },

  // 출결 통계 엑셀 다운로드
  downloadAttendanceExcel: async (startDate, endDate, classId = null) => {
    const params = { startDate, endDate }
    if (classId) params.classId = classId
    
    const response = await apiClient.get('/files/attendance-report', {
      params,
      responseType: 'blob'
    })
    return response
  },

  // 학생 등록 템플릿 다운로드
  downloadStudentTemplate: async () => {
    const response = await apiClient.get('/files/student-template', {
      responseType: 'blob'
    })
    return response
  }
}

// 대시보드 API
export const dashboardService = {
  // 대시보드 통계 조회
  getStats: async () => {
    const response = await apiClient.get('/dashboard/stats')
    return response.data
  },

  // 최근 활동 조회
  getRecentActivities: async (limit = 10) => {
    const response = await apiClient.get('/dashboard/activities', {
      params: { limit }
    })
    return response.data
  }
}

export default apiClient
