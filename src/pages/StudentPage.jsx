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
  Avatar,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import DraggableDialog from '../components/common/DraggableDialog'

const StudentPage = () => {
  const { students, lectures, loading, error, addStudent, updateStudent, deleteStudent, refreshData } = useLMS()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [formError, setFormError] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    school: '',
    grade: '',
    phone: '',
    parentPhone: '',
    attendanceNumber: '',
    email: '',
    class: '',
    birthDate: '',
    address: '',
    notes: '',
    selectedClasses: [],
    classFee: 0,
    paymentDueDate: '',
    sendPaymentNotification: true,
    profileImage: null,
    capturedImage: null,
    autoMessages: {
      attendance: true,
      outing: false,
      imagePost: false,
      studyMonitoring: false
    }
  })

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^0-9]/g, '')
    
    if (!numbers) return ''
    
    if (numbers.startsWith('010')) {
      if (numbers.length <= 3) {
        return numbers
      } else if (numbers.length <= 7) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
      } else if (numbers.length <= 11) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
      }
    }
    else if (numbers.startsWith('011') || numbers.startsWith('016') || numbers.startsWith('017') || numbers.startsWith('018') || numbers.startsWith('019')) {
      if (numbers.length <= 3) {
        return numbers
      } else if (numbers.length <= 7) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
      } else if (numbers.length <= 11) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
      }
    }
    else if (numbers.startsWith('02')) {
      if (numbers.length <= 2) {
        return numbers
      } else if (numbers.length <= 5) {
        return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
      } else if (numbers.length <= 9) {
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5, 9)}`
      } else if (numbers.length <= 10) {
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
      } else {
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
      }
    }
    else {
      if (numbers.length <= 3) {
        return numbers
      } else if (numbers.length <= 6) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
      } else if (numbers.length <= 10) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
      }
    }
  }

  const mockClasses = [
    { id: '', name: '전체' },
    ...(Array.isArray(lectures) ? lectures.map(lecture => ({
      id: lecture.id,
      name: lecture.name,
      fee: Number(lecture.fee) || 0
    })) : [])
  ]

  const resetForm = () => {
    setFormData({
      name: '',
      school: '',
      grade: '',
      phone: '',
      parentPhone: '',
      attendanceNumber: '',
      email: '',
      class: '',
      birthDate: '',
      address: '',
      notes: '',
      selectedClasses: [],
      classFee: 0,
      paymentDueDate: '',
      sendPaymentNotification: true,
      profileImage: null,
      capturedImage: null,
      autoMessages: {
        attendance: true,
        outing: false,
        imagePost: false,
        studyMonitoring: false
      }
    })
  }

  const handleOpenDialog = (student = null) => {
    if (student) {
      setEditingStudent(student)

      const formatDateForInput = (dateValue) => {
        if (!dateValue) return ''

        if (dateValue.includes('T')) {
          const date = new Date(dateValue)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateValue
        }

        return dateValue
      }

      const formattedData = {
        name: student.name || '',
        school: student.school || '',
        grade: student.grade || '',
        phone: student.phone || '',
        parentPhone: student.parentPhone || '',
        attendanceNumber: student.attendanceNumber || '',
        email: student.email || '',
        class: student.class || '',
        birthDate: formatDateForInput(student.birthDate),
        address: student.address || '',
        notes: student.notes || '',
        selectedClasses: student.selectedClasses || [],
        classFee: student.classFee || 0,
        paymentDueDate: formatDateForInput(student.paymentDueDate),
        sendPaymentNotification: student.sendPaymentNotification !== undefined ? student.sendPaymentNotification : true,
        profileImage: student.profileImage || null,
        capturedImage: student.capturedImage || null,
        autoMessages: {
          attendance: student.autoMessages?.attendance !== undefined ? student.autoMessages.attendance : true,
          outing: student.autoMessages?.outing || false,
          imagePost: student.autoMessages?.imagePost || false,
          studyMonitoring: student.autoMessages?.studyMonitoring || false
        }
      }

      setFormData(formattedData)
    } else {
      setEditingStudent(null)
      resetForm()
    }

    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingStudent(null)
    setFormError(null)
    resetForm()
  }

  const handleInputChange = (field) => (event) => {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value

    if (field === 'phone' || field === 'parentPhone') {
      value = formatPhoneNumber(value)
    }

    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      }

      if (field === 'selectedClasses') {
        const selectedClassesInfo = value.map(classId => mockClasses.find(c => c.id === classId)).filter(Boolean)
        const totalFee = selectedClassesInfo.reduce((sum, cls) => {
          const fee = Number(cls.fee) || 0
          console.log('클래스:', cls.name, '비용:', fee)
          return sum + fee
        }, 0)
        const classNames = selectedClassesInfo.map(cls => cls.name).join(', ')

        console.log('총 비용:', totalFee)

        newData.classFee = totalFee
        newData.class = classNames
      }

      return newData
    })
  }

  const handleAutoMessageChange = (messageType) => (event) => {
    const checked = event.target.checked
    setFormData(prev => ({
      ...prev,
      autoMessages: {
        ...prev.autoMessages,
        [messageType]: checked
      }
    }))
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          profileImage: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoOptionClick = () => {
    setPhotoDialogOpen(true)
  }

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      setCameraStream(stream)
      setShowCamera(true)
      setPhotoDialogOpen(false)
    } catch (error) {
      console.error('카메라 접근 오류:', error)
      alert('카메라에 접근할 수 없습니다. 권한을 확인해주세요.')
    }
  }

  const handleFileSelect = () => {
    document.getElementById('photo-upload').click()
    setPhotoDialogOpen(false)
  }

  const capturePhoto = () => {
    const video = document.getElementById('camera-video')
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    const capturedImageData = canvas.toDataURL('image/jpeg')
    setFormData(prev => ({
      ...prev,
      profileImage: capturedImageData
    }))

    stopCamera()
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError(null)

    try {
      if (editingStudent) {
        console.log('학생 수정:', formData)
        await updateStudent(editingStudent.id, formData)
        alert('학생 정보가 수정되었습니다.')
      } else {
        console.log('학생 추가:', formData)
        await addStudent(formData)
        alert('학생이 추가되었습니다.')
      }

      handleCloseDialog()
    } catch (error) {
      console.error('학생 저장 실패:', error)

      // 에러 메시지를 사용자에게 표시
      const errorMessage = error.message || '학생 저장 중 오류가 발생했습니다.'
      setFormError(errorMessage)
    }
  }

  const handleDelete = async (studentId) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        console.log('학생 삭제:', studentId)
        await deleteStudent(studentId)
        alert('학생이 삭제되었습니다.')
      } catch (error) {
        console.error('학생 삭제 실패:', error)
      }
    }
  }

  const filteredStudents = (students || []).filter(student => {
    if (!student || !student.name) {
      console.warn('⚠️ 잘못된 학생 데이터:', student);
      return false;
    }
    
    try {
      const nameMatch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const classMatch = selectedClass === '' || student.class === mockClasses.find(c => c.id === selectedClass)?.name;
      return nameMatch && classMatch;
    } catch (error) {
      console.error('❌ 필터링 에러:', error, student);
      return false;
    }
  })

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
            {params.row.profileImage ? (
              <Avatar
                src={params.row.profileImage}
                sx={{ width: 40, height: 40 }}
              />
            ) : (
              <Avatar sx={{ width: 40, height: 40 }}>
                {params.row.name ? params.row.name.charAt(0) : '?'}
              </Avatar>
            )}
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
      field: 'school',
      headerName: '학교/학년',
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      resizable: true,
      renderCell: (params) => {
        return (
          <Box>
            <Typography variant="body2" noWrap>
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {params.row.grade}학년
            </Typography>
          </Box>
        )
      }
    },
    {
      field: 'class',
      headerName: '반',
      width: 150,
      minWidth: 100,
      maxWidth: 200,
      resizable: true,
      renderCell: (params) => {
        return (
          <Chip label={params.value} size="small" />
        )
      }
    },
    {
      field: 'classFee',
      headerName: '수강료',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      resizable: true,
      renderCell: (params) => {
        return (
          <Typography variant="body2" fontWeight="bold" color="primary" noWrap>
            {params.value ? `${Math.round(params.value).toLocaleString()}원` : '-'}
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
      field: 'parentPhone',
      headerName: '학부모 연락처',
      width: 150,
      minWidth: 130,
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
      field: 'attendanceNumber',
      headerName: '출결번호',
      width: 100,
      minWidth: 80,
      maxWidth: 120,
      resizable: true,
      renderCell: (params) => {
        return (
          <Typography variant="body2" fontWeight="bold" color="primary" noWrap>
            {params.value || '-'}
          </Typography>
        )
      }
    },
    {
      field: 'paymentDueDate',
      headerName: '결제일',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      resizable: true,
      renderCell: (params) => {
        if (!params.value) return <Typography variant="body2" color="text.secondary" noWrap>-</Typography>

        let day
        if (params.value.includes('T')) {
          const date = new Date(params.value)
          day = date.getDate()
        } else if (params.value.includes('-')) {
          day = params.value.split('-')[2]
        } else {
          day = params.value
        }

        return (
          <Typography variant="body2" color="text.secondary" noWrap>
            매월 {day}일
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>데이터를 불러오는 중...</Typography>
          <Typography variant="body2" color="text.secondary">잠시만 기다려주세요</Typography>
        </Box>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>데이터 로드 실패</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
        <Button variant="contained" onClick={refreshData}>
          다시 시도
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          학생 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          학생 추가
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>반 필터</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  label="반 필터"
                >
                  {mockClasses.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Typography variant="body2" color="text.secondary">
                총 {filteredStudents.length}명
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            학생 목록 ({filteredStudents.length}명)
          </Typography>

          <Box sx={{ height: 600, width: '100%', overflow: 'auto' }}>
            <DataGrid
              rows={filteredStudents}
              columns={columns}
              loading={false}
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
                noRowsLabel: '학생 데이터가 없습니다.',
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
        title={editingStudent ? '학생 정보 수정' : '새 학생 추가'}
      >
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
              {formError}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom color="primary">
                  학생 정보
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="이름 *"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      required
                      disabled={!!editingStudent}
                      sx={{
                        '& .MuiInputBase-input.Mui-disabled': {
                          backgroundColor: '#f5f5f5',
                          color: '#666',
                          WebkitTextFillColor: '#666'
                        }
                      }}
                      helperText={editingStudent ? '이름은 수정할 수 없습니다' : ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="학교"
                      value={formData.school}
                      onChange={handleInputChange('school')}
                      placeholder="가온 중학교 3"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="학년"
                      value={formData.grade}
                      onChange={handleInputChange('grade')}
                      placeholder="3"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="학생 연락처"
                      value={formData.phone}
                      onChange={handleInputChange('phone')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="학부모 연락처 *"
                      value={formData.parentPhone}
                      onChange={handleInputChange('parentPhone')}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="출결번호 *"
                      value={formData.attendanceNumber}
                      onChange={handleInputChange('attendanceNumber')}
                      inputProps={{
                        maxLength: 4,
                        pattern: '[0-9]*'
                      }}
                      onInput={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                      }}
                      required
                      disabled={!!editingStudent}
                      sx={{
                        '& .MuiInputBase-input.Mui-disabled': {
                          backgroundColor: '#f5f5f5',
                          color: '#666',
                          WebkitTextFillColor: '#666'
                        }
                      }}
                      helperText={editingStudent ? '출결번호는 수정할 수 없습니다' : '4자리 숫자로 입력해주세요 (출결 인증용)'}
                      placeholder="1234"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="이메일"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>강의 선택 (다중 선택 가능)</InputLabel>
                      <Select
                        multiple
                        value={formData.selectedClasses}
                        onChange={handleInputChange('selectedClasses')}
                        label="강의 선택 (다중 선택 가능)"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => {
                              const cls = mockClasses.find(c => c.id === value)
                              return cls ? (
                                <Chip key={value} label={cls.name} size="small" />
                              ) : null
                            })}
                          </Box>
                        )}
                      >
                        {mockClasses.filter(c => c.id !== '').map((cls) => (
                          <MenuItem key={cls.id} value={cls.id}>
                            <Checkbox checked={formData.selectedClasses.indexOf(cls.id) > -1} />
                            {cls.name} - {Math.round(cls.fee).toLocaleString()}원
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {formData.selectedClasses.length > 0 && formData.classFee > 0 && (
                    <Grid item xs={12}>
                      <Alert severity="info">
                        선택된 강의: <strong>{formData.class}</strong><br/>
                        총 월 수강료: <strong>{Math.round(formData.classFee).toLocaleString()}원</strong>
                        {formData.selectedClasses.length > 1 && (
                          <>
                            <br/>
                            <Typography variant="caption" color="text.secondary">
                              {formData.selectedClasses.length}개 강의 선택됨
                            </Typography>
                          </>
                        )}
                      </Alert>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }}>
                      <Typography variant="h6" color="primary">
                        결제 정보
                      </Typography>
                    </Divider>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="수강료"
                      value={formData.classFee > 0 ? `${Math.round(formData.classFee).toLocaleString()}원` : ''}
                      disabled
                      helperText="선택한 강의에 따라 자동 설정됩니다"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="결제일 *"
                      type="date"
                      value={formData.paymentDueDate}
                      onChange={handleInputChange('paymentDueDate')}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      required
                      helperText="매월 결제해야 할 날짜를 지정해주세요"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.sendPaymentNotification}
                          onChange={handleInputChange('sendPaymentNotification')}
                          color="primary"
                        />
                      }
                      label="결제 안내 문자 발송 (결제 기한일 전에 알림 문자를 발송합니다)"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }}>
                      <Typography variant="h6" color="primary">
                        자동 메시지 설정
                      </Typography>
                    </Divider>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      자동으로 발송할 메시지 유형을 선택해주세요.
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.autoMessages.attendance}
                              onChange={handleAutoMessageChange('attendance')}
                              color="primary"
                            />
                          }
                          label="📚 등하원"
                        />
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.autoMessages.outing}
                              onChange={handleAutoMessageChange('outing')}
                              color="primary"
                            />
                          }
                          label="🚶 외출/복귀"
                        />
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.autoMessages.imagePost}
                              onChange={handleAutoMessageChange('imagePost')}
                              color="primary"
                            />
                          }
                          label="📷 이미지포함"
                        />
                      </Grid>
                    </Grid>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.autoMessages.studyMonitoring}
                              onChange={handleAutoMessageChange('studyMonitoring')}
                              color="primary"
                            />
                          }
                          label="📊 학습관제 대상"
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="생년월일"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleInputChange('birthDate')}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
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
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    학생 사진
                  </Typography>
                  <Box
                    sx={{
                      width: '200px',
                      height: '250px',
                      border: '2px dashed #ccc',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: '#1976d2'
                      }
                    }}
                    onClick={handlePhotoOptionClick}
                  >
                    {formData.profileImage ? (
                      <img
                        src={formData.profileImage}
                        alt="학생 사진"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '6px'
                        }}
                      />
                    ) : (
                      <>
                        <Avatar sx={{ width: 80, height: 80, mb: 2 }}>
                          <Typography variant="h4">📷</Typography>
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          클릭하여 사진을 등록하세요<br/>
                          카메라 촬영 또는<br/>
                          파일에서 선택 가능
                        </Typography>
                      </>
                    )}
                  </Box>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                  <Button
                    variant="outlined"
                    onClick={handlePhotoOptionClick}
                    sx={{ mb: 1 }}
                  >
                    사진 선택
                  </Button>
                  {formData.profileImage && (
                    <Button
                      variant="text"
                      color="error"
                      onClick={() => setFormData(prev => ({ ...prev, profileImage: null }))}
                      sx={{ display: 'block', mx: 'auto' }}
                    >
                      사진 삭제
                    </Button>
                  )}
                </Box>
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
            disabled={editingStudent ? false : (!formData.name || !formData.parentPhone || !formData.attendanceNumber || formData.attendanceNumber.length !== 4 || !formData.paymentDueDate)}
          >
            {editingStudent ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </DraggableDialog>

      <DraggableDialog
        open={photoDialogOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setPhotoDialogOpen(false)
          }
        }}
        disableEscapeKeyDown
        title="사진 선택 방법"
      >
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            학생 사진을 등록할 방법을 선택해주세요.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Typography>📷</Typography>}
              onClick={handleCameraCapture}
              sx={{ p: 2, justifyContent: 'flex-start' }}
            >
              카메라로 촬영하기
            </Button>
            <Button
              variant="outlined"
              startIcon={<Typography>📁</Typography>}
              onClick={handleFileSelect}
              sx={{ p: 2, justifyContent: 'flex-start' }}
            >
              파일에서 선택하기
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoDialogOpen(false)}>취소</Button>
        </DialogActions>
      </DraggableDialog>

      <DraggableDialog
        open={showCamera}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            stopCamera()
          }
        }}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
        title="카메라로 사진 촬영"
      >
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <video
              id="camera-video"
              autoPlay
              playsInline
              muted
              ref={(video) => {
                if (video && cameraStream) {
                  video.srcObject = cameraStream
                }
              }}
              style={{
                width: '100%',
                maxWidth: '500px',
                height: 'auto',
                borderRadius: '8px',
                border: '2px solid #ccc'
              }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={capturePhoto}
                startIcon={<Typography>📸</Typography>}
              >
                사진 촬영
              </Button>
              <Button
                variant="outlined"
                onClick={stopCamera}
              >
                취소
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </DraggableDialog>
    </Box>
  )
}

export default StudentPage
