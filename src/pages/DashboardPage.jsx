import React, { useContext } from 'react'
import {
  Box,
  Grid,
  Container
} from '@mui/material'
import { AuthContext } from '../contexts/AuthContext'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import AttendanceView from '../components/dashboard/AttendanceView'
import RecentHistory from '../components/dashboard/RecentHistory'

const DashboardPage = () => {
  const { user } = useContext(AuthContext)

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 대시보드 헤더 */}
      <DashboardHeader user={user} />

      {/* 메인 콘텐츠 그리드 */}
      <Grid container spacing={3}>
        {/* 출석 현황 뷰 - 2/3 너비 */}
        <Grid item xs={12} lg={8}>
          <AttendanceView />
        </Grid>

        {/* 최근 출결 내역 - 1/3 너비 */}
        <Grid item xs={12} lg={4}>
          <RecentHistory />
        </Grid>
      </Grid>
    </Container>
  )
}

export default DashboardPage
