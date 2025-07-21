-- 데이터베이스 생성 및 선택
CREATE DATABASE IF NOT EXISTS open_source_db DEFAULT CHARACTER SET UTF8;
USE open_source_db;

-- [1] 사용자 테이블
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 사용자 고유 ID (자동 증가)
    email VARCHAR(100) UNIQUE NOT NULL, -- 사용자 이메일 (로그인 ID로 사용)
    password_hash VARCHAR(255) NOT NULL, -- 해시된 비밀번호 (보안을 위해 해시 처리된 값 저장)
    nickname VARCHAR(50), -- 사용자 닉네임 (선택 항목)
    interest_company VARCHAR(100), -- 사용자가 관심 있는 기업명 (예: '삼성전자')
    resume_path VARCHAR(255),         -- 이력서 파일 경로
    self_intro_text TEXT,             -- 자기소개서 텍스트
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 가입 시각 (자동 입력)
);

-- [2] 기업 테이블
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 기업 고유 ID
    name VARCHAR(100) UNIQUE NOT NULL, -- 기업명
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 작성 시각 (자동 입력)
);

-- [3] 면접 세션 테이블
CREATE TABLE interview_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 세션 고유 ID
    user_id INT NOT NULL, -- 이 세션을 가진 사용자 ID (users 테이블과 연결)
    session_uuid VARCHAR(64) UNIQUE NOT NULL, -- UUID 형식의 세션 식별자 (프론트와 연동 시 사용)
    company_id INT NOT NULL, -- 사용자가 선택한 기업 번호
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 면접 시작 시각
    ended_at DATETIME, -- 면접 종료 시각 (면접 완료 시 입력)
    FOREIGN KEY (user_id) REFERENCES users(id), -- 외래키: users 테이블과 연결
    FOREIGN KEY (company_id) REFERENCES companies(id) -- 외래키: companies 테이블과 연결
);

-- [4] 면접 질문 테이블
CREATE TABLE interview_questions (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 질문 고유 ID
    company_id INT NOT NULL, -- 질문이 속한 기업 번호
    job_position VARCHAR(100), -- 직무명 (예: 백엔드 개발자)
    question_text TEXT NOT NULL, -- 질문 본문
    question_type ENUM('인성', '기술', '경험') DEFAULT '인성', -- 질문 유형
    level TINYINT DEFAULT 1, -- 질문 난이도 (1~3단계 등)
    is_followup BOOLEAN DEFAULT FALSE, -- 꼬리 질문 여부
    parent_question_id INT NULL, -- 꼬리질문 연결 구조 표현
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 질문 생성 일시
    FOREIGN KEY (company_id) REFERENCES companies(id), -- 외래키: companies 테이블과 연결
    FOREIGN KEY (parent_question_id) REFERENCES interview_questions(id) -- 자기 참조 관계이므로 외래 키 추가함
);

-- [5] 사용자 답변 테이블
CREATE TABLE user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 답변 고유 ID
    session_id INT NOT NULL, -- 해당 답변이 속한 세션 ID
    question_id INT NOT NULL, -- 어떤 질문에 대한 답변인지
    audio_path VARCHAR(255), -- 녹음된 음성 파일 경로
    transcription TEXT, -- STT로 추출된 텍스트 (음성 → 문자 변환 결과)
    duration_seconds INT, -- 답변 길이 (초 단위)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 답변 제출 시각
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id),
    FOREIGN KEY (question_id) REFERENCES interview_questions(id)
);

-- [6] 음성 분석 결과 테이블
CREATE TABLE voice_analysis_results (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 분석 결과 고유 ID
    answer_id INT NOT NULL, -- 어떤 답변의 분석 결과인지 (user_answers 테이블 연결)
    pronunciation_score TINYINT, -- 발음 정확도 점수 (0~100)
    emotion VARCHAR(30), -- 추정 감정 상태 (예: 'confident', 'nervous')
    speed_wpm INT, -- 말하기 속도 (Words Per Minute)
    filler_count INT, -- 간투사 사용 횟수 (예: '음', '어' 등의 개수)
    pitch_variation VARCHAR(30), -- 목소리 높낮이 변화 범주 (예: '높음', '보통', '낮음')
    FOREIGN KEY (answer_id) REFERENCES user_answers(id)
);

-- [7] 피드백 보고서 테이블
CREATE TABLE feedback_reports (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 보고서 고유 ID
    session_id INT NOT NULL, -- 어떤 면접 세션에 대한 보고서인지
    total_score INT, -- 총점 (예: 100점 만점 기준)
    strengths TEXT, -- 강점 분석 (자신감, 말투, 논리성 등)
    weaknesses TEXT, -- 약점 분석 (말 속도, 간투사 등)
    suggestions TEXT, -- 개선 및 연습 제안 (예: 천천히 말하기, 예시 활용하기 등)
    report_json JSON, -- 전체 분석 데이터 요약 (시각화용 JSON)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 보고서 생성 시각
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
);
