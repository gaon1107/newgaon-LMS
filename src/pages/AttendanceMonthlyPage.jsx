import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Toolbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import {
  Refresh as RefreshIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Download as DownloadIcon
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ko } from 'date-fns/locale'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate } from 'date-fns'

const AttendanceMonthlyPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(false)
  const [monthlyData, setMonthlyData] = useState({})

  // 임시 데이터 - 센차 버전의 피벗 테이블 구조를 시뮬레이션
  const mockMonthlyData = [
    {
      studentId: 1,
      studentName: '김철수',
      className: '수학 A반',
      daily: {
        1: { in: '08:45', out: '17:30' },
        2: { in: '08:50', out: '17:25' },
        3: { in: '09:00', out: '17:35' },
        5: { in: '08:40', out: '17:20' },
        8: { in: '08:55', out: '17:40' },
        9: { in: '08:45', out: '17:30' },
        10: { in: '08:50', out: '17:25' },
        12: { in: '09:05', out: '17:35' },
        15: { in: '08:35', out: '17:15' },
        16: { in: '08:45', out: '17:30' },
        17: { in: '08:50', out: '17:25' },
        19: { in: '08:55', out: '17:35' },
        22: { in: '09:00', out: '17:40' },
        23: { in: '08:40', out: '17:20' },
        24: { in: '08:45', out: '17:30' }
      },
      totalDays: 15
    },
    {
      studentId: 2,
      studentName: '이영희',
      className: '수학 A반',
      daily: {
        1: { in: '08:30', out: '17:35' },
        2: { in: '08:45', out: '17:30' },
        3: { in: '08:40', out: '17:25' },
        5: { in: '08:35', out: '17:40' },
        8: { in: '08:50', out: '17:30' },
        9: { in: '08:45', out: '17:35' },
        10: { in: '08:40', out: '17:25' },
        15: { in: '08:30', out: '17:20' },
        16: { in: '08:45', out: '17:30' },
        17: { in: '08:50', out: '17:35' },
        19: { in: '08:35', out: '17:25' },
        22: { in: '08:40', out: '17:40' },
        23: { in: '08:45', out: '17:30' }
      },
      totalDays: 13
    },
    {
      studentId: 3,
      studentName: '박민수',
      className: '영어 B반',
      daily: {
        1: { in: '09:00', out: '17:30' },
        2: { in: '08:55', out: '17:25' },
        5: { in: '09:10', out: '17:35' },
        8: { in: '08:45', out: '17:40' },
        9: { in: '09:00', out: '17:30' },
        12: { in: '08:50', out: '17:25' },
        15: { in: '09:05', out: '17:35' },
        16: { in: '08:55', out: '17:20' },
        19: { in: '09:00', out: '17:30' },
        22: { in: '08:45', out: '17:35' },
        23: { in: '09:10', out: '17:25' }
      },
      totalDays: 11
    }
  ]

  useEffect(() => {
    loadMonthlyData()
  }, [selectedMonth])

  const loadMonthlyData = async () => {
    setLoading(true)
    try {
      // 실제 API 호출 시:
      // const response = await attendanceService.getMonthlyAttendance(format(selectedMonth, 'yyyy-MM'))
      
      // 임시 데이터 사용
      setTimeout(() => {
        setAttendanceData(mockMonthlyData)
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('월별 출결 데이터 로딩 실패:', error)
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadMonthlyData()
  }

  // 해당 월의 모든 날짜 구하기
  const getDaysInMonth = () => {
    const start = startOfMonth(selectedMonth)
    const end = endOfMonth(selectedMonth)
    return eachDayOfInterval({ start, end })
  }

  // 일별 출석 데이터 렌더링
  const renderDailyCell = (studentData, day) => {
    const dayNum = getDate(day)
    const dayData = studentData.daily[dayNum]
    
    if (!dayData) {
      return <TableCell key={dayNum} align="center" sx={{ minWidth: 80 }}>-</TableCell>
    }

    return (
      <TableCell key={dayNum} align="center" sx={{ minWidth: 80 }}>
        <Box sx={{ 
          fontSize: '0.75rem', 
          lineHeight: 1.2,
          color: 'text.primary'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
            <LoginIcon sx={{ fontSize: 12, mr: 0.5, color: 'success.main' }} />
            <Tooltip title={`등원: ${dayData.in}`}>
              <span>{dayData.in}</span>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogoutIcon sx={{ fontSize: 12, mr: 0.5, color: 'info.main' }} />
            <Tooltip title={`하원: ${dayData.out}`}>
              <span>{dayData.out}</span>
            </Tooltip>
          </Box>
        </Box>
      </TableCell>
    )
  }

  // 월별 총계 계산
  const getTotalStats = () => {
    const totalStudents = attendanceData.length
    const totalAttendanceDays = attendanceData.reduce((sum, student) => sum + student.totalDays, 0)
    const averageAttendance = totalStudents > 0 ? Math.round(totalAttendanceDays / totalStudents) : 0
    
    return { totalStudents, totalAttendanceDays, averageAttendance }
  }

  // 엑셀 다운로드 기능
  const handleExportExcel = () => {
    const workbookData = []
    
    // 헤더 행 만들기
    const headerRow = ['학생명', '반']
    daysInMonth.forEach(day => {
      headerRow.push(`${getDate(day)}일`)
    })
    headerRow.push('출석일수')
    workbookData.push(headerRow)
    
    // 학생별 데이터 행 만들기
    attendanceData.forEach(student => {
      const row = [student.studentName, student.className]
      daysInMonth.forEach(day => {
        const dayNum = getDate(day)
        const dayData = student.daily[dayNum]
        if (dayData) {
          row.push(`등원: ${dayData.in}, 하원: ${dayData.out}`)
        } else {
          row.push('-')
        }
      })
      row.push(`${student.totalDays}일`)
      workbookData.push(row)
    })
    
    // 총계 행 추가
    const totalRow = ['등원 수', '']
    daysInMonth.forEach(day => {
      const dayNum = getDate(day)
      const dailyCount = attendanceData.filter(student => 
        student.daily[dayNum]
      ).length
      totalRow.push(dailyCount > 0 ? `${dailyCount}명` : '-')
    })
    totalRow.push(`${stats.totalAttendanceDays}일`)
    workbookData.push(totalRow)
    
    // CSV 형태로 변환
    const csvContent = workbookData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
    
    // 파일 다운로드
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `월별출석현황_${format(selectedMonth, 'yyyy년MM월')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const daysInMonth = getDaysInMonth()
  const stats = getTotalStats()

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          월별 출석 관리
        </Typography>

        {/* 도구 모음 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
              <DatePicker
                label="조회 월"
                value={selectedMonth}
                onChange={setSelectedMonth}
                views={['year', 'month']}
                format="yyyy년 MM월"
                renderInput={(params) => (
                  <TextField {...params} sx={{ width: 180 }} />
                )}
              />
              <Box sx={{ flex: 1 }} />
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportExcel}
                disabled={loading || attendanceData.length === 0}
                sx={{ mr: 1 }}
              >
                엑셀 다운로드
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                새로고침
              </Button>
            </Toolbar>
          </CardContent>
        </Card>

        {/* 통계 카드 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {format(selectedMonth, 'yyyy년 MM월')} 출석 현황
            </Typography>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Box>
                <Typography variant="h4" color="primary">
                  {stats.totalStudents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  총 학생 수
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" color="success.main">
                  {stats.totalAttendanceDays}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  총 출석일수
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" color="info.main">
                  {stats.averageAttendance}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  평균 출석일
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* 월별 출석 테이블 */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              월별 출석 현황
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : attendanceData.length === 0 ? (
              <Alert severity="info">
                해당 월에 출석 데이터가 없습니다.
              </Alert>
            ) : (
              <TableContainer sx={{ maxHeight: 600, overflowX: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell 
                        sx={{ 
                          position: 'sticky',
                          left: 0,
                          backgroundColor: 'background.paper',
                          zIndex: 2,
                          minWidth: 120,
                          fontWeight: 'bold'
                        }}
                      >
                        학생이름
                      </TableCell>
                      {daysInMonth.map((day) => (
                        <TableCell 
                          key={getDate(day)} 
                          align="center" 
                          sx={{ 
                            minWidth: 80,
                            fontWeight: 'bold',
                            backgroundColor: getDate(day) % 7 === 0 || getDate(day) % 7 === 6 ? 'grey.50' : 'inherit'
                          }}
                        >
                          {getDate(day)}일
                        </TableCell>
                      ))}
                      <TableCell 
                        align="center" 
                        sx={{ 
                          position: 'sticky',
                          right: 0,
                          backgroundColor: 'primary.light',
                          color: 'white',
                          fontWeight: 'bold',
                          minWidth: 80
                        }}
                      >
                        출석일수
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceData.map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell 
                          component="th" 
                          scope="row"
                          sx={{ 
                            position: 'sticky',
                            left: 0,
                            backgroundColor: 'background.paper',
                            zIndex: 1,
                            fontWeight: 'medium'
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {student.studentName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {student.className}
                            </Typography>
                          </Box>
                        </TableCell>
                        {daysInMonth.map((day) => renderDailyCell(student, day))}
                        <TableCell 
                          align="center"
                          sx={{ 
                            position: 'sticky',
                            right: 0,
                            backgroundColor: 'primary.light',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        >
                          <Chip 
                            label={`${student.totalDays}일`}
                            size="small"
                            sx={{ 
                              backgroundColor: 'white',
                              color: 'primary.main',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* 총계 행 */}
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell 
                        sx={{ 
                          position: 'sticky',
                          left: 0,
                          backgroundColor: 'grey.100',
                          zIndex: 1,
                          fontWeight: 'bold'
                        }}
                      >
                        등원 수
                      </TableCell>
                      {daysInMonth.map((day) => {
                        const dayNum = getDate(day)
                        const dailyCount = attendanceData.filter(student => 
                          student.daily[dayNum]
                        ).length
                        return (
                          <TableCell key={dayNum} align="center">
                            {dailyCount > 0 ? (
                              <Chip 
                                label={`${dailyCount}명`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ) : '-'}
                          </TableCell>
                        )
                      })}
                      <TableCell 
                        align="center"
                        sx={{ 
                          position: 'sticky',
                          right: 0,
                          backgroundColor: 'grey.100',
                          fontWeight: 'bold'
                        }}
                      >
                        <Chip 
                          label={`${stats.totalAttendanceDays}일`}
                          color="primary"
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* 범례 */}
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              범례
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LoginIcon sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="body2">등원 시간</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LogoutIcon sx={{ fontSize: 16, color: 'info.main' }} />
                <Typography variant="body2">하원 시간</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">-</Typography>
                <Typography variant="body2">미출석</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  )
}

export default AttendanceMonthlyPage