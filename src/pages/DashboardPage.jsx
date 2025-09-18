import React from 'react'
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent 
} from '@mui/material'
import { 
  People as PeopleIcon,
  School as SchoolIcon,
  EventAvailable as AttendanceIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material'

const DashboardPage = () => {
  // 임시 데이터
  const stats = [
    { title: '전체 학생', value: '245', icon: <PeopleIcon />, color: '#1976d2' },
    { title: '오늘 출석', value: '198', icon: <AttendanceIcon />, color: '#2e7d32' },
    { title: '진행 중인 수업', value: '12', icon: <SchoolIcon />, color: '#ed6c02' },
    { title: '출석률', value: '94%', icon: <TrendingUpIcon />, color: '#9c27b0' }
  ]

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        대시보드
      </Typography>
      
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Box 
                    sx={{ 
                      mr: 2, 
                      p: 1, 
                      borderRadius: 1, 
                      bgcolor: `${stat.color}20`,
                      color: stat.color 
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            최근 활동
          </Typography>
          <Typography variant="body2" color="text.secondary">
            출결 관리 기능들이 완전히 구현되어 있습니다.
            메뉴에서 각 기능을 확인해보세요!
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}

export default DashboardPage
