import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Avatar
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material'
import DraggableDialog from '../components/common/DraggableDialog'

const TeacherPage = () => {
  const [teachers, setTeachers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subjects: '',
    experience: '',
    notes: ''
  })

  // 임시 데이터
  const mockTeachers = [
    {
      id: 1,
      name: '박선생',
      phone: '010-1111-1111',
      email: 'teacher1@example.com',
      subjects: '수학, 물리',
      experience: '5년',
      notes: '중고등학교 수학 전문'
    },
    {
      id: 2,
      name: '김선생',
      phone: '010-2222-2222',
      email: 'teacher2@example.com',
      subjects: '영어',
      experience: '8년',
      notes: '영어회화 및 문법 전문'
    }
  ]

  useEffect(() => {
    loadTeachers()
  }, [])

  const loadTeachers = async () => {
    setLoading(true)
    try {
      setTimeout(() => {
        setTeachers(mockTeachers)
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('강사 데이터 로딩 실패:', error)
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      subjects: '',
      experience: '',
      notes: ''
    })
  }

  const handleOpenDialog = (teacher = null) => {
    if (teacher) {
      setEditingTeacher(teacher)
      setFormData(teacher)
    } else {
      setEditingTeacher(null)
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingTeacher(null)
    resetForm()
  }

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    try {
      if (editingTeacher) {
        console.log('강사 수정:', formData)
        setTeachers(prev => prev.map(teacher => 
          teacher.id === editingTeacher.id 
            ? { ...formData, id: editingTeacher.id }
            : teacher
        ))
      } else {
        console.log('강사 추가:', formData)
        const newTeacher = {
          ...formData,
          id: Date.now()
        }
        setTeachers(prev => [newTeacher, ...prev])
      }
      
      handleCloseDialog()
    } catch (error) {
      console.error('강사 저장 실패:', error)
    }
  }

  const handleDelete = async (teacherId) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        console.log('강사 삭제:', teacherId)
        setTeachers(prev => prev.filter(teacher => teacher.id !== teacherId))
      } catch (error) {
        console.error('강사 삭제 실패:', error)
      }
    }
  }

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.subjects.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // DataGrid 컬럼 정의
  const columns = [
    {
      field: 'profileImage',
      headerName: '프로필',
      width: 80,
      minWidth: 60,
      maxWidth: 120,
      resizable: true,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Avatar sx={{ width: 40, height: 40 }}>
              {params.row.name.charAt(0)}
            </Avatar>
          </Box>
        )
      }
    },
    {
      field: 'name',
      headerName: '이름',
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
      field: 'subjects',
      headerName: '담당 과목',
      width: 200,
      minWidth: 150,
      maxWidth: 300,
      resizable: true,
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {params.value.split(',').map((subject, index) => (
              <Chip
                key={index}
                label={subject.trim()}
                size="small"
              />
            ))}
          </Box>
        )
      }
    },
    {
      field: 'experience',
      headerName: '경력',
      width: 100,
      minWidth: 80,
      maxWidth: 150,
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
      field: 'phone',
      headerName: '연락처',
      width: 140,
      minWidth: 120,
      maxWidth: 180,
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
      field: 'email',
      headerName: '이메일',
      width: 180,
      minWidth: 150,
      maxWidth: 250,
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
      field: 'actions',
      headerName: '관리',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      resizable: true,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(params.row)}
              title="수정"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id)}
              title="삭제"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        )
      }
    }
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          강사 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          강사 추가
        </Button>
      </Box>

      {/* 검색 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                placeholder="강사 이름 또는 담당 과목 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                총 {filteredTeachers.length}명
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 강사 목록 DataGrid */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            강사 목록 ({filteredTeachers.length}명)
          </Typography>

          <Box sx={{ height: 600, width: '100%', overflow: 'auto' }}>
            <DataGrid
              rows={filteredTeachers}
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
              // 컬럼 드래그 앤 드롭 활성화
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
                minWidth: 1000,
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
                noRowsLabel: '강사 데이터가 없습니다.',
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

      {/* 강사 추가/수정 다이얼로그 */}
      <DraggableDialog
        open={dialogOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            handleCloseDialog()
          }
        }}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
        title={editingTeacher ? '강사 정보 수정' : '새 강사 추가'}
      >
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="이름 *"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="연락처 *"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="이메일"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="경력"
                  value={formData.experience}
                  onChange={handleInputChange('experience')}
                  helperText="예: 5년"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="담당 과목 *"
                  value={formData.subjects}
                  onChange={handleInputChange('subjects')}
                  helperText="쉼표로 구분하여 입력 (예: 수학, 영어, 과학)"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="비고"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange('notes')}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={editingTeacher ? false : (!formData.name || !formData.phone || !formData.subjects)}
          >
            {editingTeacher ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </DraggableDialog>
    </Box>
  )
}

export default TeacherPage
