import React, { useState, useEffect } from 'react'
import { useLMS } from '../contexts/LMSContext'
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Checkbox,
  ListItemText
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import DraggableDialog from '../components/common/DraggableDialog'
import { instructorService } from '../services/apiService'
import { formatCurrency, parseCurrency } from '../utils/formatters'

const LecturePage = () => {
  const { lectures, students, addLecture, updateLecture, deleteLecture, updateStudent } = useLMS()
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLecture, setEditingLecture] = useState(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    teacher: '', // 표시용 (강사 이름)
    instructorId: '', // 백엔드 전송용 (강사 ID)
    teacherName: '', // 백엔드 전송용 (강사 이름)
    subject: '',
    schedule: '',
    fee: '',
    capacity: '',
    currentStudents: '0',
    description: ''
  })

  const [selectedStudents, setSelectedStudents] = useState([])
  const [teachers, setTeachers] = useState([]) // 실제 강사 목록

  // Context에서 강의 데이터를 가져오므로 mock 데이터 불필요
  const mockSubjects = ['수학', '영어', '과학', '국어', '사회']

  // 강사 목록 로드
  useEffect(() => {
    loadTeachers()
  }, [])

  const loadTeachers = async () => {
    try {
      const response = await instructorService.getInstructors(1, 100, '')
      if (response.success) {
        setTeachers(response.data.instructors || [])
      }
    } catch (error) {
      console.error('강사 목록 로딩 실패:', error)
    }
  }

  // Context에서 강의 데이터를 가져오므로 별도 로딩 불필요

  const resetForm = () => {
    setFormData({
      name: '',
      teacher: '',
      instructorId: '',
      teacherName: '',
      subject: '',
      schedule: '',
      fee: '',
      capacity: '',
      currentStudents: '0',
      description: ''
    })
    setSelectedStudents([])
  }

  const handleOpenDialog = (lecture = null) => {
    if (lecture) {
      setEditingLecture(lecture)
      setFormData({
        ...lecture,
        teacher: lecture.teacher || lecture.teacherName || lecture.instructor || '',
        instructorId: lecture.instructor_id || lecture.instructorId || '',
        teacherName: lecture.teacher_name || lecture.teacherName || lecture.teacher || '',
        capacity: lecture.capacity.toString(),
        currentStudents: lecture.currentStudents.toString(),
        fee: lecture.fee ? formatCurrency(lecture.fee.toString()) : ''
      })
      // 현재 강의에 등록된 학생들을 선택된 학생 목록으로 설정
      const enrolledStudents = getStudentsForLecture(lecture.id)
      setSelectedStudents(enrolledStudents.map(student => student.id))
    } else {
      setEditingLecture(null)
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingLecture(null)
    resetForm()
  }

  const handleInputChange = (field) => (event) => {
    let value = event.target.value

    // 금액 필드 자동 포맷팅
    if (field === 'fee') {
      value = formatCurrency(value)
    }

    // 강사 선택 시 instructorId와 teacherName 저장
    if (field === 'teacher') {
      const selectedTeacher = teachers.find(t => t.name === value)
      setFormData(prev => ({
        ...prev,
        teacher: value,
        instructorId: selectedTeacher?.id || '',
        teacherName: selectedTeacher?.name || value
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      // 백엔드가 필요로 하는 형식으로 데이터 변환
      const lectureData = {
        name: formData.name,
        subject: formData.subject,
        description: formData.description,
        schedule: formData.schedule,
        capacity: parseInt(formData.capacity),
        currentStudents: selectedStudents.length, // 선택된 학생 수로 설정
        fee: parseCurrency(formData.fee),
        // 백엔드 필드명에 맞춰서 전송
        instructorId: formData.instructorId || null,
        teacherName: formData.teacherName || formData.teacher,
        instructor: formData.teacher, // 표시용
        teacher: formData.teacher, // DB 저장용
        enrolledStudents: selectedStudents // ✅ 선택된 학생 ID 배열 전달
      }

      if (editingLecture) {
        console.log('강의 수정:', lectureData)
        await updateLecture(editingLecture.id, lectureData)
      } else {
        console.log('강의 추가:', lectureData)
        await addLecture(lectureData)
      }

      handleCloseDialog()
    } catch (error) {
      console.error('강의 저장 실패:', error)
    }
  }

  const handleDelete = async (lectureId) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        console.log('강의 삭제:', lectureId)
        deleteLecture(lectureId)
      } catch (error) {
        console.error('강의 삭제 실패:', error)
      }
    }
  }

  const filteredLectures = lectures.filter(lecture =>
    lecture.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lecture.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lecture.teacher?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lecture.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStudentsForLecture = (lectureId) => {
    return students.filter(student =>
      student.selectedClasses &&
      Array.isArray(student.selectedClasses) &&
      student.selectedClasses.includes(lectureId)
    )
  }

  const getCapacityChip = (current, capacity) => {
    const ratio = current / capacity
    let color = 'success'
    if (ratio > 0.8) color = 'warning'
    if (ratio >= 1) color = 'error'

    return (
      <Chip
        label={`${current}/${capacity}`}
        color={color}
        size="small"
      />
    )
  }

  // DataGrid 컬럼 정의
  const columns = [
    {
      field: 'name',
      headerName: '강의명',
      width: 150,
      renderCell: (params) => {
        return (
          <Typography variant="body2" fontWeight="bold" noWrap>
            {params.value}
          </Typography>
        )
      }
    },
    {
      field: 'instructor',
      headerName: '담당 강사',
      width: 120,
      renderCell: (params) => {
        return (
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        )
      }
    },
    {
      field: 'subject',
      headerName: '과목',
      width: 100,
      renderCell: (params) => {
        return (
          <Chip label={params.value} size="small" />
        )
      }
    },
    {
      field: 'schedule',
      headerName: '스케줄',
      width: 180,
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ScheduleIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" noWrap>
              {params.value}
            </Typography>
          </Box>
        )
      }
    },
    {
      field: 'fee',
      headerName: '비용',
      width: 120,
      renderCell: (params) => {
        return (
          <Typography variant="body2" fontWeight="bold" color="primary" noWrap>
            {params.value ? `${Math.round(params.value).toLocaleString()}원` : '-'}
          </Typography>
        )
      }
    },
    {
      field: 'capacity',
      headerName: '수강 인원',
      width: 120,
      renderCell: (params) => {
        return getCapacityChip(params.row.currentStudents, params.value)
      }
    },
    {
      field: 'students',
      headerName: '수강생',
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const students = getStudentsForLecture(params.row.id)
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: '100%' }}>
            {students.length > 0 ? (
              students.slice(0, 3).map((student) => (
                <Chip
                  key={student.id}
                  label={student.name}
                  size="small"
                  variant="outlined"
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                수강생 없음
              </Typography>
            )}
            {students.length > 3 && (
              <Chip
                label={`+${students.length - 3}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        )
      }
    },
    {
      field: 'actions',
      headerName: '관리',
      width: 120,
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
          강의 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          강의 추가
        </Button>
      </Box>

      {/* 검색 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                placeholder="강의명, 강사명, 과목 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                총 {filteredLectures.length}개 강의
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 강의 목록 DataGrid */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            강의 목록 ({filteredLectures.length}개)
          </Typography>

          <Box sx={{ height: 600, width: '100%', overflow: 'auto' }}>
            <DataGrid
              rows={filteredLectures}
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
                noRowsLabel: '강의 데이터가 없습니다.',
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

      {/* 강의 추가/수정 다이얼로그 */}
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
        title={editingLecture ? '강의 정보 수정' : '새 강의 추가'}
      >
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="강의명 *"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>담당 강사 *</InputLabel>
                  <Select
                    value={formData.teacher}
                    onChange={handleInputChange('teacher')}
                    label="담당 강사 *"
                  >
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.name}>
                        {teacher.name} ({teacher.department || '부서 미지정'})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="과목 *"
                  value={formData.subject}
                  onChange={handleInputChange('subject')}
                  placeholder="예: 수학, 영어, 과학"
                  helperText="과목명을 직접 입력하세요"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="비용 (월 수강료) *"
                  value={formData.fee}
                  onChange={handleInputChange('fee')}
                  placeholder="예: 180,000"
                  helperText="자동으로 천 단위 콤마가 추가됩니다"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="스케줄 *"
                  value={formData.schedule}
                  onChange={handleInputChange('schedule')}
                  helperText="예: 월,수,금 19:00-20:30"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="정원 *"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange('capacity')}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="현재 수강생 수"
                  type="number"
                  value={formData.currentStudents}
                  onChange={handleInputChange('currentStudents')}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>수강생 선택</InputLabel>
                  <Select
                    multiple
                    value={selectedStudents}
                    onChange={(event) => setSelectedStudents(event.target.value)}
                    label="수강생 선택"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((studentId) => {
                          const student = students.find(s => s.id === studentId)
                          return student ? (
                            <Chip key={studentId} label={student.name} size="small" />
                          ) : null
                        })}
                      </Box>
                    )}
                  >
                    {students.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        <Checkbox checked={selectedStudents.includes(student.id)} />
                        <ListItemText primary={`${student.name} (${student.school} ${student.grade}학년)`} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="강의 설명"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange('description')}
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
            disabled={editingLecture ? false : (!formData.name || !formData.teacher || !formData.subject || !formData.schedule || !formData.capacity || !formData.fee)}
          >
            {editingLecture ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </DraggableDialog>
    </Box>
  )
}

export default LecturePage
