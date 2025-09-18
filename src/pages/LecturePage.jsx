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
  Chip
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'

const LecturePage = () => {
  const [lectures, setLectures] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLecture, setEditingLecture] = useState(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    teacher: '',
    subject: '',
    schedule: '',
    room: '',
    capacity: '',
    currentStudents: '0',
    description: ''
  })

  // 임시 데이터
  const mockLectures = [
    {
      id: 1,
      name: '중학 수학 A반',
      teacher: '박선생',
      subject: '수학',
      schedule: '월,수,금 19:00-20:30',
      room: '201호',
      capacity: 20,
      currentStudents: 15,
      description: '중학교 1-2학년 대상 기초 수학'
    },
    {
      id: 2,
      name: '고등 영어 B반',
      teacher: '김선생',
      subject: '영어',
      schedule: '화,목 20:00-21:30',
      room: '301호',
      capacity: 15,
      currentStudents: 12,
      description: '고등학교 영어 문법 및 독해'
    }
  ]

  const mockTeachers = ['박선생', '김선생', '이선생']
  const mockSubjects = ['수학', '영어', '과학', '국어', '사회']
  const mockRooms = ['201호', '301호', '401호', '501호']

  useEffect(() => {
    loadLectures()
  }, [])

  const loadLectures = async () => {
    setLoading(true)
    try {
      setTimeout(() => {
        setLectures(mockLectures)
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('강의 데이터 로딩 실패:', error)
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      teacher: '',
      subject: '',
      schedule: '',
      room: '',
      capacity: '',
      currentStudents: '0',
      description: ''
    })
  }

  const handleOpenDialog = (lecture = null) => {
    if (lecture) {
      setEditingLecture(lecture)
      setFormData({
        ...lecture,
        capacity: lecture.capacity.toString(),
        currentStudents: lecture.currentStudents.toString()
      })
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
        currentStudents: parseInt(formData.currentStudents)
      }

      if (editingLecture) {
        console.log('강의 수정:', lectureData)
        setLectures(prev => prev.map(lecture => 
          lecture.id === editingLecture.id 
            ? { ...lectureData, id: editingLecture.id }
            : lecture
        ))
      } else {
        console.log('강의 추가:', lectureData)
        const newLecture = {
          ...lectureData,
          id: Date.now()
        }
        setLectures(prev => [newLecture, ...prev])
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
        setLectures(prev => prev.filter(lecture => lecture.id !== lectureId))
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

      {/* 강의 목록 테이블 */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>강의명</TableCell>
                  <TableCell>담당 강사</TableCell>
                  <TableCell>과목</TableCell>
                  <TableCell>스케줄</TableCell>
                  <TableCell>강의실</TableCell>
                  <TableCell>수강 인원</TableCell>
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
                ) : filteredLectures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      강의 데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLectures.map((lecture) => (
                    <TableRow key={lecture.id}>
                      <TableCell>{lecture.name}</TableCell>
                      <TableCell>{lecture.teacher}</TableCell>
                      <TableCell>
                        <Chip label={lecture.subject} size="small" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ScheduleIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          {lecture.schedule}
                        </Box>
                      </TableCell>
                      <TableCell>{lecture.room}</TableCell>
                      <TableCell>
                        {getCapacityChip(lecture.currentStudents, lecture.capacity)}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(lecture)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(lecture.id)}
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

      {/* 강의 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLecture ? '강의 정보 수정' : '새 강의 추가'}
        </DialogTitle>
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
                <FormControl fullWidth>
                  <InputLabel>강의실</InputLabel>
                  <Select
                    value={formData.room}
                    onChange={handleInputChange('room')}
                    label="강의실"
                  >
                    {mockRooms.map((room) => (
                      <MenuItem key={room} value={room}>
                        {room}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
            disabled={!formData.name || !formData.teacher || !formData.subject || !formData.schedule || !formData.capacity}
          >
            {editingLecture ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LecturePage
