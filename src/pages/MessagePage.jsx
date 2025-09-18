import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Send as SendIcon,
  History as HistoryIcon,
  People as PeopleIcon
} from '@mui/icons-material'

const MessagePage = () => {
  const [tabValue, setTabValue] = useState(0)
  const [recipients, setRecipients] = useState('all')
  const [messageContent, setMessageContent] = useState('')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [messageHistory, setMessageHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [previewDialog, setPreviewDialog] = useState({ open: false, data: null })

  // 임시 데이터
  const mockStudents = [
    { id: 1, name: '김철수', class: '수학 A반', parentPhone: '010-1111-2222' },
    { id: 2, name: '이영희', class: '영어 B반', parentPhone: '010-3333-4444' },
    { id: 3, name: '박민수', class: '과학 C반', parentPhone: '010-5555-6666' }
  ]

  const mockMessageHistory = [
    {
      id: 1,
      type: 'SMS',
      recipients: '전체 학생',
      content: '다음주 화요일 휴강 안내입니다.',
      sentAt: '2025-01-19 14:30:00',
      recipientCount: 25,
      cost: 750,
      status: 'sent'
    },
    {
      id: 2,
      type: 'LMS',
      recipients: '수학 A반',
      content: '내일 중간고사 안내드립니다. 준비물: 계산기, 필기구...',
      sentAt: '2025-01-18 16:45:00',
      recipientCount: 15,
      cost: 450,
      status: 'sent'
    }
  ]

  useEffect(() => {
    loadMessageHistory()
    // 초기에 전체 학생 선택
    setSelectedStudents(mockStudents)
  }, [])

  const loadMessageHistory = () => {
    setMessageHistory(mockMessageHistory)
  }

  // 메시지 길이에 따른 타입 및 비용 계산
  const calculateMessageInfo = (content) => {
    const length = content.length
    let type = 'SMS'
    let cost = 0
    let maxLength = 90

    if (length <= 90) {
      type = 'SMS'
      cost = 30 // SMS 단가
      maxLength = 90
    } else {
      type = 'LMS'
      cost = 60 // LMS 단가
      maxLength = 2000
    }

    return { type, cost, maxLength, length }
  }

  const messageInfo = calculateMessageInfo(messageContent)

  const handleRecipientsChange = (event) => {
    setRecipients(event.target.value)
    if (event.target.value === 'all') {
      setSelectedStudents(mockStudents)
    } else {
      setSelectedStudents([])
    }
  }

  const getTotalCost = () => {
    const recipientCount = selectedStudents.length
    return messageInfo.cost * recipientCount
  }

  const handleSendMessage = () => {
    if (!messageContent.trim()) {
      alert('메시지 내용을 입력해주세요.')
      return
    }

    if (selectedStudents.length === 0) {
      alert('발송 대상을 선택해주세요.')
      return
    }

    const messageData = {
      type: messageInfo.type,
      content: messageContent,
      recipients: selectedStudents,
      recipientCount: selectedStudents.length,
      totalCost: getTotalCost()
    }

    setPreviewDialog({ open: true, data: messageData })
  }

  const confirmSend = async () => {
    setLoading(true)
    try {
      // 실제 API 호출
      console.log('메시지 발송:', previewDialog.data)
      
      // 발송 기록 추가
      const newMessage = {
        id: Date.now(),
        type: previewDialog.data.type,
        recipients: recipients === 'all' ? '전체 학생' : '선택된 학생',
        content: previewDialog.data.content,
        sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        recipientCount: previewDialog.data.recipientCount,
        cost: previewDialog.data.totalCost,
        status: 'sent'
      }
      
      setMessageHistory(prev => [newMessage, ...prev])
      
      // 폼 초기화
      setMessageContent('')
      setRecipients('all')
      setSelectedStudents(mockStudents)
      
      setPreviewDialog({ open: false, data: null })
      setTabValue(1) // 발송 기록 탭으로 이동
      
      alert('메시지가 성공적으로 발송되었습니다!')
    } catch (error) {
      console.error('메시지 발송 실패:', error)
      alert('메시지 발송에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        메시지 관리
      </Typography>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab icon={<SendIcon />} label="메시지 발송" />
        <Tab icon={<HistoryIcon />} label="발송 기록" />
      </Tabs>

      {/* 메시지 발송 탭 */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  메시지 작성
                </Typography>
                
                {/* 수신자 선택 */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>발송 대상</InputLabel>
                      <Select
                        value={recipients}
                        onChange={handleRecipientsChange}
                        label="발송 대상"
                      >
                        <MenuItem value="all">전체 학생</MenuItem>
                        <MenuItem value="class">반별 발송</MenuItem>
                        <MenuItem value="individual">개별 선택</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="발송 대상자 수"
                      value={`${selectedStudents.length}명`}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                </Grid>

                {/* 메시지 입력 */}
                <TextField
                  fullWidth
                  label="메시지 내용"
                  multiline
                  rows={6}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="발송할 메시지를 입력하세요..."
                  sx={{ mb: 2 }}
                />
                
                {/* 메시지 정보 */}
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        메시지 타입
                      </Typography>
                      <Chip 
                        label={messageInfo.type} 
                        color={messageInfo.type === 'SMS' ? 'primary' : 'secondary'}
                        size="small" 
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        글자 수
                      </Typography>
                      <Typography variant="body1">
                        {messageInfo.length}/{messageInfo.maxLength}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        건당 비용
                      </Typography>
                      <Typography variant="body1">
                        {messageInfo.cost}원
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        총 비용
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {getTotalCost().toLocaleString()}원
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {messageInfo.length > messageInfo.maxLength && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    메시지가 최대 길이를 초과했습니다. 내용을 줄여주세요.
                  </Alert>
                )}

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<SendIcon />}
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim() || selectedStudents.length === 0 || messageInfo.length > messageInfo.maxLength}
                  fullWidth
                >
                  메시지 발송하기
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  발송 대상자
                </Typography>
                
                {selectedStudents.length > 0 ? (
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {selectedStudents.map((student) => (
                      <Box 
                        key={student.id} 
                        sx={{ 
                          p: 1, 
                          mb: 1, 
                          bgcolor: 'grey.100', 
                          borderRadius: 1 
                        }}
                      >
                        <Typography variant="body2">
                          {student.name} ({student.class})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {student.parentPhone}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    발송 대상자를 선택해주세요.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 발송 기록 탭 */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              메시지 발송 기록
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>발송일시</TableCell>
                    <TableCell>타입</TableCell>
                    <TableCell>대상</TableCell>
                    <TableCell>내용</TableCell>
                    <TableCell>발송 수</TableCell>
                    <TableCell>비용</TableCell>
                    <TableCell>상태</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {messageHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        발송 기록이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    messageHistory.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell>{message.sentAt}</TableCell>
                        <TableCell>
                          <Chip 
                            label={message.type} 
                            color={message.type === 'SMS' ? 'primary' : 'secondary'}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{message.recipients}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {message.content}
                          </Typography>
                        </TableCell>
                        <TableCell>{message.recipientCount}명</TableCell>
                        <TableCell>{message.cost.toLocaleString()}원</TableCell>
                        <TableCell>
                          <Chip 
                            label={message.status === 'sent' ? '발송완료' : '발송실패'} 
                            color={message.status === 'sent' ? 'success' : 'error'}
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* 발송 확인 다이얼로그 */}
      <Dialog 
        open={previewDialog.open} 
        onClose={() => setPreviewDialog({ open: false, data: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          메시지 발송 확인
        </DialogTitle>
        <DialogContent>
          {previewDialog.data && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                아래 내용으로 메시지를 발송하시겠습니까?
              </Alert>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>메시지 타입:</strong> {previewDialog.data.type}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>발송 대상:</strong> {previewDialog.data.recipientCount}명
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>총 비용:</strong> {previewDialog.data.totalCost.toLocaleString()}원
              </Typography>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  메시지 내용:
                </Typography>
                <Typography variant="body2">
                  {previewDialog.data.content}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, data: null })}>
            취소
          </Button>
          <Button 
            variant="contained" 
            onClick={confirmSend}
            disabled={loading}
          >
            {loading ? '발송 중...' : '발송하기'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MessagePage
