import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Tooltip,
  Stack,
  InputLabel
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  GetApp as DownloadIcon,
  TableChart as ExcelIcon,
  Assessment as ReportIcon,
  Visibility as PreviewIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Payment as PaymentIcon
} from '@mui/icons-material'
import * as XLSX from 'xlsx'
import { useLMS } from '../contexts/LMSContext'
import { useAttendance } from '../contexts/AttendanceContext'
import { studentPaymentService } from '../services/apiService'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts'
import FileManager from '../components/FileManager'

const FilePage = () => {
  const { addStudent, lectures } = useLMS()

  // AttendanceContext 안전하게 접근
  const attendanceContext = useAttendance()
  const attendanceStudents = attendanceContext?.students || []
  const attendanceRecords = attendanceContext?.attendanceRecords || []

  const fileInputRef = useRef(null)

  // 상태 변수들 먼저 정의
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [studentFiles, setStudentFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewData, setPreviewData] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false)
  const [studentTemplateOpen, setStudentTemplateOpen] = useState(false)
  const [attendanceReportOpen, setAttendanceReportOpen] = useState(false)
  const [paymentStatusOpen, setPaymentStatusOpen] = useState(false)
  // 수납현황 관련 state
  const [paymentSearchStudent, setPaymentSearchStudent] = useState('') // 학생 검색어
  const [paymentStartMonth, setPaymentStartMonth] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  })
  const [paymentEndMonth, setPaymentEndMonth] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  })
  const [currentMonthPayments, setCurrentMonthPayments] = useState([]) // 전체 학생 당월 납부 현황
  const [selectedStudentPaymentInfo, setSelectedStudentPaymentInfo] = useState(null) // 선택한 학생 납부 정보
  const [paymentLoading, setPaymentLoading] = useState(false)
  // ✅ 수정: 기본값을 이번 달 1일부터 오늘까지로 명확하게 설정
  const [reportDateRange, setReportDateRange] = useState(() => {
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return {
      startDate: firstDayOfMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    }
  })
  // ✅ 학생 선택 필터
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [editingRows, setEditingRows] = useState(new Set())
  const [editedData, setEditedData] = useState({})
  // ✅ DB에서 받은 출석 통계 데이터 저장
  const [dbAttendanceStats, setDbAttendanceStats] = useState({
    studentStats: [],
    overallStats: null,
    detailedRecords: [],
    period: {}
  })

  // 실제 출석 데이터 분석 (DB 데이터 사용)
  const generateAttendanceData = useMemo(() => {
    return () => {
      try {
        console.log('📊 출석 데이터 생성 중...', {
          dbAttendanceStats: dbAttendanceStats,
          attendanceRecords: attendanceRecords.length,
          hasDbData: dbAttendanceStats?.studentStats?.length > 0
        })
        
        // ✅ DB에서 가져온 데이터가 있으면 형식을 변환해서 사용
        if (dbAttendanceStats?.studentStats && dbAttendanceStats.studentStats.length > 0) {
          console.log('✅ DB 데이터 사용 (변환 전):', dbAttendanceStats.studentStats)
          
          // 📌 DB 형식을 화면 형식으로 변환
          const transformedStats = dbAttendanceStats.studentStats.map(stat => {
            // ✅ attendance_rate를 안전하게 숫자로 변환
            const rate = parseFloat(stat.attendance_rate) || 0
            
            return {
              '학생명': stat.student_name || stat.studentName || '이름없음',
              '총일수': stat.total_days || 0,
              '출석일수': stat.present_days || 0,
              '지각일수': stat.late_days || 0,
              '조퇴일수': stat.early_leave_days || 0,
              '결석일수': stat.absent_days || 0,
              '출석률(%)': rate.toFixed(1)  // 안전하게 변환 후 소수점 처리
            }
          })
          
          console.log('✅ DB 데이터 변환 완료 (attendance_rate 안전 처리):', transformedStats)
          return {
            summary: transformedStats,
            details: dbAttendanceStats.details || []
          }
        }
        
        // 📌 DB 데이터가 없으면 Context 데이터로 계산
        console.log('📌 DB 데이터 없음, Context 데이터로 계산 중...')
        const startDate = new Date(reportDateRange.startDate)
        const endDate = new Date(reportDateRange.endDate)

      // 기간 내 출석 기록 필터링
      const filteredRecords = attendanceRecords.filter(record => {
        const recordDate = new Date(record.taggedAt)
        return recordDate >= startDate && recordDate <= endDate
      })

      // 학생별 출석 통계 계산
      const studentStats = {}
      const allStudents = [...new Set([
        ...attendanceStudents.map(s => s.name),
        ...filteredRecords.map(r => r.studentName)
      ])]

      // 총 일수 계산 (주말 제외)
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
      const workingDays = []
      for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + i)
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          workingDays.push(currentDate.toISOString().split('T')[0])
        }
      }

      allStudents.forEach(studentName => {
        const studentRecords = filteredRecords.filter(r => r.studentName === studentName)

        // 일별 출석 상태 분석
        const dailyAttendance = {}
        workingDays.forEach(date => {
          const dayRecords = studentRecords.filter(r =>
            r.taggedAt.split(' ')[0] === date
          )

          if (dayRecords.length === 0) {
            dailyAttendance[date] = '결석'
          } else {
            // 등원/하원 기록 분석
            const entranceRecord = dayRecords.find(r =>
              r.stateDescription === '등원' || r.stateDescription === '입실'
            )
            const exitRecord = dayRecords.find(r =>
              r.stateDescription === '하원' || r.stateDescription === '퇴실'
            )

            if (entranceRecord) {
              const entranceTime = new Date(`1970-01-01 ${entranceRecord.taggedAt.split(' ')[1]}`)
              const standardTime = new Date('1970-01-01 09:00:00')
              const earlyExitTime = new Date('1970-01-01 16:00:00')

              if (entranceTime > standardTime) {
                dailyAttendance[date] = '지각'
              } else if (exitRecord) {
                const exitTime = new Date(`1970-01-01 ${exitRecord.taggedAt.split(' ')[1]}`)
                if (exitTime < earlyExitTime) {
                  dailyAttendance[date] = '조퇴'
                } else {
                  dailyAttendance[date] = '출석'
                }
              } else {
                dailyAttendance[date] = '출석'
              }
            } else {
              dailyAttendance[date] = '결석'
            }
          }
        })

        // 통계 계산
        const attendanceDays = Object.values(dailyAttendance).filter(status => status === '출석').length
        const lateDays = Object.values(dailyAttendance).filter(status => status === '지각').length
        const earlyLeaveDays = Object.values(dailyAttendance).filter(status => status === '조퇴').length
        const absentDays = Object.values(dailyAttendance).filter(status => status === '결석').length

        studentStats[studentName] = {
          '학생명': studentName,
          '총일수': workingDays.length,
          '출석일수': attendanceDays,
          '지각일수': lateDays,
          '조퇴일수': earlyLeaveDays,
          '결석일수': absentDays,
          '출석률(%)': workingDays.length > 0 ?
            ((attendanceDays / workingDays.length) * 100).toFixed(1) : '0.0',
          dailyAttendance
        }
      })

      const summary = Object.values(studentStats)

      // 상세 데이터 생성
      const details = []
      workingDays.forEach(date => {
        allStudents.forEach(studentName => {
          const stats = studentStats[studentName]
          if (!stats) return

          const status = stats.dailyAttendance[date]

          const dayRecords = filteredRecords.filter(r =>
            r.studentName === studentName && r.taggedAt.split(' ')[0] === date
          )

          let entranceTime = '-'
          let exitTime = '-'
          let comment = ''

          if (dayRecords.length > 0) {
            const entranceRecord = dayRecords.find(r =>
              r.stateDescription === '등원' || r.stateDescription === '입실'
            )
            const exitRecord = dayRecords.find(r =>
              r.stateDescription === '하원' || r.stateDescription === '퇴실'
            )

            if (entranceRecord) {
              entranceTime = entranceRecord.taggedAt.split(' ')[1].slice(0, 5)
              comment = entranceRecord.comment || ''
            }
            if (exitRecord) {
              exitTime = exitRecord.taggedAt.split(' ')[1].slice(0, 5)
            }
          }

          details.push({
            '날짜': date,
            '학생명': studentName,
            '출결상태': status,
            '입실시간': entranceTime,
            '퇴실시간': exitTime,
            '비고': comment
          })
        })
      })

        return { summary, details }
      } catch (error) {
        console.error('출석 데이터 처리 오류:', error)
        return { summary: [], details: [] }
      }
    }
  }, [reportDateRange.startDate, reportDateRange.endDate, attendanceRecords, attendanceStudents, dbAttendanceStats])

  // 출석 데이터 최적화 (DB 데이터 포함)
  const attendanceData = useMemo(() => {
    if (!attendanceReportOpen) return { summary: [], details: [] }
    
    console.log('🔄 attendanceData 업데이트 중...', {
      dbStatsSummary: dbAttendanceStats?.studentStats?.length,
      contextRecords: attendanceRecords.length
    })
    
    return generateAttendanceData()
  }, [attendanceReportOpen, generateAttendanceData, attendanceRecords, attendanceStudents, dbAttendanceStats])

  // 임시 파일 데이터
  const mockFiles = [
    {
      id: 1,
      name: '학생명단_2025년1월.xlsx',
      size: 15360,
      uploadDate: '2025-01-15T09:30:00',
      url: '/api/files/download/1'
    },
    {
      id: 2,
      name: '출결통계_12월.pdf',
      size: 2048000,
      uploadDate: '2025-01-10T14:20:00',
      url: '/api/files/download/2'
    }
  ]

  const mockStudentFiles = [
    {
      id: 3,
      name: '학생일괄등록_양식.xlsx',
      size: 8192,
      uploadDate: '2025-01-01T00:00:00',
      url: '/templates/student_template.xlsx'
    }
  ]

  // 데이터 로딩
  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      // 실제로는 API에서 파일 목록을 가져옴
      setUploadedFiles(mockFiles)
      setStudentFiles(mockStudentFiles)
    } catch (error) {
      console.error('파일 목록 로딩 실패:', error)
    }
  }

  // 파일 업로드 처리
  const handleFileUpload = async (file) => {
    try {
      // 실제 API 호출
      // const response = await fileService.uploadFile(file)
      
      // 임시 처리
      const newFile = {
        id: Date.now(),
        name: file.name,
        size: file.size,
        uploadDate: new Date().toISOString(),
        url: URL.createObjectURL(file)
      }
      
      setUploadedFiles(prev => [newFile, ...prev])
      return newFile
    } catch (error) {
      console.error('파일 업로드 실패:', error)
      throw error
    }
  }

  // 학생 파일 업로드 처리
  const handleStudentFileUpload = async (file) => {
    try {
      // 엑셀 파일만 허용
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        throw new Error('엑셀 파일만 업로드 가능합니다.')
      }
      
      // 실제 API 호출
      // const response = await fileService.uploadStudentExcel(file)
      
      // 임시 처리
      const newFile = {
        id: Date.now(),
        name: file.name,
        size: file.size,
        uploadDate: new Date().toISOString(),
        url: URL.createObjectURL(file)
      }
      
      setStudentFiles(prev => [newFile, ...prev])
      return newFile
    } catch (error) {
      console.error('학생 파일 업로드 실패:', error)
      throw error
    }
  }

  // 파일 삭제
  const handleFileDelete = async (fileId) => {
    try {
      // 실제 API 호출
      // await fileService.deleteFile(fileId)
      
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
    } catch (error) {
      console.error('파일 삭제 실패:', error)
      throw error
    }
  }

  // 학생 파일 삭제
  const handleStudentFileDelete = async (fileId) => {
    try {
      setStudentFiles(prev => prev.filter(file => file.id !== fileId))
    } catch (error) {
      console.error('파일 삭제 실패:', error)
      throw error
    }
  }

  // 출결 통계 데이터 로드 (DB에서 실제 데이터 가져오기)
  const loadAttendanceStats = async () => {
    try {
      setLoading(true)
      console.log('📊 출석 통계 데이터 로드 중...', {
        startDate: reportDateRange.startDate,
        endDate: reportDateRange.endDate,
        studentId: selectedStudentId
      })

      // ✅ AttendanceContext의 getAttendanceStats 함수 호출 (학생 ID 포함)
      const statsData = await attendanceContext.getAttendanceStats(
        reportDateRange.startDate,
        reportDateRange.endDate,
        null,  // classId
        selectedStudentId
      )

      console.log('✅ 출석 통계 데이터 로드 성공:', statsData)

      // 📌 받은 데이터를 상태에 저장 (화면에 반영되도록)
      if (statsData && statsData.studentStats) {
        setDbAttendanceStats({
          studentStats: statsData.studentStats,
          overallStats: statsData.overallStats,
          detailedRecords: statsData.detailedRecords || [],
          details: statsData.details || [],
          period: {
            startDate: reportDateRange.startDate,
            endDate: reportDateRange.endDate
          }
        })
        console.log('💾 DB 데이터가 상태에 저장되었습니다')
      }

      setLoading(false)
    } catch (error) {
      console.error('❌ 출석 통계 데이터 로드 실패:', error)
      alert('출석 통계 데이터를 불러오는데 실패했습니다.')
      setLoading(false)
    }
  }

  // ✅ 로컬 날짜를 YYYY-MM-DD 형식으로 변환 (타임존 문제 해결)
  const formatLocalDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 출결 통계 리포트 모달 열기
  const handleDownloadAttendanceReport = () => {
    // ✅ 모달이 열릴 때마다 조회 기간을 이번 달 1일로 초기화
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const newDateRange = {
      startDate: formatLocalDate(firstDayOfMonth),
      endDate: formatLocalDate(today)
    }

    console.log('🗓️ 모달 열림 - 날짜 초기화:', newDateRange)

    // 모든 필터 초기화
    setReportDateRange(newDateRange)
    setSelectedStudentId(null)

    // DB 데이터 초기화
    setDbAttendanceStats({
      studentStats: [],
      overallStats: null,
      detailedRecords: [],
      period: {}
    })

    setAttendanceReportOpen(true)
    // 모달이 열렸을 때 DB에서 데이터 로드
    setTimeout(() => {
      loadAttendanceStats()
    }, 100)
  }

  // 출결 통계 리포트 모달 닫기
  const handleCloseAttendanceReport = () => {
    setAttendanceReportOpen(false)
  }

  // 학생 등록 양식 모달 열기
  const handleOpenStudentTemplate = () => {
    setStudentTemplateOpen(true)
  }

  // 학생 등록 양식 모달 닫기
  const handleCloseStudentTemplate = () => {
    setStudentTemplateOpen(false)
  }

  // 수납현황 모달 열기
  const handleOpenPaymentStatus = async () => {
    setPaymentStatusOpen(true)
    // 초기화
    setPaymentSearchStudent('')
    setSelectedStudentPaymentInfo(null)
    // 당월 전체 학생 납부 현황 로드
    await loadCurrentMonthPayments()
  }

  // 수납현황 모달 닫기
  const handleClosePaymentStatus = () => {
    setPaymentStatusOpen(false)
    setCurrentMonthPayments([])
    setSelectedStudentPaymentInfo(null)
  }

  // 당월 전체 학생 납부 현황 조회
  const loadCurrentMonthPayments = async () => {
    setPaymentLoading(true)
    try {
      const today = new Date()
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

      const response = await studentPaymentService.getCurrentMonthPayments(currentMonth)

      if (response.success) {
        setCurrentMonthPayments(response.data.payments)
        console.log('✅ 당월 납부 현황 로드 성공:', response.data.payments)
      }
    } catch (error) {
      console.error('❌ 당월 납부 현황 로드 실패:', error)
      alert('당월 납부 현황을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setPaymentLoading(false)
    }
  }

  // 학생 검색 및 납부 정보 조회
  const handlePaymentSearch = async () => {
    if (!paymentSearchStudent) {
      alert('학생 이름을 입력해주세요.')
      return
    }

    setPaymentLoading(true)
    try {
      // 학생 이름으로 ID 찾기
      const student = attendanceStudents.find(s => s.name === paymentSearchStudent)

      if (!student) {
        alert('해당 학생을 찾을 수 없습니다.')
        setPaymentLoading(false)
        return
      }

      // 학생의 납부 정보 조회
      const response = await studentPaymentService.getStudentPaymentInfo(
        student.id,
        paymentStartMonth,
        paymentEndMonth
      )

      if (response.success) {
        setSelectedStudentPaymentInfo(response.data)
        console.log('✅ 학생 납부 정보 조회 성공:', response.data)
      }
    } catch (error) {
      console.error('❌ 학생 납부 정보 조회 실패:', error)
      alert('학생 납부 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setPaymentLoading(false)
    }
  }

  // 출결 통계 데이터 새로고침
  const handleRefreshAttendanceData = async () => {
    console.log('🔄 출석 통계 데이터 새로고침 중...')
    await loadAttendanceStats()
  }

  // 기간 변경 및 학생 선택 시 자동 새로고침
  useEffect(() => {
    if (attendanceReportOpen) {
      console.log('📅 기간/학생 변경 감지, 데이터 새로고침...')
      loadAttendanceStats()
    }
  }, [reportDateRange.startDate, reportDateRange.endDate, selectedStudentId, attendanceReportOpen])

  // 엑셀 다운로드 실행
  const handleExcelDownload = async () => {
    try {
      setLoading(true)

      // 실제 API 호출
      // const response = await fileService.downloadAttendanceExcel(reportDateRange.startDate, reportDateRange.endDate)

      // 임시 처리 - 엑셀 파일 생성
      await generateAttendanceExcel()

      setLoading(false)
    } catch (error) {
      console.error('출결 리포트 다운로드 실패:', error)
      setLoading(false)
    }
  }

  // 엑셀 파일 생성
  const generateAttendanceExcel = async () => {
    const XLSX = await import('xlsx')

    const workbook = XLSX.utils.book_new()

    // 요약 시트
    const summarySheet = XLSX.utils.json_to_sheet(attendanceData.summary)
    XLSX.utils.book_append_sheet(workbook, summarySheet, '출결요약')

    // 학생별 상세 시트
    const detailSheet = XLSX.utils.json_to_sheet(attendanceData.details)
    XLSX.utils.book_append_sheet(workbook, detailSheet, '상세내역')

    // 파일명 생성
    const startDate = reportDateRange.startDate.replace(/-/g, '')
    const endDate = reportDateRange.endDate.replace(/-/g, '')
    const fileName = `출결통계_${startDate}_${endDate}.xlsx`

    XLSX.writeFile(workbook, fileName)
    alert(`${fileName} 파일이 다운로드되었습니다.`)
  }

  // 학생 등록 템플릿 파일 다운로드
  const downloadStudentTemplateFile = () => {
    try {
      // 학생 등록 양식 데이터 구조 (예시 데이터 개선)
      const templateData = [
        {
          '학생명': '홍길동',
          '학교': '새가온초등학교',
          '학년': '3',
          '과목': '수학과',
          '전화번호': '01012345678',
          '학부모연락처': '01098765432',
          '이메일': 'parent@example.com',
          '수강클래스': '초등수학기초반',
          '생년월일': '2015-03-15',
          '주소': '서울시 강남구 테헤란로 123',
          '비고': '특이사항 없음',
          '수강료': '50000',
          '결제일': '2025-01-01',
          '등하원알림': 'Y',
          '외출복귀알림': 'N',
          '이미지포함알림': 'N',
          '학습관제알림': 'N'
        },
        {
          '학생명': '김영희',
          '학교': '새가온중학교',
          '학년': '1',
          '과목': '영어과',
          '전화번호': '01023456789',
          '학부모연락처': '01087654321',
          '이메일': 'parent2@example.com',
          '수강클래스': '중등영어회화반',
          '생년월일': '2012-07-22',
          '주소': '서울시 서초구 서초대로 456',
          '비고': '영어회화 중점',
          '수강료': '70000',
          '결제일': '2025-01-01',
          '등하원알림': 'Y',
          '외출복귀알림': 'Y',
          '이미지포함알림': 'N',
          '학습관제알림': 'Y'
        },
        {
          '학생명': '',
          '학교': '',
          '학년': '',
          '과목': '',
          '전화번호': '',
          '학부모연락처': '',
          '이메일': '',
          '수강클래스': '',
          '생년월일': '',
          '주소': '',
          '비고': '',
          '수강료': '',
          '결제일': '',
          '등하원알림': '',
          '외출복귀알림': '',
          '이미지포함알림': '',
          '학습관제알림': ''
        }
      ]

      // 엑셀 워크북 생성
      const workbook = XLSX.utils.book_new()

      // 학생 정보 시트 생성
      const worksheet = XLSX.utils.json_to_sheet(templateData)

      // 컬럼 너비 설정
      const columnWidths = [
        { wch: 12 }, // 학생명
        { wch: 18 }, // 학교
        { wch: 8 },  // 학년
        { wch: 12 }, // 과목
        { wch: 15 }, // 전화번호
        { wch: 15 }, // 학부모연락처
        { wch: 25 }, // 이메일
        { wch: 18 }, // 수강클래스
        { wch: 12 }, // 생년월일
        { wch: 30 }, // 주소
        { wch: 20 }, // 비고
        { wch: 10 }, // 수강료
        { wch: 12 }, // 결제일
        { wch: 12 }, // 등하원알림
        { wch: 12 }, // 외출복귀알림
        { wch: 12 }, // 이미지포함알림
        { wch: 12 }  // 학습관제알림
      ]
      worksheet['!cols'] = columnWidths

      // 헤더 스타일링 (필수 필드 노란색 배경)
      const requiredColumns = ['A', 'B', 'F', 'H'] // 학생명, 학교, 학부모연락처, 수강클래스
      const headerRow = 1

      // 모든 헤더에 기본 스타일 적용
      const headerCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1', 'N1', 'O1', 'P1', 'Q1']

      headerCells.forEach(cell => {
        if (!worksheet[cell]) worksheet[cell] = {}
        if (!worksheet[cell].s) worksheet[cell].s = {}

        // 기본 헤더 스타일
        worksheet[cell].s = {
          font: { bold: true, color: { rgb: "000000" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        }

        // 필수 필드는 노란색 배경
        const column = cell.charAt(0)
        if (requiredColumns.includes(column)) {
          worksheet[cell].s.fill = {
            patternType: "solid",
            fgColor: { rgb: "FFFF99" } // 노란색
          }
        } else {
          worksheet[cell].s.fill = {
            patternType: "solid",
            fgColor: { rgb: "E6E6FA" } // 연한 보라색 (선택 필드)
          }
        }
      })

      // 데이터 행에 테두리 추가
      for (let row = 2; row <= 4; row++) {
        headerCells.forEach((_, colIndex) => {
          const cellAddress = String.fromCharCode(65 + colIndex) + row
          if (!worksheet[cellAddress]) worksheet[cellAddress] = { v: '', t: 's' }
          if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {}

          worksheet[cellAddress].s.border = {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } }
          }
        })
      }

      // 시트를 워크북에 추가
      XLSX.utils.book_append_sheet(workbook, worksheet, '학생등록양식')

      // 안내사항 시트 생성
      const instructionsData = [
        { '항목': '📋 작성 안내', '설명': '이 양식을 사용하여 학생 정보를 일괄 등록할 수 있습니다.', '필수여부': '안내', '예시': '' },
        { '항목': '', '설명': '', '필수여부': '', '예시': '' },
        { '항목': '🟡 필수 항목 (노란색)', '설명': '반드시 입력해야 하는 항목입니다.', '필수여부': '', '예시': '' },
        { '항목': '학생명', '설명': '학생의 이름을 입력하세요', '필수여부': '필수', '예시': '홍길동' },
        { '항목': '학교', '설명': '학생이 다니는 학교명을 입력하세요', '필수여부': '필수', '예시': '새가온초등학교' },
        { '항목': '학부모연락처', '설명': '학부모 연락처를 입력하세요 (하이픈 없이도 가능)', '필수여부': '필수', '예시': '01098765432 또는 010-9876-5432' },
        { '항목': '수강클래스', '설명': '수강할 클래스명을 입력하세요', '필수여부': '필수', '예시': '초등수학기초반' },
        { '항목': '', '설명': '', '필수여부': '', '예시': '' },
        { '항목': '🟣 선택 항목 (보라색)', '설명': '필요에 따라 입력하는 항목입니다.', '필수여부': '', '예시': '' },
        { '항목': '학년', '설명': '학생의 학년을 숫자로 입력하세요 (1-12)', '필수여부': '선택', '예시': '3' },
        { '항목': '과목', '설명': '수강 과목을 입력하세요', '필수여부': '선택', '예시': '수학과, 영어과, 과학과 등' },
        { '항목': '전화번호', '설명': '학생 본인의 연락처 (자동으로 형식이 맞춰집니다)', '필수여부': '선택', '예시': '01012345678 → 010-1234-5678' },
        { '항목': '이메일', '설명': '연락 가능한 이메일 (자동으로 형식이 보정됩니다)', '필수여부': '선택', '예시': 'parentgmail.com → parent@gmail.com' },
        { '항목': '생년월일', '설명': '다양한 형식 입력 가능 (자동 변환됩니다)', '필수여부': '선택', '예시': '20150315 → 2015-03-15' },
        { '항목': '주소', '설명': '학생의 주소를 입력하세요', '필수여부': '선택', '예시': '서울시 강남구 테헤란로 123' },
        { '항목': '비고', '설명': '특이사항이나 참고사항을 입력하세요', '필수여부': '선택', '예시': '알레르기 있음' },
        { '항목': '수강료', '설명': '월 수강료를 숫자만 입력하세요', '필수여부': '선택', '예시': '50000' },
        { '항목': '결제일', '설명': '결제 예정일 (다양한 형식 가능)', '필수여부': '선택', '예시': '2025-01-01 또는 20250101' },
        { '항목': '', '설명': '', '필수여부': '', '예시': '' },
        { '항목': '🔔 알림 설정', '설명': 'Y 또는 N으로 입력하세요 (대소문자 구분 없음)', '필수여부': '', '예시': '' },
        { '항목': '등하원알림', '설명': '등하원 알림 여부', '필수여부': '선택', '예시': 'Y, y, N, n' },
        { '항목': '외출복귀알림', '설명': '외출/복귀 알림 여부', '필수여부': '선택', '예시': 'Y, y, N, n' },
        { '항목': '이미지포함알림', '설명': '이미지 포함 알림 여부', '필수여부': '선택', '예시': 'Y, y, N, n' },
        { '항목': '학습관제알림', '설명': '학습관제 알림 여부', '필수여부': '선택', '예시': 'Y, y, N, n' },
        { '항목': '', '설명': '', '필수여부': '', '예시': '' },
        { '항목': '💡 자동 형식 변환', '설명': '시스템이 자동으로 올바른 형식으로 변환합니다', '필수여부': '안내', '예시': '' },
        { '항목': '전화번호', '설명': '01012345678 → 010-1234-5678', '필수여부': '자동변환', '예시': '하이픈 자동 추가' },
        { '항목': '이메일', '설명': 'testgmail.com → test@gmail.com', '필수여부': '자동변환', '예시': '@ 기호 자동 추가' },
        { '항목': '날짜', '설명': '20150315 → 2015-03-15', '필수여부': '자동변환', '예시': '다양한 형식 지원' }
      ]

      const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData)
      const instructionColumnWidths = [
        { wch: 15 }, // 항목
        { wch: 35 }, // 설명
        { wch: 10 }, // 필수여부
        { wch: 20 }  // 예시
      ]
      instructionsSheet['!cols'] = instructionColumnWidths

      XLSX.utils.book_append_sheet(workbook, instructionsSheet, '작성안내')

      // 파일 다운로드
      const fileName = `학생등록양식_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(workbook, fileName)

      console.log('학생등록 양식이 다운로드되었습니다.')
    } catch (error) {
      console.error('엑셀 파일 생성 실패:', error)
      alert('엑셀 파일 생성 중 오류가 발생했습니다.')
    }
  }

  // 엑셀 파일 업로드 처리
  const handleExcelUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // 파일 확장자 검증
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.')
      return
    }

    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하만 허용됩니다.')
      return
    }

    setLoading(true)

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        console.log('파일 읽기 시작...')

        // ArrayBuffer로 읽기 (더 안정적)
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        console.log('워크북 시트 목록:', workbook.SheetNames)

        if (workbook.SheetNames.length === 0) {
          throw new Error('엑셀 파일에 시트가 없습니다.')
        }

        // 첫 번째 시트 또는 '학생등록양식' 시트 찾기
        let sheetName = workbook.SheetNames[0]
        if (workbook.SheetNames.includes('학생등록양식')) {
          sheetName = '학생등록양식'
        }

        console.log('사용할 시트:', sheetName)

        const worksheet = workbook.Sheets[sheetName]
        if (!worksheet) {
          throw new Error(`시트 '${sheetName}'을 찾을 수 없습니다.`)
        }

        // 시트를 JSON으로 변환 (헤더 옵션 추가)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // 첫 번째 행을 헤더로 사용
          defval: '', // 빈 셀의 기본값
          blankrows: false // 빈 행 제외
        })

        console.log('변환된 데이터:', jsonData)

        if (jsonData.length < 2) {
          throw new Error('엑셀 파일에 데이터가 없거나 헤더만 있습니다. 최소 1개 이상의 학생 데이터가 필요합니다.')
        }

        // 헤더 추출 및 데이터 변환
        const headers = jsonData[0]
        const dataRows = jsonData.slice(1)

        console.log('헤더:', headers)
        console.log('데이터 행 수:', dataRows.length)

        // 헤더가 올바른지 검증
        const requiredHeaders = ['학생명', '학교', '학부모연락처', '수강클래스']
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))

        if (missingHeaders.length > 0) {
          throw new Error(`필수 헤더가 누락되었습니다: ${missingHeaders.join(', ')}\n다운로드한 양식을 사용해주세요.`)
        }

        // 행 데이터를 객체로 변환
        const objectData = dataRows.map((row, index) => {
          const obj = {}
          headers.forEach((header, headerIndex) => {
            obj[header] = row[headerIndex] || ''
          })
          obj._rowIndex = index + 2 // 엑셀 행 번호 (헤더 포함)
          return obj
        }).filter(obj => {
          // 완전히 빈 행만 제외 (모든 값이 비어있는 행)
          const values = Object.values(obj).filter(val => val !== obj._rowIndex)
          return values.some(val => val && val.toString().trim() !== '')
        })

        console.log('변환된 객체 데이터:', objectData)

        if (objectData.length === 0) {
          throw new Error('유효한 데이터가 없습니다. 엑셀 파일에 데이터가 입력된 행이 있는지 확인해주세요.')
        }

        // 데이터 유효성 검증 및 변환
        const { validData, errors } = validateAndTransformData(objectData)

        setPreviewData(validData)
        setValidationErrors(errors)
        setShowPreview(true)

        // 오류가 있는 첫 번째 행을 자동으로 편집 모드로 설정하지 않음
        // 사용자가 직접 편집 버튼을 클릭하도록 유도

      } catch (error) {
        console.error('엑셀 파일 처리 오류:', error)
        alert(`엑셀 파일 처리 중 오류가 발생했습니다:\n\n${error.message}\n\n다운로드한 양식을 사용하고 있는지 확인해주세요.`)
      } finally {
        setLoading(false)
      }
    }

    reader.onerror = (error) => {
      console.error('파일 읽기 오류:', error)
      alert('파일을 읽는 중 오류가 발생했습니다. 파일이 손상되었을 수 있습니다.')
      setLoading(false)
    }

    // ArrayBuffer로 파일 읽기
    reader.readAsArrayBuffer(file)
  }

  // 데이터 유효성 검증 및 변환
  const validateAndTransformData = (rawData) => {
    const validData = []
    const errors = []

    console.log('유효성 검증 시작, 데이터 수:', rawData.length)

    rawData.forEach((row, index) => {
      try {
        const rowNumber = row._rowIndex || (index + 2) // 엑셀 행 번호

        // 안전한 문자열 변환 함수
        const safeString = (value) => {
          if (value === null || value === undefined) return ''
          return String(value).trim()
        }

        // 안전한 숫자 변환 함수
        const safeNumber = (value) => {
          if (value === null || value === undefined || value === '') return 0
          const num = parseInt(String(value).replace(/[^\d]/g, ''))
          return isNaN(num) ? 0 : num
        }

        // Y/N 값을 boolean으로 변환
        const toBool = (value) => {
          const str = safeString(value).toUpperCase()
          return str === 'Y' || str === 'YES' || str === '1' || str === 'TRUE'
        }

        // 전화번호 형식 자동 변환 함수 (강화된 버전)
        const formatPhone = (value) => {
          if (!value) return ''

          // 문자열로 변환하고 모든 공백, 특수문자 제거 (숫자만 남김)
          let numbers = String(value).replace(/[^\d]/g, '')

          // 빈 문자열이면 그대로 반환
          if (!numbers) return ''

          // 맨 앞의 0이 없는 경우 추가 (한국 번호 특성)
          if (!numbers.startsWith('0') && numbers.length >= 9) {
            // 1012345678 -> 01012345678 (휴대폰)
            if (numbers.startsWith('1') && numbers.length === 10) {
              numbers = '0' + numbers
            }
            // 2123456789 -> 0212345678 (서울)
            else if (numbers.startsWith('2') && numbers.length === 9) {
              numbers = '0' + numbers
            }
            // 31234567 -> 031234567 (경기 등)
            else if (/^[3-9]/.test(numbers) && numbers.length === 8) {
              numbers = '0' + numbers
            }
          }

          console.log('전화번호 변환:', value, '->', numbers)

          // 11자리 휴대폰 번호 (010, 011, 016, 017, 018, 019)
          if (numbers.length === 11 && /^01[0-9]/.test(numbers)) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
          }

          // 10자리 서울 지역번호 (02)
          if (numbers.length === 10 && numbers.startsWith('02')) {
            return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`
          }

          // 9자리 서울 지역번호 (02) - 8자리 번호
          if (numbers.length === 9 && numbers.startsWith('02')) {
            return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`
          }

          // 10자리 일반 지역번호 (031, 032, 033, 041, 042, 043, 051, 052, 053, 054, 055, 061, 062, 063, 064)
          if (numbers.length === 10 && /^0[3-6]/.test(numbers)) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
          }

          // 11자리 일반 지역번호 (7자리 번호)
          if (numbers.length === 11 && /^0[3-6]/.test(numbers)) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
          }

          // 070 번호 (11자리)
          if (numbers.length === 11 && numbers.startsWith('070')) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
          }

          // 080, 090 등 특수번호 (11자리)
          if (numbers.length === 11 && /^0[89]/.test(numbers)) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
          }

          // 1588, 1544 등 고객센터 번호 (8자리)
          if (numbers.length === 8 && /^15/.test(numbers)) {
            return `${numbers.slice(0, 4)}-${numbers.slice(4)}`
          }

          // 형식이 맞지 않거나 알 수 없는 경우
          if (numbers.length >= 7) {
            // 최소한의 포맷팅 시도
            if (numbers.length === 7) {
              return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
            } else if (numbers.length === 8) {
              return `${numbers.slice(0, 4)}-${numbers.slice(4)}`
            } else {
              // 길이가 긴 경우 3-4-4 또는 3-3-4 형식으로
              return `${numbers.slice(0, 3)}-${numbers.slice(3, numbers.length - 4)}-${numbers.slice(-4)}`
            }
          }

          // 너무 짧은 경우 숫자만 반환
          return numbers
        }

        // 이메일 형식 자동 보정 함수
        const formatEmail = (value) => {
          if (!value) return ''

          let email = safeString(value).toLowerCase()

          // 공백 제거
          email = email.replace(/\s/g, '')

          // @ 누락된 경우 처리 (gmail.com, naver.com 등 자주 사용되는 도메인)
          if (!email.includes('@') && email.length > 0) {
            const commonDomains = ['gmail.com', 'naver.com', 'daum.net', 'hanmail.net', 'hotmail.com', 'yahoo.com']
            // 도메인이 포함되어 있으면 @ 추가
            for (const domain of commonDomains) {
              if (email.includes(domain)) {
                email = email.replace(domain, '@' + domain)
                break
              }
            }
          }

          return email
        }

        // 날짜 형식 자동 변환 함수 (강화된 버전)
        const formatDate = (value) => {
          if (!value) return ''

          let str = safeString(value).trim()

          // 빈 문자열이면 그대로 반환
          if (!str) return ''

          console.log('날짜 변환 시작:', value, '->', str)

          // 이미 YYYY-MM-DD 형식인 경우
          if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
            const parts = str.split('-')
            const year = parts[0]
            const month = parts[1].padStart(2, '0')
            const day = parts[2].padStart(2, '0')
            return `${year}-${month}-${day}`
          }

          // 숫자만 있는 경우 처리
          const numbersOnly = str.replace(/[^\d]/g, '')

          if (numbersOnly.length === 8) {
            // YYYYMMDD 형식 (20150315)
            const year = numbersOnly.slice(0, 4)
            const month = numbersOnly.slice(4, 6)
            const day = numbersOnly.slice(6, 8)

            // 년도 검증 (1900~2100)
            if (parseInt(year) >= 1900 && parseInt(year) <= 2100) {
              return `${year}-${month}-${day}`
            }
          }

          if (numbersOnly.length === 6) {
            // YYMMDD 형식 (150315)
            let year = parseInt(numbersOnly.slice(0, 2))
            const month = numbersOnly.slice(2, 4)
            const day = numbersOnly.slice(4, 6)

            // 년도 추정 (50 이상이면 19xx, 50 미만이면 20xx)
            if (year >= 50) {
              year = 1900 + year
            } else {
              year = 2000 + year
            }

            return `${year}-${month}-${day}`
          }

          // 구분자가 있는 경우 처리
          const separators = /[\/\.\-\s]/
          if (separators.test(str)) {
            const parts = str.split(separators).filter(part => part.length > 0)

            if (parts.length === 3) {
              let year, month, day

              // 첫 번째 부분이 4자리인 경우: YYYY/MM/DD 또는 YYYY.MM.DD
              if (parts[0].length === 4) {
                year = parts[0]
                month = parts[1].padStart(2, '0')
                day = parts[2].padStart(2, '0')
              }
              // 마지막 부분이 4자리인 경우: MM/DD/YYYY 또는 DD/MM/YYYY
              else if (parts[2].length === 4) {
                year = parts[2]

                // 한국에서는 보통 MM/DD/YYYY 형식
                // 하지만 DD가 12보다 크면 DD/MM/YYYY로 판단
                const first = parseInt(parts[0])
                const second = parseInt(parts[1])

                if (first > 12 && second <= 12) {
                  // DD/MM/YYYY
                  day = parts[0].padStart(2, '0')
                  month = parts[1].padStart(2, '0')
                } else {
                  // MM/DD/YYYY
                  month = parts[0].padStart(2, '0')
                  day = parts[1].padStart(2, '0')
                }
              }
              // 마지막 부분이 2자리인 경우: MM/DD/YY
              else if (parts[2].length === 2) {
                let yearNum = parseInt(parts[2])
                // 년도 추정
                if (yearNum >= 50) {
                  year = (1900 + yearNum).toString()
                } else {
                  year = (2000 + yearNum).toString()
                }

                month = parts[0].padStart(2, '0')
                day = parts[1].padStart(2, '0')
              }

              // 년도 검증
              if (year && parseInt(year) >= 1900 && parseInt(year) <= 2100) {
                // 월, 일 검증
                const monthNum = parseInt(month)
                const dayNum = parseInt(day)

                if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
                  const result = `${year}-${month}-${day}`
                  console.log('날짜 변환 완료:', str, '->', result)
                  return result
                }
              }
            }
          }

          // 특별한 형식들
          // Excel에서 날짜가 숫자로 변환된 경우 (일련번호)
          if (/^\d+$/.test(str) && str.length <= 5) {
            try {
              const excelEpoch = new Date(1900, 0, 1)
              const daysSinceEpoch = parseInt(str) - 2 // Excel의 1900년 오류 보정
              const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000)

              if (date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
                const year = date.getFullYear()
                const month = (date.getMonth() + 1).toString().padStart(2, '0')
                const day = date.getDate().toString().padStart(2, '0')
                return `${year}-${month}-${day}`
              }
            } catch (error) {
              console.log('Excel 날짜 변환 실패:', error)
            }
          }

          console.log('날짜 변환 실패, 원본 반환:', str)
          return str
        }

        // 기본 학생 데이터 생성
        const className = safeString(row['수강클래스'])
        let classFee = safeNumber(row['수강료'])

        // 수강료가 0이고 수강클래스가 있다면 강의 목록에서 수강료 찾기
        if (classFee === 0 && className) {
          const matchedLecture = lectures.find(lecture => lecture.name === className)
          if (matchedLecture && matchedLecture.fee) {
            classFee = matchedLecture.fee
            console.log(`수강료 자동 설정: ${className} → ${classFee.toLocaleString()}원`)
          }
        }

        const studentData = {
          name: safeString(row['학생명']),
          school: safeString(row['학교']),
          grade: safeString(row['학년']),
          department: safeString(row['과목']),
          phone: formatPhone(row['전화번호']),
          parentPhone: formatPhone(row['학부모연락처']),
          email: formatEmail(row['이메일']),
          class: className,
          birthDate: formatDate(row['생년월일']),
          address: safeString(row['주소']),
          notes: safeString(row['비고']),
          classFee: classFee,
          paymentDueDate: formatDate(row['결제일']),
          autoMessages: {
            attendance: toBool(row['등하원알림']),
            outing: toBool(row['외출복귀알림']),
            imagePost: toBool(row['이미지포함알림']),
            studyMonitoring: toBool(row['학습관제알림'])
          }
        }

        console.log(`${rowNumber}행 데이터:`, studentData)

        // 필수 필드 검증
        const rowErrors = []
        if (!studentData.name) {
          rowErrors.push('학생명은 필수입니다')
        }
        if (!studentData.school) {
          rowErrors.push('학교명은 필수입니다')
        }
        if (!studentData.parentPhone) {
          rowErrors.push('학부모연락처는 필수입니다')
        }
        if (!studentData.class) {
          rowErrors.push('수강클래스는 필수입니다')
        }

        // 전화번호 형식 검증 (더 유연하게)
        const phoneRegex = /^01[0-9]\d{7,8}$/
        if (studentData.phone) {
          const cleanPhone = studentData.phone.replace(/[-\s]/g, '')
          if (cleanPhone && !phoneRegex.test(cleanPhone)) {
            rowErrors.push('전화번호 형식이 올바르지 않습니다 (010-1234-5678 형식)')
          }
        }

        if (studentData.parentPhone) {
          const cleanParentPhone = studentData.parentPhone.replace(/[-\s]/g, '')
          if (!phoneRegex.test(cleanParentPhone)) {
            rowErrors.push('학부모연락처 형식이 올바르지 않습니다 (010-1234-5678 형식)')
          }
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (studentData.email && !emailRegex.test(studentData.email)) {
          rowErrors.push('이메일 형식이 올바르지 않습니다')
        }

        // 학년 검증
        if (studentData.grade && !/^[1-9]|1[0-2]$/.test(studentData.grade)) {
          rowErrors.push('학년은 1-12 사이의 숫자여야 합니다')
        }

        if (rowErrors.length > 0) {
          errors.push({
            row: rowNumber,
            studentName: studentData.name || '이름없음',
            errors: rowErrors
          })
        }

        validData.push({
          ...studentData,
          isValid: rowErrors.length === 0,
          rowNumber
        })

      } catch (error) {
        console.error(`${index + 2}행 처리 중 오류:`, error)
        errors.push({
          row: index + 2,
          studentName: '처리불가',
          errors: [`데이터 처리 중 오류: ${error.message}`]
        })

        validData.push({
          name: '처리불가',
          isValid: false,
          rowNumber: index + 2
        })
      }
    })

    console.log('유효성 검증 완료:', { total: validData.length, errors: errors.length })
    return { validData, errors }
  }

  // 학생 일괄 등록 실행
  const handleBulkRegistration = async () => {
    try {
      setBulkUploadLoading(true)

      const validStudents = previewData.filter(student => student.isValid)

      if (validStudents.length === 0) {
        alert('등록 가능한 유효한 학생 데이터가 없습니다.')
        return
      }

      // 실제로는 API 호출로 일괄 등록
      for (let i = 0; i < validStudents.length; i++) {
        const student = validStudents[i]

        // LMS Context의 addStudent 함수 사용
        const studentToAdd = {
          id: Date.now() + i, // 임시 ID
          name: student.name,
          school: student.school,
          grade: student.grade,
          department: student.department,
          phone: student.phone,
          parentPhone: student.parentPhone,
          email: student.email,
          class: student.class,
          birthDate: student.birthDate,
          address: student.address,
          notes: student.notes,
          classFee: student.classFee,
          paymentDueDate: student.paymentDueDate,
          autoMessages: student.autoMessages,
          registrationDate: new Date().toISOString(),
          status: 'active'
        }

        await addStudent(studentToAdd)

        // 진행률 업데이트
        setUploadProgress(((i + 1) / validStudents.length) * 100)

        // 시뮬레이션을 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      alert(`${validStudents.length}명의 학생이 성공적으로 등록되었습니다.`)

      // 상태 초기화
      setShowPreview(false)
      setPreviewData([])
      setValidationErrors([])
      setUploadProgress(0)

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('일괄 등록 실패:', error)
      alert('학생 등록 중 오류가 발생했습니다.')
    } finally {
      setBulkUploadLoading(false)
    }
  }

  // 미리보기 닫기
  const handleClosePreview = () => {
    setShowPreview(false)
    setPreviewData([])
    setValidationErrors([])
    setUploadProgress(0)
    setEditingRows(new Set())
    setEditedData({})
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 행 편집 모드 토글
  const handleEditRow = (index) => {
    const newEditingRows = new Set(editingRows)
    if (newEditingRows.has(index)) {
      newEditingRows.delete(index)
    } else {
      newEditingRows.add(index)

      // 현재 데이터를 편집 데이터로 완전히 복사 (모든 필드 포함)
      const student = previewData[index]

      // student가 존재하는지 확인
      if (!student) {
        console.error('Student data not found at index:', index, 'previewData length:', previewData.length)
        return
      }

      setEditedData(prev => ({
        ...prev,
        [index]: {
          name: student.name || '',
          school: student.school || '',
          grade: student.grade || '',
          department: student.department || '',
          phone: student.phone || '',
          parentPhone: student.parentPhone || '',
          email: student.email || '',
          class: student.class || '',
          birthDate: student.birthDate || '',
          address: student.address || '',
          notes: student.notes || '',
          classFee: student.classFee || 0,
          paymentDueDate: student.paymentDueDate || '',
          autoMessages: {
            attendance: student.autoMessages?.attendance || false,
            outing: student.autoMessages?.outing || false,
            imagePost: student.autoMessages?.imagePost || false,
            studyMonitoring: student.autoMessages?.studyMonitoring || false
          },
          rowNumber: student.rowNumber,
          isValid: student.isValid
        }
      }))
    }
    setEditingRows(newEditingRows)
  }

  // 편집 중인 데이터 변경
  const handleEditChange = (index, field, value) => {
    setEditedData(prev => {
      const updatedData = {
        ...prev,
        [index]: {
          ...prev[index],
          [field]: value
        }
      }

      // 수강클래스가 변경되면 해당 강의의 수강료를 자동 설정
      if (field === 'class' && value) {
        const selectedLecture = lectures.find(lecture => lecture.name === value)
        if (selectedLecture && selectedLecture.fee) {
          updatedData[index] = {
            ...updatedData[index],
            classFee: selectedLecture.fee
          }
          console.log('수강료 자동 설정:', selectedLecture.name, '→', selectedLecture.fee)
        }
      }

      return updatedData
    })
  }

  // 자동 메시지 설정 변경
  const handleAutoMessageChange = (index, messageType, value) => {
    setEditedData(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        autoMessages: {
          ...prev[index].autoMessages,
          [messageType]: value
        }
      }
    }))
  }

  // 편집 저장
  const handleSaveEdit = (index) => {
    const editedStudent = editedData[index]

    // 형식 변환 적용
    const formattedStudent = {
      ...editedStudent,
      phone: formatPhone(editedStudent.phone),
      parentPhone: formatPhone(editedStudent.parentPhone),
      email: formatEmail(editedStudent.email),
      birthDate: formatDate(editedStudent.birthDate),
      paymentDueDate: formatDate(editedStudent.paymentDueDate)
    }

    // 유효성 검증
    const errors = validateStudent(formattedStudent, index)

    // 새로운 미리보기 데이터 업데이트
    const newPreviewData = [...previewData]
    newPreviewData[index] = {
      ...formattedStudent,
      isValid: errors.length === 0,
      rowNumber: formattedStudent.rowNumber
    }
    setPreviewData(newPreviewData)

    // 에러 목록 업데이트
    const newValidationErrors = validationErrors.filter(error => error.row !== formattedStudent.rowNumber)
    if (errors.length > 0) {
      newValidationErrors.push({
        row: formattedStudent.rowNumber,
        studentName: formattedStudent.name || '이름없음',
        errors: errors
      })
    }
    setValidationErrors(newValidationErrors)

    // 편집 모드 종료
    const newEditingRows = new Set(editingRows)
    newEditingRows.delete(index)
    setEditingRows(newEditingRows)

    console.log('편집 저장됨:', formattedStudent)
  }

  // 편집 취소
  const handleCancelEdit = (index) => {
    const newEditingRows = new Set(editingRows)
    newEditingRows.delete(index)
    setEditingRows(newEditingRows)

    const newEditedData = { ...editedData }
    delete newEditedData[index]
    setEditedData(newEditedData)
  }

  // 단일 학생 유효성 검증 함수
  const validateStudent = (student, index) => {
    const errors = []

    if (!student.name.trim()) {
      errors.push('학생명은 필수입니다')
    }
    if (!student.school.trim()) {
      errors.push('학교명은 필수입니다')
    }
    if (!student.parentPhone.trim()) {
      errors.push('학부모연락처는 필수입니다')
    }
    if (!student.class.trim()) {
      errors.push('수강클래스는 필수입니다')
    }

    // 전화번호 형식 검증
    const phoneRegex = /^01[0-9]\d{7,8}$/
    if (student.phone) {
      const cleanPhone = student.phone.replace(/[-\s]/g, '')
      if (cleanPhone && !phoneRegex.test(cleanPhone)) {
        errors.push('전화번호 형식이 올바르지 않습니다')
      }
    }

    if (student.parentPhone) {
      const cleanParentPhone = student.parentPhone.replace(/[-\s]/g, '')
      if (!phoneRegex.test(cleanParentPhone)) {
        errors.push('학부모연락처 형식이 올바르지 않습니다')
      }
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (student.email && !emailRegex.test(student.email)) {
      errors.push('이메일 형식이 올바르지 않습니다')
    }

    // 학년 검증
    if (student.grade && !/^[1-9]|1[0-2]$/.test(student.grade)) {
      errors.push('학년은 1-12 사이의 숫자여야 합니다')
    }

    return errors
  }

  // 특정 필드에 오류가 있는지 확인하는 함수
  const hasFieldError = (student, fieldName) => {
    switch (fieldName) {
      case 'name':
        return !student.name?.trim()
      case 'school':
        return !student.school?.trim()
      case 'parentPhone':
        return !student.parentPhone?.trim()
      case 'class':
        return !student.class?.trim()
      case 'phone':
        if (!student.phone) return false
        const cleanPhone = student.phone.replace(/[-\s]/g, '')
        return cleanPhone && !/^01[0-9]\d{7,8}$/.test(cleanPhone)
      case 'email':
        if (!student.email) return false
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)
      case 'grade':
        if (!student.grade) return false
        return !/^[1-9]|1[0-2]$/.test(student.grade)
      default:
        return false
    }
  }

  // 형식 변환 함수들을 재사용할 수 있도록 따로 정의
  const formatPhone = (value) => {
    if (!value) return ''

    let numbers = String(value).replace(/[^\d]/g, '')
    if (!numbers) return ''

    if (!numbers.startsWith('0') && numbers.length >= 9) {
      if (numbers.startsWith('1') && numbers.length === 10) {
        numbers = '0' + numbers
      } else if (numbers.startsWith('2') && numbers.length === 9) {
        numbers = '0' + numbers
      } else if (/^[3-9]/.test(numbers) && numbers.length === 8) {
        numbers = '0' + numbers
      }
    }

    if (numbers.length === 11 && /^01[0-9]/.test(numbers)) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
    }

    if (numbers.length === 10 && numbers.startsWith('02')) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`
    }

    if (numbers.length === 9 && numbers.startsWith('02')) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`
    }

    if (numbers.length === 10 && /^0[3-6]/.test(numbers)) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
    }

    if (numbers.length >= 7) {
      if (numbers.length === 7) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
      } else if (numbers.length === 8) {
        return `${numbers.slice(0, 4)}-${numbers.slice(4)}`
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, numbers.length - 4)}-${numbers.slice(-4)}`
      }
    }

    return numbers
  }

  const formatEmail = (value) => {
    if (!value) return ''

    let email = String(value).toLowerCase().replace(/\s/g, '')

    if (!email.includes('@') && email.length > 0) {
      const commonDomains = ['gmail.com', 'naver.com', 'daum.net', 'hanmail.net', 'hotmail.com', 'yahoo.com']
      for (const domain of commonDomains) {
        if (email.includes(domain)) {
          email = email.replace(domain, '@' + domain)
          break
        }
      }
    }

    return email
  }

  const formatDate = (value) => {
    if (!value) return ''

    let str = String(value).trim()
    if (!str) return ''

    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
      const parts = str.split('-')
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
    }

    const numbersOnly = str.replace(/[^\d]/g, '')

    if (numbersOnly.length === 8) {
      const year = numbersOnly.slice(0, 4)
      const month = numbersOnly.slice(4, 6)
      const day = numbersOnly.slice(6, 8)
      if (parseInt(year) >= 1900 && parseInt(year) <= 2100) {
        return `${year}-${month}-${day}`
      }
    }

    if (numbersOnly.length === 6) {
      let year = parseInt(numbersOnly.slice(0, 2))
      const month = numbersOnly.slice(2, 4)
      const day = numbersOnly.slice(4, 6)
      if (year >= 50) {
        year = 1900 + year
      } else {
        year = 2000 + year
      }
      return `${year}-${month}-${day}`
    }

    return str
  }

  // 렌더링 에러 처리
  try {
    // 데이터 로딩 중 체크
    if (!lectures) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">데이터 로딩 중...</Typography>
        </Box>
      )
    }

    return (
      <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        파일 관리
      </Typography>

      {/* 빠른 액션 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={handleOpenStudentTemplate}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ExcelIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h6">학생 등록 양식</Typography>
              <Typography variant="body2" color="text.secondary">
                엑셀 양식 다운로드
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={handleDownloadAttendanceReport}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ReportIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">출결 통계</Typography>
              <Typography variant="body2" color="text.secondary">
                엑셀 리포트 다운로드
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={handleOpenPaymentStatus}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PaymentIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h6">수납현황</Typography>
              <Typography variant="body2" color="text.secondary">
                당월 납부 현황
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 미리보기 다이얼로그 */}
      <Dialog
        open={showPreview}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            handleClosePreview()
          }
        }}
        disableEscapeKeyDown
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Typography variant="h6">
            학생 일괄 등록 미리보기
          </Typography>
          <Typography variant="body2" color="text.secondary">
            총 {previewData.length}명 | 유효: {previewData.filter(s => s.isValid).length}명 |
            오류: {previewData.filter(s => !s.isValid).length}명
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {/* 진행률 표시 */}
          {bulkUploadLoading && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                학생 등록 중... ({Math.round(uploadProgress)}%)
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}

          {/* 유효성 검증 오류 목록 */}
          {validationErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                다음 오류를 수정한 후 다시 업로드해주세요:
              </Typography>
              <List dense>
                {validationErrors.map((error, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemIcon>
                      <ErrorIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${error.row}행 (${error.studentName})`}
                      secondary={error.errors.join(', ')}
                    />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}

          {/* 학생 데이터 미리보기 테이블 */}
          <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>편집</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>행</TableCell>
                  <TableCell>학생명*</TableCell>
                  <TableCell>학교*</TableCell>
                  <TableCell>학년</TableCell>
                  <TableCell>과목</TableCell>
                  <TableCell>전화번호</TableCell>
                  <TableCell>학부모연락처*</TableCell>
                  <TableCell>이메일</TableCell>
                  <TableCell>수강클래스*</TableCell>
                  <TableCell>생년월일</TableCell>
                  <TableCell>수강료</TableCell>
                  <TableCell>자동메시지</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((student, index) => {
                  const isEditing = editingRows.has(index)
                  const currentData = isEditing ? (editedData[index] || student) : student

                  return (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor: student.isValid ? 'success.light' : 'error.light',
                        '& td': { py: 1, px: 1 }
                      }}
                    >
                      {/* 편집 버튼 */}
                      <TableCell>
                        {isEditing ? (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="저장">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSaveEdit(index)
                                }}
                                color="primary"
                                sx={{ backgroundColor: 'primary.light', color: 'white' }}
                              >
                                <SaveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="취소">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCancelEdit(index)
                                }}
                                sx={{ backgroundColor: 'grey.300' }}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Tooltip title={student.isValid ? "편집" : "오류 수정 필요 - 클릭하여 편집"}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                handleEditRow(index)
                              }}
                              disabled={false}
                              sx={{
                                backgroundColor: student.isValid ? 'transparent' : 'error.light',
                                color: student.isValid ? 'inherit' : 'error.main',
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                                zIndex: 10,
                                '&:hover': {
                                  backgroundColor: student.isValid ? 'action.hover' : 'error.main',
                                  color: student.isValid ? 'inherit' : 'white'
                                },
                                '&:active': {
                                  transform: 'scale(0.95)'
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* 상태 */}
                      <TableCell>
                        {student.isValid ? (
                          <Chip
                            icon={<CheckIcon />}
                            label="유효"
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<ErrorIcon />}
                            label="오류"
                            color="error"
                            size="small"
                          />
                        )}
                      </TableCell>

                      {/* 행 번호 */}
                      <TableCell>{student.rowNumber}</TableCell>

                      {/* 학생명 */}
                      <TableCell>
                        {isEditing ? (
                          hasFieldError(student, 'name') ? (
                            <TextField
                              size="small"
                              value={currentData.name || ''}
                              onChange={(e) => handleEditChange(index, 'name', e.target.value)}
                              error={!currentData.name?.trim()}
                              placeholder="학생 이름"
                              helperText="필수 입력"
                              fullWidth
                              sx={{
                                '& .MuiFormHelperText-root': {
                                  color: 'error.main',
                                  fontSize: '0.7rem'
                                }
                              }}
                            />
                          ) : (
                            <Box sx={{
                              p: 1,
                              backgroundColor: 'success.light',
                              borderRadius: 1,
                              color: 'success.contrastText'
                            }}>
                              {currentData.name} ✓
                            </Box>
                          )
                        ) : (
                          <Box sx={{
                            color: student.name ? 'inherit' : 'error.main',
                            fontStyle: student.name ? 'normal' : 'italic'
                          }}>
                            {student.name || '(필수)'}
                          </Box>
                        )}
                      </TableCell>

                      {/* 학교 */}
                      <TableCell>
                        {isEditing ? (
                          hasFieldError(student, 'school') ? (
                            <TextField
                              size="small"
                              value={currentData.school || ''}
                              onChange={(e) => handleEditChange(index, 'school', e.target.value)}
                              error={!currentData.school?.trim()}
                              placeholder="학교명"
                              helperText="필수 입력"
                              fullWidth
                              sx={{
                                '& .MuiFormHelperText-root': {
                                  color: 'error.main',
                                  fontSize: '0.7rem'
                                }
                              }}
                            />
                          ) : (
                            <Box sx={{
                              p: 1,
                              backgroundColor: 'success.light',
                              borderRadius: 1,
                              color: 'success.contrastText'
                            }}>
                              {currentData.school} ✓
                            </Box>
                          )
                        ) : (
                          <Box sx={{
                            color: student.school ? 'inherit' : 'error.main',
                            fontStyle: student.school ? 'normal' : 'italic'
                          }}>
                            {student.school || '(필수)'}
                          </Box>
                        )}
                      </TableCell>

                      {/* 학년 */}
                      <TableCell>
                        {isEditing ? (
                          hasFieldError(student, 'grade') ? (
                            <TextField
                              size="small"
                              value={currentData.grade || ''}
                              onChange={(e) => handleEditChange(index, 'grade', e.target.value)}
                              placeholder="1-12"
                              error={hasFieldError({ grade: currentData.grade }, 'grade')}
                              helperText={hasFieldError({ grade: currentData.grade }, 'grade') ? "1-12 사이 숫자" : ""}
                              fullWidth
                              sx={{
                                '& .MuiFormHelperText-root': {
                                  color: 'error.main',
                                  fontSize: '0.7rem'
                                }
                              }}
                            />
                          ) : (
                            <Box sx={{
                              p: 1,
                              backgroundColor: 'success.light',
                              borderRadius: 1,
                              color: 'success.contrastText'
                            }}>
                              {currentData.grade || '(선택사항)'} ✓
                            </Box>
                          )
                        ) : (
                          student.grade
                        )}
                      </TableCell>

                      {/* 과목 */}
                      <TableCell>
                        {isEditing ? (
                          <Box sx={{
                            p: 1,
                            backgroundColor: 'success.light',
                            borderRadius: 1,
                            color: 'success.contrastText'
                          }}>
                            {currentData.department || '(선택사항)'} ✓
                          </Box>
                        ) : (
                          student.department
                        )}
                      </TableCell>

                      {/* 전화번호 */}
                      <TableCell>
                        {isEditing ? (
                          hasFieldError(student, 'phone') ? (
                            <TextField
                              size="small"
                              value={currentData.phone || ''}
                              onChange={(e) => handleEditChange(index, 'phone', e.target.value)}
                              placeholder="010-1234-5678"
                              error={hasFieldError({ phone: currentData.phone }, 'phone')}
                              helperText={hasFieldError({ phone: currentData.phone }, 'phone') ? "올바른 형식 입력" : ""}
                              fullWidth
                              sx={{
                                '& .MuiFormHelperText-root': {
                                  color: 'error.main',
                                  fontSize: '0.7rem'
                                }
                              }}
                            />
                          ) : (
                            <Box sx={{
                              p: 1,
                              backgroundColor: 'success.light',
                              borderRadius: 1,
                              color: 'success.contrastText'
                            }}>
                              {currentData.phone || '(선택사항)'} ✓
                            </Box>
                          )
                        ) : (
                          student.phone
                        )}
                      </TableCell>

                      {/* 학부모연락처 */}
                      <TableCell>
                        {isEditing ? (
                          hasFieldError(student, 'parentPhone') ? (
                            <TextField
                              size="small"
                              value={currentData.parentPhone || ''}
                              onChange={(e) => handleEditChange(index, 'parentPhone', e.target.value)}
                              error={!currentData.parentPhone?.trim()}
                              placeholder="010-9876-5432"
                              helperText="필수 입력"
                              fullWidth
                              sx={{
                                '& .MuiFormHelperText-root': {
                                  color: 'error.main',
                                  fontSize: '0.7rem'
                                }
                              }}
                            />
                          ) : (
                            <Box sx={{
                              p: 1,
                              backgroundColor: 'success.light',
                              borderRadius: 1,
                              color: 'success.contrastText'
                            }}>
                              {currentData.parentPhone} ✓
                            </Box>
                          )
                        ) : (
                          <Box sx={{
                            color: student.parentPhone ? 'inherit' : 'error.main',
                            fontStyle: student.parentPhone ? 'normal' : 'italic'
                          }}>
                            {student.parentPhone || '(필수)'}
                          </Box>
                        )}
                      </TableCell>

                      {/* 이메일 */}
                      <TableCell>
                        {isEditing ? (
                          hasFieldError(student, 'email') ? (
                            <TextField
                              size="small"
                              value={currentData.email || ''}
                              onChange={(e) => handleEditChange(index, 'email', e.target.value)}
                              placeholder="parent@example.com"
                              error={hasFieldError({ email: currentData.email }, 'email')}
                              helperText={hasFieldError({ email: currentData.email }, 'email') ? "올바른 이메일 형식" : ""}
                              fullWidth
                              sx={{
                                '& .MuiFormHelperText-root': {
                                  color: 'error.main',
                                  fontSize: '0.7rem'
                                }
                              }}
                            />
                          ) : (
                            <Box sx={{
                              p: 1,
                              backgroundColor: 'success.light',
                              borderRadius: 1,
                              color: 'success.contrastText'
                            }}>
                              {currentData.email || '(선택사항)'} ✓
                            </Box>
                          )
                        ) : (
                          student.email
                        )}
                      </TableCell>

                      {/* 수강클래스 */}
                      <TableCell>
                        {isEditing ? (
                          hasFieldError(student, 'class') ? (
                            <FormControl size="small" fullWidth error={!currentData.class?.trim()}>
                              <Select
                                value={currentData.class || ''}
                                onChange={(e) => handleEditChange(index, 'class', e.target.value)}
                                displayEmpty
                                sx={{
                                  '& .MuiSelect-select': {
                                    fontSize: '0.875rem'
                                  }
                                }}
                              >
                                <MenuItem value="" disabled>
                                  <em>강의를 선택하세요</em>
                                </MenuItem>
                                {lectures.map((lecture) => (
                                  <MenuItem key={lecture.id} value={lecture.name}>
                                    {lecture.name}
                                    {lecture.fee && ` (${lecture.fee.toLocaleString()}원)`}
                                  </MenuItem>
                                ))}
                              </Select>
                              {!currentData.class?.trim() && (
                                <Typography
                                  variant="caption"
                                  color="error.main"
                                  sx={{ fontSize: '0.7rem', mt: 0.5, ml: 1 }}
                                >
                                  필수 선택
                                </Typography>
                              )}
                            </FormControl>
                          ) : (
                            <Box sx={{
                              p: 1,
                              backgroundColor: 'success.light',
                              borderRadius: 1,
                              color: 'success.contrastText'
                            }}>
                              {currentData.class} ✓
                            </Box>
                          )
                        ) : (
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color: student.class ? 'inherit' : 'error.main',
                            fontStyle: student.class ? 'normal' : 'italic'
                          }}>
                            {student.class || '(필수 선택 필요)'}
                            {!student.class && (
                              <Tooltip title="클릭하여 수강클래스 선택">
                                <WarningIcon
                                  fontSize="small"
                                  sx={{ ml: 0.5, color: 'error.main' }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        )}
                      </TableCell>

                      {/* 생년월일 */}
                      <TableCell>
                        {isEditing ? (
                          <Box sx={{
                            p: 1,
                            backgroundColor: 'success.light',
                            borderRadius: 1,
                            color: 'success.contrastText'
                          }}>
                            {currentData.birthDate || '(선택사항)'} ✓
                          </Box>
                        ) : (
                          student.birthDate
                        )}
                      </TableCell>

                      {/* 수강료 */}
                      <TableCell>
                        {isEditing ? (
                          <Box sx={{
                            p: 1,
                            backgroundColor: 'success.light',
                            borderRadius: 1,
                            color: 'success.contrastText'
                          }}>
                            {currentData.classFee ? `${currentData.classFee.toLocaleString()}원` : '(선택사항)'} ✓
                          </Box>
                        ) : (
                          `${student.classFee.toLocaleString()}원`
                        )}
                      </TableCell>

                      {/* 자동메시지 */}
                      <TableCell>
                        {isEditing ? (
                          <Box sx={{
                            p: 1,
                            backgroundColor: 'success.light',
                            borderRadius: 1,
                            color: 'success.contrastText',
                            display: 'flex',
                            gap: 0.5,
                            flexWrap: 'wrap'
                          }}>
                            {currentData.autoMessages?.attendance && (
                              <Chip label="등하원" size="small" variant="outlined" />
                            )}
                            {currentData.autoMessages?.outing && (
                              <Chip label="외출" size="small" variant="outlined" />
                            )}
                            {currentData.autoMessages?.imagePost && (
                              <Chip label="이미지" size="small" variant="outlined" />
                            )}
                            {currentData.autoMessages?.studyMonitoring && (
                              <Chip label="학습" size="small" variant="outlined" />
                            )}
                            ✓
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {student.autoMessages.attendance && (
                              <Chip label="등하원" size="small" variant="outlined" />
                            )}
                            {student.autoMessages.outing && (
                              <Chip label="외출" size="small" variant="outlined" />
                            )}
                            {student.autoMessages.imagePost && (
                              <Chip label="이미지" size="small" variant="outlined" />
                            )}
                            {student.autoMessages.studyMonitoring && (
                              <Chip label="학습" size="small" variant="outlined" />
                            )}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
          <Box>
            {validationErrors.length > 0 && (
              <Alert severity="warning" sx={{ fontSize: '0.875rem' }}>
                {validationErrors.length}개의 오류가 있습니다. 빨간색 편집 버튼을 클릭하여 수정하세요.
              </Alert>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleClosePreview} disabled={bulkUploadLoading}>
              취소
            </Button>
            <Button
              variant="contained"
              onClick={handleBulkRegistration}
              disabled={
                bulkUploadLoading ||
                previewData.filter(s => s.isValid).length === 0
              }
              startIcon={bulkUploadLoading ? undefined : <CheckIcon />}
              color={validationErrors.length > 0 ? "warning" : "primary"}
            >
              {bulkUploadLoading ? '등록 중...' :
               validationErrors.length > 0 ?
               `${previewData.filter(s => s.isValid).length}명만 등록하기` :
               `${previewData.filter(s => s.isValid).length}명 등록하기`}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* 출결 통계 리포트 모달 */}
      <Dialog
        open={attendanceReportOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            handleCloseAttendanceReport()
          }
        }}
        disableEscapeKeyDown
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h5">출결 통계 리포트</Typography>
              <Typography variant="body2" color="text.secondary">
                기간별 출결 현황 및 통계 분석
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="데이터 새로고침">
                <IconButton
                  onClick={handleRefreshAttendanceData}
                  size="small"
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="닫기">
                <IconButton onClick={handleCloseAttendanceReport} size="small">
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {attendanceRecords.length === 0 && (
              <Alert severity="info">
                현재 출석 기록이 없습니다. 출석 관리 페이지에서 출석 기록을 등록한 후 다시 확인해주세요.
              </Alert>
            )}
            {/* 조회 조건 선택 */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>조회 조건</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="시작일"
                    type="date"
                    value={reportDateRange.startDate}
                    onChange={(e) => setReportDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="종료일"
                    type="date"
                    value={reportDateRange.endDate}
                    onChange={(e) => setReportDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    select
                    label="원생 선택"
                    value={selectedStudentId || ''}
                    onChange={(e) => setSelectedStudentId(e.target.value || null)}
                    SelectProps={{ native: true }}
                    InputLabelProps={{ shrink: true }}
                  >
                    <option value="">전체 원생</option>
                    {attendanceStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      const today = new Date()
                      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
                      setReportDateRange({
                        startDate: firstDay.toISOString().split('T')[0],
                        endDate: today.toISOString().split('T')[0]
                      })
                      setSelectedStudentId(null)
                    }}
                  >
                    이번 달 전체
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* 출결 통계 요약 */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>전체 출결 현황</Typography>
              <Grid container spacing={2}>
                {(() => {
                  // ✅ 배열을 안전하게 숫자로 변환하는 함수
                  const safeNumber = (value) => {
                    if (typeof value === 'number') return value
                    if (Array.isArray(value)) return value[0] || 0
                    if (typeof value === 'string') return parseInt(value) || 0
                    return 0
                  }

                  const totalStudents = attendanceData.summary.length
                  const avgAttendanceRate = totalStudents > 0 ?
                    (attendanceData.summary.reduce((sum, s) => sum + parseFloat(s['출석률(%)']), 0) / totalStudents).toFixed(1) : '0.0'
                  
                  // ✅ 배열값을 안전하게 처리
                  const totalAbsent = attendanceData.summary.reduce((sum, s) => {
                    return sum + safeNumber(s['결석일수'])
                  }, 0)
                  
                  const totalLate = attendanceData.summary.reduce((sum, s) => {
                    return sum + safeNumber(s['지각일수'])
                  }, 0)

                  console.log('💾 카드 데이터 (안전하게 처리됨):', {
                    totalStudents,
                    avgAttendanceRate,
                    totalLate,
                    totalAbsent
                  })

                  return (
                    <>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                          <CardContent>
                            <Typography variant="h4">{totalStudents}</Typography>
                            <Typography variant="body2">전체 학생</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                          <CardContent>
                            <Typography variant="h4">{avgAttendanceRate}%</Typography>
                            <Typography variant="body2">평균 출석률</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                          <CardContent>
                            <Typography variant="h4">{totalLate}</Typography>
                            <Typography variant="body2">지각 건수</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
                          <CardContent>
                            <Typography variant="h4">{totalAbsent}</Typography>
                            <Typography variant="body2">결석 건수</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </>
                  )
                })()}
              </Grid>
            </Paper>

            {/* 차트 섹션 */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>학생별 출석률</Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceData.summary}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="학생명"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis domain={[0, 100]} />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="출석률(%)" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>출결 상태 분포</Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={(() => {
                            // ✅ 배열을 안전하게 숫자로 변환하는 함수
                            const safeNumber = (value) => {
                              if (typeof value === 'number') return value
                              if (Array.isArray(value)) return value[0] || 0
                              if (typeof value === 'string') return parseInt(value) || 0
                              return 0
                            }

                            const totalAttendance = attendanceData.summary.reduce((sum, s) => sum + safeNumber(s['출석일수']), 0)
                            const totalLate = attendanceData.summary.reduce((sum, s) => sum + safeNumber(s['지각일수']), 0)
                            const totalEarlyLeave = attendanceData.summary.reduce((sum, s) => sum + safeNumber(s['조퇴일수']), 0)
                            const totalAbsent = attendanceData.summary.reduce((sum, s) => sum + safeNumber(s['결석일수']), 0)

                            const chartData = [
                              { name: '출석', value: totalAttendance, fill: '#8884d8' },
                              { name: '지각', value: totalLate, fill: '#82ca9d' },
                              { name: '조퇴', value: totalEarlyLeave, fill: '#ffc658' },
                              { name: '결석', value: totalAbsent, fill: '#ff7c7c' }
                            ]

                            console.log('📊 차트 데이터:', chartData)
                            return chartData
                          })()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* 학생별 기본 통계 */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>학생별 기본 통계</Typography>
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>학생명</TableCell>
                      <TableCell align="center">출석</TableCell>
                      <TableCell align="center">지각</TableCell>
                      <TableCell align="center">조퇴</TableCell>
                      <TableCell align="center">결석</TableCell>
                      <TableCell align="center">출석률</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dbAttendanceStats.studentStats && dbAttendanceStats.studentStats.length > 0 ? (
                      dbAttendanceStats.studentStats.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.student_name}</TableCell>
                          <TableCell align="center">{row.present_days}</TableCell>
                          <TableCell align="center">{row.late_days}</TableCell>
                          <TableCell align="center">{row.early_leave_days}</TableCell>
                          <TableCell align="center">{row.absent_days}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${row.attendance_rate}%`}
                              color={parseFloat(row.attendance_rate) >= 90 ? 'success' :
                                     parseFloat(row.attendance_rate) >= 80 ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          데이터가 없습니다
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* 날짜별 상세 출석 내역 */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>날짜별 상세 출석 내역</Typography>
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>날짜</TableCell>
                      <TableCell>학생명</TableCell>
                      <TableCell>강의명</TableCell>
                      <TableCell align="center">상태</TableCell>
                      <TableCell align="center">등원시간</TableCell>
                      <TableCell align="center">하원시간</TableCell>
                      <TableCell>비고</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dbAttendanceStats.detailedRecords && dbAttendanceStats.detailedRecords.length > 0 ? (
                      dbAttendanceStats.detailedRecords.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>{record.student_name}</TableCell>
                          <TableCell>{record.lecture_name || '-'}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                record.status === 'present' ? '출석' :
                                record.status === 'late' ? '지각' :
                                record.status === 'early_leave' ? '조퇴' :
                                record.status === 'absent' ? '결석' :
                                record.status === 'left' ? '하원' : record.status
                              }
                              color={
                                record.status === 'present' || record.status === 'left' ? 'success' :
                                record.status === 'late' ? 'warning' :
                                record.status === 'early_leave' ? 'info' :
                                'error'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">{record.check_in_time || '-'}</TableCell>
                          <TableCell align="center">{record.check_out_time || '-'}</TableCell>
                          <TableCell>{record.notes || '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          출석 기록이 없습니다
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAttendanceReport}>
            닫기
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExcelDownload}
            disabled={loading}
          >
            {loading ? '생성 중...' : '엑셀 다운로드'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 학생 등록 양식 모달 */}
      <Dialog
        open={studentTemplateOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            handleCloseStudentTemplate()
          }
        }}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h5">학생 등록 양식</Typography>
              <Typography variant="body2" color="text.secondary">
                엑셀 양식을 다운로드하여 작성 후 업로드하세요
              </Typography>
            </Box>
            <Tooltip title="닫기">
              <IconButton onClick={handleCloseStudentTemplate} size="small">
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Alert severity="info">
              <Typography variant="body2">
                학생 정보를 일괄 등록하려면 먼저 양식을 다운로드하여 작성한 후 업로드하세요.
              </Typography>
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  startIcon={<ExcelIcon />}
                  onClick={downloadStudentTemplateFile}
                  fullWidth
                  size="large"
                >
                  1. 학생 등록 양식 다운로드
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleExcelUpload}
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                />
                <Button
                  variant="contained"
                  startIcon={loading ? undefined : <UploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  fullWidth
                  size="large"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? '파일 읽는 중...' : '2. 작성한 양식 업로드'}
                </Button>
              </Grid>
            </Grid>

            <Alert severity="warning">
              <Typography variant="body2">
                <strong>주의사항:</strong><br/>
                • 엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.<br/>
                • 학생명, 학교, 학부모연락처, 수강클래스는 필수 입력 항목입니다.<br/>
                • 전화번호는 010-1234-5678 형식으로 입력해주세요.<br/>
                • 자동 메시지 설정은 Y 또는 N으로 입력해주세요.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStudentTemplate}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 수납현황 모달 */}
      <Dialog
        open={paymentStatusOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            handleClosePaymentStatus()
          }
        }}
        disableEscapeKeyDown
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h5">수납현황</Typography>
              <Typography variant="body2" color="text.secondary">
                당월 납부 현황 및 수납 이력 조회
              </Typography>
            </Box>
            <Tooltip title="닫기">
              <IconButton onClick={handleClosePaymentStatus} size="small">
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* 검색 조건 */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>검색 조건</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="학생명 입력"
                    placeholder="학생명 입력"
                    value={paymentSearchStudent}
                    onChange={(e) => setPaymentSearchStudent(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="month"
                    label="시작 월"
                    value={paymentStartMonth}
                    onChange={(e) => setPaymentStartMonth(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="month"
                    label="종료 월"
                    value={paymentEndMonth}
                    onChange={(e) => setPaymentEndMonth(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handlePaymentSearch}
                    disabled={paymentLoading}
                  >
                    검색
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* 전체 학생 이번 달 납부 여부 (검색 전 표시) */}
            {!selectedStudentPaymentInfo && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>전체 학생 이번 달 납부 현황</Typography>
                {paymentLoading ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <LinearProgress />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>학생명</TableCell>
                          <TableCell>학년</TableCell>
                          <TableCell>수강료</TableCell>
                          <TableCell align="right">납부 금액</TableCell>
                          <TableCell>납부 상태</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentMonthPayments.length > 0 ? (
                          currentMonthPayments.map((payment) => (
                            <TableRow key={payment.student_id}>
                              <TableCell>{payment.student_name}</TableCell>
                              <TableCell>{payment.grade || '-'}</TableCell>
                              <TableCell>
                                {parseInt(payment.should_pay || 0).toLocaleString()}원
                              </TableCell>
                              <TableCell align="right">
                                {parseInt(payment.total_paid || 0).toLocaleString()}원
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={payment.payment_status}
                                  color={
                                    payment.payment_status === '완납' ? 'success' :
                                    payment.payment_status === '일부납부' ? 'warning' :
                                    payment.payment_status === '수강 강의 없음' ? 'default' :
                                    'error'
                                  }
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              <Typography variant="body2" color="text.secondary">
                                데이터가 없습니다
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            )}

            {/* 선택한 학생의 상세 정보 (검색 후 표시) */}
            {selectedStudentPaymentInfo && (
              <>
                {/* 전체 목록으로 돌아가기 버튼 */}
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedStudentPaymentInfo(null)
                      setPaymentSearchStudent('')
                      loadCurrentMonthPayments()
                    }}
                    startIcon={<RefreshIcon />}
                  >
                    전체 목록으로 돌아가기
                  </Button>
                </Box>

                {/* 학생 정보 */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    학생 정보
                  </Typography>
                  <Alert severity="info">
                    {attendanceStudents.find(s => s.id === selectedStudentPaymentInfo.studentId)?.name || '학생'} -
                    기간: {paymentStartMonth} ~ {paymentEndMonth}
                  </Alert>
                </Paper>

                {/* 신청 강의 및 수강료 */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    신청 강의
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>강의명</TableCell>
                          <TableCell align="right">수강료</TableCell>
                          <TableCell>일정</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedStudentPaymentInfo.lectures && selectedStudentPaymentInfo.lectures.length > 0 ? (
                          selectedStudentPaymentInfo.lectures.map((lecture) => (
                            <TableRow key={lecture.id}>
                              <TableCell>{lecture.lecture_name}</TableCell>
                              <TableCell align="right">
                                {parseInt(lecture.lecture_price || 0).toLocaleString()}원
                              </TableCell>
                              <TableCell>{lecture.schedule || '-'}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              <Typography variant="body2" color="text.secondary">
                                신청한 강의가 없습니다
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* 납부 이력 (기간별) */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    납부 이력
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>납부일</TableCell>
                          <TableCell>납부 월</TableCell>
                          <TableCell align="right">납부 금액</TableCell>
                          <TableCell>납부 방식</TableCell>
                          <TableCell>강의명</TableCell>
                          <TableCell>비고</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedStudentPaymentInfo.paymentHistory && selectedStudentPaymentInfo.paymentHistory.length > 0 ? (
                          selectedStudentPaymentInfo.paymentHistory.map((history) => (
                            <TableRow key={history.id}>
                              <TableCell>{history.payment_date}</TableCell>
                              <TableCell>{history.payment_month}</TableCell>
                              <TableCell align="right">
                                {parseInt(history.amount).toLocaleString()}원
                              </TableCell>
                              <TableCell>{history.payment_method}</TableCell>
                              <TableCell>{history.lecture_name || '-'}</TableCell>
                              <TableCell>{history.notes || '-'}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <Typography variant="body2" color="text.secondary">
                                납부 이력이 없습니다
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentStatus}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    )
  } catch (error) {
    console.error('FilePage 렌더링 오류:', error)
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          파일 관리 페이지 로딩 중 오류가 발생했습니다.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
        >
          페이지 새로고침
        </Button>
      </Box>
    )
  }
}

export default FilePage
