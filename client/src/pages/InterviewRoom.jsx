import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { companyAPI, questionAPI, interviewAPI, interestCompanyAPI } from '../services/api';

const InterviewRoom = () => {
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const navigate = useNavigate();
  const recognitionRef = useRef(null);

  useEffect(() => {
    const initializeInterview = async () => {
      try {
        setIsLoading(true);
        
        // 사용자의 관심기업 조회
        const userCompaniesResponse = await interestCompanyAPI.getUserCompanies();
        const userCompanies = userCompaniesResponse.data;
        
        if (userCompanies.length === 0) {
          alert('먼저 관심기업을 선택해주세요.');
          navigate('/select-company');
          return;
        }
        
        // 첫 번째 관심기업을 기본 선택
        const defaultCompany = userCompanies[0];
        setSelectedCompany(defaultCompany);
        
        // 해당 기업의 질문들 조회
        const questionsResponse = await questionAPI.getByCompany(defaultCompany.id);
        const companyQuestions = questionsResponse.data || [];
        
        // 질문이 없으면 기본 질문 사용
        if (companyQuestions.length === 0) {
          const allQuestionsResponse = await questionAPI.getAll();
          const allQuestions = allQuestionsResponse.data || [];
          setQuestions(allQuestions.slice(0, 5)); // 최대 5개 질문
        } else {
          setQuestions(companyQuestions.slice(0, 5)); // 최대 5개 질문
        }
        
        // 면접 세션 생성
        const sessionResponse = await interviewAPI.createSession({
          companyId: defaultCompany ? defaultCompany.id : null
        });
        setSessionId(sessionResponse.data.session_uuid);
        
      } catch (error) {
        console.error('면접 초기화 오류:', error);
        alert('면접을 시작하는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeInterview();
  }, [navigate]);

  // 음성 인식(STT)
  const handleStartListening = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR'; // 한국어로 변경
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      setAnswer(event.results[0][0].transcript);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
    setListening(true);
    recognitionRef.current = recognition;
  };

  // 음성 합성(TTS)
  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('이 브라우저는 음성 합성을 지원하지 않습니다.');
      return;
    }
    setSpeaking(true);
    const utter = new window.SpeechSynthesisUtterance(questions[current]?.question_text || '질문을 불러오는 중입니다.');
    utter.lang = 'ko-KR'; // 한국어로 변경
    utter.rate = 1;
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      alert('답변을 입력해주세요.');
      return;
    }

    try {
      // 답변 저장
      if (sessionId && questions[current]) {
        await interviewAPI.saveAnswer({
          sessionId: sessionId,
          questionId: questions[current].id,
          transcription: answer.trim()
        });
      }

      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);
      setAnswer('');
      
      if (current < questions.length - 1) {
        setCurrent(current + 1);
      } else {
        // 면접 완료 - 세션 종료
        if (sessionId) {
          await interviewAPI.endSession(sessionId);
        }
        navigate('/report');
      }
    } catch (error) {
      console.error('답변 저장 오류:', error);
      alert('답변 저장 중 오류가 발생했습니다.');
    }
  };

  // 진행률 계산
  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

  // 임시 분석값 (실제로는 서버에서 받아와야 함)
  const analysis = {
    Pronunciation: 0.7,
    Emotion: 0.5,
    Speed: 0.8
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    );
  }

  if (questions.length === 0) {
    return (
      <Layout>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 'calc(100vh - 160px)',
          textAlign: 'center'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>❓</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '16px', color: '#1a1a1a' }}>
              면접 질문을 불러올 수 없습니다
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              관심 기업을 다시 선택해주세요.
            </p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/select-company')}
            >
              기업 다시 선택
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '40px 0' }}>
        {/* 상단 정보 */}
        <div className="card" style={{ 
          marginBottom: '32px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                marginBottom: '8px' 
              }}>
                <div style={{ 
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: '#ffffff'
                }}>
                  🎤
                </div>
                <h1 style={{ 
                  fontSize: 'clamp(1.5rem, 3vw, 2rem)', 
                  fontWeight: '800', 
                  margin: '0',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  AI 모의면접
                </h1>
              </div>
              <p style={{ color: '#6b7280', fontSize: '1rem', margin: '0' }}>
                {selectedCompany?.name || '기업 선택 중...'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>
                  {current + 1} / {questions.length}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>진행률</div>
              </div>
              <div style={{ 
                width: '150px', 
                height: '10px', 
                background: '#e5e7eb', 
                borderRadius: '6px', 
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{ 
                  width: `${progress}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '6px',
                  transition: 'width 0.5s ease',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    width: '20px',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                    animation: 'shimmer 2s infinite'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 인터뷰 컨테이너 */}
        <div className="interview-container">
          {/* 왼쪽: 질문/답변 */}
          <div className="interview-left">
            {/* 질문 */}
            <div className="interview-question" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid rgba(102, 126, 234, 0.1)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '4px',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
              }} />
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  color: '#ffffff',
                  flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
                }}>
                  👤
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '12px' 
                  }}>
                    <div style={{ 
                      padding: '6px 12px', 
                      background: 'rgba(102, 126, 234, 0.1)', 
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#667eea'
                    }}>
                      질문 {current + 1}
                    </div>
                    <div style={{ 
                      padding: '4px 8px', 
                      background: 'rgba(245, 158, 11, 0.1)', 
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '500',
                      color: '#f59e0b'
                    }}>
                      {questions[current]?.question_type || '일반'}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '1.3rem', 
                    lineHeight: '1.6', 
                    color: '#1a1a1a',
                    fontWeight: '500'
                  }}>
                    {questions[current]?.question_text || '질문을 불러오는 중...'}
                  </div>
                </div>
              </div>
            </div>

            {/* 음성 녹음 버튼 */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              margin: '40px 0' 
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: listening 
                  ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: listening 
                  ? '0 0 0 20px rgba(255, 107, 107, 0.2), 0 8px 32px rgba(255, 107, 107, 0.3)'
                  : '0 8px 32px rgba(102, 126, 234, 0.3)',
                animation: listening ? 'pulse 1.5s infinite' : 'none',
                position: 'relative'
              }}
              onClick={handleStartListening}
              onMouseEnter={(e) => {
                if (!listening) {
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!listening) {
                  e.target.style.transform = 'scale(1)';
                }
              }}
              >
                {listening ? '⏹️' : '🎤'}
              </div>
              
              <div style={{ 
                marginTop: '16px', 
                textAlign: 'center' 
              }}>
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: listening ? '#ff6b6b' : '#667eea',
                  marginBottom: '4px'
                }}>
                  {listening ? '녹음 중...' : '음성으로 답변 입력'}
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#6b7280' 
                }}>
                  {listening ? '다시 클릭하여 중지' : '클릭하여 녹음 시작'}
                </div>
              </div>
            </div>

            {/* 답변 입력 폼 */}
            <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: '32px' }}>
              <div className="form-group">
                <label className="form-label" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1a1a1a'
                }}>
                  <span>✍️</span>
                  답변 입력
                </label>
                <textarea
                  className="interview-textarea"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="여기에 답변을 입력하거나 마이크 버튼을 눌러 말해보세요."
                  rows={8}
                  disabled={listening}
                  style={{
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                justifyContent: 'center',
                marginTop: '24px'
              }}>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleSpeak}
                  disabled={speaking}
                  style={{ 
                    fontSize: '1rem', 
                    padding: '14px 28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>🔊</span>
                  {speaking ? '듣는 중...' : '질문 듣기'}
                </button>
                <button 
                  type="submit" 
                  className="interview-next-btn"
                  style={{ 
                    fontSize: '1rem', 
                    padding: '14px 36px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{current < questions.length - 1 ? '➡️' : '✅'}</span>
                  {current < questions.length - 1 ? '다음' : '완료'}
                </button>
              </div>
            </form>
          </div>

          {/* 오른쪽: 분석 */}
          <div className="interview-right">
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                margin: '0 auto 16px auto',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                📊
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px', color: '#ffffff' }}>
                실시간 분석
              </h3>
              <p style={{ fontSize: '0.9rem', opacity: '0.8', color: '#ffffff' }}>
                면접 진행 상황을 실시간으로 확인하세요
              </p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div className="analysis-label" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span>발음 정확도</span>
                <span style={{ fontSize: '0.8rem', opacity: '0.7' }}>
                  {Math.round(analysis.Pronunciation * 100)}%
                </span>
              </div>
              <div className="analysis-bar" style={{ 
                height: '16px',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '8px'
              }}>
                <div className="analysis-bar-fill" style={{ 
                  width: `${analysis.Pronunciation * 100}%`,
                  background: 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)',
                  borderRadius: '8px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    width: '20px',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                    animation: 'shimmer 2s infinite'
                  }} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div className="analysis-label" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span>감정 표현</span>
                <span style={{ fontSize: '0.8rem', opacity: '0.7' }}>
                  {Math.round(analysis.Emotion * 100)}%
                </span>
              </div>
              <div className="analysis-bar" style={{ 
                height: '16px',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '8px'
              }}>
                <div className="analysis-bar-fill" style={{ 
                  width: `${analysis.Emotion * 100}%`,
                  background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '8px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    width: '20px',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                    animation: 'shimmer 2s infinite'
                  }} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div className="analysis-label" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span>말하기 속도</span>
                <span style={{ fontSize: '0.8rem', opacity: '0.7' }}>
                  {Math.round(analysis.Speed * 100)}%
                </span>
              </div>
              <div className="analysis-bar" style={{ 
                height: '16px',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '8px'
              }}>
                <div className="analysis-bar-fill" style={{ 
                  width: `${analysis.Speed * 100}%`,
                  background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '8px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    width: '20px',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                    animation: 'shimmer 2s infinite'
                  }} />
                </div>
              </div>
            </div>

            <div style={{ 
              marginTop: '40px', 
              padding: '24px', 
              background: 'rgba(255, 255, 255, 0.1)', 
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                marginBottom: '16px' 
              }}>
                <div style={{ fontSize: '20px' }}>💡</div>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: '#ffffff' }}>
                  면접 팁
                </div>
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                opacity: '0.9', 
                lineHeight: '1.6',
                color: '#ffffff'
              }}>
                • 명확하고 자신감 있게 답변하세요<br/>
                • 짧고 간결한 문장으로 핵심을 전달하세요<br/>
                • 적절한 목소리 톤과 속도를 유지하세요<br/>
                • 구체적인 예시를 들어 설명하세요
              </div>
            </div>
          </div>
        </div>

        {/* 애니메이션 스타일 */}
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          @keyframes pulse {
            0% { 
              box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7);
            }
            70% { 
              box-shadow: 0 0 0 20px rgba(255, 107, 107, 0);
            }
            100% { 
              box-shadow: 0 0 0 0 rgba(255, 107, 107, 0);
            }
          }
        `}</style>
      </div>
    </Layout>
  );
};

export default InterviewRoom;
