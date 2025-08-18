import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { reportAPI, userStatsAPI } from '../services/api';

const FinalReport = () => {
  const location = useLocation();
  const [period, setPeriod] = useState('all');
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    // 페이지 로드 시 사용자 통계 정보 가져오기
    const loadUserStats = async () => {
      try {
        const response = await userStatsAPI.getStats();
        setUserStats(response.data);
      } catch (error) {
        console.error('사용자 통계 로드 오류:', error);
      }
    };

    loadUserStats();
  }, []);

  useEffect(() => {
    // 면접실에서 넘겨준 상태가 있으면 즉시 마크다운 생성 호출
    const state = location.state;
    if (state?.interview_data_log && state?.interview_data_log.length) {
      (async () => {
        try {
          setIsLoading(true);
          const payload = {
            user_info: state.user_info || { name: '사용자' },
            interview_data_log: state.interview_data_log,
          };
          const resp = await reportAPI.generateMarkdown(payload);
          if (resp.success) {
            setMarkdown(resp.data.markdown || '');
            // 저장 성공 시 알림
            if (resp.data.saved && resp.data.report_id) {
              console.log('Report saved:', resp.data.report_id);
            }
            setShow(true);
          }
        } catch (e) {
          console.error('자동 마크다운 생성 오류:', e);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // 기간별 필터링을 위한 파라미터 설정
      const filters = {};
      if (period !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (period) {
          case '1week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '1month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '3month':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = null;
        }
        
        if (startDate) {
          filters.startDate = startDate.toISOString();
        }
      }

      // 사용자의 모든 리포트 조회
      const response = await reportAPI.getUserReports();
      setReportData(response.data);
      setShow(true);
    } catch (error) {
      console.error('보고서 조회 오류:', error);
      alert('보고서 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMarkdown = async () => {
    try {
      setIsLoading(true);
      // 데모용 샘플 입력 (실 서비스에서는 실제 세션 로그로 대체)
      const sample = {
        user_info: { name: '사용자' },
        interview_data_log: (reportData && reportData.length > 0 && reportData[0]?.report_json?.interview_data_log)
          ? reportData[0].report_json.interview_data_log
          : [
              {
                question_text: '자기소개를 부탁드립니다.',
                transcription: '안녕하세요. 저는 ...',
                sense_voice_analysis: { pronunciation_score: 0.9, emotion: 'neutral', speed_wpm: 170, filler_count: 1, pitch_variation: 5.2 }
              }
            ]
      };

      const resp = await reportAPI.generateMarkdown(sample);
      if (resp.success) {
        setMarkdown(resp.data.markdown || '');
      } else {
        alert('마크다운 보고서 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('마크다운 생성 오류:', err);
      alert('마크다운 보고서 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 통계 데이터 계산
  const calculateStats = () => {
    if (!reportData || !reportData.length) return null;

    const totalSessions = reportData.length;
    const totalScore = reportData.reduce((sum, report) => sum + (report.total_score || 0), 0);
    const averageScore = totalSessions > 0 ? (totalScore / totalSessions).toFixed(1) : 0;

    // 가장 많이 언급된 약점 찾기
    const weaknesses = reportData
      .filter(report => report.weaknesses)
      .map(report => report.weaknesses)
      .join(' ')
      .toLowerCase();

    const commonWeaknesses = weaknesses
      .split(/[.,\s]+/)
      .filter(word => word.length > 2)
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

    const mostCommonWeakness = Object.entries(commonWeaknesses)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '자기소개';

    return {
      totalSessions,
      averageScore,
      mostCommonWeakness
    };
  };

  const stats = calculateStats();

  return (
    <Layout>
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f6f7fb', padding: '32px 0' }}>
        <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 22, boxShadow: '0 8px 32px 0 rgba(24,26,27,0.13)', padding: '48px 32px 40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#181A1B', marginBottom: 30, letterSpacing: 1 }}>최종 피드백 보고서</h2>
          
          {/* 사용자 통계 정보 */}
          {userStats && (
            <div style={{ width: '100%', background: '#f0f8ff', borderRadius: 14, padding: '20px 18px', marginBottom: 24, boxShadow: '0 1px 8px #0001', color: '#181A1B', fontSize: 16, fontWeight: 500, textAlign: 'left' }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10, color: '#1976d2' }}>내 활동 현황</div>
              <div>총 면접 참여: <b>{userStats.interviews}회</b></div>
              <div>자기소개서 작성: <b>{userStats.intros}건</b></div>
              <div>이력서 작성: <b>{userStats.resumes}건</b></div>
              <div>관심기업 등록: <b>{userStats.companies}개</b></div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 18, marginBottom: 24 }}>
            <label style={{ fontWeight: 700, color: '#181A1B', marginBottom: 4 }}>조회 기간</label>
            <select 
              value={period} 
              onChange={e => setPeriod(e.target.value)} 
              style={{ padding: '12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 16, background: '#f9fafb', color: '#181A1B', fontWeight: 500, outline: 'none', marginBottom: 8 }}
              disabled={isLoading}
            >
              <option value="all">전체</option>
              <option value="1week">최근 1주</option>
              <option value="1month">최근 1개월</option>
              <option value="3month">최근 3개월</option>
            </select>
            <button 
              type="submit" 
              disabled={isLoading}
              style={{ 
                padding: '13px 0', 
                fontSize: 17, 
                borderRadius: 8, 
                background: isLoading ? '#ccc' : '#181A1B', 
                color: '#fff', 
                fontWeight: 800, 
                border: 'none', 
                cursor: isLoading ? 'not-allowed' : 'pointer', 
                transition: 'all 0.2s' 
              }}
            >
              {isLoading ? '조회 중...' : '조회'}
            </button>
          </form>
          
          {show && stats && (
            <div style={{ width: '100%', background: '#f9fafb', borderRadius: 12, padding: '24px 18px', boxShadow: '0 1px 8px #0001', color: '#181A1B', fontSize: 16, fontWeight: 500, textAlign: 'left' }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>누적 보고서</div>
              <div>총 면접 횟수: <b>{stats.totalSessions}회</b></div>
              <div>평균 점수: <b>{stats.averageScore}점</b></div>
              <div>가장 많이 틀린 질문: <b>{stats.mostCommonWeakness}</b></div>
              <div style={{ marginTop: 12 }}>
                AI 피드백: <span style={{ color: '#1976d2', fontWeight: 700 }}>
                  {stats.averageScore >= 80 ? '훌륭한 성과입니다! 계속해서 연습하세요.' :
                   stats.averageScore >= 60 ? '좋은 성과입니다. 약점을 보완하면 더 좋은 결과를 얻을 수 있습니다.' :
                   '더 많은 연습이 필요합니다. 기본기를 탄탄히 다지고 다시 도전해보세요.'}
                </span>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button onClick={handleGenerateMarkdown} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>최종 마크다운 생성</button>
              </div>
            </div>
          )}

          {show && !stats && (
            <div style={{ width: '100%', background: '#fff3cd', borderRadius: 12, padding: '24px 18px', boxShadow: '0 1px 8px #0001', color: '#856404', fontSize: 16, fontWeight: 500, textAlign: 'center' }}>
              아직 면접 기록이 없습니다. AI 면접을 먼저 진행해보세요!
            </div>
          )}

          {markdown && (
            <div style={{ width: '100%', background: '#ffffff', borderRadius: 12, padding: '24px 18px', boxShadow: '0 1px 8px #0001', color: '#111827', fontSize: 14, fontWeight: 500, textAlign: 'left', marginTop: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>최종 마크다운 보고서 (미리보기)</div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{markdown}</pre>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FinalReport;
