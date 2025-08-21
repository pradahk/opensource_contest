import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useUser();

  const handleLogout = () => {
    if (window.confirm('로그아웃하시겠습니까?')) {
      logout();
      alert('로그아웃되었습니다.');
      navigate('/');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <header className="header">
        <div className="header-logo hover-scale" onClick={() => navigate('/')}>
          InnoView
        </div>
        <div className="d-flex align-center gap-3">
          {isAuthenticated && (
            <nav className="d-flex gap-2">
              <button 
                className={`btn-secondary hover-scale ${location.pathname === '/dashboard' ? 'gradient-text' : ''}`}
                onClick={() => navigate('/dashboard')}
                style={{ fontSize: '14px', padding: '10px 18px' }}
              >
                📊 대시보드
              </button>
              <button 
                className={`btn-secondary hover-scale ${location.pathname === '/mypage' ? 'gradient-text' : ''}`}
                onClick={() => navigate('/mypage')}
                style={{ fontSize: '14px', padding: '10px 18px' }}
              >
                👤 마이페이지
              </button>
            </nav>
          )}
          {isAuthenticated ? (
            <button 
              className="btn-danger hover-scale" 
              onClick={handleLogout} 
              style={{ fontSize: '14px', padding: '10px 18px' }}
            >
              🚪 로그아웃
            </button>
          ) : (
            <button 
              className="btn-primary hover-scale" 
              onClick={() => navigate('/login')} 
              style={{ fontSize: '14px', padding: '10px 18px' }}
            >
              🔑 로그인
            </button>
          )}
        </div>
      </header>

      {/* 본문 */}
      <main className="main-content">
        {children}
      </main>

      {/* 푸터 */}
      <footer className="footer">
        <div className="container">
          <div className="d-flex justify-between align-center" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div className="gradient-text" style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                InnoView
              </div>
              <div style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '500' }}>
                🤖 AI 기반 면접 준비 플랫폼
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '500' }}>
              © 2025 InnoView. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 