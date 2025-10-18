import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { studentService, lectureService } from '../services/apiService'
import { authService } from '../services/authService'

const LMSContext = createContext()

export const useLMS = () => {
  const context = useContext(LMSContext)
  if (!context) {
    throw new Error('useLMS must be used within a LMSProvider')
  }
  return context
}

export const LMSProvider = ({ children }) => {
  // 상태 관리
  const [lectures, setLectures] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 초기 강의 데이터 (백엔드 없을 때 사용)
  // 주의: 실제 서비스에서는 빈 배열로 시작해야 합니다
  const initialLectures = []

  // 데이터 로드 함수
  const loadData = useCallback(async () => {
    // 로그인하지 않은 상태에서는 API 호출하지 않음
    const token = authService.getAccessToken()
    if (!token) {
      setLoading(false)
      setLectures([])
      setStudents([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      // API에서 데이터 가져오기 시도
      try {
        const [studentsData, lecturesData] = await Promise.all([
          studentService.getStudents(1, 1000), // 페이지 1, 최대 1000개
          lectureService.getLectures(1, 1000)
        ])

        // 백엔드 API 응답 구조: { success: true, data: { students: [...], pagination: {...} } }
        const students = studentsData?.data?.students || []
        const lectures = lecturesData?.data?.lectures || []

        setStudents(students)
        setLectures(lectures)

        console.log('✅ API에서 데이터 로드 성공')
        console.log(`  - 학생: ${students.length}명`)
        console.log(`  - 강의: ${lectures.length}개`)
      } catch (apiError) {
        // 401 에러는 조용히 처리 (로그인하지 않은 상태)
        if (apiError.response?.status !== 401) {
          console.log('⚠️ API 연결 실패, localStorage 사용')
        }

        // API 실패 시 localStorage에서 가져오기
        const savedLectures = localStorage.getItem('lms_lectures')
        const savedStudents = localStorage.getItem('lms_students')

        if (savedLectures) {
          setLectures(JSON.parse(savedLectures))
        } else {
          setLectures(initialLectures)
        }

        if (savedStudents) {
          setStudents(JSON.parse(savedStudents))
        } else {
          setStudents([])
        }
      }
    } catch (error) {
      console.error('❌ 데이터 로드 실패:', error)
      setError(error.message || '데이터를 불러오는데 실패했습니다.')

      // 에러 발생 시 기본 데이터 사용
      setLectures(initialLectures)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    loadData()
  }, [loadData])

  // localStorage에 백업 저장 (API 실패 대비)
  useEffect(() => {
    if (lectures.length > 0) {
      localStorage.setItem('lms_lectures', JSON.stringify(lectures))
    }
  }, [lectures])

  useEffect(() => {
    if (students.length >= 0) {
      localStorage.setItem('lms_students', JSON.stringify(students))
    }
  }, [students])

  // 강의 현재 학생수 업데이트
  const updateLectureStudentCount = useCallback(() => {
    if (lectures.length > 0 && students.length >= 0) {
      setLectures(prevLectures =>
        prevLectures.map(lecture => {
          const enrolledStudentsCount = students.filter(student =>
            student.selectedClasses && Array.isArray(student.selectedClasses) && student.selectedClasses.includes(lecture.id)
          ).length

          return {
            ...lecture,
            currentStudents: enrolledStudentsCount
          }
        })
      )
    }
  }, [students, lectures.length])

  // 학생 추가/수정 시 강의 데이터 업데이트
  useEffect(() => {
    updateLectureStudentCount()
  }, [updateLectureStudentCount])

  // 학생 추가
  const addStudent = async (studentData) => {
    try {
      // 빈 문자열을 null로 변환, 타입 변환 (백엔드 검증 통과용)
      const cleanedData = {
        ...studentData,
        birthDate: studentData.birthDate || null,
        paymentDueDate: studentData.paymentDueDate || null,
        email: studentData.email || null,
        phone: studentData.phone || null,
        address: studentData.address || null,
        notes: studentData.notes || null,
        school: studentData.school || null,
        grade: studentData.grade || null,
        department: studentData.department || null,
        // Boolean 타입 명시적 변환 (DB에서 0/1로 올 수 있음)
        sendPaymentNotification: studentData.sendPaymentNotification === true || studentData.sendPaymentNotification === 1,
        // classFee를 숫자로 변환 (문자열로 올 수 있음)
        classFee: typeof studentData.classFee === 'string' ? parseFloat(studentData.classFee) : studentData.classFee,
        // autoMessages의 모든 값도 boolean으로 변환
        autoMessages: studentData.autoMessages ? {
          attendance: studentData.autoMessages.attendance === true || studentData.autoMessages.attendance === 1,
          outing: studentData.autoMessages.outing === true || studentData.autoMessages.outing === 1,
          imagePost: studentData.autoMessages.imagePost === true || studentData.autoMessages.imagePost === 1,
          studyMonitoring: studentData.autoMessages.studyMonitoring === true || studentData.autoMessages.studyMonitoring === 1
        } : {
          attendance: true,
          outing: false,
          imagePost: false,
          studyMonitoring: false
        }
      }

      // API 호출 시도
      try {
        const response = await studentService.createStudent(cleanedData)
        // 백엔드 응답 구조: { success: true, data: { student: {...} } }
        const newStudent = response.data?.student || response
        setStudents(prev => [newStudent, ...prev])
        console.log('✅ API로 학생 추가 성공:', newStudent)
        return newStudent
      } catch (apiError) {
        console.log('⚠️ API 실패, 로컬에 저장')

        // API 실패 시 로컬에 저장
        const newStudent = {
          ...cleanedData,
          id: Date.now()
        }
        setStudents(prev => [newStudent, ...prev])
        return newStudent
      }
    } catch (error) {
      console.error('❌ 학생 추가 실패:', error)
      throw error
    }
  }

  // 학생 수정
  const updateStudent = async (studentId, studentData) => {
    try {
      console.log('🔍 [LMSContext] 학생 수정 시작')
      console.log('  - studentId:', studentId)
      console.log('  - 받은 출결번호:', studentData.attendanceNumber)
      console.log('  - 전체 studentData:', studentData)

      // 빈 문자열을 null로 변환, 타입 변환 (백엔드 검증 통과용)
      const cleanedData = {
        ...studentData,
        birthDate: studentData.birthDate || null,
        paymentDueDate: studentData.paymentDueDate || null,
        email: studentData.email || null,
        phone: studentData.phone || null,
        address: studentData.address || null,
        notes: studentData.notes || null,
        school: studentData.school || null,
        grade: studentData.grade || null,
        department: studentData.department || null,
        // Boolean 타입 명시적 변환 (DB에서 0/1로 올 수 있음)
        sendPaymentNotification: studentData.sendPaymentNotification === true || studentData.sendPaymentNotification === 1,
        // classFee를 숫자로 변환 (문자열로 올 수 있음)
        classFee: typeof studentData.classFee === 'string' ? parseFloat(studentData.classFee) : studentData.classFee,
        // autoMessages의 모든 값도 boolean으로 변환
        autoMessages: studentData.autoMessages ? {
          attendance: studentData.autoMessages.attendance === true || studentData.autoMessages.attendance === 1,
          outing: studentData.autoMessages.outing === true || studentData.autoMessages.outing === 1,
          imagePost: studentData.autoMessages.imagePost === true || studentData.autoMessages.imagePost === 1,
          studyMonitoring: studentData.autoMessages.studyMonitoring === true || studentData.autoMessages.studyMonitoring === 1
        } : {
          attendance: true,
          outing: false,
          imagePost: false,
          studyMonitoring: false
        }
      }

      console.log('🔍 [LMSContext] 정리된 데이터:')
      console.log('  - 정리 후 출결번호:', cleanedData.attendanceNumber)
      console.log('  - sendPaymentNotification:', cleanedData.sendPaymentNotification, '(type:', typeof cleanedData.sendPaymentNotification, ')')

      // API 호출 시도
      try {
        console.log('🔍 [LMSContext] API 호출 전송할 데이터:', cleanedData)
        const response = await studentService.updateStudent(studentId, cleanedData)
        console.log('🔍 [LMSContext] 백엔드 응답 전체:', response)
        console.log('🔍 [LMSContext] response.data:', response.data)
        console.log('🔍 [LMSContext] response.data.student:', response.data?.student)
        // 백엔드 응답 구조: { success: true, data: { student: {...} } }
        const updatedStudent = response.data?.student || { ...cleanedData, id: studentId }
        console.log('🔍 [LMSContext] 최종 업데이트할 학생 데이터:', updatedStudent)
        console.log('🔍 [LMSContext] 최종 출결번호:', updatedStudent.attendanceNumber)
        setStudents(prev => prev.map(student =>
          student.id === studentId ? updatedStudent : student
        ))
        console.log('✅ API로 학생 수정 성공:', updatedStudent)
      } catch (apiError) {
        console.log('⚠️ API 실패, 로컬에서 수정')

        // API 실패 시 로컬에서 수정
        setStudents(prev => prev.map(student =>
          student.id === studentId ? { ...cleanedData, id: studentId } : student
        ))
      }
    } catch (error) {
      console.error('❌ 학생 수정 실패:', error)
      throw error
    }
  }

  // 학생 삭제
  const deleteStudent = async (studentId) => {
    try {
      // API 호출 시도
      try {
        await studentService.deleteStudent(studentId)
        setStudents(prev => prev.filter(student => student.id !== studentId))
        console.log('✅ API로 학생 삭제 성공')
      } catch (apiError) {
        console.log('⚠️ API 실패, 로컬에서 삭제')
        
        // API 실패 시 로컬에서 삭제
        setStudents(prev => prev.filter(student => student.id !== studentId))
      }
    } catch (error) {
      console.error('❌ 학생 삭제 실패:', error)
      throw error
    }
  }

  // 강의 추가
  const addLecture = async (lectureData) => {
    try {
      // API 호출 시도
      try {
        const response = await lectureService.createLecture(lectureData)
        // 백엔드 응답 구조: { success: true, data: { lecture: {...} } }
        const newLecture = response.data?.lecture || response
        setLectures(prev => [newLecture, ...prev])
        console.log('✅ API로 강의 추가 성공:', newLecture)

        // ✅ 강의 추가 후 학생 데이터 다시 로드 (student_lectures 테이블 변경 반영)
        await loadData()

        return newLecture
      } catch (apiError) {
        console.log('⚠️ API 실패, 로컬에 저장')

        // API 실패 시 로컬에 저장
        const newLecture = {
          ...lectureData,
          id: `lecture_${Date.now()}`,
          currentStudents: 0
        }
        setLectures(prev => [newLecture, ...prev])
        return newLecture
      }
    } catch (error) {
      console.error('❌ 강의 추가 실패:', error)
      throw error
    }
  }

  // 강의 수정
  const updateLecture = async (lectureId, lectureData) => {
    try {
      // API 호출 시도
      try {
        const response = await lectureService.updateLecture(lectureId, lectureData)
        // 백엔드 응답 구조: { success: true, data: { lecture: {...} } }
        const updatedLecture = response.data?.lecture || { ...lectureData, id: lectureId }
        setLectures(prev => prev.map(lecture =>
          lecture.id === lectureId ? updatedLecture : lecture
        ))
        console.log('✅ API로 강의 수정 성공:', updatedLecture)

        // ✅ 강의 수정 후 학생 데이터 다시 로드 (student_lectures 테이블 변경 반영)
        await loadData()
      } catch (apiError) {
        console.log('⚠️ API 실패, 로컬에서 수정')

        // API 실패 시 로컬에서 수정
        setLectures(prev => prev.map(lecture =>
          lecture.id === lectureId ? { ...lectureData, id: lectureId } : lecture
        ))
      }
    } catch (error) {
      console.error('❌ 강의 수정 실패:', error)
      throw error
    }
  }

  // 강의 삭제
  const deleteLecture = async (lectureId) => {
    try {
      // API 호출 시도
      try {
        await lectureService.deleteLecture(lectureId)
        setLectures(prev => prev.filter(lecture => lecture.id !== lectureId))
        
        // 해당 강의를 수강하는 학생들의 데이터도 업데이트
        setStudents(prev => prev.map(student => ({
          ...student,
          selectedClasses: student.selectedClasses ? student.selectedClasses.filter(classId => classId !== lectureId) : []
        })))
        
        console.log('✅ API로 강의 삭제 성공')
      } catch (apiError) {
        console.log('⚠️ API 실패, 로컬에서 삭제')
        
        // API 실패 시 로컬에서 삭제
        setLectures(prev => prev.filter(lecture => lecture.id !== lectureId))
        setStudents(prev => prev.map(student => ({
          ...student,
          selectedClasses: student.selectedClasses ? student.selectedClasses.filter(classId => classId !== lectureId) : []
        })))
      }
    } catch (error) {
      console.error('❌ 강의 삭제 실패:', error)
      throw error
    }
  }

  // 데이터 새로고침
  const refreshData = useCallback(() => {
    loadData()
  }, [loadData])

  const value = {
    lectures,
    students,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    addLecture,
    updateLecture,
    deleteLecture,
    updateLectureStudentCount,
    refreshData
  }

  return (
    <LMSContext.Provider value={value}>
      {children}
    </LMSContext.Provider>
  )
}
