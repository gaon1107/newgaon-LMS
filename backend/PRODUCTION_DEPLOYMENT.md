# 🚀 GFKids 앱 + LMS 백엔드 프로덕션 배포 가이드

## 📋 목차
1. [개요](#개요)
2. [서버 환경 요구사항](#서버-환경-요구사항)
3. [서버 준비 단계](#서버-준비-단계)
4. [백엔드 배포](#백엔드-배포)
5. [데이터베이스 설정](#데이터베이스-설정)
6. [앱 설정 변경](#앱-설정-변경)
7. [보안 설정](#보안-설정)
8. [도메인 및 SSL 설정](#도메인-및-ssl-설정)
9. [모니터링 및 유지보수](#모니터링-및-유지보수)

---

## 개요

현재는 개발 환경(로컬 PC)에서 테스트 중이며, 실제 서비스 배포 시 다음과 같은 구성이 필요합니다:

```
현재 (개발):                      배포 후 (프로덕션):
┌─────────────────┐              ┌──────────────────────┐
│   개발 PC       │              │   프로덕션 서버       │
│                 │              │                      │
│  GFKids 앱      │              │  백엔드 서버         │
│  (테스트)       │              │  (Node.js + MySQL)   │
│                 │              │                      │
│  Backend 서버   │              │  도메인/IP:          │
│  (localhost)    │              │  예: api.school.com  │
│                 │              │                      │
│  MySQL DB       │              │  포트: 80/443        │
│  (localhost)    │              │  (HTTP/HTTPS)        │
└─────────────────┘              └──────────────────────┘
                                           ↑
                                           │
                                    ┌──────┴──────┐
                                    │             │
                              ┌─────┴─────┐ ┌────┴─────┐
                              │ GFKids 앱 │ │ GFKids 앱│
                              │ (학생1)   │ │ (학생2)  │
                              └───────────┘ └──────────┘
```

---

## 서버 환경 요구사항

### 최소 사양
- **CPU**: 2코어 이상
- **RAM**: 4GB 이상 (권장: 8GB)
- **Storage**: 50GB 이상 (권장: 100GB SSD)
- **OS**: Ubuntu 20.04 LTS 이상 / CentOS 8 이상 / Windows Server 2019 이상
- **네트워크**: 고정 IP 또는 도메인

### 소프트웨어 요구사항
- **Node.js**: 18.x 이상
- **MySQL**: 8.0 이상
- **npm**: 9.x 이상
- **Git**: 최신 버전

### 클라우드 서버 옵션
1. **AWS EC2** (t3.medium 이상)
2. **Google Cloud Compute Engine**
3. **Azure Virtual Machines**
4. **Naver Cloud Platform**
5. **국내 호스팅** (Cafe24, 가비아 등)

---

## 서버 준비 단계

### 1. 서버 접속 및 기본 설정

```bash
# SSH로 서버 접속
ssh root@your-server-ip

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y curl wget git build-essential
```

### 2. Node.js 설치

```bash
# Node.js 18.x 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 설치 확인
node --version  # v18.x.x 확인
npm --version   # 9.x.x 확인
```

### 3. MySQL 설치

```bash
# MySQL 8.0 설치
sudo apt install -y mysql-server

# MySQL 보안 설정
sudo mysql_secure_installation

# MySQL 서비스 시작 및 자동 시작 설정
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 4. 방화벽 설정

```bash
# 방화벽 활성화
sudo ufw enable

# 필요한 포트 열기
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS (SSL 사용 시)
sudo ufw allow 5000/tcp   # 백엔드 API (임시, 나중에 nginx로 프록시)

# 방화벽 상태 확인
sudo ufw status
```

---

## 백엔드 배포

### 1. 프로젝트 업로드

**방법 A: Git 사용 (권장)**
```bash
# 프로젝트 디렉토리 생성
sudo mkdir -p /var/www
cd /var/www

# Git 저장소에서 클론 (Git 저장소가 있는 경우)
sudo git clone https://github.com/your-repo/newgaon-LMS.git
cd newgaon-LMS/backend
```

**방법 B: 수동 업로드**
```bash
# 로컬 PC에서 서버로 파일 업로드
# Windows PowerShell에서:
scp -r "C:\Users\psh08\Desktop\newgaon-LMS\backend" root@your-server-ip:/var/www/
```

### 2. 의존성 설치

```bash
cd /var/www/newgaon-LMS/backend

# npm 패키지 설치
npm install --production

# PM2 설치 (프로세스 관리자)
sudo npm install -g pm2
```

### 3. 환경 변수 설정

```bash
# .env 파일 생성
nano .env
```

**프로덕션 .env 설정:**
```env
# 서버 설정
NODE_ENV=production
PORT=5000

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=lms_admin
DB_PASSWORD=강력한비밀번호여기입력
DB_NAME=lms_production

# JWT 설정 - 반드시 강력한 랜덤 문자열로 변경!
JWT_SECRET=여기에_강력한_JWT_시크릿_키_입력_최소_32자
JWT_REFRESH_SECRET=여기에_강력한_리프레시_시크릿_키_입력_최소_32자
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# CORS 설정 - 프론트엔드 URL (있는 경우)
CLIENT_URL=https://your-frontend-domain.com

# 파일 업로드 설정
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# 로그 설정
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# SMS 서비스 설정 (필요시)
SMS_API_KEY=your_sms_api_key
SMS_API_SECRET=your_sms_api_secret

# 기타 설정
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

**JWT 시크릿 키 생성 방법:**
```bash
# 랜덤 시크릿 키 생성
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# 출력된 값을 JWT_SECRET과 JWT_REFRESH_SECRET에 사용
```

### 4. 디렉토리 권한 설정

```bash
# uploads, logs 디렉토리 생성 및 권한 설정
mkdir -p uploads logs
sudo chmod 755 uploads logs
```

---

## 데이터베이스 설정

### 1. MySQL 데이터베이스 및 사용자 생성

```bash
# MySQL 접속
sudo mysql -u root -p
```

```sql
-- 프로덕션 데이터베이스 생성
CREATE DATABASE lms_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 전용 사용자 생성
CREATE USER 'lms_admin'@'localhost' IDENTIFIED BY '강력한비밀번호여기입력';

-- 권한 부여
GRANT ALL PRIVILEGES ON lms_production.* TO 'lms_admin'@'localhost';
FLUSH PRIVILEGES;

-- 종료
EXIT;
```

### 2. 데이터베이스 초기화

```bash
cd /var/www/newgaon-LMS/backend

# 테이블 생성 및 초기 데이터 입력
node config/initDatabase.js

# 또는 SQL 파일이 있는 경우:
# mysql -u lms_admin -p lms_production < config/schema.sql
```

### 3. 초기 관리자 계정 확인

데이터베이스 초기화 후 기본 관리자 계정:
- **사용자명**: `admin`
- **비밀번호**: `admin` (반드시 변경 필요!)

---

## 앱 설정 변경

### GFKids 안드로이드 앱 설정 변경

**1. AppConfig.java 파일 수정**

파일 위치: `app/src/main/java/com/newgaon/gfkids/common/AppConfig.java`

```java
public class AppConfig {
    private static final boolean REAL = !BuildConfig.DEBUG;

    // ========================================
    // 🔴 프로덕션 배포 시 반드시 변경 필요!
    // ========================================

    // 개발 환경 (현재)
    // private static final String API_BASE_URL = "http://192.168.0.17:5000/";

    // 프로덕션 환경 (배포 후)
    // 옵션 1: 도메인 사용 (권장)
    private static final String API_BASE_URL = "https://api.yourschool.com/";

    // 옵션 2: IP 주소 사용
    // private static final String API_BASE_URL = "http://YOUR_SERVER_IP:5000/";

    // Fallback URLs도 변경
    private static final String[] FALLBACK_URLS = {
        "https://api.yourschool.com/",
        "https://backup.yourschool.com/"  // 백업 서버 (선택사항)
    };

    // ... 나머지 코드 ...
}
```

**2. 앱 리빌드**

```bash
# Windows에서
cd "C:\Users\psh08\Desktop\GFKids app"
.\gradlew assembleRelease

# 또는 Android Studio에서:
# Build > Generate Signed Bundle / APK > APK
# - Release 버전 선택
# - 서명 키 설정
```

**3. APK 배포**

- 생성된 APK: `app/build/outputs/apk/release/app-release.apk`
- 이 파일을 학생들의 기기에 설치

---

## 백엔드 서버 실행

### 1. PM2로 서버 실행

```bash
cd /var/www/newgaon-LMS/backend

# PM2로 서버 시작
pm2 start server.js --name "lms-backend"

# 서버 상태 확인
pm2 status

# 로그 확인
pm2 logs lms-backend

# 서버 재시작
pm2 restart lms-backend

# 서버 중지
pm2 stop lms-backend
```

### 2. PM2 자동 시작 설정

```bash
# 시스템 부팅 시 자동 시작 설정
pm2 startup
pm2 save

# 현재 실행 중인 프로세스 저장
pm2 save
```

### 3. 서버 동작 확인

```bash
# 로컬에서 테스트
curl http://localhost:5000/health

# 외부에서 테스트 (다른 PC에서)
curl http://YOUR_SERVER_IP:5000/health

# 예상 응답:
# {"success":true,"status":"healthy","database":"connected"}
```

---

## 보안 설정

### 1. Nginx 리버스 프록시 설정 (권장)

Nginx를 사용하면 포트 80/443으로 접속 가능하고, SSL 설정도 쉽습니다.

```bash
# Nginx 설치
sudo apt install -y nginx

# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/lms-backend
```

**Nginx 설정 내용:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 또는 서버 IP

    # API 요청을 백엔드로 프록시
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 정적 파일 (업로드된 파일)
    location /uploads {
        alias /var/www/newgaon-LMS/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# 설정 파일 활성화
sudo ln -s /etc/nginx/sites-available/lms-backend /etc/nginx/sites-enabled/

# 기본 설정 제거 (선택)
sudo rm /etc/nginx/sites-enabled/default

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
sudo systemctl enable nginx

# 이제 포트 5000 방화벽 규칙 제거 (외부 직접 접근 차단)
sudo ufw delete allow 5000/tcp
```

### 2. SSL 인증서 설치 (HTTPS)

```bash
# Certbot 설치 (Let's Encrypt 무료 SSL)
sudo apt install -y certbot python3-certbot-nginx

# SSL 인증서 발급 및 자동 설정
sudo certbot --nginx -d your-domain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

SSL 설치 후 AppConfig.java에서 `https://`로 변경 필요!

### 3. 데이터베이스 보안

```bash
# MySQL 외부 접근 차단 (로컬만 허용)
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# bind-address = 127.0.0.1 확인

# MySQL 재시작
sudo systemctl restart mysql
```

### 4. 환경 변수 보호

```bash
# .env 파일 권한 설정 (소유자만 읽기 가능)
chmod 600 /var/www/newgaon-LMS/backend/.env
```

---

## 도메인 및 DNS 설정

### 1. 도메인 구매 (선택사항이지만 권장)

**도메인 구매처:**
- 가비아 (gabia.com)
- 후이즈 (whois.co.kr)
- GoDaddy
- Cloudflare

예: `api.yourschool.com`

### 2. DNS 설정

도메인 관리 페이지에서 A 레코드 추가:

```
Type: A
Name: api (또는 @)
Value: YOUR_SERVER_IP
TTL: 3600
```

### 3. 도메인 연결 확인

```bash
# 도메인이 서버 IP를 가리키는지 확인
nslookup api.yourschool.com
ping api.yourschool.com
```

---

## 모니터링 및 유지보수

### 1. 서버 모니터링

```bash
# PM2 모니터링
pm2 monit

# 시스템 리소스 확인
htop

# 디스크 사용량
df -h

# 메모리 사용량
free -h

# 네트워크 연결 확인
netstat -tuln | grep 5000
```

### 2. 로그 확인

```bash
# 백엔드 로그
pm2 logs lms-backend

# Nginx 접근 로그
sudo tail -f /var/log/nginx/access.log

# Nginx 에러 로그
sudo tail -f /var/log/nginx/error.log

# MySQL 로그
sudo tail -f /var/log/mysql/error.log
```

### 3. 데이터베이스 백업

```bash
# 자동 백업 스크립트 생성
sudo nano /usr/local/bin/backup-lms-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/lms"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 데이터베이스 백업
mysqldump -u lms_admin -p강력한비밀번호 lms_production > $BACKUP_DIR/lms_backup_$DATE.sql

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "lms_backup_*.sql" -mtime +7 -delete

echo "백업 완료: $BACKUP_DIR/lms_backup_$DATE.sql"
```

```bash
# 실행 권한 부여
sudo chmod +x /usr/local/bin/backup-lms-db.sh

# 크론 작업 추가 (매일 새벽 3시 백업)
sudo crontab -e

# 다음 줄 추가:
0 3 * * * /usr/local/bin/backup-lms-db.sh >> /var/log/lms-backup.log 2>&1
```

### 4. 업데이트 배포

```bash
# 서버에서 업데이트
cd /var/www/newgaon-LMS/backend

# Git 사용하는 경우
git pull origin main

# 의존성 업데이트 (필요시)
npm install --production

# 서버 재시작
pm2 restart lms-backend

# 로그 확인
pm2 logs lms-backend
```

---

## 📋 배포 체크리스트

### 서버 준비
- [ ] 서버 구매 및 설정 완료
- [ ] Node.js 18+ 설치
- [ ] MySQL 8.0 설치
- [ ] 방화벽 설정 완료

### 백엔드 배포
- [ ] 소스 코드 업로드
- [ ] npm install 완료
- [ ] .env 파일 설정 (프로덕션 환경)
- [ ] JWT 시크릿 키 변경
- [ ] 데이터베이스 초기화
- [ ] PM2로 서버 실행
- [ ] PM2 자동 시작 설정

### 보안 설정
- [ ] Nginx 리버스 프록시 설정
- [ ] SSL 인증서 설치 (HTTPS)
- [ ] MySQL 외부 접근 차단
- [ ] .env 파일 권한 설정
- [ ] 기본 관리자 비밀번호 변경
- [ ] 방화벽 규칙 검토

### 앱 설정
- [ ] AppConfig.java API_BASE_URL 변경
- [ ] Release APK 빌드 및 서명
- [ ] APK 배포

### 테스트
- [ ] 서버 Health Check 확인
- [ ] 앱에서 로그인 테스트
- [ ] 학생 목록 조회 테스트
- [ ] 출석 기능 테스트
- [ ] 다양한 네트워크 환경에서 테스트

### 모니터링
- [ ] 로그 확인
- [ ] 데이터베이스 백업 설정
- [ ] 서버 모니터링 설정

---

## 🚨 주의사항

1. **비밀번호 변경 필수**
   - MySQL root 비밀번호
   - MySQL lms_admin 비밀번호
   - JWT Secret 키
   - 기본 관리자 계정 비밀번호

2. **방화벽 설정**
   - 불필요한 포트는 모두 차단
   - SSH 포트는 변경 권장 (22 → 다른 포트)

3. **정기 백업**
   - 데이터베이스 백업은 매일 자동 실행
   - 중요한 파일은 원격 저장소에 백업

4. **SSL 사용 강력 권장**
   - 데이터 암호화
   - 앱에서 HTTPS 사용 시 보안 향상

5. **로그 모니터링**
   - 에러 로그 정기 확인
   - 비정상 접근 시도 모니터링

---

## 📞 문제 해결

### 서버 접속 불가
```bash
# 방화벽 확인
sudo ufw status

# 서버 상태 확인
pm2 status
sudo systemctl status nginx
```

### 데이터베이스 연결 실패
```bash
# MySQL 상태 확인
sudo systemctl status mysql

# 연결 테스트
mysql -u lms_admin -p -h localhost lms_production
```

### 앱에서 서버 연결 안 됨
1. 서버 IP/도메인이 정확한지 확인
2. 방화벽에서 포트가 열려있는지 확인
3. curl로 서버 응답 테스트
4. 앱의 AppConfig.java 설정 재확인

---

## 🎯 다음 단계

배포 완료 후:
1. ✅ 실제 환경에서 테스트
2. ✅ 사용자 매뉴얼 작성
3. ✅ 관리자 교육
4. ✅ 정기 점검 일정 수립

---

**문서 버전**: 1.0
**최종 수정일**: 2025-11-06
**작성자**: Development Team
