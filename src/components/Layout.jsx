import React, { useState, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  CssBaseline,
  Collapse
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  EventAvailable as AttendanceIcon,
  People as StudentsIcon,
  School as TeachersIcon,
  Book as LecturesIcon,
  Message as MessageIcon,
  Folder as FileIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  Today as TodayIcon,
  CalendarMonth as CalendarIcon,
  Settings as SettingsIcon,
  VerifiedUser as LicenseIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Group as MembershipIcon,
  Announcement as AnnouncementIcon,
  Psychology as StudyIcon,
  Assessment as DailyStudyIcon,
  PersonOutline as StudentStudyIcon
} from '@mui/icons-material'
import { AuthContext } from '../contexts/AuthContext'

const drawerWidth = 240

const Layout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useContext(AuthContext)
  
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [attendanceMenuOpen, setAttendanceMenuOpen] = useState(false)
  const [studyMenuOpen, setStudyMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)

  // 기본 메뉴 (모든 사용자)
  const baseMenuItems = [
    { text: '대시보드', icon: <DashboardIcon />, path: '/dashboard' },
    { text: '학생 관리', icon: <StudentsIcon />, path: '/students' },
    { text: '강사 관리', icon: <TeachersIcon />, path: '/teachers' },
    { text: '강의 관리', icon: <LecturesIcon />, path: '/lectures' },
    {
      text: '출결 관리',
      icon: <AttendanceIcon />,
      hasSubmenu: true,
      submenu: [
        { text: '일별 출석', icon: <TodayIcon />, path: '/attendance/daily' },
        { text: '월별 출석', icon: <CalendarIcon />, path: '/attendance/monthly' }
      ]
    },
    {
      text: '학습관제 현황',
      icon: <StudyIcon />,
      hasSubmenu: true,
      submenu: [
        { text: '일일학습현황', icon: <DailyStudyIcon />, path: '/study/daily' },
        { text: '원생별 현황', icon: <StudentStudyIcon />, path: '/study/student' }
      ]
    },
    { text: '메시지 관리', icon: <MessageIcon />, path: '/messages' },
    { text: '파일 관리', icon: <FileIcon />, path: '/files' },
    {
      text: '계정 관리',
      icon: <AccountIcon />,
      hasSubmenu: true,
      submenu: [
        { text: '설정 관리', icon: <SettingsIcon />, path: '/account/settings' },
        { text: '라이선스 관리', icon: <LicenseIcon />, path: '/account/license' },
        { text: '결제 관리', icon: <PaymentIcon />, path: '/account/payment' }
      ]
    }
  ]

  // 슈퍼관리자 전용 메뉴
  const superAdminMenuItems = [
    {
      text: '슈퍼관리자',
      icon: <AdminIcon />,
      hasSubmenu: true,
      submenu: [
        { text: '가입 현황 관리', icon: <MembershipIcon />, path: '/admin/membership' },
        { text: '공지사항 관리', icon: <AnnouncementIcon />, path: '/admin/announcements' }
      ]
    }
  ]

  // 사용자 역할에 따른 메뉴 구성
  const menuItems = user?.role === 'superadmin'
    ? [...baseMenuItems, ...superAdminMenuItems]
    : baseMenuItems

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuClick = (path, hasSubmenu = false) => {
    if (hasSubmenu) {
      if (path === '출결 관리') {
        setAttendanceMenuOpen(!attendanceMenuOpen)
      } else if (path === '학습관제 현황') {
        setStudyMenuOpen(!studyMenuOpen)
      } else if (path === '계정 관리') {
        setAccountMenuOpen(!accountMenuOpen)
      } else if (path === '슈퍼관리자') {
        setAdminMenuOpen(!adminMenuOpen)
      }
    } else {
      navigate(path)
      setMobileOpen(false)
    }
  }

  const handleSubmenuClick = (path) => {
    navigate(path)
    setMobileOpen(false)
  }

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    handleProfileMenuClose()
    navigate('/')
  }

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          GFKids 출결관리
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton 
                selected={!item.hasSubmenu && location.pathname === item.path}
                onClick={() => handleMenuClick(item.hasSubmenu ? item.text : item.path, item.hasSubmenu)}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
                {item.hasSubmenu && (
                  item.text === '출결 관리' ? (
                    attendanceMenuOpen ? <ExpandLess /> : <ExpandMore />
                  ) : item.text === '학습관제 현황' ? (
                    studyMenuOpen ? <ExpandLess /> : <ExpandMore />
                  ) : item.text === '계정 관리' ? (
                    accountMenuOpen ? <ExpandLess /> : <ExpandMore />
                  ) : item.text === '슈퍼관리자' ? (
                    adminMenuOpen ? <ExpandLess /> : <ExpandMore />
                  ) : null
                )}
              </ListItemButton>
            </ListItem>
            {item.hasSubmenu && item.text === '출결 관리' && (
              <Collapse in={attendanceMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subItem) => (
                    <ListItemButton
                      key={subItem.text}
                      sx={{ pl: 4 }}
                      selected={location.pathname === subItem.path}
                      onClick={() => handleSubmenuClick(subItem.path)}
                    >
                      <ListItemIcon>
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText primary={subItem.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
            {item.hasSubmenu && item.text === '학습관제 현황' && (
              <Collapse in={studyMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subItem) => (
                    <ListItemButton
                      key={subItem.text}
                      sx={{ pl: 4 }}
                      selected={location.pathname === subItem.path}
                      onClick={() => handleSubmenuClick(subItem.path)}
                    >
                      <ListItemIcon>
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText primary={subItem.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
            {item.hasSubmenu && item.text === '계정 관리' && (
              <Collapse in={accountMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subItem) => (
                    <ListItemButton
                      key={subItem.text}
                      sx={{ pl: 4 }}
                      selected={location.pathname === subItem.path}
                      onClick={() => handleSubmenuClick(subItem.path)}
                    >
                      <ListItemIcon>
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText primary={subItem.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
            {item.hasSubmenu && item.text === '슈퍼관리자' && (
              <Collapse in={adminMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subItem) => (
                    <ListItemButton
                      key={subItem.text}
                      sx={{ pl: 4 }}
                      selected={location.pathname === subItem.path}
                      onClick={() => handleSubmenuClick(subItem.path)}
                    >
                      <ListItemIcon>
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText primary={subItem.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {(() => {
              // 메인 메뉴에서 찾기
              const mainMenu = menuItems.find(item => !item.hasSubmenu && item.path === location.pathname)
              if (mainMenu) return mainMenu.text
              
              // 서브메뉴에서 찾기
              for (const item of menuItems) {
                if (item.hasSubmenu && item.submenu) {
                  const subMenu = item.submenu.find(sub => sub.path === location.pathname)
                  if (subMenu) return subMenu.text
                }
              }
              
              return '대시보드'
            })()} 
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 사용자 메뉴 */}
      <Menu
        id="primary-account-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <AccountIcon fontSize="small" />
          </ListItemIcon>
          프로필
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          로그아웃
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* 모바일 드로어 */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        {/* 데스크톱 드로어 */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` } 
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}

export default Layout
