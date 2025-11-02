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
import { attendanceService } from '../services/apiService'

const AttendanceMonthlyPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadMonthlyData()
  }, [selectedMonth])

  const loadMonthlyData = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('📅 월별 출석 데이터 로딩 중...', format(selectedMonth, 'yyyy-MM'))

      // ✅ 실제 API 호출
      const response = await attendanceService.getMonthlyAttendance(format(selectedMonth, 'yyyy-MM'))

      if (response.success) {
        console.log('✅ 월별 출석 데이터 로딩 성공:', response.data)
        setAttendanceData(response.data.students || [])
      } else {
        throw new Error(response.error?.message || '데이터 로딩 실패')
      }
    } catch (error) {
      console.error('❌ 월별 출결 데이터 로딩 실패:', error)
      setError(error.message || '월별 출석 데이터를 불러오는데 실패했습니다')
      setAttendanceData([])
    } finally {
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
      return <TableCell key={dayNum} align="center" sx={{ minWidth: 100 }}>-</TableCell>
    }

    // ✅ 월별출석: 등원, 하원, 조퇴만 표시 (외출/복귀는 표시 안 함)
    const hasCheckIn = dayData.in && dayData.in !== 'null'
    const hasCheckOut = dayData.out && dayData.out !== 'null'

    // ✅ 상태에 따른 표시 라벨 결정
    let checkOutLabel = '하원'
    let checkOutColor = 'info.main'

    if (dayData.status === 'early_leave') {
      checkOutLabel = '조퇴'
      checkOutColor = 'warning.main'
    } else if (dayData.status === 'left') {
      checkOutLabel = '하원'
      checkOutColor = 'info.main'
    }

    return (
      <TableCell key={dayNum} align="center" sx={{ minWidth: 100 }}>
        <Box sx={{
          fontSize: '0.7rem',
          lineHeight: 1.3,
          color: 'text.primary'
        }}>
          {hasCheckIn && (
            <Box sx={{ mb: 0.3 }}>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'success.main', fontWeight: 'medium', whiteSpace: 'nowrap' }}>
                등원: {dayData.in}
              </Typography>
            </Box>
          )}
          {hasCheckOut && (
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: checkOutColor, fontWeight: 'medium', whiteSpace: 'nowrap' }}>
                {checkOutLabel}: {dayData.out}
              </Typography>
            </Box>
          )}
          {!hasCheckIn && !hasCheckOut && (
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              -
            </Typography>
          )}
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
    const headerRow = ['학생명', '학번']
    daysInMonth.forEach(day => {
      headerRow.push(`${getDate(day)}일`)
    })
    headerRow.push('출석일수')
    workbookData.push(headerRow)
    
    // 학생별 데이터 행 만들기
    attendanceData.forEach(student => {
      const row = [student.studentName, student.studentNumber || '']
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
            ) : error ? (
              <Alert severity="error">
                {error}
              </Alert>
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
                            minWidth: 100,
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
                              {student.studentNumber || ''}
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

      </Box>
    </LocalizationProvider>
  )
}

export default AttendanceMonthlyPage