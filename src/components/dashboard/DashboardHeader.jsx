import React, { useState, useEffect, useContext, useMemo } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton
} from '@mui/material'
import {
  School as SchoolIcon,
  Sms as SmsIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { useAttendance } from '../../contexts/AttendanceContext'
import { DashboardContext } from '../../contexts/DashboardContext'
import { tenantService } from '../../services/apiService'

const DashboardHeader = ({ user }) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const { students } = useAttendance()
  const [tenantData, setTenantData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { refreshSignal } = useContext(DashboardContext)
  const [lastRefreshSignal, setLastRefreshSignal] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 학원 정보 API 호출
  // refreshSignal이 변경되면 자동으로 갱신
  useEffect(() => {
    // refreshSignal이 실제로 변경되었을 때만 호출
    if (refreshSignal !== lastRefreshSignal) {
      console.log('🔄 [DashboardHeader] 대시보드 데이터 갱신 신호 수신')
      setLastRefreshSignal(refreshSignal)
      fetchTenantData()
    }
  }, [refreshSignal, lastRefreshSignal])

  // 컴포넌트 초기 로드 시 1회만 호출
  useEffect(() => {
    console.log('🎯 [DashboardHeader] 대시보드 초기 로드')
    fetchTenantData()
  }, []) // 빈 배열 = 초기 로드 시만 실행

  const fetchTenantData = async () => {
    try {
      setLoading(true)
      
      const result = await tenantService.getMyTenant()
      
      if (result.success) {
        console.log('✅ [DashboardHeader] 학원 정보 로드 완료:', result.data.academyName)
        setTenantData(result.data)
      } else {
        console.error('❌ [DashboardHeader] API 응답 실패:', result.error)
      }
    } catch (error) {
      console.error('❌ [DashboardHeader] 학원 정보 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 라이선스 남은 날짜 계산 (tenantData 변경 시에만 재계산)
  const licenseRemainDays = useMemo(() => {
    if (!tenantData?.subscriptionEndDate) {
      return 0
    }

    const endDate = new Date(tenantData.subscriptionEndDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const diffTime = endDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }, [tenantData?.subscriptionEndDate])

  // 실제 데이터 계산
  const stats = {
    innerStudents: students.filter(s => s.status === 'present' || s.status === 'late').length,
    totalStudents: students.length,
    smsBalance: tenantData?.smsBalance || 0,
    licenseRemainDays
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
        {/* 사용자 환영 메시지 및 새로고침 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 300 }}>
            안녕하세요, {tenantData?.academyName || user?.name || '관리자'}님
          </Typography>
          <IconButton
            onClick={fetchTenantData}
            sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}
            title="데이터 새로고침"
          >
            <RefreshIcon />
          </IconButton>
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
                    backgroundColor: stats.licenseRemainDays > 30 ? 'rgba(76, 175, 80, 0.8)' : stats.licenseRemainDays > 7 ? 'rgba(255, 152, 0, 0.8)' : 'rgba(244, 67, 54, 0.8)',
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
