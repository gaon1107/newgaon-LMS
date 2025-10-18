import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Avatar,
  Alert,
  Snackbar,
  IconButton
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import DraggableDialog from '../components/common/DraggableDialog'
import { instructorService } from '../services/apiService'
import { formatPhoneNumber, formatCurrency, parseCurrency, formatDateForInput } from '../utils/formatters'

const TeacherPage = () => {
  const [instructors, setInstructors] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInstructor, setEditingInstructor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 25
  })
  
  // 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  })

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    department: '',
    subject: '',
    hireDate: '',
    address: '',
    notes: '',
    salary: '',
    employmentType: 'full-time',
    status: 'active'
  })

  useEffect(() => {
    loadInstructors()
  }, [pagination.currentPage, searchTerm])

  const loadInstructors = async () => {
    setLoading(true)
    try {
      console.log('🔍 강사 목록 로딩 시작...')
      const response = await instructorService.getInstructors(
        pagination.currentPage,
        pagination.itemsPerPage,
        searchTerm
      )
      
      console.log('✅ 강사 목록 로딩 성공:', response)
      
      // 🔍 급여 디버깅 로그 추가
      if (response.success && response.data.instructors) {
        console.log('===== 강사 급여 디버깅 =====');
        response.data.instructors.forEach(instructor => {
          console.log(`ID ${instructor.id} - ${instructor.name}:`);
          console.log('  - salary 원본 값:', instructor.salary);
          console.log('  - typeof:', typeof instructor.salary);
        });
        console.log('============================');
      }
      
      if (response.success) {
        setInstructors(response.data.instructors || [])
        setPagination(prev => ({
          ...prev,
          totalPages: response.data.pagination?.totalPages || 1,
          totalItems: response.data.pagination?.totalItems || 0
        }))
      }
    } catch (error) {
      console.error('❌ 강사 목록 로딩 실패:', error)
      showSnackbar('강사 목록을 불러오는데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    })
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      department: '',
      subject: '',
      hireDate: '',
      address: '',
      notes: '',
      salary: '',
      employmentType: 'full-time',
      status: 'active'
    })
  }

  const handleOpenDialog = (instructor = null) => {
    if (instructor) {
      setEditingInstructor(instructor)
      setFormData({
        name: instructor.name || '',
        phone: formatPhoneNumber(instructor.phone || ''),
        email: instructor.email || '',
        department: instructor.department || '',
        subject: instructor.subject || '',
        hireDate: formatDateForInput(instructor.hire_date) || '', // 날짜 형식 변환
        address: instructor.address || '',
        notes: instructor.notes || '',
        salary: instructor.salary ? formatCurrency(instructor.salary.toString()) : '',
        employmentType: instructor.employment_type || 'full-time',
        status: instructor.status || 'active'
      })
    } else {
      setEditingInstructor(null)
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingInstructor(null)
    resetForm()
  }

  const handleInputChange = (field) => (event) => {
    let value = event.target.value

    // 전화번호 필드 자동 포맷팅
    if (field === 'phone') {
      value = formatPhoneNumber(value)
    }

    // 급여 필드 자동 포맷팅
    if (field === 'salary') {
      value = formatCurrency(value)
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    try {
      // 저장용 데이터 준비 (포맷 제거)
      const submitData = {
        ...formData,
        salary: parseCurrency(formData.salary) // 급여는 순수 숫자로 변환
      }

      if (editingInstructor) {
        console.log('📝 강사 수정 중...', submitData)
        const response = await instructorService.updateInstructor(
          editingInstructor.id,
          submitData
        )
        
        if (response.success) {
          console.log('✅ 강사 수정 성공!')
          showSnackbar('강사 정보가 수정되었습니다.')
          loadInstructors()
        }
      } else {
        console.log('➕ 강사 추가 중...', submitData)
        const response = await instructorService.createInstructor(submitData)
        
        if (response.success) {
          console.log('✅ 강사 추가 성공!')
          showSnackbar('강사가 추가되었습니다.')
          loadInstructors()
        }
      }
      
      handleCloseDialog()
    } catch (error) {
      console.error('❌ 강사 저장 실패:', error)
      showSnackbar(
        error.response?.data?.message || '강사 저장 중 오류가 발생했습니다.',
        'error'
      )
    }
  }

  const handleDelete = async (instructorId) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        console.log('🗑️ 강사 삭제 중...', instructorId)
        const response = await instructorService.deleteInstructor(instructorId)
        
        if (response.success) {
          console.log('✅ 강사 삭제 성공!')
          showSnackbar('강사가 삭제되었습니다.')
          loadInstructors()
        }
      } catch (error) {
        console.error('❌ 강사 삭제 실패:', error)
        showSnackbar(
          error.response?.data?.message || '강사 삭제 중 오류가 발생했습니다.',
          'error'
        )
      }
    }
  }

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
              {params.row.name?.charAt(0) || '?'}
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
      field: 'department',
      headerName: '학과',
      width: 120,
      minWidth: 100,
      maxWidth: 180,
      resizable: true,
      renderCell: (params) => {
        return (
          <Typography variant="body2" noWrap>
            {params.value || '-'}
          </Typography>
        )
      }
    },
    {
      field: 'subject',
      headerName: '담당 과목',
      width: 200,
      minWidth: 150,
      maxWidth: 300,
      resizable: true,
      renderCell: (params) => {
        if (!params.value) return <Typography variant="body2">-</Typography>
        
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
      field: 'lectures',
      headerName: '담당 강의',
      width: 180,
      minWidth: 150,
      maxWidth: 250,
      resizable: true,
      renderCell: (params) => {
        return (
          <Typography variant="body2" noWrap>
            {params.value || '미배정'}
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
            {params.value || '-'}
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
            {params.value || '-'}
          </Typography>
        )
      }
    },
    {
      field: 'status',
      headerName: '상태',
      width: 100,
      minWidth: 80,
      maxWidth: 120,
      resizable: true,
      renderCell: (params) => {
        const statusMap = {
          active: { label: '재직', color: 'success' },
          inactive: { label: '휴직', color: 'warning' },
          resigned: { label: '퇴사', color: 'error' }
        }
        const status = statusMap[params.value] || { label: params.value, color: 'default' }
        
        return (
          <Chip
            label={status.label}
            color={status.color}
            size="small"
          />
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
                placeholder="강사 이름, 학과, 과목 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                총 {pagination.totalItems}명
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 강사 목록 DataGrid */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            강사 목록 ({instructors.length}명)
          </Typography>

          <Box sx={{ height: 600, width: '100%', overflow: 'auto' }}>
            <DataGrid
              rows={instructors}
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
              disableColumnReorder={false}
              disableColumnResize={false}
              disableColumnMenu={false}
              disableColumnFilter={false}
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
                '& .MuiDataGrid-columnSeparator': {
                  display: 'block',
                  '&:hover': {
                    color: 'primary.main'
                  }
                },
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
        title={editingInstructor ? '강사 정보 수정' : '새 강사 추가'}
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
                  label="학과"
                  value={formData.department}
                  onChange={handleInputChange('department')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="담당 과목"
                  value={formData.subject}
                  onChange={handleInputChange('subject')}
                  helperText="쉼표로 구분 (예: 수학, 영어)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="입사일"
                  type="date"
                  value={formData.hireDate}
                  onChange={handleInputChange('hireDate')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="급여"
                  value={formData.salary}
                  onChange={handleInputChange('salary')}
                  placeholder="예: 5,000,000"
                  helperText="자동으로 천 단위 콤마가 추가됩니다"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="고용 형태"
                  value={formData.employmentType}
                  onChange={handleInputChange('employmentType')}
                  SelectProps={{ native: true }}
                >
                  <option value="full-time">정규직</option>
                  <option value="part-time">시간강사</option>
                  <option value="contract">계약직</option>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="주소"
                  value={formData.address}
                  onChange={handleInputChange('address')}
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
            disabled={!formData.name || !formData.phone}
          >
            {editingInstructor ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </DraggableDialog>

      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default TeacherPage
