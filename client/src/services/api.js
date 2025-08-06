import axios from "axios";

// API 기본 설정
const API_BASE_URL = "http://localhost:3001/api";

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// 인증 관련 API
export const authAPI = {
  // 회원가입
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  // 로그인
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  // 로그아웃 (클라이언트 측)
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

// 사용자 관련 API
export const userAPI = {
  // 사용자 정보 조회
  getProfile: async () => {
    const response = await api.get("/users/profile");
    return response.data;
  },

  // 사용자 정보 수정
  updateProfile: async (userData) => {
    const response = await api.put("/users/profile", userData);
    return response.data;
  },

  // 사용자 삭제
  deleteAccount: async () => {
    const response = await api.delete("/users/profile");
    return response.data;
  },
};

// 기업 관련 API
export const companyAPI = {
  // 모든 기업 조회
  getAll: async () => {
    const response = await api.get("/companies");
    return response.data;
  },

  // 특정 기업 조회
  getById: async (id) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  // 기업 생성 (관리자용)
  create: async (companyData) => {
    const response = await api.post("/companies", companyData);
    return response.data;
  },

  // 기업 수정 (관리자용)
  update: async (id, companyData) => {
    const response = await api.put(`/companies/${id}`, companyData);
    return response.data;
  },

  // 기업 삭제 (관리자용)
  delete: async (id) => {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
  },
};

// 질문 관련 API
export const questionAPI = {
  // 모든 질문 조회
  getAll: async () => {
    const response = await api.get("/questions");
    return response.data;
  },

  // 특정 질문 조회
  getById: async (id) => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  },

  // 기업별 질문 조회
  getByCompany: async (companyId) => {
    const response = await api.get(`/questions/company/${companyId}`);
    return response.data;
  },

  // 질문 타입별 조회
  getByType: async (type) => {
    const response = await api.get(`/questions/type/${type}`);
    return response.data;
  },

  // 난이도별 조회
  getByLevel: async (level) => {
    const response = await api.get(`/questions/level/${level}`);
    return response.data;
  },

  // 랜덤 질문 조회
  getRandom: async (limit = 10, filters = {}) => {
    const response = await api.post("/questions/random", { limit, filters });
    return response.data;
  },

  // 질문 생성 (관리자용)
  create: async (questionData) => {
    const response = await api.post("/questions", questionData);
    return response.data;
  },

  // 질문 수정 (관리자용)
  update: async (id, questionData) => {
    const response = await api.put(`/questions/${id}`, questionData);
    return response.data;
  },

  // 질문 삭제 (관리자용)
  delete: async (id) => {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
  },
};

// 인터뷰 세션 관련 API
export const interviewAPI = {
  // 새 인터뷰 세션 생성
  createSession: async (sessionData) => {
    const response = await api.post("/interview/sessions", {
      company_id: sessionData.companyId,
    });
    return response.data;
  },

  // 세션 조회
  getSession: async (sessionId) => {
    const response = await api.get(`/interview/sessions/${sessionId}`);
    return response.data;
  },

  // 사용자의 모든 세션 조회
  getUserSessions: async () => {
    const response = await api.get("/interview/sessions");
    return response.data;
  },

  // 세션 종료
  endSession: async (sessionId) => {
    const response = await api.put(`/interview/sessions/${sessionId}/end`);
    return response.data;
  },

  // 답변 저장
  saveAnswer: async (answerData) => {
    const response = await api.post("/interview/answers", {
      session_id: answerData.sessionId,
      question_id: answerData.questionId,
      transcription: answerData.transcription
    });
    return response.data;
  },

  // 세션의 모든 답변 조회
  getSessionAnswers: async (sessionId) => {
    const response = await api.get(`/interview/sessions/${sessionId}/answers`);
    return response.data;
  },
};

// 음성 분석 관련 API
export const voiceAPI = {
  // 음성 분석 요청
  analyzeVoice: async (audioData) => {
    const response = await api.post("/voice/analyze", audioData);
    return response.data;
  },

  // 분석 결과 조회
  getAnalysis: async (answerId) => {
    const response = await api.get(`/voice/analysis/${answerId}`);
    return response.data;
  },

  // 세션의 모든 분석 결과 조회
  getSessionAnalysis: async (sessionId) => {
    const response = await api.get(`/voice/session/${sessionId}/analysis`);
    return response.data;
  },
};

// 리포트 관련 API
export const reportAPI = {
  // 리포트 생성
  generateReport: async (sessionId) => {
    const response = await api.post("/reports/generate", { sessionId });
    return response.data;
  },

  // 리포트 조회
  getReport: async (reportId) => {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  },

  // 세션별 리포트 조회
  getSessionReport: async (sessionId) => {
    const response = await api.get(`/reports/session/${sessionId}`);
    return response.data;
  },

  // 사용자의 모든 리포트 조회
  getUserReports: async () => {
    const response = await api.get("/reports/user");
    return response.data;
  },

  // 사용자 통계 조회
  getUserStats: async () => {
    const response = await api.get("/reports/user/stats");
    return response.data;
  },
};

// 자기소개서 관련 API
export const selfIntroductionAPI = {
  // 모든 자기소개서 조회
  getAll: async () => {
    const response = await api.get("/users/self-introductions");
    return response.data;
  },

  // 자기소개서 생성
  create: async (data) => {
    const response = await api.post("/users/self-introductions", data);
    return response.data;
  },

  // 자기소개서 수정
  update: async (id, data) => {
    const response = await api.put(`/users/self-introductions/${id}`, data);
    return response.data;
  },

  // 자기소개서 삭제
  delete: async (id) => {
    const response = await api.delete(`/users/self-introductions/${id}`);
    return response.data;
  },
};

// 이력서 관련 API
export const resumeAPI = {
  // 모든 이력서 조회
  getAll: async () => {
    const response = await api.get("/users/resumes");
    return response.data;
  },

  // 이력서 생성
  create: async (data) => {
    const response = await api.post("/users/resumes", data);
    return response.data;
  },

  // 이력서 수정
  update: async (id, data) => {
    const response = await api.put(`/users/resumes/${id}`, data);
    return response.data;
  },

  // 이력서 삭제
  delete: async (id) => {
    const response = await api.delete(`/users/resumes/${id}`);
    return response.data;
  },
};

// 관심기업 관련 API
export const interestCompanyAPI = {
  // 사용자의 관심기업 조회
  getUserCompanies: async () => {
    const response = await api.get("/users/interest-companies");
    return response.data;
  },

  // 관심기업 추가
  add: async (companyId) => {
    const response = await api.post("/users/interest-companies", { companyId });
    return response.data;
  },

  // 관심기업 제거
  remove: async (companyId) => {
    const response = await api.delete(`/users/interest-companies/${companyId}`);
    return response.data;
  },
};

// 사용자 통계 API
export const userStatsAPI = {
  // 사용자 통계 조회
  getStats: async () => {
    const response = await api.get("/users/stats");
    return response.data;
  },
};

// 유틸리티 함수들
export const utils = {
  // 토큰 유효성 검사
  isTokenValid: () => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch (error) {
      return false;
    }
  },

  // 사용자 정보 가져오기
  getUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // 사용자 정보 저장
  setUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
  },

  // 에러 메시지 추출
  getErrorMessage: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return "알 수 없는 오류가 발생했습니다.";
  },
};

export default api;
