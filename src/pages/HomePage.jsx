import React, { useState } from 'react'
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container,
  Dialog,
  DialogContent,
  TextField,
  FormControlLabel,
  Checkbox,
  Link as MuiLink,
  Divider
} from '@mui/material'
import { Login as LoginIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material'

const HomePage = () => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    rememberMe: false
  })

  const handleLoginSubmit = () => {
    // 실제 로그인 처리
    console.log('로그인:', loginData)
    setLoginDialogOpen(false)
    // 성공 시 메인 화면으로 이동
    window.location.href = '/dashboard'
  }

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
          height: '610px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Box className="ContentSet" sx={{ color: 'white', ml: 8 }}>
            <Typography 
              className="Text01" 
              sx={{ fontSize: '24px', fontWeight: 200, mb: 3 }}
            >
              딱 한번 간편한 출결체크!
            </Typography>
            <Typography 
              className="Text02" 
              sx={{ fontSize: '36px', fontWeight: 200, mb: 3 }}
            >
              <Box component="span" sx={{ fontWeight: 'bold' }}>얼굴인식</Box>
              출결관리 시스템
            </Typography>
            <Typography 
              className="Text03" 
              sx={{ fontSize: '14px', fontWeight: 200, lineHeight: '20px', mb: 4 }}
            >
              <Box component="span" sx={{ fontWeight: 'bold' }}>가온출결시스템</Box>
              은 얼굴인식 프로그램을 이용한<br />
              간단하고 편리한 <Box component="span" sx={{ fontWeight: 'bold' }}>스마트 출결관리 시스템</Box>입니다.<br />
              키패드 입력도 지원하여 편리하게 이용할 수 있습니다.
            </Typography>
            <Box className="ButtonSet" sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                sx={{ 
                  backgroundColor: '#0099ff',
                  '&:hover': { backgroundColor: '#66ccff' },
                  px: 3, py: 1.5
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
                  '&:hover': { backgroundColor: '#66ccff' },
                  px: 3, py: 1.5
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

      {/* 서비스 소개 섹션들 */}
      <Box id="serviceInfo" sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom>
            가온출결시스템의 특장점
          </Typography>
          
          {/* 각 특징 섹션들 */}
          {[
            {
              title: "얼굴인식 출결관리 시스템",
              subtitle: "얼굴인식으로 스마트 하게~",
              description: "- 얼굴인식 프로그램을 사용하여 간편하게 이용할 수 있습니다.\n- 얼굴인식모드와 키패드모드를 지원합니다.",
              number: "1"
            },
            {
              title: "비밀번호로 출결관리!",
              subtitle: "얼굴인식이 안될 땐, 키패드를 쓰세요!",
              description: "- 얼굴인식이 안되는 환경일 경우, 키패드모드를 이용하여\n  비밀번호로 출결관리가 가능합니다.",
              number: "2"
            },
            {
              title: "장비걱정은 NO! 알뜰하게 사용",
              subtitle: "공기계 사용으로 비용 다이어트!",
              description: "- 사용하지 않는 스마트폰이나 테블릿을 활용하여\n신규장비를 구입할 필요가 없습니다.",
              number: "3"
            }
          ].map((item, index) => (
            <Box 
              key={index}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                py: 4,
                flexDirection: index % 2 === 0 ? 'row' : 'row-reverse'
              }}
            >
              <Box sx={{ flex: 1, p: 4 }}>
                <Box 
                  sx={{ 
                    width: 60, height: 60, 
                    borderRadius: '50%', 
                    backgroundColor: '#99ccff',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '48px',
                    fontWeight: 'bold',
                    mb: 2
                  }}
                >
                  {item.number}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {item.title}
                </Typography>
                <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                  {item.subtitle}
                </Typography>
                <Typography sx={{ color: '#666', whiteSpace: 'pre-line' }}>
                  {item.description}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    width: 300, 
                    height: 200, 
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto'
                  }}
                >
                  이미지 영역
                </Box>
              </Box>
            </Box>
          ))}
        </Container>
      </Box>

      {/* 하단 섹션들 */}
      <Box sx={{ backgroundColor: '#f8f9fa', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" gutterBottom>
            학원출결, 이제 스마트하게 관리 하세요!
          </Typography>
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              sx={{ 
                backgroundColor: '#0099ff',
                '&:hover': { backgroundColor: '#66ccff' },
                px: 4, py: 2
              }}
              onClick={() => setRegisterDialogOpen(true)}
            >
              회원가입하기
            </Button>
          </Box>
        </Container>
      </Box>

      {/* 로그인 다이얼로그 */}
      <Dialog 
        open={loginDialogOpen} 
        onClose={() => setLoginDialogOpen(false)}
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
          
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="사용자 ID"
              value={loginData.username}
              onChange={(e) => setLoginData({...loginData, username: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="password"
              placeholder="비밀번호"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              sx={{ mb: 2 }}
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
            sx={{ mb: 2 }}
          >
            로그인
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
      </Dialog>

      {/* 회원가입 다이얼로그 */}
      <Dialog 
        open={registerDialogOpen} 
        onClose={() => setRegisterDialogOpen(false)}
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
            onClick={() => window.location.href = '/register'}
          >
            회원가입 페이지로 이동
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default HomePage
