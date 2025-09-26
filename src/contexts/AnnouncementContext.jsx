import React, { createContext, useContext, useState, useEffect } from 'react'

const AnnouncementContext = createContext()

export const useAnnouncements = () => {
  const context = useContext(AnnouncementContext)
  if (!context) {
    throw new Error('useAnnouncements must be used within an AnnouncementProvider')
  }
  return context
}

export const AnnouncementProvider = ({ children }) => {
  const [announcements, setAnnouncements] = useState([])

  // 초기 데이터 로딩 (실제로는 API에서 가져올 데이터)
  useEffect(() => {
    // 기본 공지사항 데이터
    const initialAnnouncements = [
      {
        id: 1,
        title: '신규 학원 출결관리 시스템 오픈!',
        content: 'GFKids 출결관리 시스템이 새롭게 오픈했습니다. 더욱 편리하고 안전한 학원 관리를 위해 다양한 기능을 제공합니다.',
        category: '시스템',
        priority: 'high',
        status: 'published',
        author: '시스템 관리자',
        createdAt: '2024-09-20',
        isActive: true,
        views: 156,
        attachments: []
      },
      {
        id: 2,
        title: '출석 체크 기능 업데이트 안내',
        content: '출석 체크 기능이 개선되었습니다. 이제 더욱 정확하고 빠른 출석 관리가 가능합니다.',
        category: '업데이트',
        priority: 'medium',
        status: 'published',
        author: '개발팀',
        createdAt: '2024-09-18',
        isActive: true,
        views: 89,
        attachments: []
      }
    ]
    setAnnouncements(initialAnnouncements)
  }, [])

  const addAnnouncement = (announcementData) => {
    const newAnnouncement = {
      ...announcementData,
      id: Math.max(...announcements.map(a => a.id), 0) + 1,
      createdAt: new Date().toISOString().split('T')[0],
      views: 0,
      attachments: announcementData.attachments || []
    }
    setAnnouncements(prev => [newAnnouncement, ...prev])
  }

  const updateAnnouncement = (id, announcementData) => {
    setAnnouncements(prev =>
      prev.map(announcement =>
        announcement.id === id ? { ...announcement, ...announcementData } : announcement
      )
    )
  }

  const deleteAnnouncement = (id) => {
    setAnnouncements(prev => prev.filter(announcement => announcement.id !== id))
  }

  const incrementViews = (id) => {
    setAnnouncements(prev =>
      prev.map(announcement =>
        announcement.id === id
          ? { ...announcement, views: announcement.views + 1 }
          : announcement
      )
    )
  }

  // 공개된 공지사항만 반환
  const getPublishedAnnouncements = () => {
    return announcements.filter(announcement =>
      announcement.status === 'published' && announcement.isActive
    )
  }

  // 중요 공지사항 반환
  const getImportantAnnouncements = () => {
    return announcements.filter(announcement =>
      announcement.status === 'published' &&
      announcement.isActive &&
      announcement.priority === 'high'
    )
  }

  const value = {
    announcements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    incrementViews,
    getPublishedAnnouncements,
    getImportantAnnouncements
  }

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
    </AnnouncementContext.Provider>
  )
}