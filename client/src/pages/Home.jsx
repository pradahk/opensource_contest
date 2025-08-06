import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

const Home = () => {
  const navigate = useNavigate();
  
  return (
    <Layout>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: 'calc(100vh - 160px)',
        textAlign: 'center',
        padding: '40px 0'
      }}>
        {/* 히어로 섹션 */}
        <div className="card" style={{ 
          maxWidth: '900px', 
          width: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
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
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '32px',
              padding: '12px 24px',
              background: 'rgba(102, 126, 234, 0.1)',
              borderRadius: '50px',
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }}>
              <div style={{ fontSize: '24px' }}>🚀</div>
              <div style={{ fontSize: '14px', color: '#667eea', fontWeight: '600' }}>
                AI 기반 면접 준비 플랫폼
              </div>
            </div>
            
            <h1 style={{ 
              fontSize: 'clamp(3rem, 6vw, 5rem)', 
              fontWeight: '900', 
              marginBottom: '32px', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
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
              fontWeight: '400'
            }}>
              AI 기반 모의 면접, 실시간 피드백, 그리고 체계적인 면접 준비까지.<br/>
              당신의 면접 성공을 위한 모든 것을 <strong style={{ color: '#667eea' }}>InnoView</strong>에서 만나보세요.
            </p>
            
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                className="btn-primary"
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
                className="btn-secondary"
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
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '32px', 
          width: '100%',
          maxWidth: '1400px',
          marginBottom: '80px'
        }}>
          <div className="card dashboard-card" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
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
            
            <div style={{ 
              position: 'relative',
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              marginBottom: '24px',
              boxShadow: '0 12px 40px rgba(102, 126, 234, 0.3)'
            }}>
              🎤
            </div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '16px', color: '#1a1a1a' }}>
              AI 모의면접
            </h3>
            <p style={{ color: '#6b7280', lineHeight: '1.7', marginBottom: '24px', fontSize: '1rem' }}>
              실시간 음성 인식과 AI 피드백으로 실제 면접과 같은 경험을 제공합니다. 
              발음, 감정, 속도까지 상세하게 분석해드립니다.
            </p>
            <div style={{ 
              padding: '12px 16px',
              background: 'rgba(102, 126, 234, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              fontSize: '0.9rem',
              color: '#667eea',
              fontWeight: '600'
            }}>
              실시간 음성 분석 및 피드백
            </div>
          </div>
          
          <div className="card dashboard-card" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              height: '4px',
              background: 'linear-gradient(90deg, #4ecdc4 0%, #44a08d 100%)'
            }} />
            
            <div style={{ 
              position: 'relative',
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              marginBottom: '24px',
              boxShadow: '0 12px 40px rgba(78, 205, 196, 0.3)'
            }}>
              📊
            </div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '16px', color: '#1a1a1a' }}>
              상세한 분석
            </h3>
            <p style={{ color: '#6b7280', lineHeight: '1.7', marginBottom: '24px', fontSize: '1rem' }}>
              발음, 감정, 속도 등 다양한 측면에서 면접 성과를 분석해드립니다. 
              개선점과 강점을 명확하게 파악할 수 있습니다.
            </p>
            <div style={{ 
              padding: '12px 16px',
              background: 'rgba(78, 205, 196, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(78, 205, 196, 0.2)',
              fontSize: '0.9rem',
              color: '#4ecdc4',
              fontWeight: '600'
            }}>
              다차원적 성과 분석
            </div>
          </div>
          
          <div className="card dashboard-card" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              height: '4px',
              background: 'linear-gradient(90deg, #ff6b6b 0%, #ee5a52 100%)'
            }} />
            
            <div style={{ 
              position: 'relative',
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              marginBottom: '24px',
              boxShadow: '0 12px 40px rgba(255, 107, 107, 0.3)'
            }}>
              📝
            </div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '16px', color: '#1a1a1a' }}>
              문서 관리
            </h3>
            <p style={{ color: '#6b7280', lineHeight: '1.7', marginBottom: '24px', fontSize: '1rem' }}>
              자기소개서와 이력서를 체계적으로 관리하고 수정할 수 있습니다. 
              버전 관리와 실시간 편집으로 완벽한 문서를 만들어보세요.
            </p>
            <div style={{ 
              padding: '12px 16px',
              background: 'rgba(255, 107, 107, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 107, 107, 0.2)',
              fontSize: '0.9rem',
              color: '#ff6b6b',
              fontWeight: '600'
            }}>
              실시간 문서 편집 및 관리
            </div>
          </div>
          
          <div className="card dashboard-card" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              height: '4px',
              background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
            }} />
            
            <div style={{ 
              position: 'relative',
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              marginBottom: '24px',
              boxShadow: '0 12px 40px rgba(245, 158, 11, 0.3)'
            }}>
              📈
            </div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '16px', color: '#1a1a1a' }}>
              진행 상황 추적
            </h3>
            <p style={{ color: '#6b7280', lineHeight: '1.7', marginBottom: '24px', fontSize: '1rem' }}>
              면접 준비 과정과 개선 사항을 시각적으로 확인할 수 있습니다. 
              체계적인 학습과 지속적인 발전을 지원합니다.
            </p>
            <div style={{ 
              padding: '12px 16px',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              fontSize: '0.9rem',
              color: '#f59e0b',
              fontWeight: '600'
            }}>
              시각적 진행 상황 모니터링
            </div>
          </div>
        </div>
        {/* 애니메이션 스타일 */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
        `}</style>
      </div>
    </Layout>
  );
};

export default Home;
