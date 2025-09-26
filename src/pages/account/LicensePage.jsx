import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  Paper
} from '@mui/material'
import {
  VerifiedUser as LicenseIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material'

const LicensePage = () => {
  const [licenseInfo, setLicenseInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  // 임시 라이선스 데이터
  const mockLicenseData = {
    productName: '가온 출결 시스템 Pro',
    licenseType: '정식구매',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2025-01-14',
    remainingDays: 89,
    totalDays: 365,
    features: [
      { name: '무제한 학생 관리', enabled: true },
      { name: 'SMS 발송 서비스', enabled: true },
      { name: '출석 통계 분석', enabled: true },
      { name: '결제 관리', enabled: true },
      { name: '데이터 백업', enabled: true },
      { name: '고급 리포트', enabled: false },
      { name: '모바일 앱 연동', enabled: false }
    ],
    usage: {
      students: { current: 85, limit: 200 },
      sms: { current: 1250, limit: 5000 },
      storage: { current: 2.3, limit: 10 }
    },
    history: [
      {
        id: 1,
        action: '라이선스 갱신',
        date: '2024-01-15',
        details: '1년 정식 라이선스 구매',
        status: 'completed'
      },
      {
        id: 2,
        action: '라이선스 활성화',
        date: '2024-01-15',
        details: '초기 라이선스 등록',
        status: 'completed'
      },
      {
        id: 3,
        action: '무료 체험',
        date: '2023-12-15',
        details: '30일 무료 체험 시작',
        status: 'completed'
      }
    ]
  }

  useEffect(() => {
    // 라이선스 정보 로드
    const loadLicenseInfo = async () => {
      setLoading(true)
      try {
        // API 호출 대신 임시 데이터 사용
        await new Promise(resolve => setTimeout(resolve, 1000))
        setLicenseInfo(mockLicenseData)
      } catch (error) {
        console.error('라이선스 정보 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLicenseInfo()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success'
      case 'expired': return 'error'
      case 'warning': return 'warning'
      default: return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return '활성'
      case 'expired': return '만료'
      case 'warning': return '경고'
      default: return '알 수 없음'
    }
  }

  const calculateProgress = (remaining, total) => {
    return ((total - remaining) / total) * 100
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          라이선스 관리
        </Typography>
        <LinearProgress />
      </Box>
    )
  }

  if (!licenseInfo) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          라이선스 관리
        </Typography>
        <Alert severity="error">
          라이선스 정보를 불러올 수 없습니다.
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        <LicenseIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        라이선스 관리
      </Typography>

      <Grid container spacing={3}>
        {/* 라이선스 기본 정보 */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                라이선스 정보
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    제품명
                  </Typography>
                  <Typography variant="h6">
                    {licenseInfo.productName}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    라이선스 유형
                  </Typography>
                  <Typography variant="h6">
                    {licenseInfo.licenseType}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    상태
                  </Typography>
                  <Chip
                    label={getStatusText(licenseInfo.status)}
                    color={getStatusColor(licenseInfo.status)}
                    icon={<CheckIcon />}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    유효 기간
                  </Typography>
                  <Typography variant="body1">
                    {licenseInfo.startDate} ~ {licenseInfo.endDate}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 남은 기간 */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                남은 기간
              </Typography>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" gutterBottom>
                  {licenseInfo.remainingDays}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  일 남음
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={calculateProgress(licenseInfo.remainingDays, licenseInfo.totalDays)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {Math.round(calculateProgress(licenseInfo.remainingDays, licenseInfo.totalDays))}% 사용됨
                  </Typography>
                </Box>

                {licenseInfo.remainingDays <= 30 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      라이선스가 곧 만료됩니다. 갱신을 준비해주세요.
                    </Typography>
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 사용량 현황 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                사용량 현황
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      등록 학생 수
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {licenseInfo.usage.students.current}/{licenseInfo.usage.students.limit}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(licenseInfo.usage.students.current / licenseInfo.usage.students.limit) * 100}
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      SMS 발송량 (월)
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {licenseInfo.usage.sms.current}/{licenseInfo.usage.sms.limit}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(licenseInfo.usage.sms.current / licenseInfo.usage.sms.limit) * 100}
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      저장공간 (GB)
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {licenseInfo.usage.storage.current}/{licenseInfo.usage.storage.limit}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(licenseInfo.usage.storage.current / licenseInfo.usage.storage.limit) * 100}
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 기능 목록 */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                사용 가능한 기능
              </Typography>

              {licenseInfo.features.map((feature, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    borderBottom: index < licenseInfo.features.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="body1">
                    {feature.name}
                  </Typography>
                  <Chip
                    label={feature.enabled ? '사용 가능' : '사용 불가'}
                    color={feature.enabled ? 'success' : 'default'}
                    size="small"
                    icon={feature.enabled ? <CheckIcon /> : <WarningIcon />}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* 라이선스 히스토리 */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                라이선스 히스토리
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>날짜</TableCell>
                      <TableCell>내용</TableCell>
                      <TableCell>상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {licenseInfo.history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.action}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.details}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label="완료"
                            color="success"
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 라이선스 갱신 안내 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              라이선스 갱신 안내
            </Typography>
            <Typography variant="body2" paragraph>
              • 라이선스 만료 30일 전부터 갱신이 가능합니다.
            </Typography>
            <Typography variant="body2" paragraph>
              • 갱신 시 기존 남은 기간은 새로운 기간에 추가됩니다.
            </Typography>
            <Typography variant="body2" paragraph>
              • 라이선스 관련 문의사항은 고객센터로 연락해주세요.
            </Typography>
            <Button variant="contained" color="primary" sx={{ mt: 2 }}>
              라이선스 갱신하기
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default LicensePage