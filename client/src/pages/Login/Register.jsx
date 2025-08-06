import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import Layout from "../../components/Layout";

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [interestCompany, setInterestCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register, isAuthenticated, error, clearError } = useUser();

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

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!email || !password || !confirmPassword) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await register({
        email,
        password,
        nickname,
        interest_company: interestCompany
      });
      
      if (result.success) {
        alert(result.message || '회원가입 성공!');
        navigate('/login');
      }
    } catch (err) {
      console.error('회원가입 오류:', err);
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
          maxWidth: '450px', 
          width: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          {/* 로고/아이콘 */}
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>👋</div>
          
          <h1 style={{ 
            fontSize: 'clamp(1.5rem, 3vw, 2rem)', 
            fontWeight: '800', 
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            회원가입
          </h1>
          
          <p style={{ 
            color: '#6b7280', 
            marginBottom: '32px',
            fontSize: '1rem'
          }}>
            InnoView와 함께 면접 준비를 시작하세요
          </p>
          
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">이메일 *</label>
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
              <label className="form-label">비밀번호 *</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="비밀번호를 입력하세요 (최소 6자)"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">비밀번호 확인 *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="비밀번호를 다시 입력하세요"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">관심 기업</label>
              <input
                type="text"
                value={interestCompany}
                onChange={e => setInterestCompany(e.target.value)}
                placeholder="관심 있는 기업명을 입력하세요"
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
              {isSubmitting ? '회원가입 중...' : '회원가입'}
            </button>
          </form>
          
          <div style={{ 
            marginTop: '32px', 
            fontSize: '0.9rem', 
            color: '#6b7280',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '24px'
          }}>
            이미 계정이 있으신가요?{' '}
            <Link 
              to="/login" 
              style={{ 
                color: '#667eea', 
                fontWeight: '600', 
                textDecoration: 'none',
                borderBottom: '1px solid #667eea'
              }}
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
