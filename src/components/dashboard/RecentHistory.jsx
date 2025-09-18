import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  ExitToApp as ExitIcon
} from '@mui/icons-material'

const RecentHistory = () => {
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // 임시 출결 내역 데이터
  const [historyData, setHistoryData] = useState([
    {
      id: 1,
      studentName: '김철수',
      status: 'present',
      statusDescription: '등원',
      timestamp: '2024-01-15 09:15:23',
      profileImage: '/api/placeholder/40/40'
    },
    {
      id: 2,
      studentName: '박민수',
      status: 'present',
      statusDescription: '등원',
      timestamp: '2024-01-15 08:45:12',
      profileImage: '/api/placeholder/40/40'
    },
    {
      id: 3,
      studentName: '최지은',
      status: 'early_leave',
      statusDescription: '조퇴',
      timestamp: '2024-01-15 14:30:45',
      profileImage: '/api/placeholder/40/40'
    },
    {
      id: 4,
      studentName: '한미래',
      status: 'late',
      statusDescription: '지각',
      timestamp: '2024-01-15 10:15:33',
      profileImage: '/api/placeholder/40/40'
    },
    {
      id: 5,
      studentName: '정현우',
      status: 'present',
      statusDescription: '등원',
      timestamp: '2024-01-15 09:00:15',
      profileImage: '/api/placeholder/40/40'
    }
  ])

  useEffect(() => {
    let interval = null
    if (autoRefresh) {
      interval = setInterval(() => {
        handleRefresh()
      }, 30000) // 30초마다 갱신
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon sx={{ color: '#4caf50' }} />
      case 'absent':
        return <CancelIcon sx={{ color: '#f44336' }} />
      case 'late':
        return <ScheduleIcon sx={{ color: '#ff9800' }} />
      case 'early_leave':
        return <ExitIcon sx={{ color: '#9c27b0' }} />
      default:
        return <CheckCircleIcon sx={{ color: '#757575' }} />
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleRefresh = () => {
    setLastUpdate(new Date())
    // 실제로는 API 호출하여 데이터 갱신
    console.log('데이터 갱신')
  }

  const handleAutoRefreshToggle = (event) => {
    setAutoRefresh(event.target.checked)
  }

  return (
    <Card>
      <CardContent>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            최근 출결 내역
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={handleAutoRefreshToggle}
                  size="small"
                />
              }
              label="자동 갱신"
              sx={{ mr: 1 }}
            />
            <Tooltip title="새로고침">
              <IconButton size="small" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 마지막 업데이트 시간 */}
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          마지막 업데이트: {formatTimestamp(lastUpdate)}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* 출결 내역 목록 */}
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {historyData.map((item, index) => (
            <React.Fragment key={item.id}>
              <ListItem sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar src={item.profileImage} sx={{ width: 40, height: 40 }}>
                    {item.studentName.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2" sx={{ mr: 1 }}>
                        {item.studentName}
                      </Typography>
                      {getStatusIcon(item.status)}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        [{item.statusDescription}] 처리 되었습니다.
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(item.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < historyData.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>

        {historyData.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              최근 출결 내역이 없습니다.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentHistory