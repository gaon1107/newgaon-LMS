import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Divider
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material'
import { DataGrid } from '@mui/x-data-grid'
import { useLMS } from '../../contexts/LMSContext'

const StudentStudyPage = () => {
  const { students } = useLMS()
  const [studyData, setStudyData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7일 전
    endDate: new Date().toISOString().split('T')[0] // 오늘
  })

  // 임시 원생별 학습 데이터
  const mockStudentData = [
    {
      id: 1,
      studentName: '김철수',
      studentId: 'STU001',
      totalStudyTime: 450, // 분
      totalSessions: 8,
      averageConcentration: 85.5,
      bestConcentration: 92.3,
      worstConcentration: 78.1,
      studyTrend: [78, 82, 85, 88, 85, 89, 92, 85],
      weeklyData: [
        { date: '2024-01-14', sessions: 2, duration: 90, concentration: 78.1 },
        { date: '2024-01-15', sessions: 1, duration: 45, concentration: 82.3 },
        { date: '2024-01-16', sessions: 1, duration: 60, concentration: 85.7 },
        { date: '2024-01-17', sessions: 2, duration: 105, concentration: 88.2 },
        { date: '2024-01-18', sessions: 1, duration: 75, concentration: 85.4 },
        { date: '2024-01-19', sessions: 1, duration: 75, concentration: 89.1 },
        { date: '2024-01-20', sessions: 0, duration: 0, concentration: 0 }
      ],
      recentSessions: [
        {
          id: 101,
          date: '2024-01-19',
          startTime: '09:00',
          endTime: '10:15',
          duration: 75,
          concentration: 89.1,
          subject: '수학'
        },
        {
          id: 102,
          date: '2024-01-18',
          startTime: '14:00',
          endTime: '15:15',
          duration: 75,
          concentration: 85.4,
          subject: '영어'
        },
        {
          id: 103,
          date: '2024-01-17',
          startTime: '10:00',
          endTime: '11:45',
          duration: 105,
          concentration: 88.2,
          subject: '과학'
        }
      ]
    },
    {
      id: 2,
      studentName: '이영희',
      studentId: 'STU002',
      totalStudyTime: 520,
      totalSessions: 10,
      averageConcentration: 92.3,
      bestConcentration: 96.8,
      worstConcentration: 87.2,
      studyTrend: [87, 89, 92, 94, 93, 95, 97, 92],
      weeklyData: [
        { date: '2024-01-14', sessions: 2, duration: 120, concentration: 87.2 },
        { date: '2024-01-15', sessions: 1, duration: 60, concentration: 89.5 },
        { date: '2024-01-16', sessions: 2, duration: 90, concentration: 92.1 },
        { date: '2024-01-17', sessions: 1, duration: 75, concentration: 94.3 },
        { date: '2024-01-18', sessions: 2, duration: 105, concentration: 93.7 },
        { date: '2024-01-19', sessions: 2, duration: 70, concentration: 95.2 },
        { date: '2024-01-20', sessions: 0, duration: 0, concentration: 0 }
      ],
      recentSessions: [
        {
          id: 201,
          date: '2024-01-19',
          startTime: '15:00',
          endTime: '16:10',
          duration: 70,
          concentration: 95.2,
          subject: '국어'
        },
        {
          id: 202,
          date: '2024-01-18',
          startTime: '09:30',
          endTime: '11:15',
          duration: 105,
          concentration: 93.7,
          subject: '수학'
        }
      ]
    },
    {
      id: 3,
      studentName: '박민수',
      studentId: 'STU003',
      totalStudyTime: 280,
      totalSessions: 5,
      averageConcentration: 68.7,
      bestConcentration: 75.4,
      worstConcentration: 58.3,
      studyTrend: [58, 62, 68, 72, 75],
      weeklyData: [
        { date: '2024-01-14', sessions: 1, duration: 45, concentration: 58.3 },
        { date: '2024-01-15', sessions: 0, duration: 0, concentration: 0 },
        { date: '2024-01-16', sessions: 1, duration: 60, concentration: 62.1 },
        { date: '2024-01-17', sessions: 1, duration: 90, concentration: 68.5 },
        { date: '2024-01-18', sessions: 1, duration: 45, concentration: 72.3 },
        { date: '2024-01-19', sessions: 1, duration: 40, concentration: 75.4 },
        { date: '2024-01-20', sessions: 0, duration: 0, concentration: 0 }
      ],
      recentSessions: [
        {
          id: 301,
          date: '2024-01-19',
          startTime: '16:00',
          endTime: '16:40',
          duration: 40,
          concentration: 75.4,
          subject: '영어'
        },
        {
          id: 302,
          date: '2024-01-18',
          startTime: '13:00',
          endTime: '13:45',
          duration: 45,
          concentration: 72.3,
          subject: '수학'
        }
      ]
    }
  ]

  useEffect(() => {
    loadStudentData()
  }, [selectedStudent, dateRange])

  const loadStudentData = async () => {
    setLoading(true)
    try {
      // 실제로는 API 호출
      setTimeout(() => {
        setStudyData(mockStudentData)
        setLoading(false)
      }, 800)
    } catch (error) {
      console.error('학생 학습 데이터 로딩 실패:', error)
      setLoading(false)
    }
  }

  const filteredData = studyData.filter(student =>
    student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedStudent === '' || student.id.toString() === selectedStudent)
  )

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`
  }

  const getConcentrationColor = (rate) => {
    if (rate >= 90) return 'success'
    if (rate >= 75) return 'primary'
    if (rate >= 60) return 'warning'
    return 'error'
  }

  const renderTrendChart = (data) => {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    return (
      <Box sx={{ display: 'flex', alignItems: 'end', gap: 1, height: 60, width: 200 }}>
        {data.map((value, index) => (
          <Box
            key={index}
            sx={{
              width: 20,
              height: `${((value - min) / range) * 100}%`,
              bgcolor: value >= 80 ? 'success.main' : value >= 60 ? 'warning.main' : 'error.main',
              borderRadius: 1,
              minHeight: 8,
              position: 'relative'
            }}
            title={`${value}%`}
          />
        ))}
      </Box>
    )
  }

  // 최근 학습 세션 DataGrid 컬럼
  const sessionColumns = [
    {
      field: 'date',
      headerName: '날짜',
      width: 120,
      renderCell: (params) => {
        return (
          <Typography variant="body2">
            {new Date(params.value).toLocaleDateString()}
          </Typography>
        )
      }
    },
    {
      field: 'startTime',
      headerName: '시작시간',
      width: 100,
      renderCell: (params) => {
        return (
          <Typography variant="body2">
            {params.value}
          </Typography>
        )
      }
    },
    {
      field: 'endTime',
      headerName: '종료시간',
      width: 100,
      renderCell: (params) => {
        return (
          <Typography variant="body2">
            {params.value}
          </Typography>
        )
      }
    },
    {
      field: 'duration',
      headerName: '학습시간',
      width: 100,
      renderCell: (params) => {
        return (
          <Typography variant="body2" fontWeight="bold">
            {formatDuration(params.value)}
          </Typography>
        )
      }
    },
    {
      field: 'concentration',
      headerName: '집중률',
      width: 120,
      renderCell: (params) => {
        const color = getConcentrationColor(params.value)
        return (
          <Chip
            label={`${params.value.toFixed(1)}%`}
            color={color}
            size="small"
          />
        )
      }
    },
    {
      field: 'subject',
      headerName: '과목',
      width: 100,
      renderCell: (params) => {
        return (
          <Chip
            label={params.value}
            variant="outlined"
            size="small"
          />
        )
      }
    }
  ]

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        원생별 현황
      </Typography>

      {/* 검색 및 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
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
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>특정 학생 선택</InputLabel>
                <Select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  label="특정 학생 선택"
                >
                  <MenuItem value="">전체 학생</MenuItem>
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id.toString()}>
                      {student.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                type="date"
                label="시작일"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                type="date"
                label="종료일"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Typography variant="body2" color="text.secondary" textAlign="right">
                {filteredData.length}명의 학생
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 학생별 상세 정보 */}
      {filteredData.map((student) => (
        <Accordion key={student.id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <PersonIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                {student.studentName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({student.studentId})
              </Typography>
              <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
                <Chip
                  label={`평균 집중률: ${student.averageConcentration.toFixed(1)}%`}
                  color={getConcentrationColor(student.averageConcentration)}
                  size="small"
                />
                <Chip
                  label={`총 학습시간: ${formatDuration(student.totalStudyTime)}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* 통계 요약 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  학습 통계
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          총 세션수
                        </Typography>
                        <Typography variant="h5" color="primary">
                          {student.totalSessions}회
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          최고 집중률
                        </Typography>
                        <Typography variant="h5" color="success.main">
                          {student.bestConcentration.toFixed(1)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          최저 집중률
                        </Typography>
                        <Typography variant="h5" color="error.main">
                          {student.worstConcentration.toFixed(1)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          평균 세션시간
                        </Typography>
                        <Typography variant="h5" color="warning.main">
                          {formatDuration(Math.round(student.totalStudyTime / student.totalSessions))}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              {/* 집중도 추이 */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      집중도 추이
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      {renderTrendChart(student.studyTrend)}
                    </Box>
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                      최근 {student.studyTrend.length}회 세션 집중률 변화
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* 주간 학습 패턴 */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      주간 학습 패턴
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {student.weeklyData.map((day, index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">
                              {new Date(day.date).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                                weekday: 'short'
                              })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {day.sessions > 0 ? `${day.sessions}회, ${formatDuration(day.duration)}` : '학습 없음'}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={day.concentration}
                            sx={{
                              height: 8,
                              borderRadius: 1,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: day.concentration >= 80 ? 'success.main' :
                                                day.concentration >= 60 ? 'warning.main' : 'error.main'
                              }
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {day.concentration > 0 ? `${day.concentration.toFixed(1)}%` : ''}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* 최근 학습 세션 */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      최근 학습 세션
                    </Typography>
                    <Box sx={{ height: 300, width: '100%' }}>
                      <DataGrid
                        rows={student.recentSessions}
                        columns={sessionColumns}
                        pageSize={5}
                        rowsPerPageOptions={[5]}
                        disableRowSelectionOnClick
                        hideFooter={student.recentSessions.length <= 5}
                        sx={{
                          '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid #f0f0f0'
                          },
                          '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: 'grey.50',
                            fontWeight: 'bold'
                          }
                        }}
                        localeText={{
                          noRowsLabel: '최근 학습 세션이 없습니다.'
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      {filteredData.length === 0 && (
        <Alert severity="info">
          조건에 맞는 학생이 없습니다. 검색 조건을 확인해주세요.
        </Alert>
      )}
    </Box>
  )
}

export default StudentStudyPage