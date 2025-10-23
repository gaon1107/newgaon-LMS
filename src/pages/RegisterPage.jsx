import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Checkbox,
  Alert,
  Grid,
  Link as MuiLink,
  Divider
} from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { authService } from '../services/authService'
import { AuthContext } from '../contexts/AuthContext'
import { formatPhoneNumber, formatBusinessNumber, unformatPhoneNumber, unformatBusinessNumber } from '../utils/formatters'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { login: loginUser } = useContext(AuthContext)
  const [formData, setFormData] = useState({
    academyName: '',
    academyCode: '', // 학원코드 추가
    ownerName: '',
    businessNumber: '',
    phone: '',
    email: '',
    address: '',
    detailAddress: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreePrivacy: false
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)

  const handleInputChange = (field) => (event) => {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value

    // 전화번호 자동 포맷팅
    if (field === 'phone') {
      value = formatPhoneNumber(value)
    }

    // 사업자번호 자동 포맷팅
    if (field === 'businessNumber') {
      value = formatBusinessNumber(value)
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.academyName.trim()) newErrors.academyName = '학원명을 입력해주세요'
    if (!formData.academyCode.trim()) newErrors.academyCode = '학원코드를 입력해주세요'
    if (!formData.ownerName.trim()) newErrors.ownerName = '대표자명을 입력해주세요'
    if (!formData.phone.trim()) newErrors.phone = '연락처를 입력해주세요'
    if (!formData.email.trim()) newErrors.email = '이메일을 입력해주세요'
    if (!formData.address.trim()) newErrors.address = '주소를 입력해주세요'
    if (!formData.username.trim()) newErrors.username = '사용자 ID를 입력해주세요'
    if (!formData.password.trim()) newErrors.password = '비밀번호를 입력해주세요'
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다'
    }
    if (!formData.agreeTerms) newErrors.agreeTerms = '이용약관에 동의해주세요'
    if (!formData.agreePrivacy) newErrors.agreePrivacy = '개인정보처리방침에 동의해주세요'

    // 학원코드 형식 검증
    if (formData.academyCode && !/^[a-zA-Z0-9_]+$/.test(formData.academyCode)) {
      newErrors.academyCode = '학원코드는 영문, 숫자, 언더스코어(_)만 사용 가능합니다'
    }

    // 이메일 형식 검증
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다'
    }

    // 비밀번호 길이 검증
    if (formData.password && formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setApiError(null)

    try {
      // API 요청 데이터 준비
      const registrationData = {
        academyName: formData.academyName,
        academyCode: formData.academyCode,
        businessNumber: formData.businessNumber ? unformatBusinessNumber(formData.businessNumber) : null,
        ownerName: formData.ownerName,
        phone: unformatPhoneNumber(formData.phone),
        email: formData.email,
        address: formData.address + (formData.detailAddress ? ' ' + formData.detailAddress : ''),
        adminUsername: formData.username,
        adminPassword: formData.password,
        adminName: formData.ownerName
      }

      console.log('회원가입 API 호출:', registrationData)

      // 실제 API 호출
      const response = await authService.registerAcademy(registrationData)

      console.log('회원가입 응답:', response)

      if (response.success) {
        // 회원가입 성공 - 토큰 저장 및 자동 로그인
        const { accessToken, refreshToken, user } = response.data

        // 토큰 저장
        authService.setTokens(accessToken, refreshToken)

        // AuthContext에 사용자 정보 설정
        if (loginUser) {
          await loginUser(accessToken, refreshToken, user)
        }

        alert(`회원가입이 완료되었습니다! ${response.message}\n\n자동 로그인되어 메인 페이지로 이동합니다.`)

        // 메인 페이지로 리다이렉트
        navigate('/dashboard')
      } else {
        setApiError(response.error?.message || '회원가입에 실패했습니다.')
      }

    } catch (error) {
      console.error('회원가입 실패:', error)

      // 에러 메시지 추출
      let errorMessage = '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.'

      if (error.response?.data?.error) {
        if (typeof error.response.data.error === 'object') {
          errorMessage = error.response.data.error.message || errorMessage
        } else {
          errorMessage = error.response.data.error
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      setApiError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
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
            회원가입
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          학원관리 LMS 회원가입을 환영합니다.<br />
          가입 즉시 30일 무료 체험으로 서비스를 이용하실 수 있습니다.
        </Alert>

        {apiError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setApiError(null)}>
            {apiError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
            기본 정보
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="학원명 *"
                value={formData.academyName}
                onChange={handleInputChange('academyName')}
                error={!!errors.academyName}
                helperText={errors.academyName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="학원코드 *"
                value={formData.academyCode}
                onChange={handleInputChange('academyCode')}
                error={!!errors.academyCode}
                helperText={errors.academyCode || "영문, 숫자, 언더스코어(_)만 사용 가능"}
                placeholder="예: newgaon1"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="대표자명 *"
                value={formData.ownerName}
                onChange={handleInputChange('ownerName')}
                error={!!errors.ownerName}
                helperText={errors.ownerName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="사업자등록번호"
                value={formData.businessNumber}
                onChange={handleInputChange('businessNumber')}
                error={!!errors.businessNumber}
                helperText={errors.businessNumber}
                placeholder="000-00-00000 (선택)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="연락처 *"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                error={!!errors.phone}
                helperText={errors.phone}
                placeholder="010-0000-0000"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="이메일 주소 *"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="주소 *"
                value={formData.address}
                onChange={handleInputChange('address')}
                error={!!errors.address}
                helperText={errors.address}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="상세주소"
                value={formData.detailAddress}
                onChange={handleInputChange('detailAddress')}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
            계정 정보
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="사용자 ID *"
                value={formData.username}
                onChange={handleInputChange('username')}
                error={!!errors.username}
                helperText={errors.username}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="비밀번호 *"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!errors.password}
                helperText={errors.password}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="비밀번호 확인 *"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" gutterBottom>
            약관 동의
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.agreeTerms}
                  onChange={handleInputChange('agreeTerms')}
                  color="primary"
                />
              }
              label="이용약관에 동의합니다 *"
            />
            {errors.agreeTerms && (
              <Typography variant="caption" color="error" display="block">
                {errors.agreeTerms}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.agreePrivacy}
                  onChange={handleInputChange('agreePrivacy')}
                  color="primary"
                />
              }
              label="개인정보처리방침에 동의합니다 *"
            />
            {errors.agreePrivacy && (
              <Typography variant="caption" color="error" display="block">
                {errors.agreePrivacy}
              </Typography>
            )}
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isSubmitting}
            sx={{ py: 1.5, fontSize: '1.1rem' }}
          >
            {isSubmitting ? '가입 처리 중...' : '회원가입 완료'}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              이미 계정이 있으신가요?{' '}
              <MuiLink component="button" onClick={() => navigate('/')}>
                로그인하기
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default RegisterPage
