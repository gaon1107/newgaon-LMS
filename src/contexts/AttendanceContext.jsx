import React, { createContext, useContext, useState } from 'react'

const AttendanceContext = createContext()

export const useAttendance = () => {
  const context = useContext(AttendanceContext)
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider')
  }
  return context
}

export const AttendanceProvider = ({ children }) => {
  // 학생 목록 상태
  const [students, setStudents] = useState([
    {
      id: 1,
      name: '김철수',
      identifier: 'STU001',
      className: '수학 A반',
      status: 'present',
      statusDescription: '등원',
      lastUpdate: '2024-01-15 09:15',
      profileImage: '/api/placeholder/60/60'
    },
    {
      id: 2,
      name: '이영희',
      identifier: 'STU002',
      className: '수학 A반',
      status: 'absent',
      statusDescription: '미등원',
      lastUpdate: null,
      profileImage: '/api/placeholder/60/60'
    },
    {
      id: 3,
      name: '박민수',
      identifier: 'STU003',
      className: '영어 B반',
      status: 'present',
      statusDescription: '등원',
      lastUpdate: '2024-01-15 08:45',
      profileImage: '/api/placeholder/60/60'
    },
    {
      id: 4,
      name: '최지은',
      identifier: 'STU004',
      className: '영어 B반',
      status: 'early_leave',
      statusDescription: '조퇴',
      lastUpdate: '2024-01-15 14:30',
      profileImage: '/api/placeholder/60/60'
    },
    {
      id: 5,
      name: '정현우',
      identifier: 'STU005',
      className: '수학 A반',
      status: 'present',
      statusDescription: '등원',
      lastUpdate: '2024-01-15 09:00',
      profileImage: '/api/placeholder/60/60'
    },
    {
      id: 6,
      name: '한미래',
      identifier: 'STU006',
      className: '영어 B반',
      status: 'late',
      statusDescription: '지각',
      lastUpdate: '2024-01-15 10:15',
      profileImage: '/api/placeholder/60/60'
    }
  ])

  // 출석 기록 상태
  const [attendanceRecords, setAttendanceRecords] = useState([
    {
      id: 1,
      studentName: '김철수',
      className: '수학 A반',
      stateDescription: '등원',
      taggedAt: '2025-01-19 08:45:23',
      isKeypad: false,
      processTime: 1.2,
      isForced: false,
      isModified: false,
      isDelayed: false,
      comment: '정상 등원',
      deviceId: 'DEVICE-001',
      thumbnailData: '/api/images/thumbnail/1.jpg'
    },
    {
      id: 2,
      studentName: '이영희',
      className: '수학 A반',
      stateDescription: '하원',
      taggedAt: '2025-01-19 17:30:15',
      isKeypad: true,
      processTime: 0.8,
      isForced: false,
      isModified: true,
      isDelayed: false,
      comment: '키패드로 하원 처리',
      deviceId: 'DEVICE-002',
      thumbnailData: null
    },
    {
      id: 3,
      studentName: '박민수',
      className: '영어 B반',
      stateDescription: '등원',
      taggedAt: '2025-01-19 09:15:42',
      isKeypad: false,
      processTime: 2.1,
      isForced: true,
      isModified: false,
      isDelayed: true,
      comment: '지각 등원',
      deviceId: 'DEVICE-001',
      thumbnailData: '/api/images/thumbnail/3.jpg'
    },
    {
      id: 4,
      studentName: '최지은',
      className: '영어 B반',
      stateDescription: '조퇴',
      taggedAt: '2025-01-19 14:30:10',
      isKeypad: null,
      processTime: 0,
      isForced: false,
      isModified: true,
      isDelayed: false,
      comment: '몸이 아파서 조퇴',
      deviceId: '',
      thumbnailData: null
    },
    {
      id: 5,
      studentName: '정현우',
      className: '수학 A반',
      stateDescription: '등원',
      taggedAt: '2025-01-19 09:00:25',
      isKeypad: false,
      processTime: 1.5,
      isForced: false,
      isModified: false,
      isDelayed: false,
      comment: '정상 등원',
      deviceId: 'DEVICE-003',
      thumbnailData: '/api/images/thumbnail/5.jpg'
    },
    {
      id: 6,
      studentName: '한미래',
      className: '영어 B반',
      stateDescription: '지각',
      taggedAt: '2025-01-19 10:15:25',
      isKeypad: false,
      processTime: 1.5,
      isForced: true,
      isModified: false,
      isDelayed: true,
      comment: '늦게 등원',
      deviceId: 'DEVICE-003',
      thumbnailData: '/api/images/thumbnail/6.jpg'
    }
  ])

  // 상태 옵션 매핑
  const statusMapping = {
    'present': '등원',
    'absent': '미등원',
    'late': '지각',
    'early_leave': '조퇴',
    'out': '외출',
    'returned': '복귀',
    'left': '하원'
  }

  // 학생 상태 업데이트 함수
  const updateStudentStatus = (studentId, newStatus, comment = '') => {
    const student = students.find(s => s.id === studentId)
    if (!student) return

    const statusDescription = statusMapping[newStatus] || newStatus
    const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ')

    // 학생 상태 업데이트
    setStudents(prevStudents =>
      prevStudents.map(s =>
        s.id === studentId
          ? {
              ...s,
              status: newStatus,
              statusDescription: statusDescription,
              lastUpdate: currentTime
            }
          : s
      )
    )

    // 출석 기록에 새 항목 추가
    const newRecord = {
      id: attendanceRecords.length + Date.now(), // 임시 ID 생성
      studentName: student.name,
      className: student.className,
      stateDescription: statusDescription,
      taggedAt: currentTime,
      isKeypad: null, // 관리자가 직접 변경
      processTime: 0,
      isForced: false,
      isModified: true, // 관리자가 수정함
      isDelayed: false,
      comment: comment || `관리자가 ${statusDescription}로 상태 변경`,
      deviceId: '',
      thumbnailData: null
    }

    setAttendanceRecords(prevRecords => [newRecord, ...prevRecords])

    console.log(`${student.name}의 상태를 ${statusDescription}로 변경하였습니다.`, comment ? `참고: ${comment}` : '')
  }

  const value = {
    students,
    setStudents,
    attendanceRecords,
    setAttendanceRecords,
    updateStudentStatus,
    statusMapping
  }

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  )
}

export default AttendanceContext