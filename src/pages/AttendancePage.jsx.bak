import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Face as FaceIcon,
  Keyboard as KeyboardIcon
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ko } from 'date-fns/locale'

const AttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailDialog, setDetailDialog] = useState({ open: false, student: null })

  // 임시 데이터
  const mockClasses = [
    { id: '', name: '전체' },
    { id: 'math', name: '수학 A반' },
    { id: 'english', name: '영어 B반' },
    { id: 'science', name: '과학 C반' }
  ]

  const mockAttendanceData = [
    {
      id: 1,
      name: '김철수',
      class: '수학 A반',
      checkInTime: '2025-01-19 09:00:15',
      checkOutTime: '2025-01-19 17:30:22',
      method: 'face', // face or keypad
      status: 'present', // present, absent, late
      profileImage: null
    },
    {
      id: 2,
      name: '이영희',
      class: '영어 B반',
      checkInTime: '2025-01-19 09:15:30',
      checkOutTime: null,
      method: 'keypad',
      status: 'late',
      profileImage: null
    },
    {
      id: 3,
      name: '박민수',
      class: '과학 C반',
      checkInTime: null,
      checkOutTime: null,
      method: null,
      status: 'absent',
      profileImage: null
    }
  ]

  useEffect(() => {
    loadAttendanceData()
  }, [selectedDate, selectedClass])

  const loadAttendanceData = async () => {
    setLoading(true)
    try {
      // 실제 API 호출
      // const response = await attendanceService.getAttendance(selectedDate, selectedClass)
      
      // 임시 데이터 사용
      setTimeout(() => {
        setAttendanceData(mockAttendanceData)
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('출결 데이터 로딩 실패:', error)
      setLoading(false)
    }
  }

  const getStatusChip = (status) => {
    const statusMap = {
      present: { label: '출석', color: 'success' },
      late: { label: '지각', color: 'warning' },
      absent: { label: '결석', color: 'error' }
    }
    
    const { label, color } = statusMap[status] || { label: '미확인', color: 'default' }
    return <Chip label={label} color={color} size="small" />
  }

  const getMethodIcon = (method) => {
    if (method === 'face') {
      return <FaceIcon color="primary" titleAccess="얼굴인식" />
    } else if (method === 'keypad') {
      return <KeyboardIcon color="secondary" titleAccess="키패드" />
    }
    return null
  }

  const filteredData = attendanceData.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedClass === '' || student.class === mockClasses.find(c => c.id === selectedClass)?.name)
  )

  const handleExportExcel = () => {
    // 엑셀 다운로드 구현
    console.log('엑셀 다운로드')
    alert('출결 데이터를 엑셀로 다운로드합니다.')
  }

  const handleViewDetail = (student) => {
    setDetailDialog({ open: true, student })
  }

  const stats = {
    total: filteredData.length,
    present: filteredData.filter(s => s.status === 'present').length,
    late: filteredData.filter(s => s.status === 'late').length,
    absent: filteredData.filter(s => s.status === 'absent').length
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          출결 관리
        </Typography>

        {/* 통계 카드 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  전체 학생
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="success.main">
                  {stats.present}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  출석
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="warning.main">
                  {stats.late}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  지각
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="error.main">
                  {stats.absent}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  결석
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 필터 및 검색 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <DatePicker
                  label="조회 날짜"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>반 선택</InputLabel>
                  <Select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    label="반 선택"
                  >
                    {mockClasses.map((cls) => (
                      <MenuItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="학생 이름 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<DownloadIcon />}
                  onClick={handleExportExcel}
                >
                  엑셀
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 출결 데이터 테이블 */}
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>학생명</TableCell>
                    <TableCell>반</TableCell>
                    <TableCell>등원시간</TableCell>
                    <TableCell>하원시간</TableCell>
                    <TableCell>출결방법</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>상세</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        데이터를 불러오는 중...
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        출결 데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.class}</TableCell>
                        <TableCell>
                          {student.checkInTime ? (
                            new Date(student.checkInTime).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {student.checkOutTime ? (
                            new Date(student.checkOutTime).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {getMethodIcon(student.method)}
                        </TableCell>
                        <TableCell>
                          {getStatusChip(student.status)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetail(student)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* 상세 정보 다이얼로그 */}
        <Dialog
          open={detailDialog.open}
          onClose={() => setDetailDialog({ open: false, student: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            출결 상세 정보
          </DialogTitle>
          <DialogContent>
            {detailDialog.student && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {detailDialog.student.name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>반:</strong> {detailDialog.student.class}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>등원시간:</strong> {detailDialog.student.checkInTime || '미등원'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>하원시간:</strong> {detailDialog.student.checkOutTime || '미하원'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>출결방법:</strong> {
                    detailDialog.student.method === 'face' ? '얼굴인식' :
                    detailDialog.student.method === 'keypad' ? '키패드' : '미확인'
                  }
                </Typography>
                <Typography variant="body2">
                  <strong>상태:</strong> {getStatusChip(detailDialog.student.status)}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialog({ open: false, student: null })}>
              닫기
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}

export default AttendancePage
