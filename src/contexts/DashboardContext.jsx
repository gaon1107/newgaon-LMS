import React, { createContext, useState, useCallback } from 'react'

export const DashboardContext = createContext()

export const DashboardProvider = ({ children }) => {
  const [refreshSignal, setRefreshSignal] = useState(0)

  // 대시보드 데이터 갱신 신호 전송
  const triggerRefresh = useCallback(() => {
    setRefreshSignal(prev => prev + 1)
    console.log('🔄 대시보드 갱신 신호 전송')
  }, [])

  return (
    <DashboardContext.Provider value={{ refreshSignal, triggerRefresh }}>
      {children}
    </DashboardContext.Provider>
  )
}
