import React, { useState, useEffect, useContext } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material'
import { AuthContext } from '../../contexts/AuthContext'
import DraggableDialog from '../../components/common/DraggableDialog'

const MembershipPage = () => {
  const { user } = useContext(AuthContext)
  const [members, setMembers] = useState([])
  const [filteredMembers, setFilteredMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMember, setSelectedMember] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(true)

  // 신규 등록/수정용 폼 데이터
  const [formData, setFormData] = useState({
    academyName: '',
    adminName: '',
    email: '',
    phone: '',
    address: '',
    status: 'trial',
    joinDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    studentCount: 0,
    smsBalance: 5000 // 신규 가입 시 기본 5000원 제공
  })

  // 모의 데이터
  const mockMembers = [
    {
      id: 1,
      academyName: '가온학원',
      adminName: '김원장',
      email: 'gaon@academy.com',
      phone: '02-1234-5678',
      address: '서울시 강남구 테헤란로 123',
      status: 'active',
      joinDate: '2024-01-15',
      expiryDate: '2024-12-31',
      studentCount: 150,
      lastLogin: '2024-09-20',
      smsBalance: 15420
    },
    {
      id: 2,
      academyName: '미래교육원',
      adminName: '이관리',
      email: 'future@edu.com',
      phone: '02-5678-9012',
      address: '서울시 서초구 서초대로 456',
      status: 'trial',
      joinDate: '2024-09-01',
      expiryDate: '2024-09-30',
      studentCount: 45,
      lastLogin: '2024-09-19',
      smsBalance: 5000
    },
    {
      id: 3,
      academyName: '수학천재학원',
      adminName: '박선생',
      email: 'math@genius.com',
      phone: '031-1111-2222',
      address: '경기도 성남시 분당구 판교역로 789',
      status: 'expired',
      joinDate: '2023-06-10',
      expiryDate: '2024-06-09',
      studentCount: 89,
      lastLogin: '2024-06-05',
      smsBalance: 0
    },
    {
      id: 4,
      academyName: '영어마스터',
      adminName: '최영어',
      email: 'english@master.com',
      phone: '032-3333-4444',
      address: '인천시 연수구 송도국제대로 321',
      status: 'active',
      joinDate: '2024-03-20',
      expiryDate: '2025-03-19',
      studentCount: 120,
      lastLogin: '2024-09-21',
      smsBalance: 32850
    }
  ]

  useEffect(() => {
    // 데이터 로딩 시뮬레이션
    setTimeout(() => {
      setMembers(mockMembers)
      setFilteredMembers(mockMembers)
      setLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let filtered = members

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.academyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter)
    }

    setFilteredMembers(filtered)
  }, [searchTerm, statusFilter, members])

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success'
      case 'trial': return 'warning'
      case 'expired': return 'error'
      default: return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return '정상'
      case 'trial': return '체험'
      case 'expired': return '만료'
      default: return '알 수 없음'
    }
  }

  const handleViewMember = (member) => {
    setSelectedMember(member)
    setFormData({
      academyName: member.academyName,
      adminName: member.adminName,
      email: member.email,
      phone: member.phone,
      address: member.address,
      status: member.status,
      joinDate: member.joinDate,
      expiryDate: member.expiryDate,
      studentCount: member.studentCount,
      smsBalance: member.smsBalance
    })
    setIsEditMode(false)
    setDialogOpen(true)
  }

  const handleEditMember = (member) => {
    setSelectedMember(member)
    setFormData({
      academyName: member.academyName,
      adminName: member.adminName,
      email: member.email,
      phone: member.phone,
      address: member.address,
      status: member.status,
      joinDate: member.joinDate,
      expiryDate: member.expiryDate,
      studentCount: member.studentCount,
      smsBalance: member.smsBalance
    })
    setIsEditMode(true)
    setDialogOpen(true)
  }

  const handleAddNewMember = () => {
    const trialEndDate = new Date()
    trialEndDate.setMonth(trialEndDate.getMonth() + 1) // 1개월 체험 기간

    setSelectedMember(null)
    setFormData({
      academyName: '',
      adminName: '',
      email: '',
      phone: '',
      address: '',
      status: 'trial',
      joinDate: new Date().toISOString().split('T')[0],
      expiryDate: trialEndDate.toISOString().split('T')[0],
      studentCount: 0,
      smsBalance: 5000
    })
    setIsEditMode(true)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedMember(null)
    setIsEditMode(false)
    setFormData({
      academyName: '',
      adminName: '',
      email: '',
      phone: '',
      address: '',
      status: 'trial',
      joinDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      studentCount: 0,
      smsBalance: 5000
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const calculateRemainingDays = (expiryDate) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatSmsBalance = (balance) => {
    return balance.toLocaleString('ko-KR') + '원'
  }

  const getRemainingDaysDisplay = (expiryDate, status) => {
    if (status === 'expired') {
      return { text: '만료됨', color: 'error.main' }
    }

    const remainingDays = calculateRemainingDays(expiryDate)

    if (remainingDays < 0) {
      return { text: '만료됨', color: 'error.main' }
    } else if (remainingDays <= 7) {
      return { text: `${remainingDays}일 남음`, color: 'error.main' }
    } else if (remainingDays <= 30) {
      return { text: `${remainingDays}일 남음`, color: 'warning.main' }
    } else {
      return { text: `${remainingDays}일 남음`, color: 'success.main' }
    }
  }

  const handleSave = () => {
    if (selectedMember) {
      // 수정 모드
      setMembers(members.map(member =>
        member.id === selectedMember.id ? { ...member, ...formData, lastLogin: new Date().toISOString().split('T')[0] } : member
      ))
    } else {
      // 신규 등록 모드
      const newMember = {
        id: Math.max(...members.map(m => m.id)) + 1,
        ...formData,
        lastLogin: new Date().toISOString().split('T')[0]
      }
      setMembers([newMember, ...members])
    }
    handleCloseDialog()
  }

  const handleStatusChange = (memberId, newStatus) => {
    setMembers(members.map(member =>
      member.id === memberId ? { ...member, status: newStatus } : member
    ))
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>가입 현황 관리</Typography>
        <Typography>데이터를 불러오는 중...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        가입 현황 관리
      </Typography>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">총 가입 학원</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {members.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">정상 이용</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {members.filter(m => m.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">체험 중</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {members.filter(m => m.status === 'trial').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">만료</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {members.filter(m => m.status === 'expired').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 검색 및 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="학원명, 관리자명, 이메일로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>상태</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="상태"
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="active">정상</MenuItem>
                  <MenuItem value="trial">체험</MenuItem>
                  <MenuItem value="expired">만료</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddNewMember}
              >
                신규 학원 등록
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 회원 목록 테이블 */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>학원명</TableCell>
                  <TableCell>관리자</TableCell>
                  <TableCell>연락처</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>가입일</TableCell>
                  <TableCell>만료일</TableCell>
                  <TableCell>남은 기간</TableCell>
                  <TableCell>학생수</TableCell>
                  <TableCell>문자 잔액</TableCell>
                  <TableCell>최근 로그인</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {member.academyName}
                      </Typography>
                    </TableCell>
                    <TableCell>{member.adminName}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{member.phone}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(member.status)}
                        color={getStatusColor(member.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(member.joinDate)}</TableCell>
                    <TableCell>{formatDate(member.expiryDate)}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: getRemainingDaysDisplay(member.expiryDate, member.status).color,
                          fontWeight: 'medium'
                        }}
                      >
                        {getRemainingDaysDisplay(member.expiryDate, member.status).text}
                      </Typography>
                    </TableCell>
                    <TableCell>{member.studentCount}명</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: member.smsBalance === 0 ? 'error.main' :
                                 member.smsBalance < 10000 ? 'warning.main' : 'text.primary',
                          fontWeight: 'medium'
                        }}
                      >
                        {formatSmsBalance(member.smsBalance)}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(member.lastLogin)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="수정">
                          <IconButton
                            size="small"
                            onClick={() => handleEditMember(member)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 상세보기 다이얼로그 */}
      <DraggableDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        title={selectedMember ? (isEditMode ? '학원 정보 수정' : '학원 상세 정보') : '신규 학원 등록'}
      >
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="학원명"
                required
                value={formData.academyName}
                onChange={(e) => handleFormChange('academyName', e.target.value)}
                InputProps={{ readOnly: !isEditMode && !!selectedMember }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="관리자명"
                required
                value={formData.adminName}
                onChange={(e) => handleFormChange('adminName', e.target.value)}
                InputProps={{ readOnly: !isEditMode && !!selectedMember }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="이메일"
                required
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                InputProps={{ readOnly: !isEditMode && !!selectedMember }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="전화번호"
                required
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                InputProps={{ readOnly: !isEditMode && !!selectedMember }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="주소"
                required
                value={formData.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
                InputProps={{ readOnly: !isEditMode && !!selectedMember }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>상태</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  label="상태"
                  disabled={!isEditMode && !!selectedMember}
                >
                  <MenuItem value="active">정상</MenuItem>
                  <MenuItem value="trial">체험</MenuItem>
                  <MenuItem value="expired">만료</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="가입일"
                type="date"
                value={formData.joinDate}
                onChange={(e) => handleFormChange('joinDate', e.target.value)}
                InputProps={{ readOnly: !isEditMode && !!selectedMember }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="만료일"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleFormChange('expiryDate', e.target.value)}
                InputProps={{
                  readOnly: selectedMember && !isEditMode ? true :
                           selectedMember && isEditMode && user?.role !== 'superadmin' ? true :
                           false
                }}
                InputLabelProps={{ shrink: true }}
                helperText={
                  selectedMember && isEditMode && user?.role !== 'superadmin'
                    ? "만료일은 슈퍼관리자만 수정할 수 있습니다"
                    : ""
                }
              />
            </Grid>
            {selectedMember && !isEditMode && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="남은 기간"
                  value={getRemainingDaysDisplay(formData.expiryDate, formData.status).text}
                  InputProps={{
                    readOnly: true,
                    style: {
                      color: getRemainingDaysDisplay(formData.expiryDate, formData.status).color
                    }
                  }}
                />
              </Grid>
            )}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="학생수"
                type="number"
                value={formData.studentCount}
                onChange={(e) => handleFormChange('studentCount', parseInt(e.target.value) || 0)}
                InputProps={{ readOnly: !isEditMode && !!selectedMember }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="문자 잔액"
                type="number"
                value={formData.smsBalance}
                onChange={(e) => handleFormChange('smsBalance', parseInt(e.target.value) || 0)}
                InputProps={{
                  readOnly: !isEditMode && !!selectedMember,
                  endAdornment: '원'
                }}
                helperText={isEditMode || !selectedMember ? "충전할 금액을 입력하세요" : ""}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {isEditMode || !selectedMember ? '취소' : '닫기'}
          </Button>
          {!selectedMember && (
            <Button variant="contained" onClick={handleSave}>
              등록
            </Button>
          )}
          {selectedMember && !isEditMode && (
            <Button
              variant="contained"
              onClick={() => setIsEditMode(true)}
            >
              수정
            </Button>
          )}
          {selectedMember && isEditMode && (
            <Button variant="contained" onClick={handleSave}>
              저장
            </Button>
          )}
        </DialogActions>
      </DraggableDialog>
    </Box>
  )
}

export default MembershipPage