import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AIInterviewList.css';

const AIInterviewList = () => {
  const navigate = useNavigate();

  const handleStartNewSession = () => {
    navigate('/ai-interview/select');
  };

  return (
    <div className="ai-interview-list-container">
      <div className="header">
        <h1>AI 면접</h1>
        <button onClick={handleStartNewSession} className="new-session-btn">
          새 면접 시작
        </button>
      </div>

      <div className="empty-state">
        <div className="empty-icon">🤖</div>
        <h3>AI 면접을 시작해보세요!</h3>
        <p>실시간 음성 인식과 AI 인터뷰어와 함께 면접 연습을 해보세요.</p>
        <div className="features">
          <div className="feature">
            <span className="feature-icon">🎤</span>
            <span>실시간 음성 인식</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🤖</span>
            <span>AI 인터뷰어 응답</span>
          </div>
          <div className="feature">
            <span className="feature-icon">💬</span>
            <span>자연스러운 대화</span>
          </div>
        </div>
        <button onClick={handleStartNewSession} className="start-btn">
          면접 시작하기
        </button>
      </div>
    </div>
  );
};

export default AIInterviewList;
