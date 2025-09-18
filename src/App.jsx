import React, { useContext } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthContext } from './contexts/AuthContext'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/RegisterPage'
import PasswordResetPage from './pages/PasswordResetPage'
import DashboardPage from './pages/DashboardPage'
import AttendancePage from './pages/AttendancePage'
import StudentPage from './pages/StudentPage'
import TeacherPage from './pages/TeacherPage'
import LecturePage from './pages/LecturePage'
import MessagePage from './pages/MessagePage'
import FilePage from './pages/FilePage'
import Layout from './components/Layout'

function App() {
  const { user, isLoading } = useContext(AuthContext)

  if (isLoading) {
    return <div>로딩 중...</div>
  }

  // 로그인이 필요한 페이지들 (관리자 페이지)
  const privateRoutes = [
    '/dashboard',
    '/attendance',
    '/students', 
    '/teachers',
    '/lectures',
    '/messages',
    '/files'
  ]

  const location = useLocation()
  const isPrivateRoute = privateRoutes.includes(location.pathname)

  // 로그인하지 않은 사용자가 private route에 접근하려고 할 때
  if (!user && isPrivateRoute) {
    return <Navigate to="/" replace />
  }

  return (
    <Routes>
      {/* 공개 페이지들 (센차와 동일한 구조) */}
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/password-reset" element={<PasswordResetPage />} />
      
      {/* 로그인 후 관리자 페이지들 */}
      <Route path="/dashboard" element={
        <Layout>
          <DashboardPage />
        </Layout>
      } />
      <Route path="/attendance" element={
        <Layout>
          <AttendancePage />
        </Layout>
      } />
      <Route path="/students" element={
        <Layout>
          <StudentPage />
        </Layout>
      } />
      <Route path="/teachers" element={
        <Layout>
          <TeacherPage />
        </Layout>
      } />
      <Route path="/lectures" element={
        <Layout>
          <LecturePage />
        </Layout>
      } />
      <Route path="/messages" element={
        <Layout>
          <MessagePage />
        </Layout>
      } />
      <Route path="/files" element={
        <Layout>
          <FilePage />
        </Layout>
      } />
    </Routes>
  )
}

export default App
