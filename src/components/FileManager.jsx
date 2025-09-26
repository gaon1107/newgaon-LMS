import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  LinearProgress
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material'

const FileManager = ({ 
  title = "파일 관리",
  accept = "*/*",
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB
  onUpload,
  onDelete,
  files = []
}) => {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR')
  }

  const handleFileUpload = async (uploadFiles) => {
    if (!uploadFiles || uploadFiles.length === 0) return

    setUploading(true)
    try {
      for (const file of uploadFiles) {
        // 파일 크기 체크
        if (file.size > maxSize) {
          alert(`파일 크기가 너무 큽니다. 최대 ${formatFileSize(maxSize)}까지 업로드 가능합니다.`)
          continue
        }

        if (onUpload) {
          await onUpload(file)
        }
      }
    } catch (error) {
      console.error('파일 업로드 실패:', error)
      alert('파일 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files)
    handleFileUpload(selectedFiles)
    event.target.value = '' // 파일 선택 초기화
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragOver(false)
    
    const droppedFiles = Array.from(event.dataTransfer.files)
    handleFileUpload(droppedFiles)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDelete = async (fileId) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        if (onDelete) {
          await onDelete(fileId)
        }
      } catch (error) {
        console.error('파일 삭제 실패:', error)
        alert('파일 삭제에 실패했습니다.')
      }
    }
  }

  const handleDownload = (file) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>

        {/* 파일 업로드 영역 */}
        <Box
          sx={{
            border: `2px dashed ${dragOver ? '#1976d2' : '#ccc'}`,
            borderRadius: 1,
            p: 3,
            mb: 3,
            textAlign: 'center',
            backgroundColor: dragOver ? '#f5f5f5' : 'transparent',
            cursor: 'pointer'
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            id="file-upload"
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            파일을 여기로 드래그하거나 클릭하여 업로드
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            최대 파일 크기: {formatFileSize(maxSize)}
          </Typography>
          <Button
            variant="contained"
            component="label"
            htmlFor="file-upload"
            disabled={uploading}
            startIcon={<UploadIcon />}
          >
            파일 선택
          </Button>
        </Box>

        {/* 업로드 진행 상태 */}
        {uploading && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              파일 업로드 중...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {/* 파일 목록 */}
        {files.length > 0 ? (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              업로드된 파일 ({files.length}개)
            </Typography>
            <List>
              {files.map((file) => (
                <ListItem key={file.id} divider>
                  <ListItemIcon>
                    <FileIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          크기: {formatFileSize(file.size)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          업로드: {formatDate(file.uploadDate)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleDownload(file)}
                      sx={{ mr: 1 }}
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => handleDelete(file.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        ) : (
          <Alert severity="info">
            업로드된 파일이 없습니다.
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default FileManager
