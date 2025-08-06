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
        <div className="header-logo" onClick={() => navigate('/')}>
          InnoView
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAuthenticated && (
            <nav style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/dashboard')}
                style={{ fontSize: '14px', padding: '8px 16px' }}
              >
                대시보드
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/mypage')}
                style={{ fontSize: '14px', padding: '8px 16px' }}
              >
                마이페이지
              </button>
            </nav>
          )}
          {isAuthenticated ? (
            <button className="btn-danger" onClick={handleLogout} style={{ fontSize: '14px', padding: '8px 16px' }}>
              로그아웃
            </button>
          ) : (
            <button className="btn-primary" onClick={() => navigate('/login')} style={{ fontSize: '14px', padding: '8px 16px' }}>
              로그인
            </button>
          )}
        </div>
      </header>

      {/* 본문 */}
      <main className="main-content">
        <div className="container">
          {children}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="footer">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                InnoView
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                AI 기반 면접 준비 플랫폼
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              © 2024 InnoView. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 