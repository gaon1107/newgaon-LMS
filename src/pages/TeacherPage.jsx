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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Avatar
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material'

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

      {/* 강사 목록 테이블 */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>프로필</TableCell>
                  <TableCell>이름</TableCell>
                  <TableCell>담당 과목</TableCell>
                  <TableCell>경력</TableCell>
                  <TableCell>연락처</TableCell>
                  <TableCell>이메일</TableCell>
                  <TableCell>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      데이터를 불러오는 중...
                    </TableCell>
                  </TableRow>
                ) : filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      강사 데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <Avatar sx={{ width: 40, height: 40 }}>
                          {teacher.name.charAt(0)}
                        </Avatar>
                      </TableCell>
                      <TableCell>{teacher.name}</TableCell>
                      <TableCell>
                        {teacher.subjects.split(',').map((subject, index) => (
                          <Chip 
                            key={index} 
                            label={subject.trim()} 
                            size="small" 
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </TableCell>
                      <TableCell>{teacher.experience}</TableCell>
                      <TableCell>{teacher.phone}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(teacher)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(teacher.id)}
                        >
                          <DeleteIcon />
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

      {/* 강사 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTeacher ? '강사 정보 수정' : '새 강사 추가'}
        </DialogTitle>
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
            disabled={!formData.name || !formData.phone || !formData.subjects}
          >
            {editingTeacher ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TeacherPage
