import React, { useState, useEffect } from 'react'
import { useAnnouncements } from '../../contexts/AnnouncementContext'
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
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material'
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  GetApp as DownloadIcon,
  Image as ImageIcon,
  Description as DocumentIcon
} from '@mui/icons-material'
import DraggableDialog from '../../components/common/DraggableDialog'

const AnnouncementPage = () => {
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncements()
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)

  // 공지사항 작성/수정 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'normal',
    isActive: true,
    attachments: []
  })

  useEffect(() => {
    // 컨텍스트에서 데이터 로딩
    setFilteredAnnouncements(announcements)
    setLoading(false)
  }, [announcements])

  useEffect(() => {
    let filtered = announcements

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(announcement =>
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active'
      filtered = filtered.filter(announcement => announcement.isActive === isActive)
    }

    setFilteredAnnouncements(filtered)
  }, [searchTerm, statusFilter, announcements])

  const getCategoryColor = (category) => {
    switch (category) {
      case 'maintenance': return 'error'
      case 'update': return 'info'
      case 'guide': return 'success'
      case 'billing': return 'warning'
      default: return 'default'
    }
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error'
      case 'normal': return 'default'
      case 'low': return 'info'
      default: return 'default'
    }
  }

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return '높음'
      case 'normal': return '보통'
      case 'low': return '낮음'
      default: return '보통'
    }
  }

  const handleOpenDialog = (announcement = null, edit = false) => {
    if (announcement) {
      setSelectedAnnouncement(announcement)
      setFormData({
        title: announcement.title,
        content: announcement.content,
        category: announcement.category,
        priority: announcement.priority,
        isActive: announcement.isActive,
        attachments: announcement.attachments || []
      })
    } else {
      setSelectedAnnouncement(null)
      setFormData({
        title: '',
        content: '',
        category: 'general',
        priority: 'normal',
        isActive: true,
        attachments: []
      })
    }
    setEditMode(edit)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedAnnouncement(null)
    setEditMode(false)
    setFormData({
      title: '',
      content: '',
      category: 'general',
      priority: 'normal',
      isActive: true,
      attachments: []
    })
  }

  const handleSave = () => {
    if (editMode && selectedAnnouncement) {
      // 수정
      updateAnnouncement(selectedAnnouncement.id, {
        ...formData,
        updatedAt: new Date().toISOString().split('T')[0]
      })
    } else {
      // 신규 추가
      const newAnnouncementData = {
        ...formData,
        author: '관리자',
        status: 'published'
      }
      addAnnouncement(newAnnouncementData)
    }
    handleCloseDialog()
  }

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteAnnouncement(id)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  // 파일 업로드 처리
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)

    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const attachment = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result,
          isImage: file.type.startsWith('image/')
        }

        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, attachment]
        }))
      }
      reader.readAsDataURL(file)
    })

    // 파일 입력 초기화
    event.target.value = ''
  }

  // 첨부파일 삭제
  const handleRemoveAttachment = (attachmentId) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== attachmentId)
    }))
  }

  // 파일 크기 포맷
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>공지사항 관리</Typography>
        <Typography>데이터를 불러오는 중...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        공지사항 관리
      </Typography>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">전체 공지</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {announcements.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">활성</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {announcements.filter(a => a.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">중요</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {announcements.filter(a => a.priority === 'high').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">총 조회수</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {announcements.reduce((sum, a) => sum + a.viewCount, 0)}
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
                placeholder="제목, 내용으로 검색"
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
                  <MenuItem value="active">활성</MenuItem>
                  <MenuItem value="inactive">비활성</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog(null, true)}
              >
                새 공지사항
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 공지사항 목록 테이블 */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>제목</TableCell>
                  <TableCell>카테고리</TableCell>
                  <TableCell>우선순위</TableCell>
                  <TableCell>작성자</TableCell>
                  <TableCell>작성일</TableCell>
                  <TableCell>조회수</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAnnouncements.map((announcement) => (
                  <TableRow key={announcement.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {announcement.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {announcement.content.substring(0, 50)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getCategoryText(announcement.category)}
                        color={getCategoryColor(announcement.category)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPriorityText(announcement.priority)}
                        color={getPriorityColor(announcement.priority)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{announcement.author}</TableCell>
                    <TableCell>{formatDate(announcement.createdAt)}</TableCell>
                    <TableCell>{announcement.viewCount}</TableCell>
                    <TableCell>
                      <Chip
                        label={announcement.isActive ? '활성' : '비활성'}
                        color={announcement.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="수정">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(announcement, true)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="삭제">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(announcement.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 공지사항 상세/작성/수정 다이얼로그 */}
      <DraggableDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        title={editMode ? (selectedAnnouncement ? '공지사항 수정' : '새 공지사항 작성') : '공지사항 상세'}
      >
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="제목"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                InputProps={{ readOnly: !editMode }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="내용"
                multiline
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                InputProps={{ readOnly: !editMode }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>카테고리</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="카테고리"
                  disabled={!editMode}
                >
                  <MenuItem value="general">일반</MenuItem>
                  <MenuItem value="maintenance">점검</MenuItem>
                  <MenuItem value="update">업데이트</MenuItem>
                  <MenuItem value="guide">가이드</MenuItem>
                  <MenuItem value="billing">요금</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>우선순위</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  label="우선순위"
                  disabled={!editMode}
                >
                  <MenuItem value="low">낮음</MenuItem>
                  <MenuItem value="normal">보통</MenuItem>
                  <MenuItem value="high">높음</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    disabled={!editMode}
                  />
                }
                label="활성화"
              />
            </Grid>
            {selectedAnnouncement && !editMode && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="작성자"
                    value={selectedAnnouncement.author}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="조회수"
                    value={selectedAnnouncement.viewCount}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </>
            )}

            {/* 첨부파일 섹션 */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                첨부파일
              </Typography>

              {editMode && (
                <Box sx={{ mb: 2 }}>
                  <input
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    style={{ display: 'none' }}
                    id="file-upload"
                    multiple
                    type="file"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<AttachFileIcon />}
                      sx={{ mr: 1 }}
                    >
                      파일 첨부
                    </Button>
                  </label>
                  <Typography variant="caption" color="text.secondary">
                    이미지, PDF, 문서 파일을 첨부할 수 있습니다. (최대 10MB)
                  </Typography>
                </Box>
              )}

              {/* 첨부파일 목록 */}
              {formData.attachments && formData.attachments.length > 0 && (
                <List>
                  {formData.attachments.map((attachment) => (
                    <ListItem key={attachment.id} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {attachment.isImage ? <ImageIcon /> : <DocumentIcon />}
                            <Typography variant="body2">{attachment.name}</Typography>
                          </Box>
                        }
                        secondary={`크기: ${formatFileSize(attachment.size)} | 형식: ${attachment.type}`}
                      />
                      <ListItemSecondaryAction>
                        {attachment.isImage && (
                          <IconButton
                            edge="end"
                            onClick={() => window.open(attachment.data, '_blank')}
                            sx={{ mr: 1 }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        )}
                        {editMode && (
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveAttachment(attachment.id)}
                            color="error"
                          >
                            <CloseIcon />
                          </IconButton>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {editMode ? '취소' : '닫기'}
          </Button>
          {editMode && (
            <Button variant="contained" onClick={handleSave}>
              저장
            </Button>
          )}
        </DialogActions>
      </DraggableDialog>
    </Box>
  )
}

export default AnnouncementPage