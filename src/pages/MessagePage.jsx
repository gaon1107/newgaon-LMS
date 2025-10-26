import React, { useState, useEffect } from 'react'
import { useLMS } from '../contexts/LMSContext'
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
  DialogContent,
  DialogActions,
  IconButton,
  Divider
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import {
  Send as SendIcon,
  History as HistoryIcon,
  People as PeopleIcon,
  Article as TemplateIcon,
  Payment as PaymentIcon,
  School as SchoolIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExitToApp as OutingIcon,
  Home as ReturnIcon
} from '@mui/icons-material'
import DraggableDialog from '../components/common/DraggableDialog'

const MessagePage = () => {
  const { students, lectures } = useLMS()
  const [tabValue, setTabValue] = useState(0)
  const [recipients, setRecipients] = useState('all')
  const [messageContent, setMessageContent] = useState('')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [messageHistory, setMessageHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [previewDialog, setPreviewDialog] = useState({ open: false, data: null })

  // 메세지 템플릿 관리
  const [messageTemplates, setMessageTemplates] = useState([])
  const [templateDialog, setTemplateDialog] = useState({ open: false, editing: null })
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: '',
    template: '',
    description: ''
  })

  // 기본 메세지 템플릿
  const defaultTemplates = [
    {
      id: 'payment_request',
      name: '결제 요청 메세지',
      type: 'payment',
      template: '안녕하세요. [학생명] 학생의 [강의명] 수강료 [비용]원 결제를 요청드립니다. 납부 기한: [납부기한]',
      description: '월 수강료 결제 요청 시 사용',
      isDefault: true
    },
    {
      id: 'attendance_in',
      name: '등원 알림 메세지',
      type: 'attendance',
      template: '[학생명] 학생이 [시간]에 등원하였습니다.',
      description: '학생 등원 시 자동 발송',
      isDefault: true
    },
    {
      id: 'attendance_out',
      name: '하원 알림 메세지',
      type: 'attendance',
      template: '[학생명] 학생이 [시간]에 하원하였습니다.',
      description: '학생 하원 시 자동 발송',
      isDefault: true
    },
    {
      id: 'outing_alert',
      name: '외출 알림 메세지',
      type: 'outing',
      template: '[학생명] 학생이 [시간]에 외출하였습니다. 목적: [외출목적]',
      description: '학생 외출 시 자동 발송',
      isDefault: true
    },
    {
      id: 'return_alert',
      name: '복귀 알림 메세지',
      type: 'return',
      template: '[학생명] 학생이 [시간]에 복귀하였습니다.',
      description: '학생 복귀 시 자동 발송',
      isDefault: true
    }
  ]

  // 임시 학생 데이터 (Context에서 가져온 데이터로 대체 예정)
  const mockStudents = students.length > 0 ? students.map(student => ({
    id: student.id,
    name: student.name,
    class: student.class || '미배정',
    parentPhone: student.parentPhone
  })) : [
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
    loadMessageTemplates()
    // 초기에 전체 학생 선택
    setSelectedStudents(mockStudents)
  }, [])

  // 발송 기록 탭 선택 시 API 호출
  useEffect(() => {
    if (tabValue === 1) {
      loadMessageHistory()
    }
  }, [tabValue])

  useEffect(() => {
    // 학생 데이터가 변경되면 selectedStudents 업데이트
    if (recipients === 'all') {
      setSelectedStudents(mockStudents)
    }
  }, [students])

  const loadMessageHistory = async () => {
    setHistoryLoading(true)
    try {
      const response = await fetch('/api/tenants/me/sms/usage?page=1&limit=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // API 데이터를 DataGrid 형식으로 변환
        const formattedHistory = data.data.logs.map((log, index) => ({
          id: log.id,
          date: new Date(log.sent_at).toLocaleString('ko-KR'),
          type: 'SMS',
          recipients: log.student_name || log.phone_number,
          content: log.message,
          status: log.status,
          messageType: log.message_type
        }))

        setMessageHistory(formattedHistory)
        console.log('✅ 발송 기록 로드 완료:', formattedHistory.length + '건')
      } else {
        console.error('발송 기록 조회 실패:', data.error)
        setMessageHistory([])
      }
    } catch (error) {
      console.error('발송 기록 로드 오류:', error)
      setMessageHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const loadMessageTemplates = () => {
    try {
      const savedTemplates = localStorage.getItem('lms_message_templates')
      const savedDefaultTemplates = localStorage.getItem('lms_default_templates')

      let updatedDefaultTemplates = defaultTemplates

      // 수정된 기본 템플릿이 있다면 로드
      if (savedDefaultTemplates) {
        const parsedDefaults = JSON.parse(savedDefaultTemplates)
        updatedDefaultTemplates = defaultTemplates.map(dt => {
          const saved = parsedDefaults.find(pt => pt.id === dt.id)
          return saved ? { ...dt, ...saved, isDefault: true } : dt
        })
      }

      if (savedTemplates) {
        const parsed = JSON.parse(savedTemplates)
        setMessageTemplates([...updatedDefaultTemplates, ...parsed])
      } else {
        setMessageTemplates(updatedDefaultTemplates)
      }
    } catch (error) {
      console.error('템플릿 로딩 실패:', error)
      setMessageTemplates(defaultTemplates)
    }
  }

  const saveMessageTemplates = (templates) => {
    try {
      const customTemplates = templates.filter(t => !t.isDefault)
      const modifiedDefaultTemplates = templates.filter(t => t.isDefault && defaultTemplates.find(dt => dt.id === t.id))

      localStorage.setItem('lms_message_templates', JSON.stringify(customTemplates))
      localStorage.setItem('lms_default_templates', JSON.stringify(modifiedDefaultTemplates))
    } catch (error) {
      console.error('템플릿 저장 실패:', error)
    }
  }

  // 템플릿에서 실제 데이터로 치환하는 함수
  const generateMessageFromTemplate = (template, student, options = {}) => {
    let message = template.template

    // 공통 치환
    message = message.replace(/\[학생명\]/g, student.name)
    message = message.replace(/\[시간\]/g, options.time || new Date().toLocaleTimeString())

    // 결제 관련 치환
    if (template.type === 'payment') {
      const studentLectures = lectures.filter(lecture =>
        student.selectedClasses && student.selectedClasses.includes(lecture.id)
      )
      const lectureNames = studentLectures.map(l => l.name).join(', ')
      const totalFee = studentLectures.reduce((sum, l) => sum + (l.fee || 0), 0)

      message = message.replace(/\[강의명\]/g, lectureNames || '미배정')
      message = message.replace(/\[비용\]/g, totalFee.toLocaleString())
      message = message.replace(/\[납부기한\]/g, options.dueDate || '매월 25일')
    }

    // 외출 관련 치환
    if (template.type === 'outing') {
      message = message.replace(/\[외출목적\]/g, options.outingPurpose || '개인 사정')
    }

    return message
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

  // 메시지 기록 DataGrid 컬럼 정의
  const historyColumns = [
    {
      field: 'sentAt',
      headerName: '발송일시',
      width: 160,
      minWidth: 140,
      maxWidth: 200,
      resizable: true,
      renderCell: (params) => {
        return (
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        )
      }
    },
    {
      field: 'type',
      headerName: '타입',
      width: 100,
      minWidth: 80,
      maxWidth: 120,
      resizable: true,
      renderCell: (params) => {
        return (
          <Chip
            label={params.value}
            color={params.value === 'SMS' ? 'primary' : 'secondary'}
            size="small"
          />
        )
      }
    },
    {
      field: 'recipients',
      headerName: '대상',
      width: 120,
      minWidth: 100,
      maxWidth: 180,
      resizable: true,
      renderCell: (params) => {
        return (
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        )
      }
    },
    {
      field: 'content',
      headerName: '내용',
      width: 300,
      minWidth: 200,
      maxWidth: 500,
      resizable: true,
      renderCell: (params) => {
        return (
          <Typography variant="body2" noWrap sx={{ maxWidth: '100%' }} title={params.value}>
            {params.value}
          </Typography>
        )
      }
    },
    {
      field: 'recipientCount',
      headerName: '발송 수',
      width: 100,
      minWidth: 80,
      maxWidth: 120,
      resizable: true,
      renderCell: (params) => {
        return (
          <Typography variant="body2" noWrap>
            {params.value}명
          </Typography>
        )
      }
    },
    {
      field: 'cost',
      headerName: '비용',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      resizable: true,
      renderCell: (params) => {
        return (
          <Typography variant="body2" fontWeight="bold" color="primary" noWrap>
            {params.value.toLocaleString()}원
          </Typography>
        )
      }
    },
    {
      field: 'status',
      headerName: '상태',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      resizable: true,
      renderCell: (params) => {
        return (
          <Chip
            label={params.value === 'sent' ? '발송완료' : '발송실패'}
            color={params.value === 'sent' ? 'success' : 'error'}
            size="small"
          />
        )
      }
    }
  ]

  const handleRecipientsChange = (event) => {
    setRecipients(event.target.value)
    if (event.target.value === 'all') {
      setSelectedStudents(mockStudents)
    } else {
      setSelectedStudents([])
    }
  }

  // 템플릿 선택 처리
  const handleTemplateSelect = (templateId) => {
    const template = messageTemplates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      if (selectedStudents.length === 1) {
        // 단일 학생 선택 시 템플릿에 데이터 적용
        const generatedMessage = generateMessageFromTemplate(template, selectedStudents[0])
        setMessageContent(generatedMessage)
      } else {
        // 다중 선택 시 템플릿 원본 표시
        setMessageContent(template.template)
      }
    }
  }

  // 템플릿 관리 함수들
  const handleTemplateDialogOpen = (template = null) => {
    if (template) {
      setTemplateForm({
        name: template.name,
        type: template.type,
        template: template.template,
        description: template.description
      })
      setTemplateDialog({ open: true, editing: template })
    } else {
      setTemplateForm({
        name: '',
        type: '',
        template: '',
        description: ''
      })
      setTemplateDialog({ open: true, editing: null })
    }
  }

  const handleTemplateDialogClose = () => {
    setTemplateDialog({ open: false, editing: null })
    setTemplateForm({
      name: '',
      type: '',
      template: '',
      description: ''
    })
  }

  const handleTemplateSubmit = () => {
    const newTemplate = {
      id: templateDialog.editing ? templateDialog.editing.id : `custom_${Date.now()}`,
      ...templateForm
    }

    let updatedTemplates
    if (templateDialog.editing) {
      updatedTemplates = messageTemplates.map(t =>
        t.id === templateDialog.editing.id ? newTemplate : t
      )
    } else {
      updatedTemplates = [...messageTemplates, newTemplate]
    }

    setMessageTemplates(updatedTemplates)
    saveMessageTemplates(updatedTemplates)
    handleTemplateDialogClose()
  }

  const handleTemplateDelete = (templateId) => {
    const template = messageTemplates.find(t => t.id === templateId)

    // 기본 템플릿은 삭제 불가
    if (template && template.isDefault) {
      alert('기본 템플릿은 삭제할 수 없습니다. 수정만 가능합니다.')
      return
    }

    if (window.confirm('정말 삭제하시겠습니까?')) {
      const updatedTemplates = messageTemplates.filter(t => t.id !== templateId)
      setMessageTemplates(updatedTemplates)
      saveMessageTemplates(updatedTemplates)
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
      const { content, recipients: studentList } = previewDialog.data

      let successCount = 0
      let failCount = 0
      const failedStudents = [] // 실패한 학생과 이유 수집

      // 각 학생에게 개별 SMS 발송
      for (const student of studentList) {
        try {
          const response = await fetch('/api/tenants/me/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify({
              studentId: student.id,
              phoneNumber: student.parentPhone,
              message: content,
              messageType: 'bulk_manual'
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

      // 폼 초기화
      setMessageContent('')
      setRecipients('all')
      setSelectedStudents(mockStudents)

      setPreviewDialog({ open: false, data: null })

      // 발송 기록 새로고침
      await loadMessageHistory()
      setTabValue(1) // 발송 기록 탭으로 이동

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
      alert('[메시지 발송 오류]\n\n메시지 발송 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.')
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
        <Tab icon={<TemplateIcon />} label="템플릿 관리" />
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

                {/* 템플릿 선택 */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
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
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {template.type === 'payment' ? <PaymentIcon sx={{ mr: 1 }} /> : <SchoolIcon sx={{ mr: 1 }} />}
                              {template.name}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

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
              메시지 발송 기록 ({messageHistory.length}건)
            </Typography>

            <Box sx={{ height: 600, width: '100%', overflow: 'auto' }}>
              <DataGrid
                rows={messageHistory}
                columns={historyColumns}
                loading={historyLoading}
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 25 }
                  }
                }}
                disableRowSelectionOnClick
                getRowHeight={() => 60}
                autoHeight={false}
                // 컬럼 드래그 앤 드롭 활성화
                disableColumnReorder={false}
                // 컬럼 리사이징 활성화
                disableColumnResize={false}
                // 컬럼 메뉴 활성화
                disableColumnMenu={false}
                // 컬럼 필터 활성화
                disableColumnFilter={false}
                // 컬럼 정렬 활성화
                disableColumnSort={false}
                sx={{
                  minWidth: 1000,
                  '& .MuiDataGrid-cell': {
                    display: 'flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'visible'
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: 'grey.50',
                    fontWeight: 'bold'
                  },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: 'action.hover'
                  },
                  '& .MuiDataGrid-columnHeader': {
                    whiteSpace: 'nowrap'
                  },
                  // 컬럼 경계선 스타일링
                  '& .MuiDataGrid-columnSeparator': {
                    display: 'block',
                    '&:hover': {
                      color: 'primary.main'
                    }
                  },
                  // 컬럼 헤더 드래그 가능 스타일
                  '& .MuiDataGrid-columnHeader:hover .MuiDataGrid-columnSeparator': {
                    visibility: 'visible'
                  }
                }}
                localeText={{
                  noRowsLabel: '발송 기록이 없습니다.',
                  toolbarFilters: '필터',
                  toolbarFiltersLabel: '필터 보기',
                  toolbarDensity: '행 높이',
                  toolbarDensityLabel: '행 높이',
                  toolbarDensityCompact: '좁게',
                  toolbarDensityStandard: '기본',
                  toolbarDensityComfortable: '넓게',
                  toolbarColumns: '컬럼',
                  toolbarColumnsLabel: '컬럼 선택',
                  toolbarExport: '내보내기',
                  toolbarExportLabel: '내보내기',
                  toolbarExportCSV: 'CSV 다운로드',
                  toolbarExportPrint: '인쇄'
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 템플릿 관리 탭 */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    메시지 템플릿 관리
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleTemplateDialogOpen()}
                  >
                    새 템플릿 추가
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {messageTemplates.map((template) => (
                    <Grid item xs={12} md={6} key={template.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {template.type === 'payment' ? (
                                <PaymentIcon color="primary" sx={{ mr: 1 }} />
                              ) : template.type === 'outing' ? (
                                <OutingIcon color="warning" sx={{ mr: 1 }} />
                              ) : template.type === 'return' ? (
                                <ReturnIcon color="success" sx={{ mr: 1 }} />
                              ) : (
                                <SchoolIcon color="secondary" sx={{ mr: 1 }} />
                              )}
                              <Typography variant="h6">
                                {template.name}
                              </Typography>
                            </Box>
                            <Box>
                              <IconButton
                                size="small"
                                onClick={() => handleTemplateDialogOpen(template)}
                                sx={{ mr: 1 }}
                                title={template.isDefault ? '기본 템플릿 수정' : '템플릿 수정'}
                              >
                                <EditIcon />
                              </IconButton>
                              {!template.isDefault && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleTemplateDelete(template.id)}
                                  title="템플릿 삭제"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </Box>
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {template.description}
                          </Typography>

                          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {template.template}
                            </Typography>
                          </Box>

                          <Box sx={{ mt: 2 }}>
                            <Chip
                              label={
                                template.type === 'payment' ? '결제 관련' :
                                template.type === 'outing' ? '외출 관련' :
                                template.type === 'return' ? '복귀 관련' :
                                template.type === 'attendance' ? '등하원 관련' : '일반'
                              }
                              color={
                                template.type === 'payment' ? 'primary' :
                                template.type === 'outing' ? 'warning' :
                                template.type === 'return' ? 'success' :
                                'secondary'
                              }
                              size="small"
                            />
                            {template.isDefault && (
                              <Chip
                                label="기본 템플릿"
                                color="default"
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {messageTemplates.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      등록된 템플릿이 없습니다.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 발송 확인 다이얼로그 */}
      <DraggableDialog
        open={previewDialog.open}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setPreviewDialog({ open: false, data: null })
          }
        }}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
        title="메시지 발송 확인"
      >
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
      </DraggableDialog>

      {/* 템플릿 편집 다이얼로그 */}
      <DraggableDialog
        open={templateDialog.open}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            handleTemplateDialogClose()
          }
        }}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
        title={templateDialog.editing ? '템플릿 수정' : '새 템플릿 추가'}
      >
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="템플릿 이름 *"
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>템플릿 유형 *</InputLabel>
                <Select
                  value={templateForm.type}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value }))}
                  label="템플릿 유형 *"
                >
                  <MenuItem value="payment">결제 관련</MenuItem>
                  <MenuItem value="attendance">등하원 관련</MenuItem>
                  <MenuItem value="outing">외출 관련</MenuItem>
                  <MenuItem value="return">복귀 관련</MenuItem>
                  <MenuItem value="general">일반</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="템플릿 내용 *"
                multiline
                rows={6}
                value={templateForm.template}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, template: e.target.value }))}
                helperText="사용 가능한 변수: [학생명], [시간], [강의명], [비용], [납부기한], [외출목적]"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="설명"
                multiline
                rows={2}
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="이 템플릿의 용도를 설명해주세요"
              />
            </Grid>
          </Grid>

          {/* 변수 설명 */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              📝 템플릿 변수 안내
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <code>[학생명]</code> - 학생 이름으로 자동 치환
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <code>[시간]</code> - 현재 시간으로 자동 치환
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <code>[강의명]</code> - 학생이 수강 중인 강의명 (결제 관련 템플릿)
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <code>[비용]</code> - 총 수강료 (결제 관련 템플릿)
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <code>[납부기한]</code> - 결제 마감일 (결제 관련 템플릿)
            </Typography>
            <Typography variant="body2">
              • <code>[외출목적]</code> - 외출 목적/사유 (외출 관련 템플릿)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTemplateDialogClose}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleTemplateSubmit}
            disabled={templateDialog.editing ? false : (!templateForm.name || !templateForm.type || !templateForm.template)}
          >
            {templateDialog.editing ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </DraggableDialog>
    </Box>
  )
}

export default MessagePage
