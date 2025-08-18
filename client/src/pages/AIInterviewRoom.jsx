import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { aiInterviewAPI } from '../services/api';
import Layout from '../components/Layout';
import '../styles/AIInterviewRoom.css';

const AIInterviewRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [threadId, setThreadId] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiAudioUrl, setAiAudioUrl] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [interviewLog, setInterviewLog] = useState([]);
  const MAX_TOTAL_QUESTIONS = 15;
  const recordStartedAtRef = useRef(null);
  
  // 새로운 상태 추가
  const [interviewStage, setInterviewStage] = useState('self_introduction_request'); // 면접 단계
  const [questionCount, setQuestionCount] = useState(0); // 질문 카운트
  const [followUpCount, setFollowUpCount] = useState(0); // 꼬리질문 카운트
  const [hasSelfIntroduction, setHasSelfIntroduction] = useState(false); // 자기소개 완료 여부
  const [isInterviewEnded, setIsInterviewEnded] = useState(false); // 면접 종료 여부
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const initializationRef = useRef(false);

  useEffect(() => {
    if (sessionId && !isInitialized && !initializationRef.current) {
      console.log('AI 인터뷰 초기화 시작 - sessionId:', sessionId);
      initializationRef.current = true;
      setIsInitialized(true);
      initializeSession();
      initializeSpeechRecognition();
    }
    
    return () => {
      initializationRef.current = false;
    };
  }, [sessionId]);

  const initializeSession = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('AI 인터뷰 세션 초기화 시작');
      
      // AI 인터뷰 세션 시작 (자기소개 요청부터)
      const response = await aiInterviewAPI.startSession({
        userId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null,
        companyId: localStorage.getItem('ai_selected_company_id') || null,
        position: '개발자',
        includeInitialQuestion: true
      });
      
      console.log('AI 인터뷰 세션 응답:', response);
      
      if (response.success) {
        const newThreadId = response.thread_id;
        setThreadId(newThreadId);
        setSession({ id: sessionId, thread_id: newThreadId });
        
        // 작업 0: 자기소개 요청으로 시작
        await requestSelfIntroduction(newThreadId);
      } else {
        throw new Error(response.message || '세션을 초기화할 수 없습니다.');
      }
    } catch (err) {
      console.error('Error initializing session:', err);
      
      if (err.response) {
        const errorMessage = err.response.data?.message || err.response.data?.error || '서버 오류가 발생했습니다.';
        setError(`세션 초기화 실패: ${errorMessage}`);
      } else if (err.request) {
        setError('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        setError(`세션을 초기화하는데 실패했습니다: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 작업 0: 자기소개 요청
  const requestSelfIntroduction = async (threadId) => {
    try {
      console.log('자기소개 요청 시작');
      
      const response = await aiInterviewAPI.generateQuestion({
        task_type: 'self_introduction_request',
        company_id: localStorage.getItem('ai_selected_company_id') || null,
        thread_id: threadId
      });
      
      if (response.success) {
        setCurrentQuestion({
          question_text: response.data.question_text,
          question_type: response.data.question_type,
          question_number: 0
        });
        setAiResponse(response.data.question_text);
        setInterviewStage('self_introduction_request');
        setQuestionCount(0);
        
        // AI 음성 설정
        if (response.audioContent) {
          const audioBlob = new Blob(
            [Uint8Array.from(atob(response.audioContent), c => c.charCodeAt(0))],
            { type: 'audio/mp3' }
          );
          const audioUrl = URL.createObjectURL(audioBlob);
          setAiAudioUrl(audioUrl);
        }
      } else {
        throw new Error(response.error || '자기소개 요청에 실패했습니다.');
      }
    } catch (err) {
      console.error('자기소개 요청 오류:', err);
      setError('자기소개 요청에 실패했습니다.');
    }
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ko-KR';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscription(finalTranscript + interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError('음성 인식에 오류가 발생했습니다.');
      };
    } else {
      setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        handleAnswerSubmission(audioBlob);
      };

      mediaRecorderRef.current.start();
      recordStartedAtRef.current = Date.now();
      setIsRecording(true);
      setTranscription('');
      
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (err) {
      setError('마이크 접근 권한이 필요합니다.');
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const handleAnswerSubmission = async (audioBlob) => {
    try {
      setIsProcessing(true);
      setError(null);

      console.log('=== 답변 처리 시작 ===');
      console.log('Thread ID:', threadId);
      console.log('현재 면접 단계:', interviewStage);
      console.log('질문 카운트:', questionCount);

      // 음성 인식 (STT)
      console.log('음성 인식 요청 중...');
      const transcribeResponse = await aiInterviewAPI.transcribeAudio(audioBlob);
      console.log('음성 인식 응답:', transcribeResponse);
      
      if (!transcribeResponse.success) {
        throw new Error(transcribeResponse.error || '음성 인식에 실패했습니다.');
      }

      const userTranscription = transcribeResponse.transcription;
      console.log('=== 사용자 음성 인식 결과 ===');
      console.log('사용자 응답:', userTranscription);
      setTranscription(userTranscription);

      // 간이 음성 지표 계산
      const startedAt = recordStartedAtRef.current || Date.now();
      const durationMs = Math.max(1, Date.now() - startedAt);
      const durationMin = durationMs / 60000;
      const words = (userTranscription || '').trim().split(/\s+/).filter(Boolean).length;
      const speedWpm = Math.max(1, Math.round(words / (durationMin || 1)));
      const fillerCount = (userTranscription.match(/\b(음|어|그|음...|어..|그..|uh|um)\b/g) || []).length;
      const senseVoice = {
        pronunciation_score: null,
        emotion: 'neutral',
        speed_wpm: speedWpm,
        filler_count: fillerCount,
        pitch_variation: null,
      };

      // 로그에 기록 (질문/답변/음성지표)
      if (currentQuestion?.question_text) {
        setInterviewLog(prev => ([
          ...prev,
          {
            question_text: currentQuestion.question_text,
            transcription: userTranscription,
            sense_voice_analysis: senseVoice,
          }
        ]));
      }

      // 면접 단계에 따른 처리
      if (interviewStage === 'self_introduction_request') {
        // 자기소개 완료 후 첫 번째 질문으로
        setHasSelfIntroduction(true);
        setInterviewStage('initial_question');
        setQuestionCount(1);
        await generateNextQuestion(userTranscription, 'initial_question');
      } else {
        // 일반적인 답변 처리
        await generateNextQuestion(userTranscription, 'next_question');
      }
      
      console.log('=== 답변 처리 완료 ===');
    } catch (err) {
      console.error('=== 답변 처리 오류 ===');
      console.error('오류 타입:', err.constructor.name);
      console.error('오류 메시지:', err.message);
      console.error('오류 스택:', err.stack);
      
      if (err.response) {
        console.error('응답 상태:', err.response.status);
        console.error('응답 데이터:', err.response.data);
        const errorMessage = err.response.data?.error || err.response.data?.message || '서버 오류가 발생했습니다.';
        setError(`답변 처리 실패: ${errorMessage}`);
      } else if (err.request) {
        console.error('요청 오류:', err.request);
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setError(`답변을 처리하는데 실패했습니다: ${err.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 다음 질문 생성
  const generateNextQuestion = async (transcription, taskType) => {
    try {
      console.log('다음 질문 생성 시작:', { taskType, questionCount });
      
      const response = await aiInterviewAPI.generateQuestion({
        task_type: taskType,
        company_id: localStorage.getItem('ai_selected_company_id') || null,
        question_text: currentQuestion?.question_text || '',
        transcription: transcription,
        thread_id: threadId,
        current_question_count: questionCount,
        follow_up_count: followUpCount
      });
      
      if (response.success) {
        // 면접 종료 확인
        if (response.data.is_end) {
          setIsInterviewEnded(true);
          // 마지막 문제 표기를 15로 고정
          setQuestionCount(MAX_TOTAL_QUESTIONS);
          setCurrentQuestion({
            question_text: response.data.question_text,
            question_type: response.data.question_type,
            question_number: MAX_TOTAL_QUESTIONS
          });
          setAiResponse(response.data.question_text);
          setInterviewStage('final');
          
          // 3초 후 면접 종료
          setTimeout(() => {
            handleEndInterview();
          }, 2000);
          return;
        }
        
        // 꼬리질문 횟수 업데이트
        if (response.data.is_follow_up) {
          setFollowUpCount((c) => c + 1);
        } else {
          setFollowUpCount(0);
        }

        // 다음 질문으로 업데이트
        const nextQuestionCount = questionCount + 1;
        setQuestionCount(nextQuestionCount);
        setCurrentQuestion({
          question_text: response.data.question_text,
          question_type: response.data.question_type,
          question_number: nextQuestionCount
        });
        setAiResponse(response.data.question_text);
        
        // AI 음성 설정
        if (response.audioContent) {
          const audioBlob = new Blob(
            [Uint8Array.from(atob(response.audioContent), c => c.charCodeAt(0))],
            { type: 'audio/mp3' }
          );
          const audioUrl = URL.createObjectURL(audioBlob);
          setAiAudioUrl(audioUrl);
        }
        
        // 면접 단계 업데이트
        if (response.data.is_follow_up) {
          setInterviewStage('follow_up_question');
        } else if (taskType === 'initial_question') {
          setInterviewStage('next_question');
        } else {
          setInterviewStage('next_question');
        }
      } else {
        throw new Error(response.error || '다음 질문 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('다음 질문 생성 오류:', err);
      setError('다음 질문을 생성하는데 실패했습니다.');
    }
  };

  const handleEndInterview = async () => {
    if (window.confirm('면접을 종료하시겠습니까?')) {
      try {
        await aiInterviewAPI.endSession(threadId);
        // 면접 종료 후 피드백 페이지로 이동
        // 선택한 기업 정보 정리
        localStorage.removeItem('ai_selected_company_id');
        localStorage.removeItem('ai_selected_company_name');
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const user_info = { name: user?.nickname || user?.name || '사용자' };
        navigate('/ai-interview/final-report', {
          state: {
            user_info,
            interview_data_log: interviewLog,
          }
        });
      } catch (err) {
        setError('면접을 종료하는데 실패했습니다.');
        console.error('Error ending session:', err);
      }
    }
  };

  const handlePauseInterview = () => {
    navigate('/ai-interview');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container">
          <div className="ai-interview-room-container">
            <div className="loading">면접실을 준비 중입니다...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !session) {
    return (
      <Layout>
        <div className="container">
          <div className="ai-interview-room-container">
            <div className="error">{error}</div>
            <button onClick={() => navigate('/ai-interview')} className="back-btn">
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container ai-interview-room-container">
      <div className="interview-header">
        <div className="company-info">
          <h2>{localStorage.getItem('ai_selected_company_name') || '기업명 없음'}</h2>
          <p>AI 면접 진행 중</p>
        </div>
        
        <div className="session-info">
          <span className="question-counter">
            {questionCount} / {MAX_TOTAL_QUESTIONS}
          </span>
          <span className="interview-stage">
            {interviewStage === 'self_introduction_request' ? '자기소개 요청' :
             interviewStage === 'initial_question' ? '초기 질문' :
             interviewStage === 'next_question' ? '다음 질문' :
             interviewStage === 'follow_up_question' ? '심화 질문' :
             interviewStage === 'final' ? '마무리' : '진행중'}
          </span>
        </div>

        <div className="interview-controls">
          <button onClick={handlePauseInterview} className="pause-btn">
            일시정지
          </button>
          <button onClick={handleEndInterview} className="end-btn">
            면접 종료
          </button>
        </div>
      </div>

      <div className="interview-content">
        {currentQuestion ? (
          <div className="question-section">
            <div className="question-card">
              <div className="question-header">
                <span className="question-type">{currentQuestion.question_type}</span>
                <span className="question-number">
                  {interviewStage === 'self_introduction_request' ? '자기소개 요청' : `질문 ${currentQuestion.question_number}`}
                </span>
              </div>
              <h3 className="question-text">{currentQuestion.question_text}</h3>
            </div>
            
            {aiAudioUrl && (
              <div className="ai-audio-controls">
                <button 
                  onClick={() => {
                    const audio = new Audio(aiAudioUrl);
                    audio.play();
                  }}
                  className="play-ai-audio-btn"
                >
                  🔊 AI 음성 다시 듣기
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="no-question">
            <p>질문을 불러오는 중입니다...</p>
          </div>
        )}

        <div className="answer-section">
          <div className="transcription-area">
            <h4>답변 내용</h4>
            <div className="transcription-text">
              {transcription || '음성으로 답변해주세요...'}
            </div>
          </div>

          <div className="recording-controls">
            {!isRecording && !isProcessing ? (
              <button onClick={startRecording} className="record-btn">
                🎤 답변 시작
              </button>
            ) : isRecording ? (
              <button onClick={stopRecording} className="stop-btn">
                ⏹️ 답변 완료
              </button>
            ) : (
              <div className="processing">
                <div className="spinner"></div>
                <p>답변을 분석하고 있습니다...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">
            ✕
          </button>
        </div>
      )}

      <div className="interview-tips">
        <h4>면접 팁</h4>
        <ul>
          <li>명확하고 자신감 있게 답변해주세요.</li>
          <li>구체적인 경험과 예시를 들어 설명하세요.</li>
          <li>답변 후 "답변 완료" 버튼을 눌러주세요.</li>
          <li>면접 중 언제든지 일시정지할 수 있습니다.</li>
          {interviewStage === 'self_introduction_request' && (
            <li>먼저 간단한 자기소개를 해주세요.</li>
          )}
        </ul>
      </div>
      </div>
    </Layout>
  );
};

export default AIInterviewRoom;
