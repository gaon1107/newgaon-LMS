import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Chip
} from '@mui/material'
import {
  School as SchoolIcon,
  Sms as SmsIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material'

const DashboardHeader = ({ user }) => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 임시 데이터
  const stats = {
    innerStudents: 85,
    totalStudents: 120,
    smsBalance: 15420,
    licenseRemainDays: 45
  }

  const formatTime = (date) => {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        mb: 3
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {/* 사용자 환영 메시지 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 300 }}>
            안녕하세요, {user?.name || '관리자'}님
          </Typography>
        </Box>

        {/* 통계 정보 */}
        <Grid container spacing={3} alignItems="center">
          {/* 학생 통계 */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  p: 2,
                  width: '100%'
                }}
              >
                <SchoolIcon sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6">학생</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.innerStudents}/{stats.totalStudents}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    등원/총원생
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* SMS 잔액 */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  p: 2,
                  width: '100%'
                }}
              >
                <SmsIcon sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6">SMS 잔액</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.smsBalance.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    건
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* 라이선스 잔여일 & 시간 */}
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'right' }}>
              {/* 라이선스 잔여일 */}
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={`라이선스 ${stats.licenseRemainDays}일 남음`}
                  sx={{
                    backgroundColor: stats.licenseRemainDays > 30 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255, 152, 0, 0.8)',
                    color: 'white',
                    mb: 1
                  }}
                />
              </Box>

              {/* 현재 시간 */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <TimeIcon sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body1">
                    {formatTime(currentTime)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default DashboardHeader