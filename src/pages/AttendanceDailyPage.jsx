import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Toolbar,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import {
  Refresh as RefreshIcon,
  Keyboard as KeyboardIcon,
  Face as FaceIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ko } from 'date-fns/locale'
import { format } from 'date-fns'

const AttendanceDailyPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailDialog, setDetailDialog] = useState({ open: false, record: null })

  // 임시 데이터
  const mockAttendanceData = [
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
      studentName: '최지현',
      className: '영어 B반',
      stateDescription: '등원',
      taggedAt: '2025-01-19 08:30:10',
      isKeypad: null,
      processTime: 0,
      isForced: false,
      isModified: true,
      isDelayed: false,
      comment: '직접 입력',
      deviceId: '',
      thumbnailData: null
    },
    {
      id: 5,
      studentName: '김영수',
      className: '수학 A반',
      stateDescription: '하원',
      taggedAt: '2025-01-19 18:00:25',
      isKeypad: false,
      processTime: 1.5,
      isForced: false,
      isModified: false,
      isDelayed: false,
      comment: '',
      deviceId: 'DEVICE-003',
      thumbnailData: '/api/images/thumbnail/5.jpg'
    }
  ]

  useEffect(() => {
    loadAttendanceData()
  }, [selectedDate])

  const loadAttendanceData = async () => {
    setLoading(true)
    try {
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

  const handleRefresh = () => {
    loadAttendanceData()
  }

  const handleViewDetail = (record) => {
    setDetailDialog({ open: true, record })
  }

  const handleDelete = (id) => {
    const record = attendanceData.find(item => item.id === id)
    if (window.confirm(`${record.studentName}의 출결 데이터를 삭제하시겠습니까?`)) {
      setAttendanceData(prev => prev.filter(item => item.id !== id))
      alert('삭제가 완료되었습니다.')
    }
  }

  const getTotalCount = () => {
    return attendanceData.length
  }

  // DataGrid 컬럼 정의 (리사이징 가능하게 설정)
  const columns = [
    {
      field: 'thumbnailData',
      headerName: '영상',
      width: 80,
      minWidth: 60,
      maxWidth: 120,
      resizable: true,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            {params.value ? (
              <Avatar
                src={params.value}
                sx={{ width: 40, height: 30 }}
                variant="rounded"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <Avatar
                sx={{ width: 40, height: 30, bgcolor: 'grey.300' }}
                variant="rounded"
              >
                <FaceIcon />
              </Avatar>
            )}
          </Box>
        )
      }
    },
    {
      field: 'studentName',
      headerName: '학생명',
      width: 120,
      minWidth: 80,
      maxWidth: 200,
      resizable: true,
      renderCell: (params) => {
        return (
          <Typography variant="body2" fontWeight="bold" noWrap>
            {params.value}
          </Typography>
        )
      }
    },
    {
      field: 'className',
      headerName: '반',
      width: 120,
      minWidth: 80,
      maxWidth: 200,
      resizable: true,
      renderCell: (params) => {
        return (
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        )
      }
    },
    {
      field: 'stateDescription',
      headerName: '출결상태',
      width: 100,
      minWidth: 80,
      maxWidth: 150,
      resizable: true,
      renderCell: (params) => {
        return (
          <Chip 
            label={params.value} 
            size="small"
            color={params.value === '등원' ? 'success' : 'info'}
          />
        )
      }
    },
    {
      field: 'taggedAt',
      headerName: '태그시각',
      width: 140,
      minWidth: 120,
      maxWidth: 180,
      resizable: true,
      renderCell: (params) => {
        return (
          <Typography variant="body2" noWrap>
            {format(new Date(params.value), 'MM/dd HH:mm:ss')}
          </Typography>
        )
      }
    },
    {
      field: 'isKeypad',
      headerName: '구분',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      resizable: true,
      renderCell: (params) => {
        if (params.value === null || params.value === undefined) {
          return (
            <Chip 
              label="직접입력" 
              size="small" 
              variant="outlined"
              color="default"
            />
          )
        } else if (params.value === true) {
          return (
            <Chip 
              label="키패드" 
              size="small" 
              icon={<KeyboardIcon />}
              color="secondary"
            />
          )
        } else {
          return (
            <Chip 
              label="영상인식" 
              size="small" 
              icon={<FaceIcon />}
              color="primary"
            />
          )
        }
      }
    },
    {
      field: 'processTime',
      headerName: '소요(초)',
      width: 80,
      minWidth: 60,
      maxWidth: 120,
      resizable: true,
      type: 'number',
      renderCell: (params) => {
        return (
          <Typography variant="body2" noWrap>
            {params.value > 0 ? `${params.value}s` : '-'}
          </Typography>
        )
      }
    },
    {
      field: 'isForced',
      headerName: '강제',
      width: 60,
      minWidth: 50,
      maxWidth: 80,
      resizable: true,
      renderCell: (params) => {
        return params.value ? (
          <Chip label="Y" size="small" color="warning" />
        ) : (
          <span>-</span>
        )
      }
    },
    {
      field: 'isModified',
      headerName: '수동',
      width: 60,
      minWidth: 50,
      maxWidth: 80,
      resizable: true,
      renderCell: (params) => {
        return params.value ? (
          <Chip label="Y" size="small" color="warning" />
        ) : (
          <span>-</span>
        )
      }
    },
    {
      field: 'isDelayed',
      headerName: '지연',
      width: 60,
      minWidth: 50,
      maxWidth: 80,
      resizable: true,
      renderCell: (params) => {
        return params.value ? (
          <Chip label="Y" size="small" color="warning" />
        ) : (
          <span>-</span>
        )
      }
    },
    {
      field: 'comment',
      headerName: '참고사항',
      width: 200,
      minWidth: 100,
      maxWidth: 300,
      resizable: true,
      renderCell: (params) => {
        return (
          <Box 
            sx={{ 
              width: '100%', 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={params.value || '-'}
          >
            <Typography variant="body2" noWrap>
              {params.value || '-'}
            </Typography>
          </Box>
        )
      }
    },
    {
      field: 'deviceId',
      headerName: '기기 ID',
      width: 200,
      minWidth: 120,
      maxWidth: 300,
      resizable: true,
      renderCell: (params) => {
        return (
          <Box 
            sx={{ 
              width: '100%', 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={params.value || '-'}
          >
            <Typography 
              variant="body2" 
              noWrap
              sx={{ 
                fontFamily: 'monospace', 
                fontSize: '0.8rem'
              }}
            >
              {params.value || '-'}
            </Typography>
          </Box>
        )
      }
    },
    {
      field: 'actions',
      headerName: '작업',
      width: 100,
      minWidth: 80,
      maxWidth: 120,
      resizable: true,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => handleViewDetail(params.row)}
              title="상세보기"
            >
              <ViewIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDelete(params.id)}
              title="삭제"
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )
      }
    }
  ]

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          일별 출석 관리
        </Typography>

        {/* 도구 모음 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
              <DatePicker
                label="조회 날짜"
                value={selectedDate}
                onChange={setSelectedDate}
                format="yyyy/MM/dd"
                renderInput={(params) => (
                  <TextField {...params} sx={{ width: 150 }} />
                )}
              />
              <Box sx={{ flex: 1 }} />
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

        {/* 출결 데이터 그리드 */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              출결 현황 ({getTotalCount()}개)
            </Typography>
            
            <Box sx={{ height: 600, width: '100%', overflow: 'auto' }}>
              <DataGrid
                rows={attendanceData}
                columns={columns}
                loading={loading}
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 25 }
                  }
                }}
                disableRowSelectionOnClick
                getRowHeight={() => 60}
                autoHeight={false}
                // 컬럼 드래그 앞드 드롭 활성화
                disableColumnReorder={false}
                // 컬럼 리사이징 활성화
                disableColumnResize={false}
                // 컬럼 메뉴 활성화
                disableColumnMenu={false}
                // 컬럼 필터 활성화
                disableColumnFilter={false}
                // 컬럼 정렬 활성화
                disableColumnSort={false}
                sx={{
                  minWidth: 1200,
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
                  },
                  // 컬럼 경계선 스타일링
                  '& .MuiDataGrid-columnSeparator': {
                    display: 'block',
                    '&:hover': {
                      color: 'primary.main'
                    }
                  },
                  // 컬럼 헤더 드래그 가능 스타일
                  '& .MuiDataGrid-columnHeader:hover .MuiDataGrid-columnSeparator': {
                    visibility: 'visible'
                  }
                }}
                localeText={{
                  noRowsLabel: '출결 데이터가 없습니다.',
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

        {/* 상세 정보 다이얼로그 */}
        <Dialog
          open={detailDialog.open}
          onClose={() => setDetailDialog({ open: false, record: null })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            출결 상세 정보
          </DialogTitle>
          <DialogContent>
            {detailDialog.record && (
              <Box sx={{ mt: 2 }}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      학생 정보
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">학생명</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {detailDialog.record.studentName}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">반</Typography>
                        <Typography variant="body1">
                          {detailDialog.record.className}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      출결 정보
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">출결상태</Typography>
                        <Chip 
                          label={detailDialog.record.stateDescription} 
                          color={detailDialog.record.stateDescription === '등원' ? 'success' : 'info'}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">태그시각</Typography>
                        <Typography variant="body1">
                          {format(new Date(detailDialog.record.taggedAt), 'yyyy년 MM월 dd일 HH:mm:ss')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialog({ open: false, record: null })}>
              닫기
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}

export default AttendanceDailyPage