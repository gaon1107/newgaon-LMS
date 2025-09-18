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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material'

const StudentPage = () => {
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    phone: '',
    parentPhone: '',
    email: '',
    class: '',
    birthDate: '',
    address: '',
    notes: ''
  })

  // 임시 데이터
  const mockStudents = [
    {
      id: 1,
      name: '김철수',
      studentId: 'ST001',
      phone: '010-1111-2222',
      parentPhone: '010-9999-8888',
      email: 'parent1@example.com',
      class: '수학 A반',
      birthDate: '2010-03-15',
      address: '서울시 강남구',
      notes: '수학에 관심이 많음'
    },
    {
      id: 2,
      name: '이영희',
      studentId: 'ST002',
      phone: '010-2222-3333',
      parentPhone: '010-8888-7777',
      email: 'parent2@example.com',
      class: '영어 B반',
      birthDate: '2011-07-22',
      address: '서울시 서초구',
      notes: '영어 회화 실력 우수'
    }
  ]

  const mockClasses = [
    { id: '', name: '전체' },
    { id: 'math', name: '수학 A반' },
    { id: 'english', name: '영어 B반' },
    { id: 'science', name: '과학 C반' }
  ]

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    setLoading(true)
    try {
      setTimeout(() => {
        setStudents(mockStudents)
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('학생 데이터 로딩 실패:', error)
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      studentId: '',
      phone: '',
      parentPhone: '',
      email: '',
      class: '',
      birthDate: '',
      address: '',
      notes: ''
    })
  }

  const handleOpenDialog = (student = null) => {
    if (student) {
      setEditingStudent(student)
      setFormData(student)
    } else {
      setEditingStudent(null)
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingStudent(null)
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
      if (editingStudent) {
        console.log('학생 수정:', formData)
        setStudents(prev => prev.map(student => 
          student.id === editingStudent.id 
            ? { ...formData, id: editingStudent.id }
            : student
        ))
      } else {
        console.log('학생 추가:', formData)
        const newStudent = {
          ...formData,
          id: Date.now()
        }
        setStudents(prev => [newStudent, ...prev])
      }
      
      handleCloseDialog()
    } catch (error) {
      console.error('학생 저장 실패:', error)
    }
  }

  const handleDelete = async (studentId) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        console.log('학생 삭제:', studentId)
        setStudents(prev => prev.filter(student => student.id !== studentId))
      } catch (error) {
        console.error('학생 삭제 실패:', error)
      }
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedClass === '' || student.class === mockClasses.find(c => c.id === selectedClass)?.name)
  )

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

      {/* 검색 및 필터 */}
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

      {/* 학생 목록 테이블 */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>프로필</TableCell>
                  <TableCell>이름</TableCell>
                  <TableCell>학번</TableCell>
                  <TableCell>반</TableCell>
                  <TableCell>연락처</TableCell>
                  <TableCell>학부모 연락처</TableCell>
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
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      학생 데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Avatar sx={{ width: 40, height: 40 }}>
                          {student.name.charAt(0)}
                        </Avatar>
                      </TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>
                        <Chip label={student.class} size="small" />
                      </TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>{student.parentPhone}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(student)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(student.id)}
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

      {/* 학생 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStudent ? '학생 정보 수정' : '새 학생 추가'}
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
                  label="학번 *"
                  value={formData.studentId}
                  onChange={handleInputChange('studentId')}
                  required
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
                  label="이메일"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>반 *</InputLabel>
                  <Select
                    value={formData.class}
                    onChange={handleInputChange('class')}
                    label="반 *"
                    required
                  >
                    {mockClasses.filter(c => c.id !== '').map((cls) => (
                      <MenuItem key={cls.id} value={cls.name}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            취소
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || !formData.studentId || !formData.parentPhone}
          >
            {editingStudent ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StudentPage
