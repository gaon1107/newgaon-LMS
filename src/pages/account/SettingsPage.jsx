import React, { useState, useContext } from 'react'
import { AuthContext } from '../../contexts/AuthContext'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Paper,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material'
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Refresh as RefreshIcon,
  Launch as LaunchIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import DraggableDialog from '../../components/common/DraggableDialog'

const SettingsPage = () => {
  const { user } = useContext(AuthContext)
  const [passwordDialog, setPasswordDialog] = useState(false)

  const [settings, setSettings] = useState({
    // 학원 기본 설정
    username: user?.username || 'admin',
    name: '가온 학원',
    address: '서울시 강남구 테헤란로 123',
    email: 'admin@gaon.co.kr',
    phone: '010-1234-5678',

    // 학습 관제 서비스 설정
    homeKey: 'GAON-2024-HOME-KEY-12345',

    // 문자 서비스 설정
    smsPhone: '010-1234-5678'
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [loading, setLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const handleSettingChange = (field) => (event) => {
    setSettings(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handlePasswordChange = (field) => (event) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // API 호출 로직
      console.log('설정 저장:', settings)

      // 임시 지연
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSaveMessage('설정이 성공적으로 저장되었습니다.')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('설정 저장 실패:', error)
      setSaveMessage('설정 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.')
      return
    }

    if (passwordData.newPassword.length < 8) {
      alert('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    try {
      // API 호출 로직
      console.log('비밀번호 변경')

      // 임시 지연
      await new Promise(resolve => setTimeout(resolve, 1000))

      alert('비밀번호가 성공적으로 변경되었습니다.')
      setPasswordDialog(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('비밀번호 변경 실패:', error)
      alert('비밀번호 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSmsCharge = () => {
    // 문자 서비스 충전 링크 열기
    window.open('https://www.ione24.com/charge', '_blank')
  }

  const handleSmsAuth = () => {
    // 발신번호 인증 링크 열기
    window.open('https://www.ione24.com/auth', '_blank')
  }

  const handleProductChange = () => {
    // 상품 변경 기능
    alert('상품 변경 기능은 고객센터로 문의해주세요.')
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        설정 관리
      </Typography>

      {saveMessage && (
        <Alert
          severity={saveMessage.includes('실패') ? 'error' : 'success'}
          sx={{ mb: 3 }}
          onClose={() => setSaveMessage('')}
        >
          {saveMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 학원 기본 설정 */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                학원 기본 설정
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="아이디 *"
                    value={settings.username}
                    disabled
                    helperText="아이디는 변경할 수 없습니다"
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="학원명 *"
                    value={settings.name}
                    onChange={handleSettingChange('name')}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="주소 *"
                    value={settings.address}
                    onChange={handleSettingChange('address')}
                    required
                    helperText="대략적인 주소를 입력해 주세요."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="이메일 *"
                    type="email"
                    value={settings.email}
                    onChange={handleSettingChange('email')}
                    required
                    helperText="비밀번호 분실 시 등에 이용됩니다."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="전화번호 *"
                    value={settings.phone}
                    onChange={handleSettingChange('phone')}
                    required
                    helperText="시스템에서 발송되는 문자 메시지를 수신할 번호입니다. 비밀번호 분실 시 등에 이용됩니다."
                    inputProps={{
                      pattern: '^\\d{3}-\\d{3,4}-\\d{4}$'
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 학습 관제 서비스 설정 */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                학습 관제 서비스 설정
              </Typography>

              <TextField
                fullWidth
                label="가정용 앱 키"
                value={settings.homeKey}
                disabled
                helperText="원생 가정에서 학습 관제를 사용 시 프로그램 설치에 필요한 키 입니다."
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 문자 서비스 설정 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                📱 문자 서비스 설정
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                문자 서비스 이용을 위해 아래 3단계를 순서대로 진행해주세요.
              </Typography>

              <Grid container spacing={2}>
                {/* Step 1 */}
                <Grid item xs={12} md={4}>
                  <Card
                    sx={{
                      border: '1px solid',
                      borderColor: 'primary.main',
                      position: 'relative',
                      mt: 2,
                      height: 240,
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        boxShadow: 3
                      }
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 12,
                        bgcolor: 'primary.main',
                        color: 'white',
                        px: 1.5,
                        py: 0.2,
                        borderRadius: 1,
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}
                    >
                      STEP 1
                    </Box>
                    <CardContent sx={{ 
                      pt: 4, 
                      pb: 3, 
                      px: 3, 
                      flexGrow: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1.5
                          }}
                        >
                          <Typography variant="h6" color="white" sx={{ fontWeight: 'bold' }}>
                            1
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          서비스 충전하기
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 3,
                          fontSize: '0.9rem',
                          lineHeight: 1.5
                        }}
                      >
                        문자 발송을 위한 서비스 비용을 충전합니다.
                      </Typography>

                      <Button
                        variant="contained"
                        startIcon={<LaunchIcon />}
                        onClick={handleSmsCharge}
                        fullWidth
                        size="large"
                        sx={{ fontSize: '0.9rem', py: 1.2 }}
                      >
                        문자 서비스 충전
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Step 2 */}
                <Grid item xs={12} md={4}>
                  <Card
                    sx={{
                      border: '1px solid',
                      borderColor: 'warning.main',
                      position: 'relative',
                      mt: 2,
                      height: 240,
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        boxShadow: 3
                      }
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 12,
                        bgcolor: 'warning.main',
                        color: 'white',
                        px: 1.5,
                        py: 0.2,
                        borderRadius: 1,
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}
                    >
                      STEP 2
                    </Box>
                    <CardContent sx={{ 
                      pt: 4, 
                      pb: 3, 
                      px: 3, 
                      flexGrow: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            bgcolor: 'warning.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1.5
                          }}
                        >
                          <Typography variant="h6" color="white" sx={{ fontWeight: 'bold' }}>
                            2
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          발신번호 인증하기
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 3,
                          fontSize: '0.9rem',
                          lineHeight: 1.5
                        }}
                      >
                        문자 발송에 사용할 전화번호를 인증합니다.
                      </Typography>

                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<LaunchIcon />}
                        onClick={handleSmsAuth}
                        fullWidth
                        size="large"
                        sx={{ fontSize: '0.9rem', py: 1.2 }}
                      >
                        발신 번호 인증
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Step 3 */}
                <Grid item xs={12} md={4}>
                  <Card
                    sx={{
                      border: '1px solid',
                      borderColor: 'success.main',
                      position: 'relative',
                      mt: 2,
                      height: 240,
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        boxShadow: 3
                      }
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 12,
                        bgcolor: 'success.main',
                        color: 'white',
                        px: 1.5,
                        py: 0.2,
                        borderRadius: 1,
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}
                    >
                      STEP 3
                    </Box>
                    <CardContent sx={{ 
                      pt: 4, 
                      pb: 3, 
                      px: 3, 
                      flexGrow: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1.5
                          }}
                        >
                          <Typography variant="h6" color="white" sx={{ fontWeight: 'bold' }}>
                            3
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          발신번호 입력하기
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 3,
                          fontSize: '0.9rem',
                          lineHeight: 1.5
                        }}
                      >
                        인증받은 전화번호를 입력하세요.
                      </Typography>

                      <TextField
                        fullWidth
                        label="발신 전화번호"
                        value={settings.smsPhone}
                        onChange={handleSettingChange('smsPhone')}
                        placeholder="010-1234-5678"
                        size="medium"
                        inputProps={{
                          pattern: '^\\d{3}-\\d{3,4}-\\d{4}$'
                        }}
                        sx={{
                          '& .MuiInputLabel-root': {
                            fontSize: '0.9rem'
                          },
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.9rem',
                            '&.Mui-focused fieldset': {
                              borderColor: 'success.main'
                            }
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* SMS 연동 안내 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              📱 SMS 연동 안내
            </Typography>
            <Box component="ol" sx={{ pl: 2 }}>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  가온 출결 시스템의 문자 서비스는{' '}
                  <a href="http://www.ione24.com/" target="_blank" rel="noopener noreferrer">
                    아이원
                  </a>
                  {' '}에서 제공하고 있습니다.
                </Typography>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  왼편 화면의 [Step 1] &gt; [Step 2] &gt; [Step 3] 의 순서대로 문자 서비스 설정을 진행하여 주세요.
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body2">
                  [Step 2] 에서 SMS 발신 번호로 등록(인증)하신 번호는 [Step 3] 의 [발신 전화번호] 란에 입력해 주시기 바랍니다.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* 액션 버튼들 */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleProductChange}
            >
              상품 변경
            </Button>
            <Button
              variant="outlined"
              startIcon={<LockIcon />}
              onClick={() => setPasswordDialog(true)}
            >
              비밀번호 변경
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? '저장 중...' : '설정 저장'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* 비밀번호 변경 다이얼로그 */}
      <DraggableDialog
        open={passwordDialog}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setPasswordDialog(false)
          }
        }}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
        title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              <LockIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              비밀번호 변경
            </Typography>
            <IconButton onClick={() => setPasswordDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        }
      >
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="현재 비밀번호"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange('currentPassword')}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="새 비밀번호"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange('newPassword')}
                helperText="8자 이상의 비밀번호를 입력하세요"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="새 비밀번호 확인"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange('confirmPassword')}
                error={passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword}
                helperText={
                  passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                    ? '비밀번호가 일치하지 않습니다'
                    : ''
                }
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handlePasswordSave}
            disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
          >
            {loading ? '변경 중...' : '변경'}
          </Button>
        </DialogActions>
      </DraggableDialog>
    </Box>
  )
}

export default SettingsPage