import React, { useState } from 'react'
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
  Tooltip
} from '@mui/material'
import {
  Message as MessageIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Groups as GroupsIcon
} from '@mui/icons-material'

const AttendanceView = () => {
  const [filter, setFilter] = useState('all')

  // 임시 학생 데이터
  const students = [
    {
      id: 1,
      name: '김철수',
      identifier: 'STU001',
      status: 'present',
      statusDescription: '등원',
      lastUpdate: '2024-01-15 09:15',
      profileImage: '/api/placeholder/60/60'
    },
    {
      id: 2,
      name: '이영희',
      identifier: 'STU002',
      status: 'absent',
      statusDescription: '미등원',
      lastUpdate: null,
      profileImage: '/api/placeholder/60/60'
    },
    {
      id: 3,
      name: '박민수',
      identifier: 'STU003',
      status: 'present',
      statusDescription: '등원',
      lastUpdate: '2024-01-15 08:45',
      profileImage: '/api/placeholder/60/60'
    },
    {
      id: 4,
      name: '최지은',
      identifier: 'STU004',
      status: 'early_leave',
      statusDescription: '조퇴',
      lastUpdate: '2024-01-15 14:30',
      profileImage: '/api/placeholder/60/60'
    },
    {
      id: 5,
      name: '정현우',
      identifier: 'STU005',
      status: 'present',
      statusDescription: '등원',
      lastUpdate: '2024-01-15 09:00',
      profileImage: '/api/placeholder/60/60'
    },
    {
      id: 6,
      name: '한미래',
      identifier: 'STU006',
      status: 'late',
      statusDescription: '지각',
      lastUpdate: '2024-01-15 10:15',
      profileImage: '/api/placeholder/60/60'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#4caf50'
      case 'absent': return '#f44336'
      case 'late': return '#ff9800'
      case 'early_leave': return '#9c27b0'
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
    console.log('단체 메시지 전송')
  }

  const handleSendMessage = (student) => {
    console.log('메시지 전송:', student.name)
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
                      sx={{
                        backgroundColor: getStatusColor(student.status),
                        color: 'white'
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
    </Card>
  )
}

export default AttendanceView