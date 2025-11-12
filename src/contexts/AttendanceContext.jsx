import React, { createContext, useContext, useState, useEffect } from 'react'
import { useLMS } from './LMSContext'
import { attendanceService } from '../services/apiService'

const AttendanceContext = createContext()

export const useAttendance = () => {
  const context = useContext(AttendanceContext)
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider')
  }
  return context
}

export const AttendanceProvider = ({ children }) => {
  // LMSContext에서 학생 데이터 가져오기
  const { students: lmsStudents, loading: lmsLoading } = useLMS()

  // 출석 상태를 추가한 학생 목록
  const [students, setStudents] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(false)

  // 오늘 날짜를 항상 최신으로 가져오는 함수 (한국 시간 기준)
  const getTodayDate = () => {
    const now = new Date()
    // 한국 시간대로 변환 (UTC+9)
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000))
    const dateStr = koreaTime.toISOString().split('T')[0]
    console.log('🔍 [getTodayDate] 현재 시간:', {
      로컬시간: now.toLocaleString('ko-KR'),
      UTC시간: now.toISOString(),
      한국시간: koreaTime.toISOString(),
      반환날짜: dateStr
    })
    return dateStr
  }

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

  // 자정에 자동으로 데이터 초기화
  useEffect(() => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const timeUntilMidnight = tomorrow.getTime() - now.getTime()

    console.log(`⏰ 자정 자동 초기화 타이머 설정: ${Math.floor(timeUntilMidnight / 1000 / 60)}분 후`)

    const midnightTimer = setTimeout(() => {
      console.log('🌙 자정이 되었습니다! 출석 데이터를 초기화합니다.')
      // 모든 학생을 미등원 상태로 초기화
      setStudents([])
      setAttendanceRecords([])
      // 데이터 다시 로드
      if (lmsStudents && lmsStudents.length > 0) {
        loadTodayAttendance()
      }
    }, timeUntilMidnight)

    return () => clearTimeout(midnightTimer)
  }, [])

  // LMS 학생 데이터와 오늘의 출석 데이터를 결합
  useEffect(() => {
    if (lmsStudents && lmsStudents.length > 0) {
      loadTodayAttendance()
    } else {
      setStudents([])
    }
  }, [lmsStudents])

  // 오늘의 출석 데이터 로드
  const loadTodayAttendance = async () => {
    setLoading(true)
    const today = getTodayDate() // 항상 최신 날짜 사용
    try {
      console.log('📅 오늘 출석 데이터 로딩 중...', today)

      // 오늘 날짜의 출석 데이터 조회
      const response = await attendanceService.getAttendance(today)
      
      if (response.success) {
        const todayAttendance = response.data.attendance || []
        console.log('✅ 출석 데이터 로딩 성공:', todayAttendance)
        
        // ✅ 학생 ID별로 출석 상태를 매핑
        // 한 학생이 하루에 여러 번 출입(등원→외출→복귀→하원)하므로
        // 첫 등원 시간 + 마지막 하원 시간 + 현재 상태(마지막 레코드)를 결합
        const attendanceMap = {}

        // 학생별로 레코드 그룹화
        const recordsByStudent = {}
        todayAttendance.forEach(record => {
          if (!recordsByStudent[record.student_id]) {
            recordsByStudent[record.student_id] = []
          }
          recordsByStudent[record.student_id].push(record)
        })

        // 각 학생의 첫 등원 + 마지막 하원 추출
        Object.keys(recordsByStudent).forEach(studentId => {
          const records = recordsByStudent[studentId]

          // ✅ 백엔드는 ORDER BY created_at DESC로 정렬 → records[0]이 가장 최근!
          // 첫 번째 등원 찾기 (present, late) - 역순에서 찾기
          const firstCheckIn = [...records].reverse().find(r => ['present', 'late'].includes(r.status))

          // 마지막 하원 찾기 (left, early_leave) - 정순에서 찾기
          const lastCheckOut = records.find(r => ['left', 'early_leave'].includes(r.status))

          // 가장 최근 레코드 (현재 상태 판단용)
          const lastRecord = records[0] // ✅ 수정: DESC 정렬이므로 첫 번째가 최신

          attendanceMap[studentId] = {
            status: lastRecord.status, // 마지막 상태가 현재 상태
            checkInTime: firstCheckIn ? firstCheckIn.check_in_time : null,
            checkOutTime: lastCheckOut ? lastCheckOut.check_out_time : null,
            notes: lastRecord.notes,
            lastUpdate: lastRecord.created_at
          }
        })
        
        // LMS 학생 데이터와 출석 데이터 결합
        const formattedStudents = lmsStudents.map(student => {
          const attendance = attendanceMap[student.id] || {}
          const status = attendance.status || 'absent'
          
          return {
            id: student.id,
            name: student.name,
            identifier: student.attendance_number || student.attendanceNumber || `STU${String(student.id).padStart(3, '0')}`,
            className: student.class || '미등록',
            status: status,
            statusDescription: statusMapping[status] || status,
            lastUpdate: attendance.lastUpdate || null,
            checkInTime: attendance.checkInTime || null,
            checkOutTime: attendance.checkOutTime || null,
            notes: attendance.notes || '',
            profileImage: student.profileImage || student.profile_image_url || null,
            phone: student.phone,
            parentPhone: student.parentPhone || student.parent_phone
          }
        })
        
        setStudents(formattedStudents)
        
        // 출석 기록도 설정 (최근 활동 표시용)
        const records = todayAttendance.map(record => {
          // 시간 값 생성 (check_in_time이 있으면 사용, 없으면 created_at 사용)
          let taggedAt = record.created_at || new Date().toISOString()

          if (record.check_in_time) {
            // check_in_time은 HH:MM 또는 HH:MM:SS 형식이므로 오늘 날짜와 결합
            const today = new Date().toISOString().split('T')[0]
            const timeStr = record.check_in_time
            // 이미 초(SS)가 포함되어 있는지 확인
            if (timeStr.split(':').length === 2) {
              // HH:MM 형식이면 :00 추가
              taggedAt = `${today}T${timeStr}:00`
            } else {
              // HH:MM:SS 형식이면 그대로 사용
              taggedAt = `${today}T${timeStr}`
            }
          } else if (record.check_out_time) {
            // check_in_time이 없으면 check_out_time 사용
            const today = new Date().toISOString().split('T')[0]
            const timeStr = record.check_out_time
            if (timeStr.split(':').length === 2) {
              taggedAt = `${today}T${timeStr}:00`
            } else {
              taggedAt = `${today}T${timeStr}`
            }
          }

          return {
            id: record.id,
            studentName: record.student_name,
            className: record.lecture_name || '학원 출석',
            stateDescription: statusMapping[record.status] || record.status,
            taggedAt: taggedAt,
            isKeypad: null,
            processTime: 0,
            isForced: false,
            isModified: true,
            isDelayed: false,
            comment: record.notes || '',
            deviceId: '',
            thumbnailData: null
          }
        })
        
        setAttendanceRecords(records)
      }
    } catch (error) {
      console.error('❌ 출석 데이터 로딩 실패:', error)
      
      // 오류 발생 시 기본 데이터로 설정
      const formattedStudents = lmsStudents.map(student => ({
        id: student.id,
        name: student.name,
        identifier: student.attendance_number || student.attendanceNumber || `STU${String(student.id).padStart(3, '0')}`,
        className: student.class || '미등록',
        status: 'absent',
        statusDescription: '미등원',
        lastUpdate: null,
        profileImage: student.profileImage || student.profile_image_url || null,
        phone: student.phone,
        parentPhone: student.parentPhone || student.parent_phone
      }))
      setStudents(formattedStudents)
    } finally {
      setLoading(false)
    }
  }

  // 학생 상태 업데이트 함수 (MySQL에 저장)
  // ✅ lectureId 파라미터 제거 - 학원 출석은 강의와 무관
  const updateStudentStatus = async (studentId, newStatus, comment = '') => {
    const student = students.find(s => s.id === studentId)
    if (!student) {
      console.error('학생을 찾을 수 없습니다:', studentId)
      return
    }

    const today = getTodayDate() // 항상 최신 날짜 사용
    const statusDescription = statusMapping[newStatus] || newStatus
    const currentTime = new Date()
    const checkTime = currentTime.toTimeString().split(' ')[0].substring(0, 5) // HH:MM 형식

    try {
      console.log('📝 출석 상태 업데이트 중...', {
        studentId,
        date: today,
        status: newStatus,
        type: '학원 출석 (강의 무관)'
      })

      // ✅ MySQL에 출석 상태 저장 (lectureId 없이)
      // checkInTime: 등원, 지각, 복귀 시 현재 시간 저장
      // checkOutTime: 하원, 외출 시 현재 시간 저장
      const response = await attendanceService.updateAttendanceStatus(
        studentId,
        today,
        {
          // lectureId 제거 - 학원 출석이므로 불필요
          status: newStatus,
          checkInTime: ['present', 'late', 'returned'].includes(newStatus) ? checkTime : null,
          checkOutTime: ['left', 'out', 'early_leave'].includes(newStatus) ? checkTime : null,
          notes: comment
        }
      )

      if (response.success) {
        console.log('✅ 출석 상태 MySQL 저장 성공!')

        // 로컬 상태도 업데이트
        setStudents(prevStudents =>
          prevStudents.map(s =>
            s.id === studentId
              ? {
                  ...s,
                  status: newStatus,
                  statusDescription: statusDescription,
                  lastUpdate: currentTime.toISOString(),
                  checkInTime: ['present', 'late', 'returned'].includes(newStatus) ? checkTime : s.checkInTime,
                  checkOutTime: ['left', 'out', 'early_leave'].includes(newStatus) ? checkTime : s.checkOutTime,
                  notes: comment
                }
              : s
          )
        )

        // 출석 기록에 새 항목 추가
        const newRecord = {
          id: Date.now(),
          studentName: student.name,
          className: student.className,
          stateDescription: statusDescription,
          taggedAt: currentTime.toISOString(),
          isKeypad: null,
          processTime: 0,
          isForced: false,
          isModified: true,
          isDelayed: false,
          comment: comment || `관리자가 ${statusDescription}로 상태 변경`,
          deviceId: '',
          thumbnailData: null
        }

        setAttendanceRecords(prevRecords => [newRecord, ...prevRecords])

        console.log(`✅ ${student.name}의 상태를 ${statusDescription}로 변경하였습니다.`)
      }
    } catch (error) {
      console.error('❌ 출석 상태 업데이트 실패:', error)
      // ✅ 사용자에게 에러 알림
      alert(`출석 상태 업데이트 실패: ${error.response?.data?.error?.message || error.message}`)
      throw error
    }
  }

  // 출석 통계 조회
  const getAttendanceStats = async (startDate, endDate, classId = null, studentId = null) => {
    try {
      console.log('📊 출석 통계 조회 중...', { startDate, endDate, classId, studentId })

      const response = await attendanceService.getAttendanceStats(startDate, endDate, classId, studentId)

      if (response.success) {
        console.log('✅ 출석 통계 조회 성공:', response.data)
        return response.data
      }
    } catch (error) {
      console.error('❌ 출석 통계 조회 실패:', error)
      throw error
    }
  }

  const value = {
    students,
    setStudents,
    attendanceRecords,
    setAttendanceRecords,
    updateStudentStatus,
    getAttendanceStats,
    loadTodayAttendance,
    statusMapping,
    loading: loading || lmsLoading
  }

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  )
}

export default AttendanceContext
