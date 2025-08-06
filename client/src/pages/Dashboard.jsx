import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { selfIntroductionAPI, resumeAPI } from '../services/api';

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
        
        setIntroductions(introResponse.data || []);
        setResumes(resumeResponse.data || []);
      } catch (error) {
        console.error('문서 로드 오류:', error);
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
      <div style={{ padding: '40px 0' }}>
        {/* 헤더 섹션 */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '16px', 
            marginBottom: '24px',
            padding: '16px 32px',
            background: '#ffffff',
            borderRadius: '50px',
            border: '2px solid #667eea',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '32px' }}>🚀</div>
            <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '700' }}>
              면접 준비를 위한 모든 도구
            </div>
          </div>
          
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
            fontWeight: '900', 
            marginBottom: '20px',
            color: '#000000'
          }}>
            대시보드
          </h1>
          
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#374151', 
            maxWidth: '600px', 
            margin: '0 auto',
            lineHeight: '1.6',
            fontWeight: '500'
          }}>
            AI 면접, 문서 관리, 분석 결과까지 한 곳에서 관리하세요
          </p>
        </div>
        
        {/* 메뉴 카드들 */}
        <div className="dashboard-grid">
          <div className="card dashboard-card" onClick={() => navigate('/write?type=intro')} style={{
            background: '#ffffff',
            border: '3px solid #e5e7eb',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              position: 'relative',
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '20px',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
            }}>
              📝
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px', color: '#000000' }}>
              자기소개서 작성
            </h3>
            <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '20px', fontSize: '0.95rem', fontWeight: '500' }}>
              새로운 자기소개서를 작성하거나 기존 문서를 수정하세요.
            </p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(102, 126, 234, 0.1)',
              borderRadius: '12px',
              border: '2px solid rgba(102, 126, 234, 0.3)'
            }}>
              <span style={{ fontSize: '0.9rem', color: '#667eea', fontWeight: '700' }}>
                현재 {introductions.length}개 작성됨
              </span>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>→</div>
            </div>
          </div>
          
          <div className="card dashboard-card" onClick={() => navigate('/write?type=resume')} style={{
            background: '#ffffff',
            border: '3px solid #e5e7eb',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              position: 'relative',
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '20px',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
            }}>
              📄
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px', color: '#000000' }}>
              이력서 작성
            </h3>
            <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '20px', fontSize: '0.95rem', fontWeight: '500' }}>
              새로운 이력서를 작성하거나 기존 문서를 수정하세요.
            </p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '12px',
              border: '2px solid rgba(16, 185, 129, 0.3)'
            }}>
              <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: '700' }}>
                현재 {resumes.length}개 작성됨
              </span>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>→</div>
            </div>
          </div>
          
          <div className="card dashboard-card" onClick={() => navigate('/select-company')} style={{
            background: '#ffffff',
            border: '3px solid #e5e7eb',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              position: 'relative',
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '20px',
              boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)'
            }}>
              🎤
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px', color: '#000000' }}>
              AI 면접
            </h3>
            <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '20px', fontSize: '0.95rem', fontWeight: '500' }}>
              관심 기업을 선택하고 AI 면접을 시작하세요.
            </p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '12px',
              border: '2px solid rgba(245, 158, 11, 0.3)'
            }}>
              <span style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: '700' }}>
                실시간 음성 분석
              </span>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>→</div>
            </div>
          </div>
          
          <div className="card dashboard-card" onClick={() => navigate('/final-report')} style={{
            background: '#ffffff',
            border: '3px solid #e5e7eb',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              position: 'relative',
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '20px',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
            }}>
              📊
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px', color: '#000000' }}>
              누적 보고서
            </h3>
            <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '20px', fontSize: '0.95rem', fontWeight: '500' }}>
              면접 결과와 통계를 확인하세요.
            </p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '12px',
              border: '2px solid rgba(139, 92, 246, 0.3)'
            }}>
              <span style={{ fontSize: '0.9rem', color: '#8b5cf6', fontWeight: '700' }}>
                상세한 분석 결과
              </span>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>→</div>
            </div>
          </div>
          
          <div className="card dashboard-card" onClick={() => navigate('/mypage')} style={{
            background: '#ffffff',
            border: '3px solid #e5e7eb',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              position: 'relative',
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '20px',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)'
            }}>
              👤
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px', color: '#000000' }}>
              마이페이지
            </h3>
            <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '20px', fontSize: '0.95rem', fontWeight: '500' }}>
              개인 정보와 활동 내역을 확인하세요.
            </p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '12px',
              border: '2px solid rgba(239, 68, 68, 0.3)'
            }}>
              <span style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: '700' }}>
                개인 설정 관리
              </span>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>→</div>
            </div>
          </div>
        </div>

        {/* 문서 목록 섹션 */}
        <div style={{ marginTop: '80px' }}>
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '48px',
            padding: '32px',
            background: '#ffffff',
            borderRadius: '20px',
            border: '3px solid #e5e7eb',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '800', 
              marginBottom: '16px',
              color: '#000000'
            }}>
              내 문서 관리
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#374151', maxWidth: '500px', margin: '0 auto', fontWeight: '600' }}>
              작성한 문서들을 체계적으로 관리하고 수정하세요
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
            gap: '32px' 
          }}>
            {/* 자기소개서 목록 */}
            <div className="card" style={{ 
              background: '#ffffff',
              border: '3px solid #e5e7eb',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
                <div style={{ 
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  marginRight: '16px'
                }}>
                  📝
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#000000', margin: '0 0 4px 0' }}>
                    내 자기소개서
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0', fontWeight: '600' }}>
                    {introductions.length}개의 문서
                  </p>
                </div>
              </div>
              
              {introductions.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px 20px',
                  color: '#6b7280',
                  background: '#f9fafb',
                  borderRadius: '16px',
                  border: '3px dashed #d1d5db'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px', opacity: '0.7' }}>📝</div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '12px', color: '#374151' }}>
                    첫 자기소개서를 작성해보세요
                  </h4>
                  <p style={{ fontSize: '0.9rem', marginBottom: '24px', color: '#6b7280', fontWeight: '500' }}>
                    아직 작성된 자기소개서가 없습니다.
                  </p>
                  <button 
                    className="btn-primary"
                    onClick={() => navigate('/write?type=intro')}
                    style={{ fontSize: '0.9rem', padding: '12px 24px' }}
                  >
                    첫 자기소개서 작성하기
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {introductions.map((intro) => (
                    <div key={intro.id} style={{ 
                      padding: '20px', 
                      background: '#f9fafb', 
                      borderRadius: '16px', 
                      border: '2px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                    onClick={() => handleEditIntro(intro.id)}
                    >
                      <div>
                        <div style={{ fontWeight: '700', color: '#000000', marginBottom: '6px', fontSize: '1rem' }}>
                          {intro.title}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>
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
                        className="btn-primary"
                        style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                      >
                        수정
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 이력서 목록 */}
            <div className="card" style={{ 
              background: '#ffffff',
              border: '3px solid #e5e7eb',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
                <div style={{ 
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  marginRight: '16px'
                }}>
                  📄
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#000000', margin: '0 0 4px 0' }}>
                    내 이력서
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0', fontWeight: '600' }}>
                    {resumes.length}개의 문서
                  </p>
                </div>
              </div>
              
              {resumes.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px 20px',
                  color: '#6b7280',
                  background: '#f9fafb',
                  borderRadius: '16px',
                  border: '3px dashed #d1d5db'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px', opacity: '0.7' }}>📄</div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '12px', color: '#374151' }}>
                    첫 이력서를 작성해보세요
                  </h4>
                  <p style={{ fontSize: '0.9rem', marginBottom: '24px', color: '#6b7280', fontWeight: '500' }}>
                    아직 작성된 이력서가 없습니다.
                  </p>
                  <button 
                    className="btn-primary"
                    onClick={() => navigate('/write?type=resume')}
                    style={{ fontSize: '0.9rem', padding: '12px 24px' }}
                  >
                    첫 이력서 작성하기
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {resumes.map((resume) => (
                    <div key={resume.id} style={{ 
                      padding: '20px', 
                      background: '#f9fafb', 
                      borderRadius: '16px', 
                      border: '2px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                    onClick={() => handleEditResume(resume.id)}
                    >
                      <div>
                        <div style={{ fontWeight: '700', color: '#000000', marginBottom: '6px', fontSize: '1rem' }}>
                          {resume.title}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>
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
                        className="btn-primary"
                        style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                      >
                        수정
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard; 