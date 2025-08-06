// Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import Layout from "../../components/Layout";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, error, clearError } = useUser();

  // 이미 로그인된 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // 에러가 있으면 알림 표시
  useEffect(() => {
    if (error) {
      alert(error);
      clearError();
    }
  }, [error, clearError]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await login(email, password);
      if (result.success) {
        alert('로그인 성공!');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('로그인 오류:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Layout>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh - 160px)',
        padding: '40px 0'
      }}>
        <div className="card" style={{ 
          maxWidth: '400px', 
          width: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          {/* 로고/아이콘 */}
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔐</div>
          
          <h1 style={{ 
            fontSize: 'clamp(1.5rem, 3vw, 2rem)', 
            fontWeight: '800', 
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            로그인
          </h1>
          
          <p style={{ 
            color: '#6b7280', 
            marginBottom: '32px',
            fontSize: '1rem'
          }}>
            InnoView에 오신 것을 환영합니다
          </p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">이메일</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="이메일을 입력하세요" 
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="비밀번호를 입력하세요" 
                className="form-input"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary"
              style={{ 
                fontSize: '1rem', 
                padding: '16px 32px',
                marginTop: '8px'
              }}
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>
          
          <div style={{ 
            marginTop: '32px', 
            fontSize: '0.9rem', 
            color: '#6b7280',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '24px'
          }}>
            계정이 없으신가요?{' '}
            <Link 
              to="/register" 
              style={{ 
                color: '#667eea', 
                fontWeight: '600', 
                textDecoration: 'none',
                borderBottom: '1px solid #667eea'
              }}
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login; 