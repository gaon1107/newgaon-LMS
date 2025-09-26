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
  Avatar,
  IconButton,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import {
  Person as PersonIcon,
  Edit as EditIcon,
  PhotoCamera as CameraIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  School as SchoolIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon
} from '@mui/icons-material'
import DraggableDialog from '../../components/common/DraggableDialog'

const ProfilePage = () => {
  const { user } = useContext(AuthContext)
  const [editMode, setEditMode] = useState(false)
  const [passwordDialog, setPasswordDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const [profileData, setProfileData] = useState({
    name: user?.name || '관리자',
    username: user?.username || 'admin',
    email: 'admin@gaon.co.kr',
    phone: '010-1234-5678',
    organization: '가온 학원',
    address: '서울시 강남구 테헤란로 123',
    position: '원장',
    joinDate: '2023-01-15'
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleProfileChange = (field) => (event) => {
    setProfileData(prev => ({
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

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      // API 호출 로직
      console.log('프로필 저장:', profileData)

      // 임시 지연
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSaveMessage('프로필이 성공적으로 업데이트되었습니다.')
      setEditMode(false)
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('프로필 저장 실패:', error)
      setSaveMessage('프로필 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
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

  const handleAvatarChange = () => {
    // 프로필 사진 변경 로직
    console.log('프로필 사진 변경')
    alert('프로필 사진 변경 기능은 준비 중입니다.')
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        개인정보 변경
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
        {/* 프로필 기본 정보 */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  기본 정보
                </Typography>
                <Button
                  variant={editMode ? 'outlined' : 'contained'}
                  startIcon={<EditIcon />}
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? '취소' : '편집'}
                </Button>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="이름"
                    value={profileData.name}
                    onChange={handleProfileChange('name')}
                    disabled={!editMode}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="사용자 ID"
                    value={profileData.username}
                    disabled={true}
                    helperText="사용자 ID는 변경할 수 없습니다"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="이메일"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange('email')}
                    disabled={!editMode}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="전화번호"
                    value={profileData.phone}
                    onChange={handleProfileChange('phone')}
                    disabled={!editMode}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="기관명"
                    value={profileData.organization}
                    onChange={handleProfileChange('organization')}
                    disabled={!editMode}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="직급"
                    value={profileData.position}
                    onChange={handleProfileChange('position')}
                    disabled={!editMode}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="주소"
                    value={profileData.address}
                    onChange={handleProfileChange('address')}
                    disabled={!editMode}
                    multiline
                    rows={2}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="가입일"
                    value={profileData.joinDate}
                    disabled={true}
                    helperText="가입일은 변경할 수 없습니다"
                  />
                </Grid>
              </Grid>

              {editMode && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={loading}
                    sx={{ minWidth: 200 }}
                  >
                    {loading ? '저장 중...' : '변경사항 저장'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 프로필 사진 및 추가 정보 */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                프로필 사진
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <Avatar
                    src="/images/default-avatar.png"
                    sx={{ width: 120, height: 120 }}
                  >
                    {profileData.name.charAt(0)}
                  </Avatar>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }}
                    size="small"
                    onClick={handleAvatarChange}
                  >
                    <CameraIcon />
                  </IconButton>
                </Box>

                <Typography variant="h6" gutterBottom>
                  {profileData.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {profileData.position}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* 보안 설정 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                보안 설정
              </Typography>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<LockIcon />}
                onClick={() => setPasswordDialog(true)}
                sx={{ mb: 2 }}
              >
                비밀번호 변경
              </Button>

              <Typography variant="body2" color="text.secondary">
                마지막 비밀번호 변경: 2024-01-15
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 계정 요약 정보 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              계정 요약
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText
                  primary="기관"
                  secondary={profileData.organization}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="이메일"
                  secondary={profileData.email}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary="연락처"
                  secondary={profileData.phone}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText
                  primary="주소"
                  secondary={profileData.address}
                />
              </ListItem>
            </List>
          </Paper>
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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LockIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            비밀번호 변경
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
            onClick={handleChangePassword}
            disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
          >
            {loading ? '변경 중...' : '변경'}
          </Button>
        </DialogActions>
      </DraggableDialog>
    </Box>
  )
}

export default ProfilePage