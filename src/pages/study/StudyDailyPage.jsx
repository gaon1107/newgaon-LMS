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
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Send as SendIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Image as ImageIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { DataGrid } from '@mui/x-data-grid'

const StudyDailyPage = () => {
  const [studyData, setStudyData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [screenshotDialog, setScreenshotDialog] = useState({ open: false, images: [] })

  // 임시 데이터
  const mockStudyData = [
    {
      id: 1,
      studentName: '김철수',
      studentId: 'STU001',
      startTime: '2024-01-20 09:00:00',
      endTime: '2024-01-20 10:30:00',
      studyDuration: 90, // 분
      concentrationRate: 85.5,
      averageRate: 78.2,
      concentrationDistribution: [75, 80, 85, 90, 88, 82, 87],
      concentrationTrend: [70, 75, 80, 85, 88, 85, 90, 85, 82, 88],
      deviceId: 'DEV001',
      screenshots: [
        'https://via.placeholder.com/300x200/4CAF50/white?text=Study+1',
        'https://via.placeholder.com/300x200/2196F3/white?text=Study+2',
        'https://via.placeholder.com/300x200/FF9800/white?text=Study+3'
      ],
      canSendReport: true
    },
    {
      id: 2,
      studentName: '이영희',
      studentId: 'STU002',
      startTime: '2024-01-20 10:00:00',
      endTime: '2024-01-20 11:45:00',
      studyDuration: 105, // 분
      concentrationRate: 92.3,
      averageRate: 85.7,
      concentrationDistribution: [85, 90, 95, 92, 88, 90, 94],
      concentrationTrend: [80, 85, 88, 90, 95, 92, 94, 90, 88, 92],
      deviceId: 'DEV002',
      screenshots: [
        'https://via.placeholder.com/300x200/E91E63/white?text=Study+A',
        'https://via.placeholder.com/300x200/9C27B0/white?text=Study+B'
      ],
      canSendReport: true
    },
    {
      id: 3,
      studentName: '박민수',
      studentId: 'STU003',
      startTime: '2024-01-20 14:00:00',
      endTime: '2024-01-20 14:45:00',
      studyDuration: 45, // 분
      concentrationRate: 65.8,
      averageRate: 72.1,
      concentrationDistribution: [60, 65, 70, 68, 62, 68, 66],
      concentrationTrend: [70, 68, 65, 62, 60, 65, 68, 70, 66, 65],
      deviceId: 'DEV003',
      screenshots: [],
      canSendReport: false
    }
  ]

  useEffect(() => {
    loadStudyData()
  }, [selectedDate])

  const loadStudyData = async () => {
    setLoading(true)
    try {
      // 실제로는 API 호출
      setTimeout(() => {
        setStudyData(mockStudyData)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('학습 데이터 로딩 실패:', error)
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadStudyData()
  }

  const handleSendReport = (studentData) => {
    if (confirm(`${studentData.studentName} 학생의 학습 보고서를 전송하시겠습니까?`)) {
      alert('학습 보고서가 전송되었습니다.')
    }
  }

  const handleShowScreenshots = (screenshots) => {
    setScreenshotDialog({ open: true, images: screenshots })
  }

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

  const renderConcentrationChart = (data) => {
    const max = Math.max(...data)
    return (
      <Box sx={{ display: 'flex', alignItems: 'end', gap: 0.5, height: 40 }}>
        {data.map((value, index) => (
          <Box
            key={index}
            sx={{
              width: 8,
              height: `${(value / max) * 100}%`,
              bgcolor: value >= 80 ? 'success.main' : value >= 60 ? 'warning.main' : 'error.main',
              borderRadius: 0.5,
              minHeight: 4
            }}
            title={`${value}%`}
          />
        ))}
      </Box>
    )
  }

  // DataGrid 컬럼 정의
  const columns = [
    {
      field: 'actions',
      headerName: '작업',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {params.row.canSendReport && (
              <Tooltip title="보고서 전송">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleSendReport(params.row)}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      }
    },
    {
      field: 'studentName',
      headerName: '학생명',
      width: 120,
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon fontSize="small" color="primary" />
            <Typography variant="body2" fontWeight="bold">
              {params.value}
            </Typography>
          </Box>
        )
      }
    },
    {
      field: 'studentId',
      headerName: '고유번호',
      width: 100,
      align: 'center',
      renderCell: (params) => {
        return (
          <Typography variant="body2" color="text.secondary">
            {params.value}
          </Typography>
        )
      }
    },
    {
      field: 'startTime',
      headerName: '시작시각',
      width: 160,
      renderCell: (params) => {
        return (
          <Typography variant="body2">
            {new Date(params.value).toLocaleString()}
          </Typography>
        )
      }
    },
    {
      field: 'endTime',
      headerName: '종료시각',
      width: 160,
      renderCell: (params) => {
        return (
          <Typography variant="body2">
            {new Date(params.value).toLocaleString()}
          </Typography>
        )
      }
    },
    {
      field: 'studyDuration',
      headerName: '학습시간',
      width: 120,
      align: 'center',
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight="bold">
              {formatDuration(params.value)}
            </Typography>
          </Box>
        )
      }
    },
    {
      field: 'concentrationRate',
      headerName: '집중률',
      width: 120,
      align: 'center',
      renderCell: (params) => {
        const color = getConcentrationColor(params.value)
        return (
          <Chip
            label={`${params.value.toFixed(1)}%`}
            color={color}
            size="small"
            icon={<TrendingUpIcon />}
          />
        )
      }
    },
    {
      field: 'averageRate',
      headerName: '이전 평균',
      width: 120,
      align: 'center',
      renderCell: (params) => {
        return (
          <Typography variant="body2" color="text.secondary">
            {params.value.toFixed(1)}%
          </Typography>
        )
      }
    },
    {
      field: 'concentrationDistribution',
      headerName: '집중률분포',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        return renderConcentrationChart(params.value)
      }
    },
    {
      field: 'concentrationTrend',
      headerName: '집중도변화',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        return renderConcentrationChart(params.value)
      }
    },
    {
      field: 'screenshots',
      headerName: '스크린샷',
      width: 100,
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        if (params.value.length === 0) return null
        return (
          <Tooltip title="스크린샷 보기">
            <IconButton
              size="small"
              onClick={() => handleShowScreenshots(params.value)}
            >
              <ImageIcon fontSize="small" />
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {params.value.length}
              </Typography>
            </IconButton>
          </Tooltip>
        )
      }
    }
  ]

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        일일학습현황
      </Typography>

      {/* 검색 및 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                type="date"
                label="조회 날짜"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                새로고침
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary" textAlign="right">
                총 {studyData.length}건의 학습 기록
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 통계 요약 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                평균 집중률
              </Typography>
              <Typography variant="h4" color="primary">
                {studyData.length > 0
                  ? (studyData.reduce((sum, item) => sum + item.concentrationRate, 0) / studyData.length).toFixed(1)
                  : 0
                }%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                총 학습시간
              </Typography>
              <Typography variant="h4" color="success.main">
                {formatDuration(studyData.reduce((sum, item) => sum + item.studyDuration, 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                학습 학생수
              </Typography>
              <Typography variant="h4" color="warning.main">
                {studyData.length}명
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                <SendIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                보고서 발송가능
              </Typography>
              <Typography variant="h4" color="error.main">
                {studyData.filter(item => item.canSendReport).length}건
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 학습 기록 DataGrid */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            학습 기록 상세
          </Typography>

          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={studyData}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25 }
                }
              }}
              disableRowSelectionOnClick
              getRowHeight={() => 70}
              autoHeight={false}
              disableColumnReorder={false}
              disableColumnResize={false}
              disableColumnMenu={false}
              disableColumnFilter={false}
              disableColumnSort={false}
              sx={{
                minWidth: 1400,
                '& .MuiDataGrid-cell': {
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'visible'
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'grey.50',
                  fontWeight: 'bold'
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'action.hover'
                },
                '& .MuiDataGrid-columnHeader': {
                  whiteSpace: 'nowrap'
                }
              }}
              localeText={{
                noRowsLabel: '학습 기록이 없습니다.',
                toolbarFilters: '필터',
                toolbarFiltersLabel: '필터 보기',
                toolbarDensity: '행 높이',
                toolbarDensityLabel: '행 높이',
                toolbarDensityCompact: '좁게',
                toolbarDensityStandard: '기본',
                toolbarDensityComfortable: '넓게',
                toolbarColumns: '컬럼',
                toolbarColumnsLabel: '컬럼 선택',
                toolbarExport: '내보내기',
                toolbarExportLabel: '내보내기',
                toolbarExportCSV: 'CSV 다운로드',
                toolbarExportPrint: '인쇄'
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* 스크린샷 다이얼로그 */}
      <Dialog
        open={screenshotDialog.open}
        onClose={() => setScreenshotDialog({ open: false, images: [] })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          학습 스크린샷
          <IconButton
            onClick={() => setScreenshotDialog({ open: false, images: [] })}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {screenshotDialog.images.map((image, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box
                  component="img"
                  src={image}
                  alt={`스크린샷 ${index + 1}`}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.300'
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScreenshotDialog({ open: false, images: [] })}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StudyDailyPage