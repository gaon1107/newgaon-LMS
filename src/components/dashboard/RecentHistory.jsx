import React, { useState, useEffect } from 'react'
import { useAttendance } from '../../contexts/AttendanceContext'
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
  // AttendanceContext 안전하게 접근
  let attendanceContext = null
  let attendanceRecords = []
  try {
    attendanceContext = useAttendance()
    attendanceRecords = attendanceContext?.attendanceRecords || []
  } catch (error) {
    console.warn('AttendanceContext를 사용할 수 없습니다:', error)
  }
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // 실제 출결 데이터에서 최근 5개 가져오기
  const getRecentHistory = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return []
    }

    // 최근 기록 순으로 정렬하고 상위 5개 선택
    return attendanceRecords
      .sort((a, b) => new Date(b.taggedAt) - new Date(a.taggedAt))
      .slice(0, 5)
      .map(record => ({
        id: record.id,
        studentName: record.studentName,
        status: getStatusFromDescription(record.stateDescription),
        statusDescription: record.stateDescription,
        timestamp: record.taggedAt,
        profileImage: record.thumbnailData || '/api/placeholder/40/40'
      }))
  }

  // 상태 설명에서 status 변환
  const getStatusFromDescription = (description) => {
    switch (description) {
      case '등원':
      case '입실':
        return 'present'
      case '하원':
      case '퇴실':
        return 'exit'
      case '지각':
        return 'late'
      case '조퇴':
        return 'early_leave'
      default:
        return 'present'
    }
  }

  // historyData를 실시간으로 업데이트
  const [historyData, setHistoryData] = useState([])

  // attendanceRecords가 변경될 때마다 historyData 업데이트
  useEffect(() => {
    setHistoryData(getRecentHistory())
    setLastUpdate(new Date())
  }, [attendanceRecords])

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
      case 'exit':
        return <ExitIcon sx={{ color: '#2196f3' }} />
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
    try {
      // AttendanceContext에서 최신 데이터를 다시 가져와서 업데이트
      if (attendanceContext?.attendanceRecords) {
        setHistoryData(getRecentHistory())
      }
      setLastUpdate(new Date())
    } catch (error) {
      console.warn('출결 데이터 새로고침 중 오류:', error)
      // 컨텍스트가 없어도 로컬 상태는 업데이트
      setHistoryData(getRecentHistory())
      setLastUpdate(new Date())
    }
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
                  <Avatar
                    src={item.profileImage?.startsWith('/uploads')
                      ? `http://localhost:5000${item.profileImage}`
                      : item.profileImage}
                    sx={{ width: 40, height: 40 }}
                  >
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