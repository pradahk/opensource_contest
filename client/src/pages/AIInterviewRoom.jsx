import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { aiInterviewAPI } from '../services/api';
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
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (sessionId && !isInitialized) {
      setIsInitialized(true);
      initializeSession();
      initializeSpeechRecognition();
    }
  }, [sessionId, isInitialized]);

  const initializeSession = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('AI 인터뷰 세션 초기화 시작');
      
      // AI 인터뷰 세션 시작
      const response = await aiInterviewAPI.startSession({
        userId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null,
        companyId: sessionId, // sessionId를 companyId로 사용
        position: '개발자' // 기본값 설정
      });
      
      console.log('AI 인터뷰 세션 응답:', response);
      
      if (response.success) {
        const newThreadId = response.thread_id;
        setThreadId(newThreadId);
        setSession({ id: sessionId, thread_id: newThreadId });
        
        // 초기 질문 생성 (threadId를 매개변수로 전달)
        await generateInitialQuestion(newThreadId);
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

  const generateInitialQuestion = async (currentThreadId) => {
    try {
      const response = await aiInterviewAPI.chat('안녕하세요. 면접을 시작해주세요.', currentThreadId);
      
      if (response.success) {
        setAiResponse(response.response);
        setCurrentQuestion({
          question_text: response.response,
          question_type: '인성',
          question_number: 1
        });
        
        // AI 음성 재생
        if (response.audioContent) {
          const audioBlob = new Blob(
            [Uint8Array.from(atob(response.audioContent), c => c.charCodeAt(0))],
            { type: 'audio/mp3' }
          );
          const audioUrl = URL.createObjectURL(audioBlob);
          setAiAudioUrl(audioUrl);
          
          const audio = new Audio(audioUrl);
          audio.play();
        }
      } else {
        throw new Error(response.error || '초기 질문을 생성하는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Error generating initial question:', err);
      
      // 더 구체적인 오류 메시지 제공
      if (err.response) {
        const errorMessage = err.response.data?.error || err.response.data?.message || '서버 오류가 발생했습니다.';
        setError(`초기 질문 생성 실패: ${errorMessage}`);
      } else if (err.request) {
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setError(`초기 질문을 생성하는데 실패했습니다: ${err.message}`);
      }
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
      setIsRecording(true);
      setTranscription('');
      
      // 음성 인식 시작
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
      
      // 음성 인식 중지
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
      console.log('오디오 Blob 크기:', audioBlob.size, 'bytes');

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

      // AI와 대화
      console.log('AI 채팅 요청 중...');
      const chatResponse = await aiInterviewAPI.chat(userTranscription, threadId);
      console.log('AI 채팅 응답:', chatResponse);
      
      if (chatResponse.success) {
        console.log('=== AI 응답 ===');
        console.log('AI 응답:', chatResponse.response);
        setAiResponse(chatResponse.response);
        
        // AI 음성 재생
        if (chatResponse.audioContent) {
          console.log('AI 음성 재생 시작...');
          const audioBlob = new Blob(
            [Uint8Array.from(atob(chatResponse.audioContent), c => c.charCodeAt(0))],
            { type: 'audio/mp3' }
          );
          const audioUrl = URL.createObjectURL(audioBlob);
          setAiAudioUrl(audioUrl);
          
          const audio = new Audio(audioUrl);
          audio.play().catch(audioError => {
            console.error('AI 음성 재생 실패:', audioError);
          });
        }

        // 다음 질문으로 업데이트 (question_text만 사용)
        setCurrentQuestion({
          question_text: chatResponse.response,
          question_type: 'AI 질문',
          question_number: (currentQuestion?.question_number || 0) + 1
        });
        
        console.log('=== 답변 처리 완료 ===');
      } else {
        throw new Error(chatResponse.error || 'AI 응답을 받는데 실패했습니다.');
      }
    } catch (err) {
      console.error('=== 답변 처리 오류 ===');
      console.error('오류 타입:', err.constructor.name);
      console.error('오류 메시지:', err.message);
      console.error('오류 스택:', err.stack);
      
      // 더 구체적인 오류 메시지 제공
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

  const handleEndInterview = async () => {
    if (window.confirm('면접을 종료하시겠습니까?')) {
      try {
        await aiInterviewAPI.endSession(threadId);
        navigate('/ai-interview');
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
      <div className="ai-interview-room-container">
        <div className="loading">면접실을 준비 중입니다...</div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="ai-interview-room-container">
        <div className="error">{error}</div>
        <button onClick={() => navigate('/ai-interview')} className="back-btn">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="ai-interview-room-container">
      <div className="interview-header">
        <div className="company-info">
          <h2>{session?.company?.name || '기업명 없음'}</h2>
          <p>AI 면접 진행 중</p>
        </div>
        
        <div className="session-info">
          <span className="question-counter">
            {session?.current_question_number || 0} / {session?.total_questions || 0}
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
                <span className="question-number">질문 {currentQuestion.question_number}</span>
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
        </ul>
      </div>
    </div>
  );
};

export default AIInterviewRoom;
