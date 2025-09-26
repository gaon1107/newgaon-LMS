import React, { useContext } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthContext } from './contexts/AuthContext'
import { LMSProvider } from './contexts/LMSContext'
import { AttendanceProvider } from './contexts/AttendanceContext'
import { AnnouncementProvider } from './contexts/AnnouncementContext'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/RegisterPage'
import PasswordResetPage from './pages/PasswordResetPage'
import DashboardPage from './pages/DashboardPage'
import AttendanceDailyPage from './pages/AttendanceDailyPage'
import AttendanceMonthlyPage from './pages/AttendanceMonthlyPage'
import StudentPage from './pages/StudentPage'
import TeacherPage from './pages/TeacherPage'
import LecturePage from './pages/LecturePage'
import MessagePage from './pages/MessagePage'
import FilePage from './pages/FilePage'
import StudyDailyPage from './pages/study/StudyDailyPage'
import StudentStudyPage from './pages/study/StudentStudyPage'
import SettingsPage from './pages/account/SettingsPage'
import LicensePage from './pages/account/LicensePage'
import PaymentPage from './pages/account/PaymentPage'
import ProfilePage from './pages/account/ProfilePage'
import MembershipPage from './pages/admin/MembershipPage'
import AnnouncementPage from './pages/admin/AnnouncementPage'
import Layout from './components/Layout'

function AppContent() {
  const { user, isLoading } = useContext(AuthContext)
  const location = useLocation()

  // 로그인이 필요한 페이지들 (관리자 페이지)
  const privateRoutes = [
    '/dashboard',
    '/attendance/daily',
    '/attendance/monthly',
    '/study/daily',
    '/study/student',
    '/students',
    '/teachers',
    '/lectures',
    '/messages',
    '/files',
    '/account/settings',
    '/account/license',
    '/account/payment',
    '/account/profile',
    '/admin/membership',
    '/admin/announcements'
  ]

  // 슈퍼관리자 전용 페이지
  const superAdminRoutes = [
    '/admin/membership',
    '/admin/announcements'
  ]

  const isPrivateRoute = privateRoutes.includes(location.pathname)
  const isSuperAdminRoute = superAdminRoutes.includes(location.pathname)

  if (isLoading) {
    return <div>로딩 중...</div>
  }

  // 로그인하지 않은 사용자가 private route에 접근하려고 할 때
  if (!user && isPrivateRoute) {
    return <Navigate to="/" replace />
  }

  // 슈퍼관리자가 아닌 사용자가 슈퍼관리자 페이지에 접근하려고 할 때
  if (user && isSuperAdminRoute && user.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AnnouncementProvider>
      <LMSProvider>
        <AttendanceProvider>
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
        <Route path="/attendance/daily" element={
          <Layout>
            <AttendanceDailyPage />
          </Layout>
        } />
        <Route path="/attendance/monthly" element={
          <Layout>
            <AttendanceMonthlyPage />
          </Layout>
        } />
        <Route path="/study/daily" element={
          <Layout>
            <StudyDailyPage />
          </Layout>
        } />
        <Route path="/study/student" element={
          <Layout>
            <StudentStudyPage />
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
        <Route path="/account/settings" element={
          <Layout>
            <SettingsPage />
          </Layout>
        } />
        <Route path="/account/license" element={
          <Layout>
            <LicensePage />
          </Layout>
        } />
        <Route path="/account/payment" element={
          <Layout>
            <PaymentPage />
          </Layout>
        } />
        <Route path="/account/profile" element={
          <Layout>
            <ProfilePage />
          </Layout>
        } />

        {/* 슈퍼관리자 전용 페이지들 */}
        <Route path="/admin/membership" element={
          <Layout>
            <MembershipPage />
          </Layout>
        } />
        <Route path="/admin/announcements" element={
          <Layout>
            <AnnouncementPage />
          </Layout>
        } />
          </Routes>
        </AttendanceProvider>
      </LMSProvider>
    </AnnouncementProvider>
  )
}

function App() {
  return <AppContent />
}

export default App