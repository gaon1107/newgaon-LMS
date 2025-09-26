import React, { useState } from 'react'
import { useAttendance } from '../../contexts/AttendanceContext'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  IconButton,
  Tooltip,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material'
import {
  Message as MessageIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Groups as GroupsIcon,
  Close as CloseIcon,
  Edit as EditIcon
} from '@mui/icons-material'
import DraggableDialog from '../common/DraggableDialog'
import GroupMessageModal from './GroupMessageModal'

const AttendanceView = () => {
  const { students, updateStudentStatus } = useAttendance()
  const [filter, setFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [comment, setComment] = useState('')
  const [messageModalOpen, setMessageModalOpen] = useState(false)

  // 상태 옵션
  const statusOptions = [
    { value: 'present', label: '등원', description: '정상 등원' },
    { value: 'absent', label: '미등원', description: '등원하지 않음' },
    { value: 'late', label: '지각', description: '늦게 등원' },
    { value: 'early_leave', label: '조퇴', description: '일찍 하원' },
    { value: 'out', label: '외출', description: '외출 중' },
    { value: 'returned', label: '복귀', description: '외출 후 복귀' },
    { value: 'left', label: '하원', description: '정상 하원' }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#4caf50'
      case 'absent': return '#f44336'
      case 'late': return '#ff9800'
      case 'early_leave': return '#9c27b0'
      case 'out': return '#ff5722'
      case 'returned': return '#2196f3'
      case 'left': return '#607d8b'
      default: return '#757575'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircleIcon />
      case 'absent': return <CancelIcon />
      case 'late': return <CheckCircleIcon />
      case 'early_leave': return <CheckCircleIcon />
      default: return <PersonIcon />
    }
  }

  const filteredStudents = students.filter(student => {
    switch (filter) {
      case 'inner': return student.status === 'present'
      case 'outer': return student.status === 'absent' || student.status === 'early_leave'
      case 'today': return student.status !== 'absent'
      case '!today': return student.status === 'absent'
      default: return true
    }
  })

  const handleSendGroupMessage = () => {
    setMessageModalOpen(true)
  }

  const handleSendMessage = (student) => {
    console.log('메시지 전송:', student.name)
  }

  const handleStatusClick = (student) => {
    setSelectedStudent(student)
    setNewStatus(student.status)
    setComment('')
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedStudent(null)
    setNewStatus('')
    setComment('')
  }

  const handleSaveStatus = () => {
    if (!newStatus || !selectedStudent) return

    // Context의 updateStudentStatus 함수 사용
    updateStudentStatus(selectedStudent.id, newStatus, comment)
    handleCloseDialog()
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* 필터 버튼 및 단체 메시지 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(e, value) => value && setFilter(value)}
            size="small"
          >
            <ToggleButton value="all">모든 원생</ToggleButton>
            <ToggleButton value="inner">학원 내</ToggleButton>
            <ToggleButton value="outer">학원 외</ToggleButton>
            <ToggleButton value="today">오늘 등원</ToggleButton>
            <ToggleButton value="!today">오늘 미등원</ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            startIcon={<GroupsIcon />}
            onClick={handleSendGroupMessage}
            sx={{ ml: 2 }}
          >
            단체 메시지
          </Button>
        </Box>

        {/* 학생 카드 그리드 */}
        <Grid container spacing={2}>
          {filteredStudents.map((student) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={student.id}>
              <Card
                variant="outlined"
                sx={{
                  borderColor: getStatusColor(student.status),
                  borderWidth: 2,
                  position: 'relative',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  {/* 상태 헤더 */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip
                      icon={getStatusIcon(student.status)}
                      label={student.statusDescription}
                      size="small"
                      clickable
                      onClick={() => handleStatusClick(student)}
                      sx={{
                        backgroundColor: getStatusColor(student.status),
                        color: 'white',
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8,
                          transform: 'scale(1.02)'
                        }
                      }}
                    />
                    {student.lastUpdate && (
                      <Typography variant="caption" color="text.secondary">
                        {new Date(student.lastUpdate).toLocaleTimeString('ko-KR', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    )}
                  </Box>

                  {/* 학생 정보 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={student.profileImage}
                      sx={{ width: 50, height: 50, mr: 2 }}
                    >
                      {student.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {student.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({student.identifier})
                      </Typography>
                    </Box>
                    <Tooltip title="메시지 보내기">
                      <IconButton
                        size="small"
                        onClick={() => handleSendMessage(student)}
                        sx={{ color: getStatusColor(student.status) }}
                      >
                        <MessageIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredStudents.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              해당 조건에 맞는 학생이 없습니다.
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* 상태 변경 다이얼로그 */}
      <DraggableDialog
        open={dialogOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            handleCloseDialog()
          }
        }}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              학생 상태 변경
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        }
      >
        <DialogContent>
          {selectedStudent && (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>{selectedStudent.name}</strong>님의 출석 상태를 변경합니다.
                </Typography>
              </Alert>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>출석 상태</InputLabel>
                <Select
                  value={newStatus}
                  label="출석 상태"
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: getStatusColor(option.value),
                            mr: 1
                          }}
                        />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {option.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="참고사항 (선택)"
                placeholder="상태 변경 사유나 특이사항을 입력하세요"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                multiline
                rows={3}
                variant="outlined"
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            취소
          </Button>
          <Button
            onClick={handleSaveStatus}
            variant="contained"
            disabled={!newStatus}
          >
            변경 확인
          </Button>
        </DialogActions>
      </DraggableDialog>

      {/* 단체메세지 모달 */}
      <GroupMessageModal
        open={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
      />
    </Card>
  )
}

export default AttendanceView