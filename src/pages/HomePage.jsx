import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  DialogContent,
  TextField,
  FormControlLabel,
  Checkbox,
  Link as MuiLink,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  CardContent,
  Card,
  DialogActions
} from '@mui/material'
import { Login as LoginIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material'
import { AuthContext } from '../contexts/AuthContext'
import { useAnnouncements } from '../contexts/AnnouncementContext'
import DraggableDialog from '../components/common/DraggableDialog'

const HomePage = () => {
  const navigate = useNavigate()
  const { login, isLoading } = useContext(AuthContext)
  const { getPublishedAnnouncements, incrementViews } = useAnnouncements()

  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false)
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false)
  const [termsDialogOpen, setTermsDialogOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loginError, setLoginError] = useState('')

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    rememberMe: false
  })

  const handleLoginSubmit = async () => {
    if (!loginData.username || !loginData.password) {
      setLoginError('아이디와 비밀번호를 입력해주세요.')
      return
    }

    setLoginError('')

    const result = await login({
      username: loginData.username,
      password: loginData.password
    })

    if (result.success) {
      setLoginDialogOpen(false)
      navigate('/dashboard')
    } else {
      // 에러 메시지 설정
      setLoginError(result.message || '로그인에 실패했습니다.')

      // 중요한 에러는 alert도 표시
      if (result.errorCode === 'ACCOUNT_DISABLED') {
        alert('탈퇴했거나 비활성화된 계정입니다. 관리자에게 문의하세요.')
      } else if (result.errorCode === 'INVALID_CREDENTIALS') {
        alert('가입 이력이 없는 계정입니다. 회원가입을 먼저 진행해주세요.')
      }
    }
  }

  const handleAnnouncementClick = () => {
    setAnnouncementDialogOpen(true)
  }

  const handleAnnouncementItemClick = (announcement) => {
    setSelectedAnnouncement(announcement)
    incrementViews(announcement.id)
  }

  const handleAnnouncementDialogClose = () => {
    setAnnouncementDialogOpen(false)
    setSelectedAnnouncement(null)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCategoryText = (category) => {
    switch (category) {
      case 'maintenance': return '점검'
      case 'update': return '업데이트'
      case 'guide': return '가이드'
      case 'billing': return '요금'
      case 'general': return '일반'
      default: return '기타'
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'maintenance': return 'error'
      case 'update': return 'info'
      case 'guide': return 'success'
      case 'billing': return 'warning'
      case 'general': return 'default'
      default: return 'default'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4444'
      case 'medium': return '#ff8800'
      case 'normal': return '#666'
      default: return '#666'
    }
  }

  // 슬라이더 자동 전환
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => prev === 0 ? 1 : 0)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Box>
      {/* 헤더 */}
      <AppBar 
        position="fixed" 
        sx={{ 
          backgroundColor: 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          height: 64
        }}
      >
        <Toolbar sx={{ height: 64 }}>
          <Box className="HeaderLogo" sx={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/resources/images/logo_web.png" 
              alt="Gaon" 
              style={{ height: 40 }}
              onError={(e) => {
                // 이미지 로딩 실패 시 텍스트로 대체
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'block'
              }}
            />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                color: '#333', 
                fontWeight: 'bold',
                display: 'none' // 이미지가 로딩되면 숨김
              }}
            >
              GFKids
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box className="HeaderMenu" sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              color="inherit"
              sx={{ color: '#333', fontWeight: 'bold', mx: 1 }}
              onClick={() => setContactDialogOpen(true)}
            >
              <i className="fas fa-question" style={{ marginRight: 8 }}></i>
              고객문의
            </Button>
            <Button
              color="inherit"
              sx={{ color: '#333', fontWeight: 'bold', mx: 1 }}
              onClick={handleAnnouncementClick}
            >
              <i className="fas fa-bell" style={{ marginRight: 8 }}></i>
              공지사항
            </Button>
            <Button
              color="inherit"
              sx={{ color: '#09f', fontWeight: 'bold', mx: 1 }}
              onClick={() => setRegisterDialogOpen(true)}
            >
              <PersonAddIcon sx={{ mr: 1 }} />
              회원가입
            </Button>
            <Button
              color="inherit"
              sx={{ color: '#333', fontWeight: 'bold', mx: 1 }}
              onClick={() => setLoginDialogOpen(true)}
            >
              <LoginIcon sx={{ mr: 1 }} />
              로그인
            </Button>
            <Button
              color="inherit"
              sx={{ color: '#4CAF50', fontWeight: 'bold', mx: 1 }}
              onClick={() => alert('원격지원 서비스 준비 중입니다.')}
            >
              <i className="fas fa-desktop" style={{ marginRight: 8 }}></i>
              원격지원
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 메인 비주얼 섹션 */}
      <Box
        className="VisualSet"
        sx={{
          position: 'relative',
          height: '530px',
          overflow: 'hidden'
        }}
      >
        {/* 배경 슬라이더 */}
        <Box
          className="slider"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1
          }}
        >
          <Box
            className="BGVisual"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: 'url(/resources/images/main01.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: currentSlide === 0 ? 1 : 0,
              transition: 'opacity 1s ease-in-out'
            }}
          >
            <Box
              className="Main01OBJ"
              sx={{
                position: 'absolute',
                right: '10%',
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            >
              <img
                src="/resources/images/main01obj.png"
                alt=""
                style={{ maxHeight: '400px' }}
              />
            </Box>
          </Box>
          <Box
            className="BGVisual"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: 'url(/resources/images/main02.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: currentSlide === 1 ? 1 : 0,
              transition: 'opacity 1s ease-in-out'
            }}
          />
        </Box>

        {/* 콘텐츠 오버레이 */}
        <Box
          className="Cover"
          sx={{
            position: 'relative',
            zIndex: 2,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.3)'
          }}
        >
          <Container maxWidth="lg">
            <Box className="ContentSet" sx={{ color: 'white', ml: { xs: 2, md: 8 } }}>
              <Typography
                className="Text01"
                sx={{ fontSize: { xs: '18px', md: '24px' }, fontWeight: 200, mb: 3 }}
              >
                딱 한번 간편한 출결체크!
              </Typography>
              <Typography
                className="Text02"
                sx={{ fontSize: { xs: '28px', md: '36px' }, fontWeight: 200, mb: 3 }}
              >
                <Box component="span" sx={{ fontWeight: 'bold' }}>얼굴인식</Box>
                출결관리 시스템
              </Typography>
              <Typography
                className="Text03"
                sx={{
                  fontSize: { xs: '12px', md: '14px' },
                  fontWeight: 200,
                  lineHeight: '20px',
                  mb: 4,
                  maxWidth: '600px'
                }}
              >
                <Box component="span" sx={{ fontWeight: 'bold' }}>가온출결시스템</Box>
                은 얼굴인식 프로그램을 이용한<br />
                간단하고 편리한 <Box component="span" sx={{ fontWeight: 'bold' }}>스마트 출결관리 시스템</Box>입니다.<br />
                키패드 입력도 지원하여 편리하게 이용할 수 있습니다.
              </Typography>
              <Box className="ButtonSet" sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: '#0099ff',
                    '&:hover': { backgroundColor: '#0077cc' },
                    px: 3, py: 1.5,
                    borderRadius: '8px'
                  }}
                  onClick={() => setRegisterDialogOpen(true)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <img
                      src="/resources/images/ico_logo.png"
                      alt=""
                      style={{ width: 20, height: 20, marginRight: 8 }}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    회원 가입하기
                  </Box>
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: '#0dd67e',
                    '&:hover': { backgroundColor: '#0bb866' },
                    px: 3, py: 1.5,
                    borderRadius: '8px'
                  }}
                  onClick={() => window.open('https://play.google.com/store/apps/details?id=com.newgaon.gfkids', '_blank')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <img
                      src="/resources/images/ico_download.png"
                      alt=""
                      style={{ width: 20, height: 20, marginRight: 8 }}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    앱 다운로드
                  </Box>
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* 앵커 */}
        <Box id="serviceInfo" sx={{ position: 'absolute', top: 0 }} />
      </Box>

      {/* 서비스 소개 섹션들 */}
      <Box className="ContentsFrame" sx={{ py: 0 }}>
        {/* 각 특징 섹션들 */}
        {[
          {
            title: "얼굴인식 출결관리 시스템",
            subtitle: "얼굴인식으로 스마트 하게~",
            description: "- 얼굴인식 프로그램을 사용하여 간편하게 이용할 수 있습니다.\n- 얼굴인식모드와 키패드모드를 지원합니다.",
            number: "1",
            image: "/resources/images/mbc01.png",
            reverse: false
          },
          {
            title: "비밀번호로 출결관리!",
            subtitle: "얼굴인식이 안될 땐, 키패드를 쓰세요!",
            description: "- 얼굴인식이 안되는 환경일 경우 , 키패드모드를 이용하여\n  비밀번호로 출결관리가 가능합니다.",
            number: "2",
            image: "/resources/images/mbc02.png",
            reverse: true
          },
          {
            title: "장비걱정은 NO! 알뜰하게 사용",
            subtitle: "공기계 사용으로 비용 다이어트!",
            description: "- 사용하지 않는 스마트폰이나 테블릿을 활용하여\n신규장비를 구입할 필요가 없습니다.",
            number: "3",
            image: "/resources/images/mbc03.png",
            reverse: false
          },
          {
            title: "문자메세지도 다이어트!",
            subtitle: "은근 비용부담이 있는 문자메세지도 최저가로!",
            description: "- 단문메세지 12원 / 건\n- 장문메세지 32원 / 건\n- 포토메세지 70원 / 건",
            number: "4",
            image: "/resources/images/mbc04.png",
            reverse: true
          },
          {
            title: "원생숫자는 무제한으로!",
            subtitle: "원생은 많으면 많을 수록 좋습니다!",
            description: "- 타 서비스들과는 달리 가온출결서비스는 원생수 제한이 없습니다.\n마음껏 사용하세요",
            number: "5",
            image: "/resources/images/mbc05.png",
            reverse: false
          },
          {
            title: "등/하원 모습이 부모님에게로",
            subtitle: "포토 문자 발송",
            description: "- 등/하원 시 모습이 부모님에게로 실시간 전송됩니다.\n- 원생 별로 별도 설정이 가능합니다.",
            number: "6",
            image: "/resources/images/mbc07.png",
            reverse: true
          }
        ].map((item, index) => (
          <Box
            key={index}
            className="MainBannerSection"
            sx={{
              height: '270px',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* 배경 이미지 */}
            <Box
              className={item.reverse ? "LBGFrame" : "RBGFrame"}
              sx={{
                position: 'absolute',
                top: 0,
                [item.reverse ? 'left' : 'right']: 0,
                width: '50%',
                height: '100%',
                backgroundImage: `url(${item.image})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                zIndex: 1
              }}
            />

            {/* 콘텐츠 */}
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
              <Box
                className={item.reverse ? "RContents" : "LContents"}
                sx={{
                  width: '50%',
                  [item.reverse ? 'marginLeft' : 'marginRight']: 'auto',
                  p: 4
                }}
              >
                <Box
                  className="Numbering"
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: '#0099ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    mb: 2
                  }}
                >
                  {item.number}
                </Box>
                <Typography
                  className="h01"
                  variant="h5"
                  sx={{ fontWeight: 'bold', mb: 1 }}
                >
                  {item.title.split('').map((char, i) =>
                    ['얼굴인식', '비밀번호', 'NO!', '무제한', '등/하원 모습'].some(word => item.title.includes(word) && item.title.indexOf(word) <= i && i < item.title.indexOf(word) + word.length) ?
                    <Box key={i} component="span" sx={{ fontWeight: 'bold', color: '#0099ff' }}>{char}</Box> : char
                  )}
                </Typography>
                <Typography
                  className="h02"
                  variant="h6"
                  sx={{ color: '#666', mb: 2 }}
                >
                  {item.subtitle}
                </Typography>
                <Typography
                  className="h03"
                  sx={{ color: '#666', whiteSpace: 'pre-line', fontSize: '14px' }}
                >
                  {item.description}
                </Typography>
              </Box>
            </Container>
          </Box>
        ))}
      </Box>

      {/* 요금제 섹션 */}
      <Box
        className="PaymentSection"
        sx={{
          py: 8,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box className="LeftSet">
                <Box className="Logo" sx={{ mb: 3 }}>
                  <img
                    src="/resources/images/logo_pweb.png"
                    alt="가온 로고"
                    style={{ maxHeight: '80px' }}
                  />
                </Box>
                <Typography
                  className="Text01"
                  variant="h4"
                  sx={{ fontWeight: 'bold', mb: 4 }}
                >
                  학원출결, 이제 스마트하게 관리 하세요!
                </Typography>
                <Box className="ButtonSet">
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      backgroundColor: '#0099ff',
                      '&:hover': { backgroundColor: '#0077cc' },
                      px: 4, py: 2,
                      borderRadius: '8px'
                    }}
                    onClick={() => setRegisterDialogOpen(true)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <img
                        src="/resources/images/ico_human.png"
                        alt=""
                        style={{ width: 20, height: 20, marginRight: 8 }}
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      회원가입하기
                    </Box>
                  </Button>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box className="RightSet" sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Paper
                  className="PaymentCard"
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    color: '#333',
                    borderRadius: '12px',
                    minWidth: '150px'
                  }}
                >
                  <Box className="Logo" sx={{ mb: 2 }}>
                    <img
                      src="/resources/images/logo.png"
                      alt="로고"
                      style={{ height: '40px' }}
                    />
                  </Box>
                  <Typography className="Mod" variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    키패드모드
                  </Typography>
                  <Box className="Cost">
                    <Typography className="Old" sx={{ textDecoration: 'line-through', color: '#999' }}>
                      5,000 원
                    </Typography>
                    <Typography className="New" variant="h5" sx={{ fontWeight: 'bold', color: '#e74c3c' }}>
                      무료
                    </Typography>
                  </Box>
                </Paper>
                <Paper
                  className="PaymentCard"
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    color: '#333',
                    borderRadius: '12px',
                    minWidth: '150px'
                  }}
                >
                  <Box className="Logo" sx={{ mb: 2 }}>
                    <img
                      src="/resources/images/logo.png"
                      alt="로고"
                      style={{ height: '40px' }}
                    />
                  </Box>
                  <Typography className="Mod" variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    얼굴인식+키패드모드
                  </Typography>
                  <Box className="Cost">
                    <Typography className="Old" sx={{ textDecoration: 'line-through', color: '#999' }}>
                      15,000 원
                    </Typography>
                    <Typography className="New" variant="h5" sx={{ fontWeight: 'bold', color: '#e74c3c' }}>
                      무료
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 패밀리 사이트 섹션 */}
      <Box
        className="FamilySection"
        sx={{
          py: 4,
          backgroundColor: '#f8f9fa'
        }}
      >
        <Container maxWidth="lg">
          <Box
            className="BannerSet"
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4,
              flexWrap: 'wrap'
            }}
          >
            <Box component="a" href="http://newgaon.co.kr/" target="_blank">
              <img
                src="/resources/images/logo_gaon.png"
                alt="가온"
                style={{ height: '60px' }}
              />
            </Box>
            <Box component="a" href="https://moms.newgaon.com/" target="_blank">
              <img
                src="/resources/images/logo_momsmom.png"
                alt="맘스맘"
                style={{ height: '60px' }}
              />
            </Box>
            <Box component="a" href="http://247.etoos.com/" target="_blank">
              <img
                src="/resources/images/logo_etoos_247.png"
                alt="이투스 247"
                style={{ height: '60px' }}
              />
            </Box>
            <Box component="a" href="http://math.etoos.com/" target="_blank">
              <img
                src="/resources/images/logo_etoos_math.png"
                alt="이투스 수학"
                style={{ height: '60px' }}
              />
            </Box>
            <Box component="a" href="http://etoosanswer.co.kr/" target="_blank">
              <img
                src="/resources/images/logo_etoos_answer.png"
                alt="이투스 답변"
                style={{ height: '60px' }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 하단 정보 섹션 */}
      <Box
        className="BottomSet"
        sx={{
          py: 6,
          backgroundColor: '#2c3e50',
          color: 'white',
          position: 'relative'
        }}
      >
        <Container maxWidth="lg">
          <Box className="BottomLogo" sx={{ textAlign: 'center', mb: 3 }}>
            <Box component="a" href="/">
              <img
                src="/resources/images/blogo_web.png"
                alt="Gaon"
                style={{ height: '40px' }}
              />
            </Box>
          </Box>
          <Box
            className="BottomMenu"
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 3,
              mb: 4,
              flexWrap: 'wrap'
            }}
          >
            <MuiLink href="http://newgaon.co.kr/" target="_blank" color="inherit">
              <i className="fas fa-building" style={{ marginRight: 8 }}></i>
              회사소개
            </MuiLink>
            <MuiLink href="http://www.ftc.go.kr/" target="_blank" color="inherit">
              <i className="fas fa-question-circle" style={{ marginRight: 8 }}></i>
              사업자 정보확인
            </MuiLink>
            <MuiLink href="#" onClick={() => setPrivacyDialogOpen(true)} color="inherit">
              <i className="fas fa-shield-alt" style={{ marginRight: 8 }}></i>
              개인정보보호정책
            </MuiLink>
            <MuiLink href="#" onClick={() => setTermsDialogOpen(true)} color="inherit">
              <i className="fas fa-info-circle" style={{ marginRight: 8 }}></i>
              이용약관
            </MuiLink>
            <MuiLink href="#" onClick={() => setLoginDialogOpen(true)} color="inherit">
              <i className="fas fa-sign-in-alt" style={{ marginRight: 8 }}></i>
              로그인
            </MuiLink>
            <MuiLink href="#" onClick={() => setRegisterDialogOpen(true)} color="inherit">
              <i className="fas fa-user-plus" style={{ marginRight: 8 }}></i>
              회원가입
            </MuiLink>
          </Box>
          <Box
            className="BottomInfo"
            sx={{
              textAlign: 'center',
              fontSize: '14px',
              lineHeight: '20px',
              color: '#bdc3c7'
            }}
          >
            가온<Box component="span" sx={{ mx: 1 }}>|</Box>
            대표자 : 이주은<Box component="span" sx={{ mx: 1 }}>|</Box>
            정보보호책임자 : 박성헌<Box component="span" sx={{ mx: 1 }}>|</Box>
            소재지 : 경기 용인시 기흥구 보정동 375-16 2층 280호<br />
            사업자등록번호 : 373-66-00087<Box component="span" sx={{ mx: 1 }}>|</Box>
            통신판매업신고번호: 제2019-용인기흥-0527호<br />
            TEL : 031-281-3980<Box component="span" sx={{ mx: 1 }}>|</Box>
            HP : 010-6215-3980<Box component="span" sx={{ mx: 1 }}>|</Box>
            E-mail : psh01@newgaon.co.kr<br /><br />
            Copyright (C) 2018 GAON. All rights reserved.
          </Box>
        </Container>
      </Box>

      {/* 로그인 다이얼로그 */}
      <DraggableDialog
        open={loginDialogOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setLoginDialogOpen(false)
          }
        }}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom>
            로그인
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 3, color: 'text.secondary' }}>
            가입하신 ID와 비밀번호를 입력해 주세요.
          </Typography>

          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loginError}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="사용자 ID"
              value={loginData.username}
              onChange={(e) => {
                setLoginData({...loginData, username: e.target.value})
                setLoginError('')
              }}
              sx={{ mb: 2 }}
              disabled={isLoading}
            />
            <TextField
              fullWidth
              type="password"
              placeholder="비밀번호"
              value={loginData.password}
              onChange={(e) => {
                setLoginData({...loginData, password: e.target.value})
                setLoginError('')
              }}
              sx={{ mb: 2 }}
              disabled={isLoading}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleLoginSubmit()
                }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={loginData.rememberMe}
                  onChange={(e) => setLoginData({...loginData, rememberMe: e.target.checked})}
                />
              }
              label="자동 로그인"
            />
            <MuiLink href="#passwordreset" variant="body2">
              비밀번호가 기억나지 않으세요?
            </MuiLink>
          </Box>
          
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleLoginSubmit}
            disabled={isLoading}
            sx={{ mb: 2 }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                로그인 중...
              </>
            ) : (
              '로그인'
            )}
          </Button>
          
          <Divider sx={{ my: 2 }}>또는</Divider>
          
          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => {
              setLoginDialogOpen(false)
              setRegisterDialogOpen(true)
            }}
          >
            회원 가입
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginDialogOpen(false)}>
            닫기
          </Button>
        </DialogActions>
      </DraggableDialog>

      {/* 회원가입 다이얼로그 */}
      <DraggableDialog
        open={registerDialogOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setRegisterDialogOpen(false)
          }
        }}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <Typography variant="h5" align="center" gutterBottom>
            회원 가입
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 3 }}>
            회원가입 기능은 별도 페이지에서 제공됩니다.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setRegisterDialogOpen(false)
              navigate('/register')
            }}
          >
            회원가입 페이지로 이동
          </Button>
        </DialogContent>
      </DraggableDialog>

      {/* 고객문의 다이얼로그 */}
      <DraggableDialog
        open={contactDialogOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setContactDialogOpen(false)
          }
        }}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Typography variant="h5" align="center" gutterBottom>
            고객 문의
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 3 }}>
            고객 문의는 아래 연락처로 직접 연락해 주세요.
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>전화:</strong> 031-281-3980
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>휴대폰:</strong> 010-6215-3980
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              <strong>이메일:</strong> psh01@newgaon.co.kr
            </Typography>
          </Box>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setContactDialogOpen(false)}
          >
            확인
          </Button>
        </DialogContent>
      </DraggableDialog>

      {/* 공지사항 다이얼로그 */}
      <DraggableDialog
        open={announcementDialogOpen}
        onClose={handleAnnouncementDialogClose}
        maxWidth="md"
        fullWidth
        title="공지사항"
      >
        <DialogContent>
          {selectedAnnouncement ? (
            // 상세 보기
            <Box>
              <Button
                onClick={() => setSelectedAnnouncement(null)}
                sx={{ mb: 2 }}
              >
                ← 목록으로 돌아가기
              </Button>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={getCategoryText(selectedAnnouncement.category)}
                      color={getCategoryColor(selectedAnnouncement.category)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: getPriorityColor(selectedAnnouncement.priority),
                        fontWeight: 'bold'
                      }}
                    >
                      {selectedAnnouncement.priority === 'high' ? '[중요]' : ''}
                    </Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedAnnouncement.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    작성자: {selectedAnnouncement.author} |
                    작성일: {formatDate(selectedAnnouncement.createdAt)} |
                    조회수: {selectedAnnouncement.views}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedAnnouncement.content}
                  </Typography>

                  {/* 첨부파일 표시 */}
                  {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        첨부파일
                      </Typography>

                      {/* 이미지 첨부파일들 */}
                      {selectedAnnouncement.attachments.filter(att => att.isImage).map((attachment) => (
                        <Box key={attachment.id} sx={{ mb: 2 }}>
                          <img
                            src={attachment.data}
                            alt={attachment.name}
                            style={{
                              maxWidth: '100%',
                              height: 'auto',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            {attachment.name}
                          </Typography>
                        </Box>
                      ))}

                      {/* 문서 첨부파일들 */}
                      {selectedAnnouncement.attachments.filter(att => !att.isImage).length > 0 && (
                        <List>
                          {selectedAnnouncement.attachments.filter(att => !att.isImage).map((attachment) => (
                            <ListItem key={attachment.id} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography>📄</Typography>
                                    <Typography variant="body2">{attachment.name}</Typography>
                                  </Box>
                                }
                                secondary={`크기: ${formatFileSize(attachment.size)}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Box>
          ) : (
            // 목록 보기
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                총 {getPublishedAnnouncements().length}개의 공지사항이 있습니다.
              </Typography>
              {getPublishedAnnouncements().length === 0 ? (
                <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                  등록된 공지사항이 없습니다.
                </Typography>
              ) : (
                <List>
                  {getPublishedAnnouncements().map((announcement) => (
                    <ListItem
                      key={announcement.id}
                      button
                      onClick={() => handleAnnouncementItemClick(announcement)}
                      sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={getCategoryText(announcement.category)}
                              color={getCategoryColor(announcement.category)}
                              size="small"
                            />
                            {announcement.priority === 'high' && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: getPriorityColor(announcement.priority),
                                  fontWeight: 'bold'
                                }}
                              >
                                [중요]
                              </Typography>
                            )}
                            <Typography variant="subtitle1" component="span">
                              {announcement.title}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              작성자: {announcement.author}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(announcement.createdAt)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                조회 {announcement.views}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAnnouncementDialogClose}>
            닫기
          </Button>
        </DialogActions>
      </DraggableDialog>

      {/* 개인정보보호정책 다이얼로그 */}
      <DraggableDialog
        open={privacyDialogOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setPrivacyDialogOpen(false)
          }
        }}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
        title="개인정보 취급방침"
      >
        <DialogContent sx={{ p: 4, maxHeight: '70vh', overflow: 'auto' }}>
          <Box sx={{ lineHeight: 1.8 }}>
            <Typography variant="body1" paragraph>
              가온("이하 "회사")은 정보통신서비스제공자가 준수해야 하는 관련 법령상의 개인정보보호 규정을 준수하고 있습니다.<br />
              회사는 개인정보의 중요성을 인식하고 개인정보취급방침을 통하여 회원이 제공하는 개인정보가 어떠한 방식으로 관리되고 있는지 안내해 드립니다.
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              ※ 회사의 개인정보취급방침은 정부의 법률 및 지침 변경이나 회사의 내부 방침 변경 등으로 인하여 수시로 변경될 수 있으며, 관련사항은 공지사항 또는 개별공지를 통하여 공지하도록 하겠습니다.
            </Typography>

            <Typography variant="body2" paragraph>
              회사의 개인정보취급방침은 다음과 같은 내용을 담고 있습니다.
            </Typography>

            <Typography variant="body2" paragraph>
              1. 개인정보의 수집 목적<br />
              2. 개인정보의 수집 방법 및 항목
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              1. 개인정보 수집 목적
            </Typography>
            <Typography variant="body2" paragraph>
              회사는 회원가입 시 서비스 제공을 위해 필요한 최소한의 개인정보를 수집하고 있습니다.<br />
              회원가입 시 수집하는 개인정보는 회원님의 아이디, 비밀번호입니다.<br />
              회원가입 시 기입하신 정보는 해당 서비스 제공이나 회원님께 사전에 밝힌 목적 이외의 다른 어떠한 목적으로도 사용되지 않음을 알려드립니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              2. 개인정보 수집 방법 및 항목
            </Typography>
            <Typography variant="body2" paragraph>
              1) 수집항목<br />
              ① 필수 수집 항목 : 아이디, 비밀번호, 닉네임, 이메일<br />
              ② 자동 수집 항목 : IP 및 접속일시 등 로그기록, 결제기록, 쿠키<br />
              ③ 본인인증 : 성명, 생년월일, 성별, 연계정보(CI), 중복가입정보(DI), 휴대폰번호<br />
              <br />
              외국인의 선택 수집 항목은 이메일, 상담, 팩스로 접수할 수 있음.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              3. 개인정보 관리(열람, 정정, 삭제 등)
            </Typography>
            <Typography variant="body2" paragraph>
              ① 회원은 회사의 서비스에서 ID와 비밀번호를 입력하고 로그인한 후 "마이페이지"를 통해 언제든지 본인의 개인정보를 조회하거나 수정할 수 있습니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              4. 개인정보의 보유 및 이용 기간
            </Typography>
            <Typography variant="body2" paragraph>
              기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.<br />
              ① 계약 또는 청약 철회에 관한 기록(전자상거래 등에서의 소비자보호에 관한 법률) 보존기간 : 5년<br />
              ② 대금결제 및 재화 등의 공급에 관한 기록(전자상거래 등에서의 소비자보호에 관한 법률) 보존기간 : 5년<br />
              ③ 소비자의 불만 또는 분쟁처리에 관한 기록(전자상거래 등에서의 소비자보호에 관한 법률) 보존기간 : 3년<br />
              ④ 방문에 관한 기록(통신비밀보호법) 보존기간 : 3개월
            </Typography>

            <Typography variant="body2" paragraph>
              2) 파기방법<br />
              - 전자적 파일 형태 : 개인정보의 기록을 복원할 수 없는 기술적 방법으로 삭제합니다.<br />
              - 종이에 출력된 경우 : 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.
            </Typography>

            <Typography variant="body2" paragraph>
              3) 기타<br />
              - 회원이 기존에 사용한 아이디는 타 회원들과의 혼선을 방지하기 위해 보존됩니다.<br />
              - 회사의 이용약관 등을 위반하여 이용 정지가 이루어진 경우에도 개인정보는 삭제됩니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              5. 개인정보의 제3자 제공
            </Typography>
            <Typography variant="body2" paragraph>
              ① 회원의 동의가 있는 경우<br />
              ② 서비스 이용과 관련하여 요금 정산이 필요한 경우<br />
              ③ 법과 관련하여 기관의 요구가 있는 경우
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              6. 개인정보 자동수집 장치의 설치, 운영 및 그 거부에 관한 사항
            </Typography>
            <Typography variant="body2" paragraph>
              회사는 회원들에게 원활한 서비스를 제공하기 위해 '쿠키(cookie)'를 사용합니다. 쿠키란 회사의 서버가 회원의 컴퓨터로 전송하는 작은 텍스트 파일로써 회원의 컴퓨터 하드디스크에 저장됩니다.
            </Typography>

            <Typography variant="body2" paragraph>
              1) 쿠키의 사용 목적<br />
              회원이 방문한 회사의 컨텐츠를 이용하는 과정에서 최적화된 관련 정보를 제공하기 위해 쿠키를 사용합니다.
            </Typography>

            <Typography variant="body2" paragraph>
              2) 쿠키의 설정 등<br />
              ① 쿠키는 회사에 로그인할 때 설정되며 로그인 시 해제됩니다.<br />
              ② 쿠키는 필요할 때 언제든지 불러와 필요한 만큼 변경할 수 있으며 다시 저장할 수 있습니다.<br />
              ③ 쿠키는 회사를 이용하는 회원들의 이용 형태를 측정하는 통계 자료로 활용됩니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              7. 개인정보의 기술적, 관리적 보호
            </Typography>
            <Typography variant="body2" paragraph>
              1) 기술적 대책<br />
              회사는 회원의 개인정보를 처리함에 있어 개인정보가 분실, 도난, 누출, 변조 또는 훼손되지 않도록 안전성 확보를 위해 체계적으로 보안성을 확보하기 위해 모든 기술적 장치를 확보하려 노력하고 있습니다.
            </Typography>

            <Typography variant="body2" paragraph>
              2) 관리적 대책<br />
              ① 개인정보에 대해 접근 가능한 인원에 제한을 두고 있습니다.<br />
              ② 회원의 개인정보를 처리할 수 있는 시스템 담당자를 별도로 두고 있으며, 담당자에게 비밀번호를 부여하고 보안을 유지하고 있습니다.
            </Typography>

            <Typography variant="body2" paragraph>
              3) 예외<br />
              ① 회원의 부주의로 인해 자신의 개인정보(아이디, 비밀번호 등)가 유출된 경우 보안 및 유지에 대한 책임은 회원 본인에게 있습니다.<br />
              ② 회원의 개인정보는 누구에게도 알려주어서는 안됩니다.<br />
              ③ 다른 사람과 컴퓨터를 함께 사용하거나 공공장소에서 회사의 서비스를 이용할 경우 웹브라우저의 자동완성 기능(아이디, 비밀번호 저장 등의 기능)의 사용 여부를 반드시 확인하고 사용을 피해야 하며, 서비스 사용 후에는 반드시 웹브라우저를 로그아웃 및 종료해야 합니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              8. 개인정보의 열람 및 정정
            </Typography>
            <Typography variant="body2" paragraph>
              이용자 혹은 법정 대리인은 언제든지 등록되어 있는 자신 혹은 당해 만 14세 미만 아동의 개인정보를 조회하거나 수정할 수 있으며 가입해지를 요청할 수도 있습니다. 이용자 혹은 만 14세 미만 아동의 개인정보 조회/수정을 위해서는 '개인정보변경'(또는 '회원정보수정' 등)을, 가입해지(동의철회)를 위해서는 "회원탈퇴"를 클릭하여 본인 확인 절차를 거치신 후 직접 열람, 정정 또는 탈퇴가 가능합니다. 혹은 개인정보관리책임자에게 서면, 전화 또는 이메일로 연락하시면 지체없이 조치하겠습니다. 이용자가 개인정보의 오류에 대한 정정을 요청하신 경우에는 정정을 완료하기 전까지 당해 개인정보를 이용 또는 제공하지 않습니다. 또한 잘못된 개인정보를 제3자에게 이미 제공한 경우에는 정정 처리결과를 제3자에게 지체없이 통지하여 정정이 이루어지도록 하겠습니다. 회사는 이용자 혹은 법정 대리인의 요청에 의해 해지 또는 삭제된 개인정보는 "회사가 수집하는 개인정보의 보유 및 이용기간"에 명시된 바에 따라 처리하고 그 외의 용도로 열람 또는 이용할 수 없도록 처리하고 있습니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              9. 개인정보 관리책임자 및 담당자의 연락처
            </Typography>
            <Typography variant="body2" paragraph>
              회사는 회원의 개인정보를 보호하고 관련 법률을 준수하기 위해 별도의 부서를 지정하고 있습니다.
            </Typography>

            <Typography variant="body2" paragraph>
              <strong>개인정보 관리 책임 및 담당부서</strong><br />
              이름 : 박성헌<br />
              E-MAIL : psh01@newgaon.co.kr<br />
              전화번호 : 031-281-3980
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              10. 고지의 의무
            </Typography>
            <Typography variant="body2" paragraph>
              회사는 개인정보취급방침과 관련하여 내용 추가, 수정 및 삭제가 있을 경우 최소한 7일 이전에 회사 홈페이지의 "공지사항"을 통해 고지할 것입니다.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrivacyDialogOpen(false)}>
            닫기
          </Button>
        </DialogActions>
      </DraggableDialog>

      {/* 이용약관 다이얼로그 */}
      <DraggableDialog
        open={termsDialogOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setTermsDialogOpen(false)
          }
        }}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
        title="이용약관"
      >
        <DialogContent sx={{ p: 4, maxHeight: '70vh', overflow: 'auto' }}>
          <Box sx={{ lineHeight: 1.8 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
              가온 서비스 이용약관
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제1조 (목적)
            </Typography>
            <Typography variant="body2" paragraph>
              이 약관은 가온(이하 "회사")이 제공하는 서비스를 이용함에 있어 이용조건 및 절차, 회사와 회원간의 권리, 의무 및 기타 필요한 사항을 규정함을 목적으로 합니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제2조 (용어의 정의)
            </Typography>
            <Typography variant="body2" paragraph>
              ① '가온'이라 함은 회사가 재화 또는 용역을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 또는 용역을 거래할 수 있도록 설정한 가상의 영업장을 말합니다.<br />
              ② '이용자'라 함은 '가온'에 접속하여 이 약관에 따라 '가온'이 제공하는 서비스를 받는 회원 및 비회원을 말합니다.<br />
              ③ '회원'이라 함은 가온에 개인정보를 제공하여 회원등록을 한 자로서, 가온의 정보를 지속적으로 제공받으며, 가온이 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.<br />
              ④ '비회원'이라 함은 회원에 가입하지 않고 가온이 제공하는 서비스를 이용하는 자를 말합니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제3조 (약관의 명시와 개정)
            </Typography>
            <Typography variant="body2" paragraph>
              ① 가온은 이 약관의 내용과 상호, 연락처(전화, 팩스, 전자우편 주소 등) 등을 이용자가 알 수 있도록 사이트의 초기 서비스화면에 게시합니다.<br />
              ② 가온은 약관의 규제 등에 관한법률, 전자거래기본법, 전자서명법, 정보통신망이용촉진등에 관한 법률, 방문판매등에 관한 법률, 소비자보호법 등 관련 법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.<br />
              ③ 가온이 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 사이트의 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.<br />
              ④ 가온이 약관을 개정할 경우에는 그 개정약관은 그 적용일자 이후에 체결되는 계약에만 적용되고 그 이전에 이미 체결된 계약에 대해서는 개정전의 약관조항이 그대로 적용됩니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제4조 (서비스의 제공 및 변경)
            </Typography>
            <Typography variant="body2" paragraph>
              ① 가온은 다음과 같은 업무를 수행합니다.<br />
              &nbsp;&nbsp;&nbsp;1. 재화 또는 용역에 대한 정보 제공 및 구매계약의 체결<br />
              &nbsp;&nbsp;&nbsp;2. 구매계약이 체결된 재화 또는 용역의 배송<br />
              &nbsp;&nbsp;&nbsp;3. 기타 가온이 정하는 업무<br />
              ② 가온은 재화 또는 용역의 품절 또는 기술적 사양의 변경 등의 경우에는 장차 체결되는 계약에 의해 제공할 재화·상품의 내용을 변경할 수 있습니다.<br />
              ③ 가온이 제공하기로 이용자와 체결한 서비스의 내용을 재화의 품절 또는 기술적 사양의 변경 등의 사유로 변경할 경우에는 가온은 이로 인하여 이용자가 입은 손해를 배상하지 아니합니다. 단, 가온에게 고의 또는 과실이 있는 경우에는 그러하지 아니합니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제5조 (서비스의 중단)
            </Typography>
            <Typography variant="body2" paragraph>
              ① 가온은 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.<br />
              ② 제1항에 의한 서비스 중단의 경우에는 가온은 제8조에 정한 방법으로 이용자에게 통지합니다.<br />
              ③ 가온은 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상하지 아니합니다. 단 가온에게 고의 또는 과실이 있는 경우에는 그러하지 아니합니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제6조 (회원가입)
            </Typography>
            <Typography variant="body2" paragraph>
              ① 가온 이용자는 가온이 정한 가입 양식에 따라 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.<br />
              ② 가온은 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.<br />
              &nbsp;&nbsp;&nbsp;1. 등록 내용에 허위, 기재누락, 오기가 있는 경우<br />
              &nbsp;&nbsp;&nbsp;2. 기타 회원으로 등록하는 것이 가온의 기술상 현저히 지장이 있다고 판단되는 경우<br />
              ③ 회원가입계약의 성립시기는 가온의 승낙이 회원에게 도달한 시점으로 합니다.<br />
              ④ 회원은 제15조 제1항에 의한 등록사항에 변경이 있는 경우, 즉시 전자우편 기타 방법으로 가온에 대하여 그 변경사항을 알려야 합니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제7조 (회원 탈퇴 및 자격 상실 등)
            </Typography>
            <Typography variant="body2" paragraph>
              ① 회원은 가온에게 언제든지 탈퇴를 요청할 수 있으며 가온은 즉시 회원 탈퇴를 처리합니다.<br />
              ② 회원이 다음 각 호의 사유에 해당하는 경우, 가온은 회원자격을 제한 및 정지시킬 수 있습니다.<br />
              &nbsp;&nbsp;&nbsp;1. 가입 신청시에 허위 내용을 등록한 경우<br />
              &nbsp;&nbsp;&nbsp;2. 가온을 이용하여 구입한 재화 또는 상품 등의 대금, 기타 가온 이용에 관련하여 회원이 부담하는 채무를 기일에 지급하지 않는 경우<br />
              &nbsp;&nbsp;&nbsp;3. 다른 사람의 가온 이용을 방해하거나 그 정보를 도용하는 등 전자거래 질서를 위협하는 경우<br />
              &nbsp;&nbsp;&nbsp;4. 가온을 이용하여 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우<br />
              ③ 가온이 회원 자격을 제한, 정지 시킨 후, 동일한 행위가 2회 이상 반복되거나 30일 이내에 그 사유가 시정되지 아니하는 경우 가온은 회원자격을 상실시킬 수 있습니다.<br />
              ④ 가온은 회원자격을 상실시키는 경우에는 회원등록을 말소합니다. 이 경우 회원에게 이를 통지하고, 회원등록 말소 전에 소명할 기회를 부여합니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제10조 (계약의 성립)
            </Typography>
            <Typography variant="body2" paragraph>
              ① 가온은 제9조와 같은 구매신청에 대하여 다음 각 호에 해당하지 않는 한 승낙합니다.<br />
              &nbsp;&nbsp;&nbsp;1. 신청 내용에 허위, 기재누락, 오기가 있는 경우<br />
              &nbsp;&nbsp;&nbsp;2. 기타 구매신청에 승낙하는 것이 가온 기술상, 및 업무 수행상 현저히 지장이 있다고 판단하는 경우<br />
              ② 가온 승낙이 제12조 제1항의 수신확인통지형태로 이용자에게 도달한 시점에 계약이 성립한 것으로 봅니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제11조 (지급방법)
            </Typography>
            <Typography variant="body2" paragraph>
              가온에서 구매한 재화 또는 상품에 대한 대금지급방법은 다음 각 호의 하나로 할 수 있습니다.<br />
              &nbsp;&nbsp;&nbsp;1. 계좌이체<br />
              &nbsp;&nbsp;&nbsp;2. 신용카드결제<br />
              &nbsp;&nbsp;&nbsp;3. 온라인무통장입금<br />
              <br />
              ① 회원이 상품을 구입할 때 사용할 수 있는 결제 수단에는 신용카드, 온라인 송금 등이 있습니다.<br />
              ② 신용카드는 회원의 동의를 얻어 등록한 후 사용할 수 있습니다.<br />
              ③ 온라인 송금은 회원이 직접 가온이 지정한 계좌로 돈을 입금하는 방식입니다.<br />
              ④ 인터넷 뱅킹은 인터넷을 통해 다른 은행 계좌에서 가온 계좌로 직접 계좌 이체해 결제하는 방식입니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제12조 (수신확인통지·구매신청 변경 및 취소)
            </Typography>
            <Typography variant="body2" paragraph>
              ① 가온은 이용자의 구매신청이 있는 경우 이용자에게 수신확인통지를 합니다.<br />
              ② 수신확인통지를 받은 이용자는 의사표시의 불일치 등이 있는 경우에는 수신확인통지를 받은 후 즉시 구매신청 변경 및 취소를 요청할 수 있습니다.<br />
              ③ 가온은 배송 전 이용자의 구매신청 변경 및 취소 요청이 있는 때에는 지체없이 그 요청에 따라 처리합니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제14조 (환급, 반품 및 교환)
            </Typography>
            <Typography variant="body2" paragraph>
              ① 가온은 이용자가 구매 신청한 재화 또는 상품이 품절 등의 사유로 재화 또는 상품의 인도를 할 수 없을 때에는 지체 없이 그 사유를 이용자에게 통지하고, 사전에 재화 또는 상품의 대금을 받은 경우에는 대금을 받은 날부터 3일 이내에, 그렇지 않은 경우에는 그 사유 발생일로부터 3일 이내에 계약 해제 및 환급절차를 취합니다.<br />
              ② 다음 각 호의 경우에는 가온은 배송된 재화일지라도 재화를 반품 받은 다음 영업일 이내에 이용자의 요구에 따라 즉시 환급, 반품 및 교환 조치를 합니다. 다만 그 요구기한은 배송된 날로부터 20일 이내로 합니다.<br />
              &nbsp;&nbsp;&nbsp;1. 배송된 상품이 주문내용과 상이하거나 가온이 제공한 정보와 상이할 경우<br />
              &nbsp;&nbsp;&nbsp;2. 배송된 상품이 파손, 손상되었거나 오염되었을 경우 (단, 이용자의 책임있는 사유로 상품이 훼손된 경우는 제외합니다.)<br />
              &nbsp;&nbsp;&nbsp;3. 재화가 약관에 명시된 배송기간보다 늦게 배송된 경우 (단, 물품수령자의 부재 등 이용자의 귀책사유로 인해 배송이 지연된 경우는 제외합니다.)
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제15조 (개인정보보호)
            </Typography>
            <Typography variant="body2" paragraph>
              ① 가온은 이용자의 정보수집시 구매계약 이행에 필요한 최소한의 정보를 수집합니다. 다음 사항을 필수사항으로 하며 그 외 사항은 선택사항으로 합니다.<br />
              &nbsp;&nbsp;&nbsp;1. 성명<br />
              &nbsp;&nbsp;&nbsp;2. 주민등록번호(회원의 경우)<br />
              &nbsp;&nbsp;&nbsp;3. 주소<br />
              &nbsp;&nbsp;&nbsp;4. 전화번호<br />
              ② 가온이 이용자의 개인 식별이 가능한 개인정보를 수집하는 때에는 이하 각 호의 경우를 제외하고는 반드시 당해 이용자의 동의를 받습니다.<br />
              &nbsp;&nbsp;&nbsp;1. 법률에 특별한 규정이 있는 경우<br />
              &nbsp;&nbsp;&nbsp;2. 전자거래 계약의 이행을 위해서 필요한 경우<br />
              &nbsp;&nbsp;&nbsp;3. 재화 등의 제공에 따른 요금정산을 위하여 필요한 경우<br />
              ③ 제공된 개인정보는 당해 이용자의 동의 없이 목적 외의 이용이나 제3자에게 제공할 수 없으며, 이에 대한 모든 책임은 가온이 책임을 집니다. 다만, 다음의 경우에는 예외로 합니다.<br />
              &nbsp;&nbsp;&nbsp;1. 배송업무상 배송업체에게 배송에 필요한 최소한의 이용자의 정보(성명, 주소, 전화번호)를 알려주는 경우<br />
              &nbsp;&nbsp;&nbsp;2. 통계작성, 학술연구 또는 시장조사를 위하여 필요한 경우로서 특정개인을 식별할 수 없는 형태로 제공하는 경우<br />
              ④ 가온이 제2항과 제3항에 의해 이용자의 동의를 받아야 하는 경우에는 개인정보관리 책임자의 신원(소속, 성명 및 전화번호 기타 연락처), 정보의 수집목적 및 이용목적, 제3자에 대한 정보제공 관련사항(제공받는자, 제공목적 및 제공할 정보의 내용) 등 정보통신망이용촉진등에관한법률 제22조 제2항이 규정한 사항을 미리 명시하거나 고지해야 하며 이용자는 언제든지 이 동의를 철회할 수 있습니다.<br />
              ⑤ 가온은 은행계좌 등을 포함한 이용자의 개인정보의 분실, 도난, 유출, 변조 등으로 인한 이용자의 손해에 대하여 모든 책임을 집니다.<br />
              ⑥ 가온 또는 그로부터 개인정보를 제공받은 제3자는 개인정보의 수집목적 또는 제공받은 목적을 달성한 때에는 당해 개인정보를 지체 없이 파기합니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제16조 (회사의 의무)
            </Typography>
            <Typography variant="body2" paragraph>
              ① '가온'은 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며 이 약관이 정하는 바에 따라 지속적이고, 안정적으로 재화·용역을 제공하는 데 최선을 다하여야 합니다.<br />
              ② 가온은 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 개인정보(신용정보 포함) 보호를 위한 보안 시스템을 갖추어야 합니다.<br />
              ③ 가온이 상품이나 용역에 대하여 「표시·광고의공정화에관한법률」 제3조 소정의 부당한 표시·광고행위를 함으로써 이용자가 손해를 입은 때에는 이를 배상할 책임을 집니다.<br />
              ④ 가온은 이용자가 원하지 않는 영리목적의 광고성 전자우편을 발송하지 않습니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제17조 (회원의 ID 및 비밀번호에 대한 의무)
            </Typography>
            <Typography variant="body2" paragraph>
              ① 제15조의 경우를 제외한 ID와 비밀번호에 관한 관리책임은 회원에게 있습니다.<br />
              ② 회원은 자신의 ID 및 비밀번호를 제3자에게 이용하게 해서는 안됩니다.<br />
              ③ 회원이 자신의 ID 및 비밀번호를 도난당하거나 제3자가 사용하고 있음을 인지한 경우에는 바로 가온에 통보하고 가온의 안내가 있는 경우에는 그에 따라야 합니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제18조 (회원의 의무)
            </Typography>
            <Typography variant="body2" paragraph>
              회원은 다음 행위를 하여서는 안 됩니다.<br />
              &nbsp;&nbsp;&nbsp;1. 신청 또는 변경시 허위내용의 등록<br />
              &nbsp;&nbsp;&nbsp;2. 가온에 게시된 정보의 변경<br />
              &nbsp;&nbsp;&nbsp;3. 가온이 정한 정보 이외의 정보(컴퓨터 프로그램 등)의 송신 또는 게시<br />
              &nbsp;&nbsp;&nbsp;4. 가온 기타 제3자의 저작권 등 지적재산권에 대한 침해<br />
              &nbsp;&nbsp;&nbsp;5. 가온 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위<br />
              &nbsp;&nbsp;&nbsp;6. 외설 또는 폭력적인 메시지·화상·음성 기타 공서양속에 반하는 정보를 사이트에 공개 또는 게시하는 행위
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제19조 (연결 '사이트'와 피연결 '사이트' 간의 관계)
            </Typography>
            <Typography variant="body2" paragraph>
              ① 가온은 연결사이트가 독자적으로 제공하는 상품 또는 상품에 의하여 이용자와 행하는 거래에 대하서는 보증 책임을 지지 않습니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제20조 (저작권의 귀속 및 이용제한)
            </Typography>
            <Typography variant="body2" paragraph>
              ① 가온이 작성한 저작물에 대한 저작권 기타 지적재산권은 가온에게 귀속합니다.<br />
              ② 이용자는 가온이 제공한 서비스를 이용함으로써 얻은 정보를 가온의 사전 승낙없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안됩니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제21조 (분쟁해결)
            </Typography>
            <Typography variant="body2" paragraph>
              ① 가온은 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.<br />
              ② 가온은 이용자로부터 제출되는 불만사항 및 의견은 우선적으로 그 사항을 처리합니다. 다만, 신속한 처리가 곤란한 경우에는 이용자에게 그 사유와 처리일정을 즉시 통보해 드립니다.<br />
              ③ 가온과 이용자간에 발생한 분쟁은 전자거래기본법 제28조 및 동 시행령 제15조에 의하여 설치된 전자거래분쟁조정위원회의 조정에 따를 수 있습니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제22조 (재판권 및 준거법)
            </Typography>
            <Typography variant="body2" paragraph>
              ① 가온과 이용자간에 발생한 전자거래 분쟁에 관한 소송은 민사소송법상의 관할법원에 제기합니다.<br />
              ② 가온과 이용자간에 제기된 전자거래 소송에는 대한민국 법을 적용합니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              제23조 (약관외 준칙)
            </Typography>
            <Typography variant="body2" paragraph>
              당 약관에 명시되지 않은 사항은 전자거래 기본법, 전자서명법, 방문판매법 및 기타 관련법령의 규정에 의합니다.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="body2" paragraph sx={{ textAlign: 'center', fontWeight: 'bold' }}>
              (시행일) 위 약관은 2025년 12월 01일부터 시행합니다.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTermsDialogOpen(false)}>
            닫기
          </Button>
        </DialogActions>
      </DraggableDialog>
    </Box>
  )
}

export default HomePage
