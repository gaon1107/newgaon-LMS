import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Link as MuiLink,
  Stepper,
  Step,
  StepLabel
} from '@mui/material'
import { ArrowBack as ArrowBackIcon, Email as EmailIcon } from '@mui/icons-material'

const PasswordResetPage = () => {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const steps = ['이메일 입력', '인증 코드', '새 비밀번호']

  const handleEmailSubmit = async (event) => {
    event.preventDefault()
    
    if (!email.trim()) {
      setError('이메일을 입력해주세요')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('올바른 이메일 형식이 아닙니다')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // 실제 API 호출
      console.log('비밀번호 재설정 요청:', email)
      
      // 임시: 성공 처리
      setTimeout(() => {
        setActiveStep(1)
        setIsSubmitting(false)
      }, 1000)
      
    } catch (error) {
      console.error('이메일 전송 실패:', error)
      setError('이메일 전송에 실패했습니다. 다시 시도해주세요.')
      setIsSubmitting(false)
    }
  }

  const handleVerificationSubmit = async (event) => {
    event.preventDefault()
    
    if (!verificationCode.trim()) {
      setError('인증 코드를 입력해주세요')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // 실제 API 호출
      console.log('인증 코드 확인:', verificationCode)
      
      // 임시: 성공 처리
      setTimeout(() => {
        setActiveStep(2)
        setIsSubmitting(false)
      }, 1000)
      
    } catch (error) {
      console.error('인증 코드 확인 실패:', error)
      setError('잘못된 인증 코드입니다.')
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    
    if (!newPassword.trim()) {
      setError('새 비밀번호를 입력해주세요')
      return
    }

    if (newPassword.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // 실제 API 호출
      console.log('새 비밀번호 설정:', newPassword)
      
      // 임시: 성공 처리
      setTimeout(() => {
        alert('비밀번호가 성공적으로 변경되었습니다!')
        navigate('/')
        setIsSubmitting(false)
      }, 1000)
      
    } catch (error) {
      console.error('비밀번호 변경 실패:', error)
      setError('비밀번호 변경에 실패했습니다.')
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            홈으로
          </Button>
          <Typography variant="h4" component="h1">
            비밀번호 재설정
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 1단계: 이메일 입력 */}
        {activeStep === 0 && (
          <Box component="form" onSubmit={handleEmailSubmit}>
            <Alert severity="info" sx={{ mb: 3 }}>
              가입 시 사용한 이메일 주소를 입력하세요.<br />
              임시 비밀번호가 발송됩니다.
            </Alert>
            
            <TextField
              fullWidth
              type="email"
              label="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{ py: 1.5 }}
            >
              {isSubmitting ? '전송 중...' : '인증 코드 받기'}
            </Button>
          </Box>
        )}

        {/* 2단계: 인증 코드 입력 */}
        {activeStep === 1 && (
          <Box component="form" onSubmit={handleVerificationSubmit}>
            <Alert severity="success" sx={{ mb: 3 }}>
              {email}로 인증 코드를 발송했습니다.<br />
              이메일을 확인하고 인증 코드를 입력해주세요.
            </Alert>
            
            <TextField
              fullWidth
              label="인증 코드"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              sx={{ mb: 3 }}
              placeholder="6자리 숫자"
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{ py: 1.5, mb: 2 }}
            >
              {isSubmitting ? '확인 중...' : '인증 코드 확인'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => setActiveStep(0)}
            >
              다른 이메일 사용
            </Button>
          </Box>
        )}

        {/* 3단계: 새 비밀번호 설정 */}
        {activeStep === 2 && (
          <Box component="form" onSubmit={handlePasswordSubmit}>
            <Alert severity="info" sx={{ mb: 3 }}>
              새로운 비밀번호를 설정해주세요.
            </Alert>
            
            <TextField
              fullWidth
              type="password"
              label="새 비밀번호"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{ mb: 2 }}
              helperText="6자 이상 입력해주세요"
            />
            
            <TextField
              fullWidth
              type="password"
              label="새 비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{ py: 1.5 }}
            >
              {isSubmitting ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </Box>
        )}

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2">
            로그인 페이지로 돌아가기{' '}
            <MuiLink component="button" onClick={() => navigate('/')}>
              로그인
            </MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default PasswordResetPage
