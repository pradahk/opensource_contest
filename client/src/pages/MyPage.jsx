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
        <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f6f7fb', padding: '32px 0' }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 22, boxShadow: '0 8px 32px 0 rgba(24,26,27,0.13)', padding: '48px 32px 40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 18, color: '#666', fontWeight: 600 }}>사용자 정보를 불러오는 중...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f6f7fb', padding: '32px 0' }}>
        <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 22, boxShadow: '0 8px 32px 0 rgba(24,26,27,0.13)', padding: '48px 32px 40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#181A1B', marginBottom: 30, letterSpacing: 1 }}>마이 페이지</h2>
          
          {/* 사용자 정보 */}
          {userInfo && (
            <div style={{ width: '100%', background: '#f9fafb', borderRadius: 14, padding: '24px 20px', boxShadow: '0 1px 8px #0001', color: '#181A1B', fontSize: 16, fontWeight: 500, marginBottom: 28 }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>내 정보</div>
              <div>이름: <b>{userInfo.nickname || '미설정'}</b></div>
              <div>이메일: <b>{userInfo.email}</b></div>
              <div>가입일: <b>{new Date(userInfo.created_at).toLocaleDateString('ko-KR')}</b></div>
              {userInfo.interest_company && (
                <div>관심기업: <b>{userInfo.interest_company}</b></div>
              )}
            </div>
          )}

          {/* 활동 내역 */}
          {userStats && (
            <div style={{ width: '100%', background: '#f9fafb', borderRadius: 14, padding: '24px 20px', boxShadow: '0 1px 8px #0001', color: '#181A1B', fontSize: 16, fontWeight: 500 }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>활동 내역</div>
              <div>AI 면접 참여: <b>{userStats.interviews}회</b></div>
              <div>자기소개서 작성: <b>{userStats.intros}건</b></div>
              <div>이력서 작성: <b>{userStats.resumes}건</b></div>
              <div>관심기업 등록: <b>{userStats.companies}개</b></div>
            </div>
          )}

          {/* 데이터가 없는 경우 */}
          {!userInfo && !userStats && (
            <div style={{ 
              width: '100%', 
              background: '#fff3cd', 
              borderRadius: 12, 
              padding: '20px', 
              textAlign: 'center',
              color: '#856404',
              fontSize: 16,
              fontWeight: 500
            }}>
              사용자 정보를 불러올 수 없습니다.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyPage; 