import React, { useState, useEffect } from 'react'
import { useLMS } from '../../contexts/LMSContext'
import {
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Divider,
  IconButton
} from '@mui/material'
import {
  Send as SendIcon,
  Close as CloseIcon,
  School as SchoolIcon
} from '@mui/icons-material'
import DraggableDialog from '../common/DraggableDialog'

const GroupMessageModal = ({ open, onClose }) => {
  const { students } = useLMS()
  const [messageContent, setMessageContent] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewDialog, setPreviewDialog] = useState(false)

  // 기본 메시지 템플릿
  const messageTemplates = [
    {
      id: 'general',
      name: '일반 안내',
      template: '안녕하세요. 중요한 안내사항이 있어 연락드립니다.'
    },
    {
      id: 'schedule',
      name: '일정 변경 안내',
      template: '수업 일정이 변경되었습니다. 자세한 내용은 확인 부탁드립니다.'
    },
    {
      id: 'event',
      name: '행사 안내',
      template: '다가오는 행사에 대해 안내드립니다. 많은 참여 부탁드립니다.'
    },
    {
      id: 'payment',
      name: '결제 안내',
      template: '수강료 결제 안내입니다. 기한 내 납부 부탁드립니다.'
    }
  ]

  // 임시 학생 데이터 (Context에서 가져온 데이터로 대체 예정)
  const mockStudents = students.length > 0 ? students.map(student => ({
    id: student.id,
    name: student.name,
    class: student.class || '미배정',
    parentPhone: student.parentPhone || '010-0000-0000'
  })) : [
    { id: 1, name: '김철수', class: '수학 A반', parentPhone: '010-1111-2222' },
    { id: 2, name: '이영희', class: '영어 B반', parentPhone: '010-3333-4444' },
    { id: 3, name: '박민수', class: '과학 C반', parentPhone: '010-5555-6666' },
    { id: 4, name: '최지우', class: '수학 A반', parentPhone: '010-7777-8888' },
    { id: 5, name: '정하늘', class: '영어 B반', parentPhone: '010-9999-0000' },
    { id: 6, name: '강바다', class: '과학 C반', parentPhone: '010-1234-5678' },
    { id: 7, name: '윤달님', class: '수학 A반', parentPhone: '010-2345-6789' },
    { id: 8, name: '서별님', class: '영어 B반', parentPhone: '010-3456-7890' }
  ]

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (open) {
      setMessageContent('')
      setSelectedTemplate('')
      setSelectedStudents([])
      setSelectAll(false)
    }
  }, [open])

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

  // 템플릿 선택 처리
  const handleTemplateSelect = (templateId) => {
    const template = messageTemplates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setMessageContent(template.template)
    } else {
      setSelectedTemplate('')
      setMessageContent('')
    }
  }

  // 전체 선택/해제
  const handleSelectAll = (checked) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedStudents([...mockStudents])
    } else {
      setSelectedStudents([])
    }
  }

  // 개별 학생 선택/해제
  const handleStudentSelect = (student, checked) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, student])
    } else {
      setSelectedStudents(prev => prev.filter(s => s.id !== student.id))
      setSelectAll(false)
    }
  }

  // 선택된 학생 확인
  const isStudentSelected = (studentId) => {
    return selectedStudents.some(s => s.id === studentId)
  }

  // 전체 선택 상태 업데이트
  useEffect(() => {
    if (selectedStudents.length === mockStudents.length && mockStudents.length > 0) {
      setSelectAll(true)
    } else {
      setSelectAll(false)
    }
  }, [selectedStudents, mockStudents.length])

  // 총 비용 계산
  const getTotalCost = () => {
    const recipientCount = selectedStudents.length
    return messageInfo.cost * recipientCount
  }

  // 메시지 발송 처리
  const handleSendMessage = () => {
    if (!messageContent.trim()) {
      alert('메시지 내용을 입력해주세요.')
      return
    }

    if (selectedStudents.length === 0) {
      alert('발송 대상을 선택해주세요.')
      return
    }

    if (messageInfo.length > messageInfo.maxLength) {
      alert('메시지 길이가 초과되었습니다.')
      return
    }

    setPreviewDialog(true)
  }

  // 발송 확인
  const confirmSend = async () => {
    setLoading(true)
    try {
      let successCount = 0
      let failCount = 0
      const failedStudents = [] // 실패한 학생과 이유 수집

      // 각 학생에게 개별 SMS 발송
      for (const student of selectedStudents) {
        try {
          const response = await fetch('/api/tenants/me/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify({
              studentId: student.id,
              phoneNumber: student.parentPhone || student.phone,
              message: messageContent,
              messageType: 'group_manual'
            })
          })

          const data = await response.json()

          if (response.ok) {
            successCount++
          } else {
            failCount++
            // 구체적인 실패 이유 수집
            let reason = '알 수 없는 오류'
            if (data.error?.code === 'INSUFFICIENT_SMS_BALANCE') {
              reason = 'SMS 잔액 부족'
            } else if (data.error?.code === 'INVALID_PHONE_NUMBER') {
              reason = '유효하지 않은 전화번호'
            } else if (data.error?.message) {
              reason = data.error.message
            }
            failedStudents.push({ name: student.name, reason })
            console.error(`${student.name} 발송 실패:`, data.error)
          }
        } catch (error) {
          failCount++
          failedStudents.push({ name: student.name, reason: '네트워크 오류' })
          console.error(`${student.name} 발송 에러:`, error)
        }
      }

      // 발송 완료 후 모달 닫기
      setLoading(false)
      setPreviewDialog(false)
      onClose()

      // 결과 메시지 생성
      let resultMessage = `메시지 발송 완료!\n\n성공: ${successCount}건\n실패: ${failCount}건`

      if (failedStudents.length > 0) {
        resultMessage += '\n\n[실패 내역]'
        failedStudents.forEach(({ name, reason }) => {
          resultMessage += `\n- ${name}: ${reason}`
        })
      }

      alert(resultMessage)

    } catch (error) {
      console.error('메시지 발송 실패:', error)
      setLoading(false)
      alert('[메시지 발송 오류]\n\n메시지 발송 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <>
      <DraggableDialog
        open={open}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            onClose()
          }
        }}
        disableEscapeKeyDown
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
        title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">단체메세지 발송</Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        }
      >

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3} sx={{ height: '100%' }}>
            {/* 왼쪽: 발송 내용 */}
            <Grid item xs={12} md={7}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    메시지 작성
                  </Typography>

                  {/* 템플릿 선택 */}
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>메시지 템플릿 선택 (선택사항)</InputLabel>
                    <Select
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                      label="메시지 템플릿 선택 (선택사항)"
                    >
                      <MenuItem value="">직접 작성</MenuItem>
                      <Divider />
                      {messageTemplates.map((template) => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* 메시지 입력 */}
                  <TextField
                    fullWidth
                    label="메시지 내용"
                    multiline
                    rows={8}
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="발송할 메시지를 입력하세요..."
                    sx={{ mb: 2 }}
                  />

                  {/* 메시지 정보 */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
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

                  {messageInfo.length > messageInfo.maxLength && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      메시지가 최대 길이를 초과했습니다. 내용을 줄여주세요.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* 오른쪽: 학생 선택 */}
            <Grid item xs={12} md={5}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      학생 선택
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {selectedStudents.length}명 선택됨
                    </Typography>
                  </Box>

                  {/* 전체 선택 체크박스 */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        indeterminate={selectedStudents.length > 0 && selectedStudents.length < mockStudents.length}
                      />
                    }
                    label="전체 선택"
                    sx={{ mb: 2 }}
                  />

                  <Divider sx={{ mb: 2 }} />

                  {/* 학생 목록 */}
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    <List>
                      {mockStudents.map((student) => (
                        <ListItem
                          key={student.id}
                          dense
                          sx={{
                            px: 0,
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: isStudentSelected(student.id) ? 'action.selected' : 'transparent'
                          }}
                        >
                          <ListItemIcon>
                            <Checkbox
                              checked={isStudentSelected(student.id)}
                              onChange={(e) => handleStudentSelect(student, e.target.checked)}
                              size="small"
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={student.name}
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  {student.class}
                                </Typography>
                                <br />
                                <Typography variant="caption" color="text.secondary">
                                  {student.parentPhone}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  {mockStudents.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      등록된 학생이 없습니다.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit">
            취소
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={!messageContent.trim() || selectedStudents.length === 0 || messageInfo.length > messageInfo.maxLength}
          >
            메시지 발송
          </Button>
        </DialogActions>
      </DraggableDialog>

      {/* 발송 확인 다이얼로그 */}
      <DraggableDialog
        open={previewDialog}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setPreviewDialog(false)
          }
        }}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
        title="메시지 발송 확인"
      >
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            아래 내용으로 메시지를 발송하시겠습니까?
          </Alert>

          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>메시지 타입:</strong> {messageInfo.type}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>발송 대상:</strong> {selectedStudents.length}명
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>총 비용:</strong> {getTotalCost().toLocaleString()}원
          </Typography>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              메시지 내용:
            </Typography>
            <Typography variant="body2">
              {messageContent}
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              발송 대상자:
            </Typography>
            <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
              {selectedStudents.map((student, index) => (
                <Typography key={student.id} variant="body2" sx={{ mb: 0.5 }}>
                  {index + 1}. {student.name} ({student.class})
                </Typography>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>
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
      </DraggableDialog>
    </>
  )
}

export default GroupMessageModal