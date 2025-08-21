import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { selfIntroductionAPI, resumeAPI } from '../services/api';

// 개발 환경 확인
const isDevelopment = process.env.NODE_ENV === 'development';

const Dashboard = () => {
  const navigate = useNavigate();
  const [introductions, setIntroductions] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true);
        
        // 자기소개서와 이력서 목록 로드
        const [introResponse, resumeResponse] = await Promise.all([
          selfIntroductionAPI.getAll(),
          resumeAPI.getAll()
        ]);
        
        // 서버 응답 구조: { success: true, data: [...] }
        if (introResponse.success && introResponse.data) {
          setIntroductions(introResponse.data);
        } else {
          setIntroductions([]);
        }
        
        if (resumeResponse.success && resumeResponse.data) {
          setResumes(resumeResponse.data);
        } else {
          setResumes([]);
        }
      } catch (error) {
        console.error('문서 로드 오류:', error);
        // 에러 발생 시 빈 배열로 설정
        setIntroductions([]);
        setResumes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  const handleEditIntro = (id) => {
    navigate(`/edit-intro/${id}`);
  };

  const handleEditResume = (id) => {
    navigate(`/edit-resume/${id}`);
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

  return (
    <Layout>
      <div>
        <div className="container">
          {/* 헤더 섹션 */}
          <div className="text-center mb-5 animate-fade-in">
            <h1 style={{ 
              fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
              fontWeight: '900', 
              marginBottom: '20px',
              color: '#fff'
            }}>
              🚀 대시보드
            </h1>
            
            <p style={{ 
              fontSize: '1.2rem', 
              color: '#374151', 
              maxWidth: '600px', 
              margin: '0 auto',
              lineHeight: '1.6',
              fontWeight: '600'
            }}>
              AI 면접, 문서 관리, 분석 결과까지 한 곳에서 관리하세요
            </p>
          </div>
          
          {/* 메뉴 카드들 */}
          <div className="dashboard-grid mb-5">
            <div className="dashboard-card hover-lift animate-scale-in" onClick={() => navigate('/write?type=intro')}>
              <div className="d-flex align-center mb-3">
                <div className="p-3 rounded-xl" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '32px',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                }}>
                  📝
                </div>
                <div className="ml-3">
                  <h3 className="gradient-text" style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
                    자기소개서 작성
                  </h3>
                  <p style={{ color: '#374151', fontSize: '16px', fontWeight: '600' }}>
                    새로운 자기소개서를 작성하거나 기존 문서를 수정하세요.
                  </p>
                </div>
              </div>
              <div className="p-3 glass-dark rounded-xl">
                <div className="d-flex justify-between align-center">
                  <span style={{ fontSize: '14px', color: '#667eea', fontWeight: '700' }}>
                    현재 {introductions.length}개 작성됨
                  </span>
                  <div style={{ fontSize: '16px', color: '#6b7280' }}>→</div>
                </div>
              </div>
            </div>
            
            <div className="dashboard-card hover-lift animate-scale-in" onClick={() => navigate('/write?type=resume')}>
              <div className="d-flex align-center mb-3">
                <div className="p-3 rounded-xl" style={{
                  background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                  fontSize: '32px',
                  boxShadow: '0 8px 32px rgba(78, 205, 196, 0.3)'
                }}>
                  📄
                </div>
                <div className="ml-3">
                  <h3 className="gradient-text-secondary" style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
                    이력서 작성
                  </h3>
                  <p style={{ color: '#374151', fontSize: '16px', fontWeight: '600' }}>
                    새로운 이력서를 작성하거나 기존 문서를 수정하세요.
                  </p>
                </div>
              </div>
              <div className="p-3 glass-dark rounded-xl">
                <div className="d-flex justify-between align-center">
                  <span style={{ fontSize: '14px', color: '#4ecdc4', fontWeight: '700' }}>
                    현재 {resumes.length}개 작성됨
                  </span>
                  <div style={{ fontSize: '16px', color: '#6b7280' }}>→</div>
                </div>
              </div>
            </div>
            
            <div className="dashboard-card hover-lift animate-scale-in" onClick={() => navigate('/ai-interview')}>
              <div className="d-flex align-center mb-3">
                <div className="p-3 rounded-xl" style={{
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                  fontSize: '32px',
                  boxShadow: '0 8px 32px rgba(255, 107, 107, 0.3)'
                }}>
                  🤖
                </div>
                <div className="ml-3">
                  <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: '#ff6b6b' }}>
                    AI 면접
                  </h3>
                  <p style={{ color: '#374151', fontSize: '16px', fontWeight: '600' }}>
                    AI와 함께 맞춤형 면접을 진행하고 실시간 피드백을 받으세요.
                  </p>
                </div>
              </div>
              <div className="p-3 glass-dark rounded-xl">
                <div className="d-flex justify-between align-center">
                  <span style={{ fontSize: '14px', color: '#ff6b6b', fontWeight: '700' }}>
                    AI 기반 맞춤 면접
                  </span>
                  <div style={{ fontSize: '16px', color: '#6b7280' }}>→</div>
                </div>
              </div>
            </div>
            
            <div className="dashboard-card hover-lift animate-scale-in" onClick={() => navigate('/final-report')}>
              <div className="d-flex align-center mb-3">
                <div className="p-3 rounded-xl" style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  fontSize: '32px',
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
                }}>
                  📊
                </div>
                <div className="ml-3">
                  <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: '#8b5cf6' }}>
                    누적 보고서
                  </h3>
                  <p style={{ color: '#374151', fontSize: '16px', fontWeight: '600' }}>
                    면접 결과와 통계를 확인하세요.
                  </p>
                </div>
              </div>
              <div className="p-3 glass-dark rounded-xl">
                <div className="d-flex justify-between align-center">
                  <span style={{ fontSize: '14px', color: '#8b5cf6', fontWeight: '700' }}>
                    상세한 분석 결과
                  </span>
                  <div style={{ fontSize: '16px', color: '#6b7280' }}>→</div>
                </div>
              </div>
            </div>
            
            <div className="dashboard-card hover-lift animate-scale-in" onClick={() => navigate('/mypage')}>
              <div className="d-flex align-center mb-3">
                <div className="p-3 rounded-xl" style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  fontSize: '32px',
                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)'
                }}>
                  👤
                </div>
                <div className="ml-3">
                  <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: '#f59e0b' }}>
                    마이페이지
                  </h3>
                  <p style={{ color: '#374151', fontSize: '16px', fontWeight: '600' }}>
                    개인 정보와 활동 내역을 확인하세요.
                  </p>
                </div>
              </div>
              <div className="p-3 glass-dark rounded-xl">
                <div className="d-flex justify-between align-center">
                  <span style={{ fontSize: '14px', color: '#f59e0b', fontWeight: '700' }}>
                    개인 설정 관리
                  </span>
                  <div style={{ fontSize: '16px', color: '#6b7280' }}>→</div>
                </div>
              </div>
            </div>
          </div>

          {/* 문서 목록 섹션 */}
          <div className="animate-fade-in">
            <div className="card glass mb-4 animate-slide-in-right">
              <div className="text-center">
                <h2 style={{ 
                  fontSize: '32px', 
                  fontWeight: '800', 
                  marginBottom: '16px',
                  color: '#fff'
                }}>
                  📁 내 문서 관리
                </h2>
                <p style={{ fontSize: '18px', color: '#374151', maxWidth: '500px', margin: '0 auto', fontWeight: '700' }}>
                  작성한 문서들을 체계적으로 관리하고 수정하세요
                </p>
              </div>
            </div>
            
            <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px' }}>
              {/* 자기소개서 목록 */}
              <div className="card animate-slide-in-left">
                <div className="d-flex align-center mb-4">
                  <div className="p-3 rounded-xl mr-3" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: '24px',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                  }}>
                    📝
                  </div>
                  <div>
                    <h3 className="gradient-text" style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>
                      내 자기소개서
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>
                      {introductions.length}개의 문서
                    </p>
                  </div>
                </div>
                
                {introductions.length === 0 ? (
                  <div className="text-center p-5 glass-dark rounded-xl">
                    <div style={{ fontSize: '64px', marginBottom: '20px', opacity: '0.7' }}>📝</div>
                    <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#374151' }}>
                      첫 자기소개서를 작성해보세요
                    </h4>
                    <p style={{ fontSize: '16px', marginBottom: '24px', color: '#374151', fontWeight: '600' }}>
                      아직 작성된 자기소개서가 없습니다.
                    </p>
                    <button 
                      className="btn-primary hover-lift"
                      onClick={() => navigate('/write?type=intro')}
                    >
                      첫 자기소개서 작성하기
                    </button>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {introductions.map((intro) => (
                      <div key={intro.id} className="p-4 glass-dark rounded-xl hover-lift"
                        onClick={() => handleEditIntro(intro.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex justify-between align-center">
                          <div>
                            <div style={{ fontWeight: '700', color: '#1a1a1a', marginBottom: '6px', fontSize: '16px' }}>
                              {intro.title}
                            </div>
                            <div style={{ fontSize: '14px', color: '#374151', fontWeight: '600' }}>
                              {new Date(intro.updated_at).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditIntro(intro.id);
                            }}
                            className="btn-primary hover-scale"
                            style={{ fontSize: '14px', padding: '8px 16px' }}
                          >
                            수정
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 이력서 목록 */}
              <div className="card animate-slide-in-right">
                <div className="d-flex align-center mb-4">
                  <div className="p-3 rounded-xl mr-3" style={{
                    background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                    fontSize: '24px',
                    boxShadow: '0 8px 32px rgba(78, 205, 196, 0.3)'
                  }}>
                    📄
                  </div>
                  <div>
                    <h3 className="gradient-text-secondary" style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>
                      내 이력서
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>
                      {resumes.length}개의 문서
                    </p>
                  </div>
                </div>
                
                {resumes.length === 0 ? (
                  <div className="text-center p-5 glass-dark rounded-xl">
                    <div style={{ fontSize: '64px', marginBottom: '20px', opacity: '0.7' }}>📄</div>
                    <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#374151' }}>
                      첫 이력서를 작성해보세요
                    </h4>
                    <p style={{ fontSize: '16px', marginBottom: '24px', color: '#374151', fontWeight: '600' }}>
                      아직 작성된 이력서가 없습니다.
                    </p>
                    <button 
                      className="btn-primary hover-lift"
                      onClick={() => navigate('/write?type=resume')}
                    >
                      첫 이력서 작성하기
                    </button>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {resumes.map((resume) => (
                      <div key={resume.id} className="p-4 glass-dark rounded-xl hover-lift"
                        onClick={() => handleEditResume(resume.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex justify-between align-center">
                          <div>
                            <div style={{ fontWeight: '700', color: '#1a1a1a', marginBottom: '6px', fontSize: '16px' }}>
                              {resume.title}
                            </div>
                            <div style={{ fontSize: '14px', color: '#374151', fontWeight: '600' }}>
                              {new Date(resume.updated_at).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditResume(resume.id);
                            }}
                            className="btn-primary hover-scale"
                            style={{ fontSize: '14px', padding: '8px 16px' }}
                          >
                            수정
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard; 