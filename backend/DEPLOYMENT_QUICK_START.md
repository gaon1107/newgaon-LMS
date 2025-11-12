# ⚡ 프로덕션 배포 빠른 시작 가이드

## 🎯 핵심 요약

개발 완료 후 실제 서비스를 시작하려면:

### 1️⃣ 서버 준비 (1-2시간)
```
서버 구매 → Node.js + MySQL 설치 → 방화벽 설정
```

### 2️⃣ 백엔드 배포 (30분)
```
코드 업로드 → 환경 설정 → 데이터베이스 초기화 → 서버 실행
```

### 3️⃣ 앱 설정 변경 (10분)
```
AppConfig.java 수정 → 앱 리빌드 → APK 배포
```

---

## 📝 서버에서 실행할 명령어 (복사해서 사용)

### 1단계: 서버 기본 설정
```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Node.js 18 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL 설치
sudo apt install -y mysql-server
sudo mysql_secure_installation

# 방화벽 설정
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 2단계: 백엔드 배포
```bash
# 프로젝트 디렉토리 생성
sudo mkdir -p /var/www
cd /var/www

# 코드 업로드 (로컬 PC에서 실행)
# scp -r "C:\Users\psh08\Desktop\newgaon-LMS\backend" root@서버IP:/var/www/

# 의존성 설치
cd /var/www/backend
npm install --production

# PM2 설치
sudo npm install -g pm2
```

### 3단계: 데이터베이스 설정
```bash
# MySQL 접속
sudo mysql -u root -p

# 데이터베이스 생성 (MySQL 프롬프트에서)
CREATE DATABASE lms_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lms_admin'@'localhost' IDENTIFIED BY '강력한비밀번호';
GRANT ALL PRIVILEGES ON lms_production.* TO 'lms_admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 데이터베이스 초기화
node config/initDatabase.js
```

### 4단계: 환경 설정 및 실행
```bash
# .env 파일 수정
nano .env

# 반드시 변경해야 할 항목:
# NODE_ENV=production
# DB_PASSWORD=실제비밀번호
# JWT_SECRET=랜덤64자이상
# JWT_REFRESH_SECRET=랜덤64자이상

# 서버 실행
pm2 start server.js --name "lms-backend"
pm2 startup
pm2 save
```

---

## 📱 앱 설정 변경

### AppConfig.java 수정
파일: `app/src/main/java/com/newgaon/gfkids/common/AppConfig.java`

```java
// 21번 줄 변경:
// 기존: private static final String API_BASE_URL = "http://192.168.0.17:5000/";
// 변경: private static final String API_BASE_URL = "http://서버IP주소/";
// 또는: private static final String API_BASE_URL = "https://api.yourschool.com/";
```

### 앱 빌드
```bash
# Android Studio에서:
Build → Generate Signed Bundle / APK → APK → Release

# 또는 명령어로:
cd "C:\Users\psh08\Desktop\GFKids app"
.\gradlew assembleRelease
```

---

## ✅ 테스트 확인

```bash
# 서버에서
curl http://localhost:5000/health
# 예상 결과: {"success":true,"status":"healthy","database":"connected"}

# 외부에서 (다른 PC)
curl http://서버IP/health
# 같은 결과가 나와야 함

# 앱에서
# 로그인 → 학생 목록 → 출석 체크 → 모두 정상 동작 확인
```

---

## 🔐 보안 강화 (선택사항이지만 강력 권장)

### Nginx 설치 및 SSL 설정
```bash
# Nginx 설치
sudo apt install -y nginx

# Certbot 설치 (무료 SSL)
sudo apt install -y certbot python3-certbot-nginx

# SSL 인증서 발급 (도메인이 있는 경우)
sudo certbot --nginx -d api.yourschool.com
```

---

## 🚨 중요! 반드시 변경할 것

1. ✅ MySQL 비밀번호 (강력하게)
2. ✅ .env의 JWT_SECRET (랜덤 64자 이상)
3. ✅ 기본 관리자 비밀번호 (admin/admin → 변경)
4. ✅ 앱의 API_BASE_URL (실제 서버 주소로)

---

## 💰 예상 비용

### 클라우드 서버 (월 기준)
- AWS EC2 t3.medium: 약 $40-50 (한화 약 5만원)
- Naver Cloud: 약 3-5만원
- 국내 호스팅 (Cafe24 등): 약 2-3만원

### 도메인
- .com 도메인: 연 1-2만원
- .kr 도메인: 연 2-3만원

### SSL 인증서
- Let's Encrypt: **무료**
- 상업용 SSL: 연 10-30만원

---

## 📞 문제 발생 시

1. **서버 접속 안 됨**
   - 방화벽 확인: `sudo ufw status`
   - 서버 실행 확인: `pm2 status`

2. **앱에서 연결 안 됨**
   - 서버 IP 확인: `curl ifconfig.me`
   - API 응답 확인: `curl http://서버IP/health`
   - 앱 설정 확인: AppConfig.java의 API_BASE_URL

3. **데이터베이스 에러**
   - MySQL 실행 확인: `sudo systemctl status mysql`
   - .env 설정 확인: DB_PASSWORD 등

---

## 📚 상세 가이드

전체 내용은 `PRODUCTION_DEPLOYMENT.md` 파일을 참고하세요.

---

**배포 시간 예상**: 총 2-3시간
**난이도**: 중급 (Linux 기본 명령어 지식 필요)
