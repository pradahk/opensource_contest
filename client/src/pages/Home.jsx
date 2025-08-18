import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

const Home = () => {
  const navigate = useNavigate();
  
  return (
    <Layout>
      <div className="main-content">
        <div className="container">
          <div className="d-flex flex-column align-center justify-center text-center">
            {/* 히어로 섹션 */}
            <div className="card animate-fade-in" style={{ 
              maxWidth: '900px', 
              width: '100%',
              marginBottom: '80px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
                animation: 'float 6s ease-in-out infinite'
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="card glass mb-4 animate-slide-in-left">
                  <div className="d-flex align-center justify-center gap-3">
                    <div style={{ fontSize: '24px' }}>🚀</div>
                    <div style={{ fontSize: '16px', color: '#667eea', fontWeight: '700' }}>
                      AI 기반 면접 준비 플랫폼
                    </div>
                  </div>
                </div>
                
                <h1 className="gradient-text" style={{ 
                  fontSize: 'clamp(3rem, 6vw, 5rem)', 
                  fontWeight: '900', 
                  marginBottom: '32px', 
                  lineHeight: '1.1',
                  letterSpacing: '-0.02em'
                }}>
                  AI 면접 준비의<br/>
                  새로운 시작
                </h1>
                
                <p style={{ 
                  fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)', 
                  color: '#6b7280', 
                  lineHeight: '1.7',
                  marginBottom: '48px',
                  maxWidth: '700px',
                  margin: '0 auto 48px auto',
                  fontWeight: '500'
                }}>
                  AI 기반 모의 면접, 실시간 피드백, 그리고 체계적인 면접 준비까지.<br/>
                  당신의 면접 성공을 위한 모든 것을 <span className="gradient-text" style={{ fontWeight: '700' }}>InnoView</span>에서 만나보세요.
                </p>
                
                <div className="d-flex gap-4 justify-center" style={{ flexWrap: 'wrap' }}>
                  <button 
                    className="btn-primary hover-lift"
                    onClick={() => navigate('/login')}
                    style={{ 
                      fontSize: '1.1rem', 
                      padding: '18px 40px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>🎯</span>
                    시작하기
                  </button>
                  <button 
                    className="btn-secondary hover-lift"
                    onClick={() => navigate('/introduction')}
                    style={{ 
                      fontSize: '1.1rem', 
                      padding: '18px 40px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>📖</span>
                    서비스 소개
                  </button>
                </div>
              </div>
            </div>

            {/* 기능 소개 섹션 */}
            <div className="dashboard-grid mb-5">
              <div className="dashboard-card hover-lift animate-scale-in">
                <div className="p-4 rounded-xl mb-4" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '36px',
                  boxShadow: '0 12px 40px rgba(102, 126, 234, 0.3)'
                }}>
                  🎤
                </div>
                <h3 className="gradient-text" style={{ fontSize: '28px', fontWeight: '800', marginBottom: '16px' }}>
                  AI 모의면접
                </h3>
                <p style={{ color: '#6b7280', lineHeight: '1.7', marginBottom: '24px', fontSize: '16px', fontWeight: '500' }}>
                  실시간 음성 인식과 AI 피드백으로 실제 면접과 같은 경험을 제공합니다. 
                  발음, 감정, 속도까지 상세하게 분석해드립니다.
                </p>
                <div className="p-3 glass-dark rounded-xl">
                  <div style={{ fontSize: '14px', color: '#667eea', fontWeight: '700' }}>
                    실시간 음성 분석 및 피드백
                  </div>
                </div>
              </div>
              
              <div className="dashboard-card hover-lift animate-scale-in">
                <div className="p-4 rounded-xl mb-4" style={{
                  background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                  fontSize: '36px',
                  boxShadow: '0 12px 40px rgba(78, 205, 196, 0.3)'
                }}>
                  📊
                </div>
                <h3 className="gradient-text-secondary" style={{ fontSize: '28px', fontWeight: '800', marginBottom: '16px' }}>
                  상세한 분석
                </h3>
                <p style={{ color: '#6b7280', lineHeight: '1.7', marginBottom: '24px', fontSize: '16px', fontWeight: '500' }}>
                  발음, 감정, 속도 등 다양한 측면에서 면접 성과를 분석해드립니다. 
                  개선점과 강점을 명확하게 파악할 수 있습니다.
                </p>
                <div className="p-3 glass-dark rounded-xl">
                  <div style={{ fontSize: '14px', color: '#4ecdc4', fontWeight: '700' }}>
                    다차원적 성과 분석
                  </div>
                </div>
              </div>
              
              <div className="dashboard-card hover-lift animate-scale-in">
                <div className="p-4 rounded-xl mb-4" style={{
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                  fontSize: '36px',
                  boxShadow: '0 12px 40px rgba(255, 107, 107, 0.3)'
                }}>
                  📝
                </div>
                <h3 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '16px', color: '#ff6b6b' }}>
                  문서 관리
                </h3>
                <p style={{ color: '#6b7280', lineHeight: '1.7', marginBottom: '24px', fontSize: '16px', fontWeight: '500' }}>
                  자기소개서와 이력서를 체계적으로 관리하고 수정할 수 있습니다. 
                  버전 관리와 실시간 편집으로 완벽한 문서를 만들어보세요.
                </p>
                <div className="p-3 glass-dark rounded-xl">
                  <div style={{ fontSize: '14px', color: '#ff6b6b', fontWeight: '700' }}>
                    실시간 문서 편집 및 관리
                  </div>
                </div>
              </div>
              
              <div className="dashboard-card hover-lift animate-scale-in">
                <div className="p-4 rounded-xl mb-4" style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  fontSize: '36px',
                  boxShadow: '0 12px 40px rgba(245, 158, 11, 0.3)'
                }}>
                  📈
                </div>
                <h3 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '16px', color: '#f59e0b' }}>
                  진행 상황 추적
                </h3>
                <p style={{ color: '#6b7280', lineHeight: '1.7', marginBottom: '24px', fontSize: '16px', fontWeight: '500' }}>
                  면접 준비 과정과 개선 사항을 시각적으로 확인할 수 있습니다. 
                  체계적인 학습과 지속적인 발전을 지원합니다.
                </p>
                <div className="p-3 glass-dark rounded-xl">
                  <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: '700' }}>
                    시각적 진행 상황 모니터링
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
