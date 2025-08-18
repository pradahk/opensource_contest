import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { userAPI, userStatsAPI } from '../services/api';

const MyPage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        
        // 사용자 프로필 정보 조회
        const profileResponse = await userAPI.getProfile();
        setUserInfo(profileResponse.data);
        
        // 사용자 통계 정보 조회
        const statsResponse = await userStatsAPI.getStats();
        setUserStats(statsResponse.data);
      } catch (error) {
        console.error('사용자 정보 로드 오류:', error);
        alert('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        <div className="card animate-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="text-center mb-4">
            <h2 className="gradient-text" style={{ fontSize: '28px', fontWeight: 900 }}>마이 페이지</h2>
            <p style={{ color: '#6b7280', fontWeight: 600 }}>내 정보와 활동 내역을 확인하세요.</p>
          </div>

          {userInfo && (
            <div className="card glass mb-4">
              <h3 className="gradient-text" style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>내 정보</h3>
              <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div className="p-3 glass-dark rounded-xl">이름: <b>{userInfo.nickname || '미설정'}</b></div>
                <div className="p-3 glass-dark rounded-xl">이메일: <b>{userInfo.email}</b></div>
                <div className="p-3 glass-dark rounded-xl">가입일: <b>{new Date(userInfo.created_at).toLocaleDateString('ko-KR')}</b></div>
                {userInfo.interest_company && (
                  <div className="p-3 glass-dark rounded-xl">관심기업: <b>{userInfo.interest_company}</b></div>
                )}
              </div>
            </div>
          )}

          {userStats && (
            <div className="card glass">
              <h3 className="gradient-text-secondary" style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>활동 내역</h3>
              <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div className="text-center p-3 glass-dark rounded-xl">AI 면접 참여: <b>{userStats.interviews}회</b></div>
                <div className="text-center p-3 glass-dark rounded-xl">자기소개서 작성: <b>{userStats.intros}건</b></div>
                <div className="text-center p-3 glass-dark rounded-xl">이력서 작성: <b>{userStats.resumes}건</b></div>
                <div className="text-center p-3 glass-dark rounded-xl">관심기업 등록: <b>{userStats.companies}개</b></div>
              </div>
            </div>
          )}

          {!userInfo && !userStats && (
            <div className="text-center p-4 glass-dark rounded-xl" style={{ color: '#856404' }}>
              사용자 정보를 불러올 수 없습니다.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyPage; 