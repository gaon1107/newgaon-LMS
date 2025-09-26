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

    try {
      const result = await login({
        username: loginData.username,
        password: loginData.password
      })

      if (result.success) {
        setLoginDialogOpen(false)
        navigate('/dashboard')
      } else {
        setLoginError(result.message || '로그인에 실패했습니다.')
      }
    } catch (error) {
      setLoginError('로그인 중 오류가 발생했습니다.')
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
              onClick={() => document.getElementById('serviceInfo')?.scrollIntoView()}
            >
              <i className="fas fa-newspaper" style={{ marginRight: 8 }}></i>
              서비스소개
            </Button>
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
          <Box className="BottomBox" sx={{ textAlign: 'center', mb: 4 }}>
            <img
              src="/resources/images/bbox.png"
              alt="bottom box"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Box>
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
            <MuiLink href="#privacy" color="inherit">
              <i className="fas fa-shield-alt" style={{ marginRight: 8 }}></i>
              개인정보보호정책
            </MuiLink>
            <MuiLink href="#termsofuse" color="inherit">
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
    </Box>
  )
}

export default HomePage
