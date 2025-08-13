import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  companyAPI, 
  selfIntroductionAPI, 
  resumeAPI, 
  aiInterviewAPI 
} from '../services/api';
import '../styles/AIInterviewSelect.css';

const AIInterviewSelect = () => {
  const [companies, setCompanies] = useState([]);
  const [selfIntroductions, setSelfIntroductions] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedSelfIntro, setSelectedSelfIntro] = useState('');
  const [selectedResume, setSelectedResume] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [companiesResponse, selfIntroResponse, resumesResponse] = await Promise.all([
        companyAPI.getAll(),
        selfIntroductionAPI.getAll(),
        resumeAPI.getAll()
      ]);

      console.log('기업 목록 응답:', companiesResponse);
      console.log('자기소개서 응답:', selfIntroResponse);
      console.log('이력서 응답:', resumesResponse);

      if (companiesResponse.success && companiesResponse.data) {
        setCompanies(companiesResponse.data);
      } else {
        console.warn('기업 목록 응답 구조가 예상과 다릅니다:', companiesResponse);
        setCompanies([]);
      }

      if (selfIntroResponse.success && selfIntroResponse.data) {
        setSelfIntroductions(selfIntroResponse.data);
      } else {
        console.warn('자기소개서 응답 구조가 예상과 다릅니다:', selfIntroResponse);
        setSelfIntroductions([]);
      }

      if (resumesResponse.success && resumesResponse.data) {
        setResumes(resumesResponse.data);
      } else {
        console.warn('이력서 응답 구조가 예상과 다릅니다:', resumesResponse);
        setResumes([]);
      }
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Error loading data:', err);
      setCompanies([]);
      setSelfIntroductions([]);
      setResumes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!selectedSelfIntro || !selectedResume) {
      setError('자기소개서와 이력서는 필수입니다.');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      // 새로운 AI 인터뷰 시스템에 맞는 세션 데이터 구조
      const sessionData = {
        userId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null,
        companyId: selectedCompany || null,
        position: selectedCompany ? '일반' : '일반', // 기업이 선택되면 해당 기업, 아니면 일반
        selfIntroductionId: selectedSelfIntro,
        resumeId: selectedResume
      };

      console.log('세션 시작 요청:', sessionData);
      const response = await aiInterviewAPI.startSession(sessionData);
      console.log('세션 시작 응답:', response);
      
      if (response.success && response.thread_id) {
        // 새로운 시스템에서는 thread_id를 받아서 면접실로 이동
        const threadId = response.thread_id;
        navigate(`/ai-interview/room/${threadId}`);
      } else {
        throw new Error(response.message || '세션 시작에 실패했습니다.');
      }
    } catch (err) {
      console.error('Error starting session:', err);
      
      // AxiosError인 경우 더 자세한 에러 정보 제공
      if (err.response) {
        // 서버에서 응답을 받았지만 에러 상태인 경우
        const errorMessage = err.response.data?.message || err.response.data?.error || '서버 오류가 발생했습니다.';
        setError(`면접 세션 시작 실패: ${errorMessage}`);
      } else if (err.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        setError('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        // 요청 자체에 문제가 있는 경우
        setError(`면접 세션을 시작하는데 실패했습니다: ${err.message}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCreateSelfIntro = () => {
    navigate('/write?type=self-intro');
  };

  const handleCreateResume = () => {
    navigate('/write?type=resume');
  };

  if (loading) {
    return (
      <div className="ai-interview-select-container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="ai-interview-select-container">
      <div className="header">
        <h1>AI 면접 설정</h1>
        <p>면접에 사용할 정보를 선택해주세요</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="selection-form">
        <div className="form-section">
          <h3>1. 면접 기업 선택 (선택사항)</h3>
          <select 
            value={selectedCompany} 
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="form-select"
          >
            <option value="">기업을 선택하세요 (선택하지 않으면 일반 면접)</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-section">
          <h3>2. 자기소개서 선택</h3>
          {selfIntroductions.length === 0 ? (
            <div className="empty-state">
              <p>작성된 자기소개서가 없습니다.</p>
              <button onClick={handleCreateSelfIntro} className="create-btn">
                자기소개서 작성하기
              </button>
            </div>
          ) : (
            <select 
              value={selectedSelfIntro} 
              onChange={(e) => setSelectedSelfIntro(e.target.value)}
              className="form-select"
            >
              <option value="">자기소개서를 선택하세요</option>
              {selfIntroductions.map((intro) => (
                <option key={intro.id} value={intro.id}>
                  {intro.title || `자기소개서 ${intro.id}`}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-section">
          <h3>3. 이력서 선택</h3>
          {resumes.length === 0 ? (
            <div className="empty-state">
              <p>작성된 이력서가 없습니다.</p>
              <button onClick={handleCreateResume} className="create-btn">
                이력서 작성하기
              </button>
            </div>
          ) : (
            <select 
              value={selectedResume} 
              onChange={(e) => setSelectedResume(e.target.value)}
              className="form-select"
            >
              <option value="">이력서를 선택하세요</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.title || `이력서 ${resume.id}`}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-actions">
          <button 
            onClick={() => navigate('/ai-interview')} 
            className="cancel-btn"
          >
            취소
          </button>
          <button 
            onClick={handleStartInterview}
            disabled={!selectedSelfIntro || !selectedResume || creating}
            className="start-btn"
          >
            {creating ? '면접 준비 중...' : 'AI 면접 시작'}
          </button>
        </div>
      </div>

      <div className="info-section">
        <h3>AI 면접 안내</h3>
        <ul>
          <li>AI가 선택하신 정보를 바탕으로 맞춤형 면접 질문을 생성합니다.</li>
          <li>음성으로 답변하시면 AI가 실시간으로 분석하고 피드백을 제공합니다.</li>
          <li>면접이 완료되면 종합적인 평가 리포트를 받으실 수 있습니다.</li>
          <li>면접 중 언제든지 일시정지하고 나중에 이어서 진행할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
};

export default AIInterviewSelect;
