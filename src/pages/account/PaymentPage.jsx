import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Grid,
  Alert,
  Chip,
  Divider,
  TextField,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import DraggableDialog from '../../components/common/DraggableDialog'

const PaymentPage = () => {
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('card')
  const [promotionCode, setPromotionCode] = useState('')
  const [isPromotionApplied, setIsPromotionApplied] = useState(false)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState([])

  // 상품 정의
  const products = [
    {
      id: 'smart_attendance',
      name: '스마트출결',
      description: '기본 출결 관리 서비스',
      basePrice: 5000, // 월 기본 가격 (부가세 별도)
      icon: '📚',
      features: [
        '실시간 출결 관리',
        '학부모 알림 서비스',
        '출결 통계 및 리포트',
        '기본 메시지 발송'
      ]
    },
    {
      id: 'smart_attendance_plus',
      name: '스마트출결+학습관제',
      description: '출결 관리 + 학습 관제 통합 서비스',
      basePrice: 10000, // 월 기본 가격 (부가세 별도)
      icon: '🎓',
      features: [
        '실시간 출결 관리',
        '학부모 알림 서비스',
        '출결 통계 및 리포트',
        '학습 진도 관리',
        '성취도 분석',
        '개별 학습 리포트',
        '고급 메시지 발송'
      ],
      popular: true
    }
  ]

  // 결제 기간 정의
  const terms = [
    {
      id: '1month',
      name: '1개월',
      months: 1,
      discount: 0,
      description: '1개월 단위 결제'
    },
    {
      id: '3months',
      name: '3개월',
      months: 3,
      discount: 0.05, // 5% 할인
      description: '3개월 단위 결제 (5% 할인)'
    },
    {
      id: '6months',
      name: '6개월',
      months: 6,
      discount: 0.10, // 10% 할인
      description: '6개월 단위 결제 (10% 할인)'
    },
    {
      id: '12months',
      name: '1년',
      months: 12,
      discount: 0.15, // 15% 할인
      description: '1년 단위 결제 (15% 할인)',
      popular: true
    }
  ]

  // 결제 방법 정의
  const paymentMethods = [
    { id: 'card', name: '신용카드', description: '신용카드 결제' },
    { id: 'transfer', name: '계좌이체', description: '실시간 계좌이체' },
    { id: 'virtual', name: '가상계좌', description: '가상계좌 입금' }
  ]

  // 가격 계산
  const calculatePrice = () => {
    if (!selectedProduct || !selectedTerm) return { subtotal: 0, tax: 0, total: 0 }

    const product = products.find(p => p.id === selectedProduct)
    const term = terms.find(t => t.id === selectedTerm)

    if (!product || !term) return { subtotal: 0, tax: 0, total: 0 }

    const baseAmount = product.basePrice * term.months
    const discountAmount = baseAmount * term.discount
    const subtotal = baseAmount - discountAmount
    const tax = Math.round(subtotal * 0.1) // 부가세 10%
    const total = subtotal + tax

    return {
      subtotal: Math.round(subtotal),
      tax,
      total,
      discount: Math.round(discountAmount),
      originalPrice: baseAmount
    }
  }

  const price = calculatePrice()

  // 프로모션 코드 적용
  const handlePromotionApply = () => {
    if (promotionCode.trim()) {
      // 간단한 프로모션 코드 검증 (실제로는 서버에서 검증)
      if (promotionCode.toUpperCase() === 'WELCOME10') {
        setIsPromotionApplied(true)
        alert('프로모션 코드가 적용되었습니다! (10% 추가 할인)')
      } else {
        alert('유효하지 않은 프로모션 코드입니다.')
      }
    }
  }

  const handlePromotionCancel = () => {
    setPromotionCode('')
    setIsPromotionApplied(false)
  }

  // 결제 처리
  const handlePayment = () => {
    if (!selectedProduct || !selectedTerm) {
      alert('상품과 결제 기간을 선택해주세요.')
      return
    }
    setPaymentDialog(true)
  }

  const processPayment = () => {
    // 실제 결제 처리 로직
    const product = products.find(p => p.id === selectedProduct)
    const term = terms.find(t => t.id === selectedTerm)
    const method = paymentMethods.find(m => m.id === selectedMethod)

    const newPayment = {
      id: Date.now(),
      product: product.name,
      term: term.name,
      method: method.name,
      amount: price.total,
      date: new Date().toISOString().split('T')[0],
      status: 'completed'
    }

    setPaymentHistory(prev => [newPayment, ...prev])
    setPaymentDialog(false)

    // 폼 초기화
    setSelectedProduct('')
    setSelectedTerm('')
    setPromotionCode('')
    setIsPromotionApplied(false)

    alert('결제가 완료되었습니다!')
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        결제 관리
      </Typography>

      <Grid container spacing={3}>
        {/* 왼쪽: 결제 폼 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PaymentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                결제 정보
              </Typography>

              {/* 프로모션 코드 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  프로모션 코드 <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                </Typography>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs>
                    <TextField
                      size="small"
                      placeholder="프로모션 코드를 입력하세요"
                      value={promotionCode}
                      onChange={(e) => setPromotionCode(e.target.value)}
                      disabled={isPromotionApplied}
                    />
                  </Grid>
                  <Grid item>
                    {!isPromotionApplied ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handlePromotionApply}
                        disabled={!promotionCode.trim()}
                      >
                        적용
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={handlePromotionCancel}
                      >
                        취소
                      </Button>
                    )}
                  </Grid>
                </Grid>
                {isPromotionApplied && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    프로모션 코드가 적용되었습니다!
                  </Alert>
                )}
              </Box>

              {/* 상품 선택 */}
              <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                <FormLabel component="legend">
                  <Typography variant="subtitle1" fontWeight="bold">
                    상품 선택 *
                  </Typography>
                </FormLabel>
                <RadioGroup
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  {products.map((product) => (
                    <Box key={product.id} sx={{ mb: 2 }}>
                      <FormControlLabel
                        value={product.id}
                        control={<Radio />}
                        label={
                          <Box sx={{ ml: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" fontWeight="bold">
                                {product.icon} {product.name}
                              </Typography>
                              {product.popular && (
                                <Chip
                                  label="인기"
                                  size="small"
                                  color="primary"
                                  icon={<StarIcon />}
                                />
                              )}
                              <Typography variant="body2" color="primary" fontWeight="bold">
                                월 {product.basePrice.toLocaleString()}원 (부가세별도)
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {product.description}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              {product.features.map((feature, index) => (
                                <Chip
                                  key={index}
                                  label={feature}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </Box>
                          </Box>
                        }
                        sx={{ alignItems: 'flex-start', mb: 1 }}
                      />
                    </Box>
                  ))}
                </RadioGroup>
              </FormControl>

              {/* 사용 기간 선택 */}
              <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                <FormLabel component="legend">
                  <Typography variant="subtitle1" fontWeight="bold">
                    사용 기간 *
                  </Typography>
                </FormLabel>
                <RadioGroup
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                >
                  <Grid container spacing={1}>
                    {terms.map((term) => (
                      <Grid item xs={12} sm={6} key={term.id}>
                        <FormControlLabel
                          value={term.id}
                          control={<Radio />}
                          label={
                            <Box sx={{ ml: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" fontWeight="bold">
                                  <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                  {term.name}
                                </Typography>
                                {term.popular && (
                                  <Chip
                                    label="추천"
                                    size="small"
                                    color="secondary"
                                    icon={<StarIcon />}
                                  />
                                )}
                                {term.discount > 0 && (
                                  <Chip
                                    label={`${(term.discount * 100)}% 할인`}
                                    size="small"
                                    color="error"
                                  />
                                )}
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {term.description}
                              </Typography>
                            </Box>
                          }
                          sx={{ alignItems: 'flex-start', mb: 1 }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </RadioGroup>
              </FormControl>

              {/* 결제 방법 선택 */}
              <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                <FormLabel component="legend">
                  <Typography variant="subtitle1" fontWeight="bold">
                    결제 방법 *
                  </Typography>
                </FormLabel>
                <RadioGroup
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  row
                >
                  {paymentMethods.map((method) => (
                    <FormControlLabel
                      key={method.id}
                      value={method.id}
                      control={<Radio />}
                      label={method.name}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              {/* 결제 금액 */}
              {selectedProduct && selectedTerm && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    결제 금액
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>기본 금액:</Typography>
                    <Typography>{price.originalPrice?.toLocaleString()}원</Typography>
                  </Box>
                  {price.discount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="error">기간 할인:</Typography>
                      <Typography color="error">-{price.discount.toLocaleString()}원</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>소계:</Typography>
                    <Typography>{price.subtotal.toLocaleString()}원</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>부가세 (10%):</Typography>
                    <Typography>{price.tax.toLocaleString()}원</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight="bold">총 결제 금액:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {price.total.toLocaleString()}원
                    </Typography>
                  </Box>
                </Box>
              )}

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handlePayment}
                disabled={!selectedProduct || !selectedTerm}
                startIcon={<PaymentIcon />}
              >
                결제하기
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 오른쪽: 결제 안내 및 이전 결제 내역 */}
        <Grid item xs={12} md={4}>
          {/* 최근 결제 내역 */}
          {paymentHistory.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  최근 결제 내역
                </Typography>
                {paymentHistory.slice(0, 3).map((payment) => (
                  <Box key={payment.id} sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {payment.product} {payment.term}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      [{payment.method}] {payment.amount.toLocaleString()}원
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {payment.date} 결제 완료
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 결제 안내 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                결제 안내
              </Typography>
              <Box component="ol" sx={{ pl: 2, m: 0 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    회원 가입 후 30일 무료 사용이 가능합니다.
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    결제 신청이 완료되면 홈 화면에 잔여 기간이 갱신되니 꼭 확인 바랍니다.
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    상품 변경 시에는 고객센터로 별도 문의를 주세요.
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    프로모션 코드를 입력 후 결제 진행하시면 무료 사용 기한 연장 서비스가 적용됩니다.
                  </Typography>
                </Box>
                <Box component="li">
                  <Typography variant="body2">
                    부가세는 별도로 부과되며, 세금계산서 발행이 가능합니다.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 결제 확인 다이얼로그 */}
      <DraggableDialog
        open={paymentDialog}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setPaymentDialog(false)
          }
        }}
        disableEscapeKeyDown
        title="결제 확인"
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            아래 내용으로 결제를 진행하시겠습니까?
          </Alert>

          {selectedProduct && selectedTerm && (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>상품:</strong> {products.find(p => p.id === selectedProduct)?.name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>기간:</strong> {terms.find(t => t.id === selectedTerm)?.name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>결제방법:</strong> {paymentMethods.find(m => m.id === selectedMethod)?.name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>결제금액:</strong> {price.total.toLocaleString()}원 (부가세 포함)
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>
            취소
          </Button>
          <Button variant="contained" onClick={processPayment}>
            결제 진행
          </Button>
        </DialogActions>
      </DraggableDialog>
    </Box>
  )
}

export default PaymentPage