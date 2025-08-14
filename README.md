# InnoView - AI 면접 연습 플랫폼

InnoView는 AI 기술을 활용한 맞춤형 면접 연습 플랫폼입니다. 사용자의 이력서와 자기소개서를 분석하여 개인화된 면접 질문을 생성하고, 실시간 음성 분석을 통해 상세한 피드백을 제공합니다.

## 주요 기능

### 🤖 AI 면접 시스템

- **맞춤형 질문 생성**: 사용자의 이력서와 자기소개서를 분석하여 개인화된 면접 질문 생성
- **동적 질문 조정**: 사용자의 답변에 따라 심화 질문 또는 다음 질문으로 자연스럽게 전환
- **실시간 대화**: AI 면접관과의 자연스러운 대화형 면접 진행
- **음성 인식 (STT)**: 사용자 음성을 실시간으로 텍스트로 변환
- **음성 합성 (TTS)**: AI 응답을 자연스러운 음성으로 변환하여 재생
- **상세한 피드백**: 면접 완료 후 종합적인 평가 및 개선 방안 제시

### 📊 면접 분석 및 피드백

- **음성 분석**: 발음, 속도, 감정 상태 등 음성 품질 분석
- **답변 품질 평가**: 내용의 적절성, 논리성, 구체성 평가
- **점수 시스템**: 전체 점수, 의사소통 능력, 기술적 역량, 인성 및 태도 별도 평가
- **개선 추이 분석**: 시간에 따른 면접 실력 향상 추이 분석

### 👤 사용자 관리

- **회원가입/로그인**: JWT 기반 인증 시스템
- **이력서/자기소개서 관리**: 다중 문서 작성 및 관리
- **관심 기업 설정**: 특정 기업에 맞춘 면접 연습
- **면접 이력 관리**: 과거 면접 세션 및 결과 조회

## 기술 스택

### Backend

- **Node.js** + **Express.js**: 서버 프레임워크
- **MySQL**: 데이터베이스
- **OpenAI GPT-4o-mini**: AI 면접 질문 생성 및 피드백
- **OpenAI Whisper**: 음성 인식 (STT)
- **Google Cloud Text-to-Speech**: 음성 합성 (TTS)
- **FFmpeg**: 오디오 파일 변환
- **JWT**: 사용자 인증
- **bcrypt**: 비밀번호 암호화

### Frontend

- **React.js**: 사용자 인터페이스
- **Web Speech API**: 음성 인식 및 합성
- **Chart.js**: 데이터 시각화

## 설치 및 실행

### 1. 환경 설정

```bash
# 서버 디렉토리로 이동
cd server

# 의존성 설치
npm install

# 환경 변수 설정
cp env.example .env
# .env 파일을 편집하여 실제 값으로 설정
```

### 2. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
CREATE DATABASE innoview;

# 테이블 생성
node resetDatabase.js
```

### 3. 서버 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

### 4. 클라이언트 실행

```bash
# 클라이언트 디렉토리로 이동
cd client

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

## 환경 변수 설정

### 필수 환경 변수

```env
# 데이터베이스
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=innoview

# JWT
JWT_SECRET=your_jwt_secret_key_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
ASSISTANT_ID=your_openai_assistant_id_here

# Google Cloud (TTS용)
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/google-credentials.json
```

## API 엔드포인트

### AI 면접 관련

- `POST /api/ai-interview/session/start` - AI 인터뷰 세션 시작
- `POST /api/ai-interview/session/end` - AI 인터뷰 세션 종료
- `POST /api/ai-interview/transcribe` - 음성 인식 (STT)
- `POST /api/ai-interview/chat` - AI 인터뷰어와의 대화 처리
- `GET /api/ai-interview/audio/:filename` - 오디오 파일 다운로드
- `GET /api/ai-interview/audio/ai/:filename` - AI 오디오 파일 다운로드

### 사용자 관리

- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/users/profile` - 사용자 프로필 조회
- `PUT /api/users/profile` - 사용자 프로필 수정

### 이력서/자기소개서

- `GET /api/users/self-introductions` - 자기소개서 목록
- `POST /api/users/self-introductions` - 자기소개서 생성
- `PUT /api/users/self-introductions/:id` - 자기소개서 수정
- `DELETE /api/users/self-introductions/:id` - 자기소개서 삭제
- `GET /api/users/resumes` - 이력서 목록
- `POST /api/users/resumes` - 이력서 생성
- `PUT /api/users/resumes/:id` - 이력서 수정
- `DELETE /api/users/resumes/:id` - 이력서 삭제

## AI 면접 시스템 사용법

### 1. 면접 준비

1. 회원가입 및 로그인
2. 이력서 및 자기소개서 작성
3. 관심 기업 설정 (선택사항)

### 2. AI 면접 시작

1. AI 면접 세션 생성
2. AI가 이력서와 자기소개서를 분석하여 첫 번째 질문 생성
3. 음성으로 답변 제출

### 3. 면접 진행

1. AI가 답변을 분석하여 심화 질문 또는 다음 질문 생성
2. 최대 6개의 기본 질문과 각 질문당 최대 2개의 심화 질문
3. 자연스러운 대화형 면접 진행

### 4. 면접 완료 및 피드백

1. 면접 종료 시 자동으로 종합 피드백 생성
2. 전체 점수, 세부 평가, 강점/약점 분석
3. 구체적인 개선 방안 제시

## 프로젝트 구조

```
InnoView/
├── server/                 # 백엔드 서버
│   ├── config/            # 설정 파일
│   ├── controllers/       # 컨트롤러
│   ├── models/           # 데이터 모델
│   ├── routes/           # API 라우터
│   ├── services/         # 비즈니스 로직
│   └── middleware/       # 미들웨어
├── client/               # 프론트엔드
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   ├── services/     # API 서비스
│   │   └── utils/        # 유틸리티
└── shared/              # 공유 코드
```

## 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.
