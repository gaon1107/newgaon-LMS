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

const LecturePage = () => {
  const { lectures, students, addLecture, updateLecture, deleteLecture, updateStudent } = useLMS()
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLecture, setEditingLecture] = useState(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    teacher: '',
    subject: '',
    schedule: '',
    fee: '',
    capacity: '',
    currentStudents: '0',
    description: ''
  })

  const [selectedStudents, setSelectedStudents] = useState([])

  // Context에서 강의 데이터를 가져오므로 mock 데이터 불필요

  const mockTeachers = ['박선생', '김선생', '이선생']
  const mockSubjects = ['수학', '영어', '과학', '국어', '사회']

  // Context에서 강의 데이터를 가져오므로 별도 로딩 불필요

  const resetForm = () => {
    setFormData({
      name: '',
      teacher: '',
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
        capacity: lecture.capacity.toString(),
        currentStudents: lecture.currentStudents.toString(),
        fee: lecture.fee ? lecture.fee.toString() : ''
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
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      const lectureData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        currentStudents: parseInt(formData.currentStudents),
        fee: parseInt(formData.fee)
      }

      if (editingLecture) {
        console.log('강의 수정:', lectureData)
        updateLecture(editingLecture.id, lectureData)

        // 학생 등록 정보 업데이트
        students.forEach(student => {
          const currentlyEnrolled = student.selectedClasses && student.selectedClasses.includes(editingLecture.id)
          const shouldBeEnrolled = selectedStudents.includes(student.id)

          if (currentlyEnrolled !== shouldBeEnrolled) {
            let updatedClasses = student.selectedClasses || []

            if (shouldBeEnrolled) {
              // 학생을 강의에 추가
              updatedClasses = [...updatedClasses, editingLecture.id]
            } else {
              // 학생을 강의에서 제거
              updatedClasses = updatedClasses.filter(classId => classId !== editingLecture.id)
            }

            updateStudent(student.id, {
              ...student,
              selectedClasses: updatedClasses
            })
          }
        })
      } else {
        console.log('강의 추가:', lectureData)
        const newLecture = addLecture(lectureData)

        // 새 강의에 선택된 학생들 등록
        if (selectedStudents.length > 0) {
          selectedStudents.forEach(studentId => {
            const student = students.find(s => s.id === studentId)
            if (student) {
              const updatedClasses = student.selectedClasses || []
              updateStudent(studentId, {
                ...student,
                selectedClasses: [...updatedClasses, newLecture.id]
              })
            }
          })
        }
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
    lecture.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lecture.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lecture.subject.toLowerCase().includes(searchTerm.toLowerCase())
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
      minWidth: 120,
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
      field: 'teacher',
      headerName: '담당 강사',
      width: 120,
      minWidth: 100,
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
      field: 'subject',
      headerName: '과목',
      width: 100,
      minWidth: 80,
      maxWidth: 150,
      resizable: true,
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
      minWidth: 150,
      maxWidth: 250,
      resizable: true,
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
      minWidth: 100,
      maxWidth: 150,
      resizable: true,
      renderCell: (params) => {
        return (
          <Typography variant="body2" fontWeight="bold" color="primary" noWrap>
            {params.value ? `${params.value.toLocaleString()}원` : '-'}
          </Typography>
        )
      }
    },
    {
      field: 'capacity',
      headerName: '수강 인원',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      resizable: true,
      renderCell: (params) => {
        return getCapacityChip(params.row.currentStudents, params.value)
      }
    },
    {
      field: 'students',
      headerName: '수강생',
      width: 200,
      minWidth: 150,
      maxWidth: 300,
      resizable: true,
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
                    {mockTeachers.map((teacher) => (
                      <MenuItem key={teacher} value={teacher}>
                        {teacher}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>과목 *</InputLabel>
                  <Select
                    value={formData.subject}
                    onChange={handleInputChange('subject')}
                    label="과목 *"
                  >
                    {mockSubjects.map((subject) => (
                      <MenuItem key={subject} value={subject}>
                        {subject}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="비용 (월 수강료) *"
                  type="number"
                  value={formData.fee}
                  onChange={handleInputChange('fee')}
                  InputProps={{
                    endAdornment: '원'
                  }}
                  helperText="월 수강료를 입력하세요"
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
