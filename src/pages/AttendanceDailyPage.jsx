import React, { useState, useEffect } from 'react'
import { attendanceService } from '../services/apiService'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Toolbar,
  Chip,
  Avatar,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import {
  Refresh as RefreshIcon,
  Keyboard as KeyboardIcon,
  Face as FaceIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material'
import DraggableDialog from '../components/common/DraggableDialog'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ko } from 'date-fns/locale'
import { format } from 'date-fns'

const AttendanceDailyPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentHistory, setStudentHistory] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])

  useEffect(() => {
    loadAttendanceData()
  }, [selectedDate])

  const loadAttendanceData = async () => {
    setLoading(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      console.log('📅 일별 출석 데이터 로딩:', dateStr)

      const response = await attendanceService.getAttendance(dateStr)

      if (response.success) {
        const records = response.data.attendance || []
        console.log('✅ 출석 데이터 로딩 성공:', records.length, '건')
        console.log('📋 데이터 샘플:', records[0])

        // 데이터 구조 변환
        const transformedRecords = records.map(record => {
          // 태그시각: date + check_in_time 또는 check_out_time 조합
          let taggedAt = record.created_at
          if (record.check_in_time && record.date) {
            taggedAt = `${record.date.split('T')[0]}T${record.check_in_time}`
          } else if (record.check_out_time && record.date) {
            taggedAt = `${record.date.split('T')[0]}T${record.check_out_time}`
          }

          return {
            id: record.id,
            studentName: record.student_name,
            className: record.lecture_name || '학원',
            stateDescription: getStatusLabel(record.status),
            taggedAt: taggedAt,
            isKeypad: null,
            isForced: false,
            comment: record.notes || '',
            thumbnailData: null
          }
        })

        console.log('🔄 변환된 데이터:', transformedRecords)
        setAttendanceRecords(transformedRecords)
      } else {
        console.error('❌ 출석 데이터 로딩 실패:', response.error)
        setAttendanceRecords([])
      }
    } catch (error) {
      console.error('❌ 출석 데이터 로딩 오류:', error)
      setAttendanceRecords([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadAttendanceData()
  }

  const handleCloseHistory = () => {
    setSelectedStudent(null)
    setStudentHistory([])
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'present': return '등원'
      case 'absent': return '미등원'
      case 'late': return '지각'
      case 'early_leave': return '조퇴'
      case 'out': return '외출'
      case 'returned': return '복귀'
      case 'left': return '하원'
      default: return status
    }
  }

  const getStatusColor = (type) => {
    switch (type) {
      case '등원': return 'success'
      case '하원': return 'info'
      case '외출': return 'warning'
      case '복귀': return 'secondary'
      case '조퇴': return 'error'
      default: return 'default'
    }
  }


  // ✅ 수정: 학생별 최신 상태를 보여주는 함수 (그리드용)
  // 각 학생의 가장 최근 출입 기록을 표시
  const getStudentLatestStatus = () => {
    const studentMap = new Map()

    // 시간 순으로 정렬 (최신순)
    const sortedRecords = [...attendanceRecords].sort((a, b) =>
      new Date(b.taggedAt) - new Date(a.taggedAt)
    )

    // 각 학생의 가장 최근 기록만 저장 (그리드 표시용)
    sortedRecords.forEach(record => {
      if (!studentMap.has(record.studentName)) {
        studentMap.set(record.studentName, record)
      }
    })

    return Array.from(studentMap.values())
  }

  const getTotalCount = () => {
    // ✅ 총 학생 수 (중복 제거)
    const uniqueStudents = new Set(attendanceRecords.map(r => r.studentName))
    return uniqueStudents.size
  }

  const handleStudentSelect = (studentName) => {
    setSelectedStudent(studentName)
    // 해당 학생의 모든 기록을 시간순으로 정렬하여 이력으로 설정
    const studentRecords = attendanceRecords
      .filter(record => record.studentName === studentName)
      .sort((a, b) => new Date(a.taggedAt) - new Date(b.taggedAt))
      .map(record => ({
        id: record.id,
        type: record.stateDescription,
        time: record.taggedAt,
        method: record.isKeypad === null ? '직접입력' : record.isKeypad ? '키패드' : '영상인식',
        deviceId: record.deviceId,
        comment: record.comment
      }))

    setStudentHistory(studentRecords)
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
          <Typography
            variant="body2"
            fontWeight="bold"
            noWrap
            sx={{
              cursor: 'pointer',
              color: 'primary.main',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
            onClick={() => handleStudentSelect(params.value)}
          >
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
        if (!params.value) {
          return <Typography variant="body2" noWrap>-</Typography>
        }
        try {
          const date = new Date(params.value)
          if (isNaN(date.getTime())) {
            return <Typography variant="body2" noWrap>-</Typography>
          }
          return (
            <Typography variant="body2" noWrap>
              {format(date, 'MM/dd HH:mm:ss')}
            </Typography>
          )
        } catch (error) {
          return <Typography variant="body2" noWrap>-</Typography>
        }
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
                rows={getStudentLatestStatus()}
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

        {/* 학생 출입 이력 다이얼로그 */}
        <DraggableDialog
          open={!!selectedStudent}
          onClose={(event, reason) => {
            if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
              handleCloseHistory()
            }
          }}
          disableEscapeKeyDown
          maxWidth="md"
          fullWidth
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">
                {selectedStudent} 출입 이력
              </Typography>
              <IconButton onClick={handleCloseHistory} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          }
        >
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {format(selectedDate, 'yyyy년 MM월 dd일')} 출입 이력
            </Typography>

            {studentHistory.length > 0 ? (
              <List>
                {studentHistory.map((history, index) => (
                  <React.Fragment key={history.id}>
                    <ListItem sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        <AccessTimeIcon color="action" fontSize="small" />
                      </Box>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={history.type}
                              size="small"
                              color={getStatusColor(history.type)}
                            />
                            <Typography variant="body1" fontWeight="medium">
                              {(() => {
                                if (!history.time) return '-'
                                try {
                                  const date = new Date(history.time)
                                  if (isNaN(date.getTime())) return '-'
                                  return format(date, 'HH:mm:ss')
                                } catch (error) {
                                  return '-'
                                }
                              })()}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              방법: {history.method}
                              {history.deviceId && ` • 장치: ${history.deviceId}`}
                            </Typography>
                            {history.comment && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                참고: {history.comment}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < studentHistory.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  출입 이력이 없습니다.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseHistory}>
              닫기
            </Button>
          </DialogActions>
        </DraggableDialog>

      </Box>
    </LocalizationProvider>
  )
}

export default AttendanceDailyPage