import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const LMSContext = createContext()

export const useLMS = () => {
  const context = useContext(LMSContext)
  if (!context) {
    throw new Error('useLMS must be used within a LMSProvider')
  }
  return context
}

export const LMSProvider = ({ children }) => {
  // 강의 목록
  const [lectures, setLectures] = useState([])

  // 학생 목록
  const [students, setStudents] = useState([])

  // 초기 강의 데이터
  const initialLectures = [
    {
      id: 'math_a',
      name: '수학 A반',
      teacher: '박선생',
      subject: '수학',
      schedule: '월,수,금 19:00-20:30',
      fee: 150000,
      capacity: 20,
      currentStudents: 0,
      description: '중학교 1-2학년 대상 기초 수학'
    },
    {
      id: 'math_b',
      name: '수학 B반',
      teacher: '박선생',
      subject: '수학',
      schedule: '화,목 18:00-19:30',
      fee: 120000,
      capacity: 15,
      currentStudents: 0,
      description: '중학교 3학년 대상 수학'
    },
    {
      id: 'english_a',
      name: '영어 A반',
      teacher: '김선생',
      subject: '영어',
      schedule: '월,수,금 20:00-21:30',
      fee: 130000,
      capacity: 18,
      currentStudents: 0,
      description: '고등학교 영어 문법 및 독해'
    },
    {
      id: 'english_b',
      name: '영어 B반',
      teacher: '김선생',
      subject: '영어',
      schedule: '화,목 19:00-20:30',
      fee: 110000,
      capacity: 15,
      currentStudents: 0,
      description: '중학교 영어 기초 과정'
    },
    {
      id: 'science',
      name: '과학 C반',
      teacher: '이선생',
      subject: '과학',
      schedule: '토 10:00-12:00',
      fee: 140000,
      capacity: 12,
      currentStudents: 0,
      description: '중고등학교 과학 실험 수업'
    },
    {
      id: 'coding',
      name: '코딩반',
      teacher: '최선생',
      subject: '컴퓨터',
      schedule: '토 14:00-16:00',
      fee: 180000,
      capacity: 10,
      currentStudents: 0,
      description: '초보자를 위한 프로그래밍 기초'
    }
  ]

  // 초기 학생 데이터
  const initialStudents = [
    {
      id: 1,
      name: '김철수',
      school: '가온 중학교',
      grade: '3',
      department: '수학과',
      phone: '010-1111-2222',
      parentPhone: '010-9999-8888',
      email: 'parent1@example.com',
      class: '수학 A반',
      birthDate: '2010-03-15',
      address: '서울시 강남구',
      notes: '수학에 관심이 많음',
      selectedClasses: ['math_a'],
      classFee: 150000,
      paymentDueDate: '2025-01-25',
      sendPaymentNotification: true,
      profileImage: null,
      capturedImage: null,
      autoMessages: {
        attendance: true,
        outing: false,
        imagePost: false,
        studyMonitoring: false
      }
    },
    {
      id: 2,
      name: '이영희',
      school: '가온 고등학교',
      grade: '1',
      department: '영어과',
      phone: '010-2222-3333',
      parentPhone: '010-8888-7777',
      email: 'parent2@example.com',
      class: '영어 B반',
      birthDate: '2011-07-22',
      address: '서울시 서초구',
      notes: '영어 회화 실력 우수',
      selectedClasses: ['english_b'],
      classFee: 110000,
      paymentDueDate: '2025-01-30',
      sendPaymentNotification: true,
      profileImage: null,
      capturedImage: null,
      autoMessages: {
        attendance: true,
        outing: false,
        imagePost: false,
        studyMonitoring: false
      }
    }
  ]

  // 데이터 초기화
  useEffect(() => {
    try {
      const savedLectures = localStorage.getItem('lms_lectures')
      const savedStudents = localStorage.getItem('lms_students')

      if (savedLectures) {
        const parsedLectures = JSON.parse(savedLectures)
        setLectures(parsedLectures)
      } else {
        setLectures(initialLectures)
      }

      if (savedStudents) {
        const parsedStudents = JSON.parse(savedStudents)
        setStudents(parsedStudents)
      } else {
        setStudents(initialStudents)
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
      // 오류 발생시 초기 데이터 사용
      setLectures(initialLectures)
      setStudents(initialStudents)
    }
  }, [])

  // 데이터 저장
  useEffect(() => {
    if (lectures.length > 0) {
      localStorage.setItem('lms_lectures', JSON.stringify(lectures))
    }
  }, [lectures])

  useEffect(() => {
    if (students.length > 0) {
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
  }, [students])

  // 학생 추가/수정 시 강의 데이터 업데이트
  useEffect(() => {
    updateLectureStudentCount()
  }, [updateLectureStudentCount])

  // 학생 추가
  const addStudent = (studentData) => {
    const newStudent = {
      ...studentData,
      id: Date.now()
    }
    setStudents(prev => [newStudent, ...prev])
    return newStudent
  }

  // 학생 수정
  const updateStudent = (studentId, studentData) => {
    setStudents(prev => prev.map(student =>
      student.id === studentId ? { ...studentData, id: studentId } : student
    ))
  }

  // 학생 삭제
  const deleteStudent = (studentId) => {
    setStudents(prev => prev.filter(student => student.id !== studentId))
  }

  // 강의 추가
  const addLecture = (lectureData) => {
    const newLecture = {
      ...lectureData,
      id: `lecture_${Date.now()}`,
      currentStudents: 0
    }
    setLectures(prev => [newLecture, ...prev])
    return newLecture
  }

  // 강의 수정
  const updateLecture = (lectureId, lectureData) => {
    setLectures(prev => prev.map(lecture =>
      lecture.id === lectureId ? { ...lectureData, id: lectureId } : lecture
    ))
  }

  // 강의 삭제
  const deleteLecture = (lectureId) => {
    setLectures(prev => prev.filter(lecture => lecture.id !== lectureId))
    // 해당 강의를 수강하는 학생들의 데이터도 업데이트
    setStudents(prev => prev.map(student => ({
      ...student,
      selectedClasses: student.selectedClasses ? student.selectedClasses.filter(classId => classId !== lectureId) : []
    })))
  }

  const value = {
    lectures,
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    addLecture,
    updateLecture,
    deleteLecture,
    updateLectureStudentCount
  }

  return (
    <LMSContext.Provider value={value}>
      {children}
    </LMSContext.Provider>
  )
}