/**
 * 전화번호 자동 포맷팅 함수
 * @param {string} value - 입력된 전화번호 값
 * @returns {string} 포맷된 전화번호 (예: 010-1234-5678)
 */
export const formatPhoneNumber = (value) => {
  // 숫자만 추출
  const numbers = value.replace(/[^0-9]/g, '')
  
  // 빈 문자열이면 그대로 반환
  if (!numbers) return ''
  
  // 010으로 시작하는 경우 (11자리)
  if (numbers.startsWith('010')) {
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    } else {
      // 11자리 초과시 잘라내기
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }
  }
  // 011, 016, 017, 018, 019로 시작하는 경우
  else if (numbers.startsWith('011') || numbers.startsWith('016') || numbers.startsWith('017') || numbers.startsWith('018') || numbers.startsWith('019')) {
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }
  }
  // 02로 시작하는 경우 (서울)
  else if (numbers.startsWith('02')) {
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5, 9)}`
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
    } else {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
    }
  }
  // 기타 지역번호 (3자리)
  else {
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }
  }
}

/**
 * 금액 자동 포맷팅 함수 (입력용)
 * @param {string|number} value - 입력된 금액 값
 * @returns {string} 포맷된 금액 (예: 5,000,000)
 */
export const formatCurrency = (value) => {
  // null, undefined, 빈 문자열 처리
  if (!value && value !== 0) return ''
  
  // 이미 숫자인 경우 (백엔드에서 온 데이터)
  if (typeof value === 'number') {
    return Math.round(value).toLocaleString('ko-KR')
  }
  
  // 문자열 처리
  if (typeof value === 'string') {
    // 소수점이 있는 경우 (예: "50000000.00")
    if (value.includes('.')) {
      const num = parseFloat(value)
      return Math.round(num).toLocaleString('ko-KR')
    }
    
    // 숫자만 추출 (입력 중인 경우)
    const numbers = value.replace(/[^0-9]/g, '')
    if (!numbers) return ''
    
    return Number(numbers).toLocaleString('ko-KR')
  }
  
  return ''
}

/**
 * 포맷된 금액을 숫자로 변환 (저장용)
 * @param {string} value - 포맷된 금액 문자열
 * @returns {number} 순수 숫자
 */
export const parseCurrency = (value) => {
  if (!value) return 0
  return Number(value.replace(/[^0-9]/g, ''))
}

/**
 * 금액 표시용 포맷 (읽기 전용, 원 포함)
 * @param {number} value - 금액 숫자
 * @returns {string} 포맷된 금액 문자열 (예: 5,000,000원)
 */
export const displayCurrency = (value) => {
  if (!value) return '-'
  return `${Number(value).toLocaleString('ko-KR')}원`
}

/**
 * 전화번호에서 하이픈 제거 (저장용)
 * @param {string} value - 포맷된 전화번호
 * @returns {string} 숫자만 있는 전화번호
 */
export const unformatPhoneNumber = (value) => {
  return value.replace(/[^0-9]/g, '')
}

/**
 * ISO 날짜를 yyyy-MM-dd 형식으로 변환
 * @param {string} dateString - ISO 8601 날짜 문자열 또는 yyyy-MM-dd 형식
 * @returns {string} yyyy-MM-dd 형식의 날짜 문자열
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  
  // 이미 yyyy-MM-dd 형식이면 그대로 반환
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }
  
  // ISO 8601 형식 (2025-10-06T15:00:00.000Z) 변환
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return ''
    }
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  } catch (error) {
    console.error('날짜 변환 오류:', error)
    return ''
  }
}

/**
 * 날짜를 표시용 형식으로 변환 (yyyy년 MM월 dd일)
 * @param {string} dateString - 날짜 문자열
 * @returns {string} 한글 형식의 날짜 문자열
 */
export const displayDate = (dateString) => {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '-'
    }
    
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    
    return `${year}년 ${month}월 ${day}일`
  } catch (error) {
    return '-'
  }
}
