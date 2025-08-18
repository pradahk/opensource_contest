import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { aiInterviewAPI } from '../services/api';
import Layout from '../components/Layout';
import '../styles/AIInterviewFeedback.css';

const AIInterviewFeedback = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const [feedbackResponse, sessionResponse] = await Promise.all([
        aiInterviewAPI.getFeedback(sessionId),
        aiInterviewAPI.getSession(sessionId)
      ]);

      console.log('피드백 응답:', feedbackResponse);
      console.log('세션 응답:', sessionResponse);

      if (feedbackResponse.success && feedbackResponse.data) {
        setFeedback(feedbackResponse.data);
      } else {
        console.warn('피드백 응답 구조가 예상과 다릅니다:', feedbackResponse);
        setFeedback(null);
      }

      if (sessionResponse.success && sessionResponse.data) {
        setSession(sessionResponse.data);
      } else {
        console.warn('세션 응답 구조가 예상과 다릅니다:', sessionResponse);
        setSession(null);
      }
    } catch (err) {
      setError('피드백을 불러오는데 실패했습니다.');
      console.error('Error loading feedback:', err);
      setFeedback(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-poor';
  };

  const getScoreText = (score) => {
    if (score >= 80) return '우수';
    if (score >= 60) return '양호';
    if (score >= 40) return '보통';
    return '미흡';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container">
          <div className="ai-interview-feedback-container">
            <div className="loading">피드백을 분석하고 있습니다...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container">
          <div className="ai-interview-feedback-container">
            <div className="error">{error}</div>
            <button onClick={loadFeedback} className="retry-btn">다시 시도</button>
            <button onClick={() => navigate('/ai-interview')} className="back-btn">
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!feedback) {
    return (
      <Layout>
        <div className="container">
          <div className="ai-interview-feedback-container">
            <div className="no-feedback">
              <h3>피드백이 아직 준비되지 않았습니다</h3>
              <p>면접이 완료된 후 피드백을 확인할 수 있습니다.</p>
              <button onClick={() => navigate('/ai-interview')} className="back-btn">
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container ai-interview-feedback-container">
      <div className="feedback-header">
        <div className="company-info">
          <h1>{session?.company?.name || '기업명 없음'} AI 면접 결과</h1>
          <p>면접 완료일: {formatDate(session?.ended_at)}</p>
        </div>
        
        <div className="overall-score">
          <div className={`score-circle ${getScoreColor(feedback.overall_score)}`}>
            <span className="score-number">{feedback.overall_score}</span>
            <span className="score-label">점</span>
          </div>
          <div className="score-text">
            <h3>{getScoreText(feedback.overall_score)}</h3>
            <p>종합 평가</p>
          </div>
        </div>
      </div>

      <div className="feedback-content">
        <div className="score-breakdown">
          <h2>세부 평가</h2>
          <div className="score-grid">
            <div className="score-item">
              <div className="score-label">의사소통 능력</div>
              <div className={`score-value ${getScoreColor(feedback.communication_score)}`}>
                {feedback.communication_score}점
              </div>
            </div>
            <div className="score-item">
              <div className="score-label">전문 지식</div>
              <div className={`score-value ${getScoreColor(feedback.technical_score)}`}>
                {feedback.technical_score}점
              </div>
            </div>
            <div className="score-item">
              <div className="score-label">인성 및 태도</div>
              <div className={`score-value ${getScoreColor(feedback.personality_score)}`}>
                {feedback.personality_score}점
              </div>
            </div>
          </div>
        </div>

        <div className="feedback-details">
          <div className="strengths-section">
            <h3>💪 강점</h3>
            <div className="strengths-content">
              {feedback.strengths ? (
                <ul>
                  {feedback.strengths.split('\n').map((strength, index) => (
                    <li key={index}>{strength.trim()}</li>
                  ))}
                </ul>
              ) : (
                <p>강점 분석이 준비되지 않았습니다.</p>
              )}
            </div>
          </div>

          <div className="weaknesses-section">
            <h3>🔧 개선점</h3>
            <div className="weaknesses-content">
              {feedback.weaknesses ? (
                <ul>
                  {feedback.weaknesses.split('\n').map((weakness, index) => (
                    <li key={index}>{weakness.trim()}</li>
                  ))}
                </ul>
              ) : (
                <p>개선점 분석이 준비되지 않았습니다.</p>
              )}
            </div>
          </div>

          <div className="suggestions-section">
            <h3>💡 개선 제안</h3>
            <div className="suggestions-content">
              {feedback.improvement_suggestions ? (
                <ul>
                  {feedback.improvement_suggestions.split('\n').map((suggestion, index) => (
                    <li key={index}>{suggestion.trim()}</li>
                  ))}
                </ul>
              ) : (
                <p>개선 제안이 준비되지 않았습니다.</p>
              )}
            </div>
          </div>
        </div>

        {feedback.detailed_feedback && (
          <div className="detailed-feedback">
            <h3>📋 상세 피드백</h3>
            <div className="detailed-content">
              <pre>{feedback.detailed_feedback}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="feedback-actions">
        <button onClick={() => navigate('/ai-interview')} className="list-btn">
          면접 목록으로
        </button>
        <button onClick={() => navigate('/ai-interview/select')} className="new-interview-btn">
          새 면접 시작
        </button>
        <button onClick={() => window.print()} className="print-btn">
          결과 인쇄
        </button>
      </div>

      <div className="feedback-tips">
        <h4>💡 면접 개선을 위한 팁</h4>
        <ul>
          <li>정기적으로 AI 면접을 연습하여 실전 감각을 기르세요.</li>
          <li>피드백에서 지적된 개선점을 중심으로 연습하세요.</li>
          <li>다양한 기업의 면접을 경험해보세요.</li>
          <li>실제 면접 전에 AI 면접으로 충분히 연습하세요.</li>
        </ul>
      </div>
      </div>
    </Layout>
  );
};

export default AIInterviewFeedback;
