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
  Tooltip,
  Alert
} from '@mui/material'
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material'
import { AuthContext } from '../../contexts/AuthContext'
import { DashboardContext } from '../../contexts/DashboardContext'
import DraggableDialog from '../../components/common/DraggableDialog'
import { tenantService } from '../../services/apiService'
import { formatPhoneNumber, formatBusinessNumber, unformatPhoneNumber, unformatBusinessNumber } from '../../utils/formatters'

const MembershipPage = () => {
  const { user } = useContext(AuthContext)
  const { triggerRefresh } = useContext(DashboardContext)
  const [members, setMembers] = useState([])
  const [filteredMembers, setFilteredMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMember, setSelectedMember] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 신규 등록/수정용 폼 데이터
  const [formData, setFormData] = useState({
    academyName: '',
    adminName: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
    joinDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    studentCount: 0,
    smsBalance: 5000 // 신규 가입 시 기본 5000원 제공
  })

  // DB에서 학원 목록 조회
  const fetchTenants = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await tenantService.getAllTenants()

      if (response.success) {
        // DB 데이터를 UI 형식에 맞게 변환
        const formattedMembers = response.data.map(tenant => ({
          id: tenant.id,
          academyName: tenant.academyName,
          adminName: tenant.ownerName || tenant.adminName || '-',
          adminId: tenant.adminId || tenant.adminUsername || '-', // 등록한 아이디
          email: tenant.email || tenant.adminEmail || '-',
          phone: tenant.phone ? formatPhoneNumber(tenant.phone) : '-',
          address: tenant.address || '-',
          status: tenant.status,
          joinDate: tenant.joinDate || tenant.createdAt?.split('T')[0],
          expiryDate: tenant.expiryDate,
          studentCount: tenant.studentCount || 0,
          lastLogin: tenant.lastLogin ? tenant.lastLogin.split('T')[0] : '-',
          smsBalance: tenant.smsBalance || 0,
          subscriptionPlan: tenant.subscriptionPlan,
          businessNumber: tenant.businessNumber,
          ownerName: tenant.ownerName || tenant.adminName,
          maxStudents: tenant.maxStudents,
          maxInstructors: tenant.maxInstructors
        }))

        setMembers(formattedMembers)
        setFilteredMembers(formattedMembers)
      }
    } catch (err) {
      console.error('학원 목록 조회 실패:', err)
      setError('학원 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
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
      case 'inactive': return 'warning'
      case 'suspended': return 'error'
      default: return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return '정상'
      case 'inactive': return '비활성'
      case 'suspended': return '정지'
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
      joinDate: member.joinDate ? member.joinDate.split('T')[0] : '',
      expiryDate: member.expiryDate ? member.expiryDate.split('T')[0] : '',
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
      joinDate: member.joinDate ? member.joinDate.split('T')[0] : '',
      expiryDate: member.expiryDate ? member.expiryDate.split('T')[0] : '',
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

  const handleSave = async () => {
    try {
      if (selectedMember) {
        // 수정 모드 - API 호출 (포맷 해제 후 전송)
        const updateData = {
          name: formData.academyName,
          businessNumber: formData.businessNumber ? unformatBusinessNumber(formData.businessNumber) : null,
          ownerName: formData.ownerName || formData.adminName,
          phone: formData.phone ? unformatPhoneNumber(formData.phone) : null,
          email: formData.email,
          address: formData.address,
          status: formData.status,
          subscriptionPlan: formData.subscriptionPlan || 'basic',
          subscriptionEndDate: formData.expiryDate,
          maxStudents: formData.maxStudents || 1000,
          maxInstructors: formData.maxInstructors || 50,
          smsBalance: formData.smsBalance
        }

        const response = await tenantService.updateTenant(selectedMember.id, updateData)

        if (response.success) {
          alert('학원 정보가 수정되었습니다.')
          await fetchTenants() // 목록 새로고침
          triggerRefresh() // 🔄 대시보드 데이터 갱신 신호 전송
          console.log('✅ 대시보드 갱신 신호 전송 완료')
        }
      } else {
        // 신규 등록은 회원가입 페이지에서만 가능
        alert('신규 학원 등록은 회원가입 페이지를 이용해주세요.')
      }
      handleCloseDialog()
    } catch (err) {
      console.error('학원 정보 저장 실패:', err)
      console.error('에러 상세:', err.response?.data)
      console.error('에러 메시지:', err.message)
      alert(`학원 정보 저장에 실패했습니다.\n${err.response?.data?.error || err.message}`)
    }
  }

  const handleStatusChange = async (memberId, newStatus) => {
    try {
      // 해당 학원 정보 찾기
      const member = members.find(m => m.id === memberId)
      if (!member) {
        alert('학원을 찾을 수 없습니다.')
        return
      }

      // 상태 변경 확인
      const statusText = {
        'active': '정상',
        'inactive': '비활성',
        'suspended': '정지'
      }

      if (!window.confirm(`"${member.academyName}" 학원을 "${statusText[newStatus]}" 상태로 변경하시겠습니까?`)) {
        return
      }

      // 백엔드에 상태 변경 요청 (undefined 값을 null로 변환, 포맷 해제)
      const updateData = {
        name: member.academyName,
        businessNumber: member.businessNumber ? unformatBusinessNumber(member.businessNumber) : null,
        ownerName: member.ownerName || null,
        phone: member.phone ? unformatPhoneNumber(member.phone) : null,
        email: member.email || null,
        address: member.address || null,
        status: newStatus,
        subscriptionPlan: member.subscriptionPlan || 'basic',
        subscriptionEndDate: member.expiryDate || null,
        maxStudents: member.maxStudents || 1000,
        maxInstructors: member.maxInstructors || 50,
        smsBalance: member.smsBalance || 5000
      }

      const response = await tenantService.updateTenant(memberId, updateData)

      if (response.success) {
        // 프론트엔드 state 업데이트
        setMembers(members.map(m =>
          m.id === memberId ? { ...m, status: newStatus } : m
        ))
        alert(`학원 상태가 "${statusText[newStatus]}"(으)로 변경되었습니다.`)
      }
    } catch (err) {
      console.error('상태 변경 실패:', err)
      alert('상태 변경에 실패했습니다.')
    }
  }

  const handleDeleteMember = async (member) => {
    if (!window.confirm(`정말로 "${member.academyName}" 학원을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      const response = await tenantService.deleteTenant(member.id)

      if (response.success) {
        alert('학원이 삭제되었습니다.')
        await fetchTenants() // 목록 새로고침
      }
    } catch (err) {
      console.error('학원 삭제 실패:', err)
      alert('학원 삭제에 실패했습니다.')
    }
  }

  const handleFormChange = (field, value) => {
    // 전화번호와 사업자번호는 자동 포맷팅 적용
    let formattedValue = value

    if (field === 'phone') {
      formattedValue = formatPhoneNumber(value)
    } else if (field === 'businessNumber') {
      formattedValue = formatBusinessNumber(value)
    }

    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
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

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 32px rgba(102, 126, 234, 0.4)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', padding: '24px' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>총 가입 학원</Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', fontSize: '2.5rem' }}>
                {members.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            boxShadow: '0 8px 24px rgba(245, 87, 108, 0.3)',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 32px rgba(245, 87, 108, 0.4)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', padding: '24px' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>정상 이용</Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', fontSize: '2.5rem' }}>
                {members.filter(m => m.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            boxShadow: '0 8px 24px rgba(79, 172, 254, 0.3)',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 32px rgba(79, 172, 254, 0.4)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', padding: '24px' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>비활성</Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', fontSize: '2.5rem' }}>
                {members.filter(m => m.status === 'inactive').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
            boxShadow: '0 8px 24px rgba(250, 112, 154, 0.3)',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 32px rgba(250, 112, 154, 0.4)'
            }
          }}>
            <CardContent sx={{ textAlign: 'center', padding: '24px' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>정지</Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', fontSize: '2.5rem' }}>
                {members.filter(m => m.status === 'suspended').length}
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
                  <MenuItem value="inactive">비활성</MenuItem>
                  <MenuItem value="suspended">정지</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => fetchTenants()}
                sx={{
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  padding: '12px 24px',
                  fontSize: '1rem',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 6px 25px rgba(25, 118, 210, 0.4)',
                    transform: 'translateY(-2px)',
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
                  }
                }}
              >
                새로고침
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
                  <TableCell>등록한 아이디</TableCell>
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
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {member.adminId}
                      </Typography>
                    </TableCell>
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
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteMember(member)}
                          >
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
        <DialogContent sx={{ 
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          padding: '24px',
          borderRadius: '0 0 12px 12px'
        }}>
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
                  <MenuItem value="inactive">비활성</MenuItem>
                  <MenuItem value="suspended">정지</MenuItem>
                  <MenuItem value="trial">체험</MenuItem>
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
        <DialogActions sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          padding: '16px 24px',
          borderTop: '1px solid #e0e0e0',
          borderRadius: '0 0 12px 12px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1
        }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              color: '#666',
              '&:hover': {
                backgroundColor: '#e0e0e0'
              }
            }}
          >
            {isEditMode ? '취소' : '닫기'}
          </Button>
          {selectedMember && !isEditMode && (
            <Button
              variant="contained"
              onClick={() => setIsEditMode(true)}
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              수정
            </Button>
          )}
          {selectedMember && isEditMode && (
            <Button 
              variant="contained" 
              onClick={handleSave}
              sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              저장
            </Button>
          )}
        </DialogActions>
      </DraggableDialog>
    </Box>
  )
}

export default MembershipPage