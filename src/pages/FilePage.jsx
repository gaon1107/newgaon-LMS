import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Tabs,
  Tab,
  Alert
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  GetApp as DownloadIcon,
  TableChart as ExcelIcon,
  Assessment as ReportIcon
} from '@mui/icons-material'
import FileManager from '../components/FileManager'

const FilePage = () => {
  const [tabValue, setTabValue] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [studentFiles, setStudentFiles] = useState([])
  const [loading, setLoading] = useState(false)

  // 임시 파일 데이터
  const mockFiles = [
    {
      id: 1,
      name: '학생명단_2025년1월.xlsx',
      size: 15360,
      uploadDate: '2025-01-15T09:30:00',
      url: '/api/files/download/1'
    },
    {
      id: 2,
      name: '출결통계_12월.pdf',
      size: 2048000,
      uploadDate: '2025-01-10T14:20:00',
      url: '/api/files/download/2'
    }
  ]

  const mockStudentFiles = [
    {
      id: 3,
      name: '학생일괄등록_양식.xlsx',
      size: 8192,
      uploadDate: '2025-01-01T00:00:00',
      url: '/templates/student_template.xlsx'
    }
  ]

  // 데이터 로딩
  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      // 실제로는 API에서 파일 목록을 가져옴
      setUploadedFiles(mockFiles)
      setStudentFiles(mockStudentFiles)
    } catch (error) {
      console.error('파일 목록 로딩 실패:', error)
    }
  }

  // 파일 업로드 처리
  const handleFileUpload = async (file) => {
    try {
      // 실제 API 호출
      // const response = await fileService.uploadFile(file)
      
      // 임시 처리
      const newFile = {
        id: Date.now(),
        name: file.name,
        size: file.size,
        uploadDate: new Date().toISOString(),
        url: URL.createObjectURL(file)
      }
      
      setUploadedFiles(prev => [newFile, ...prev])
      return newFile
    } catch (error) {
      console.error('파일 업로드 실패:', error)
      throw error
    }
  }

  // 학생 파일 업로드 처리
  const handleStudentFileUpload = async (file) => {
    try {
      // 엑셀 파일만 허용
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        throw new Error('엑셀 파일만 업로드 가능합니다.')
      }
      
      // 실제 API 호출
      // const response = await fileService.uploadStudentExcel(file)
      
      // 임시 처리
      const newFile = {
        id: Date.now(),
        name: file.name,
        size: file.size,
        uploadDate: new Date().toISOString(),
        url: URL.createObjectURL(file)
      }
      
      setStudentFiles(prev => [newFile, ...prev])
      return newFile
    } catch (error) {
      console.error('학생 파일 업로드 실패:', error)
      throw error
    }
  }

  // 파일 삭제
  const handleFileDelete = async (fileId) => {
    try {
      // 실제 API 호출
      // await fileService.deleteFile(fileId)
      
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
    } catch (error) {
      console.error('파일 삭제 실패:', error)
      throw error
    }
  }

  // 학생 파일 삭제
  const handleStudentFileDelete = async (fileId) => {
    try {
      setStudentFiles(prev => prev.filter(file => file.id !== fileId))
    } catch (error) {
      console.error('파일 삭제 실패:', error)
      throw error
    }
  }

  // 출결 데이터 다운로드
  const handleDownloadAttendanceReport = async () => {
    try {
      setLoading(true)
      
      // 실제 API 호출
      // const response = await fileService.downloadAttendanceExcel(startDate, endDate)
      
      // 임시 처리 - 가짜 파일 다운로드
      alert('출결통계 엑셀 파일을 다운로드합니다.')
      
      setLoading(false)
    } catch (error) {
      console.error('출결 리포트 다운로드 실패:', error)
      setLoading(false)
    }
  }

  // 학생 등록 템플릿 다운로드
  const handleDownloadStudentTemplate = () => {
    alert('학생일괄등록 양식을 다운로드합니다.')
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        파일 관리
      </Typography>

      {/* 빠른 액션 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={handleDownloadStudentTemplate}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ExcelIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h6">학생 등록 양식</Typography>
              <Typography variant="body2" color="text.secondary">
                엑셀 양식 다운로드
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={handleDownloadAttendanceReport}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ReportIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">출결 통계</Typography>
              <Typography variant="body2" color="text.secondary">
                엑셀 리포트 다운로드
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <UploadIcon sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
              <Typography variant="h6">파일 업로드</Typography>
              <Typography variant="body2" color="text.secondary">
                {uploadedFiles.length}개 파일
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <DownloadIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6">다운로드</Typography>
              <Typography variant="body2" color="text.secondary">
                파일 관리
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 탭 메뉴 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="fullWidth"
        >
          <Tab label="일반 파일" />
          <Tab label="학생 일괄 등록" />
          <Tab label="리포트 다운로드" />
        </Tabs>
      </Paper>

      {/* 탭 내용 */}
      {tabValue === 0 && (
        <Alert severity="info">
          <Typography variant="body2">
            일반 파일 업로드 기능입니다. FileManager 컴포넌트가 필요합니다.
          </Typography>
        </Alert>
      )}

      {tabValue === 1 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              학생 정보를 일괄 등록하려면 먼저 양식을 다운로드하여 작성한 후 업로드하세요.
            </Typography>
          </Alert>
          
          <Button
            variant="outlined"
            startIcon={<ExcelIcon />}
            onClick={handleDownloadStudentTemplate}
            sx={{ mb: 3 }}
          >
            학생 등록 양식 다운로드
          </Button>
          
          <Alert severity="info">
            <Typography variant="body2">
              학생 파일 업로드 기능입니다. FileManager 컴포넌트가 필요합니다.
            </Typography>
          </Alert>
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            리포트 다운로드
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    출결 통계 리포트
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    월별/일별 출결 현황을 엑셀 파일로 다운로드합니다.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadAttendanceReport}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? '생성 중...' : '다운로드'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    학생 명단
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    현재 등록된 학생 명단을 엑셀 파일로 다운로드합니다.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    fullWidth
                  >
                    다운로드
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    강사 현황
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    강사 정보 및 담당 강의 현황을 다운로드합니다.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    fullWidth
                  >
                    다운로드
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  )
}

export default FilePage
