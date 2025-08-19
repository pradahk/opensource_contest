import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
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
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'markdown'

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
            setShow(true);
            try {
              const listResp = await reportAPI.getUserReports();
              setReportData(listResp.data);
              setReports(listResp.data || []);
              setSelectedReportId(resp.data.report_id || null);
            } catch {}
          } else {
            alert(resp.message || '리포트 생성에 실패했습니다.');
          }
        } catch (e) {
          console.error('자동 마크다운 생성 오류:', e);
          alert('리포트 생성 중 오류가 발생했습니다.');
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
      const list = response.data || [];
      setReports(list);
      setShow(true);
      if (list.length > 0) {
        // 최신 보고서 자동 로드
        await handleSelectReport(list[0].id);
      } else {
        setMarkdown('');
        setSelectedReportId(null);
      }
    } catch (error) {
      console.error('보고서 조회 오류:', error);
      alert('보고서 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectReport = async (reportId) => {
    try {
      setIsLoading(true);
      setSelectedReportId(reportId);
      const resp = await reportAPI.getReport(reportId);
      if (resp.success && resp.data) {
        const payload = typeof resp.data.report_json === 'string' ? JSON.parse(resp.data.report_json) : resp.data.report_json;
        setMarkdown(payload?.markdown || '');
      } else {
        alert('보고서를 불러오지 못했습니다.');
      }
    } catch (e) {
      console.error('보고서 로드 오류:', e);
      alert('보고서 로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMarkdown = async () => {
    try {
      setIsLoading(true);
      // 선택된 리포트의 데이터를 사용하여 다시 생성
      if (selectedReportId && reportData) {
        const selectedReport = reportData.find(r => r.id === selectedReportId);
        if (selectedReport && selectedReport.report_json) {
          const payload = typeof selectedReport.report_json === 'string' 
            ? JSON.parse(selectedReport.report_json) 
            : selectedReport.report_json;
          
          const resp = await reportAPI.generateMarkdown({
            user_info: payload.user_info || { name: '사용자' },
            interview_data_log: payload.interview_data_log || []
          });
          
          if (resp.success) {
            setMarkdown(resp.data.markdown || '');
          } else {
            alert(resp.message || '마크다운 보고서 생성에 실패했습니다.');
          }
        } else {
          alert('선택된 리포트의 데이터를 찾을 수 없습니다.');
        }
      } else {
        alert('먼저 리포트를 선택해주세요.');
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
      <div>
        <div className="container">
          <div className="card animate-fade-in">
            <div className="text-center mb-4">
              <h1 className="gradient-text" style={{ fontSize: '36px', fontWeight: 900, marginBottom: '8px' }}>
                📊 최종 피드백 보고서
              </h1>
              <p style={{ color: '#6b7280', fontSize: '18px', fontWeight: 500 }}>
                AI 면접 결과를 종합적으로 분석한 상세 보고서입니다
              </p>
            </div>
            
            {/* 사용자 통계 정보 */}
            {userStats && (
              <div className="card glass mb-4 animate-slide-in-left">
                <h3 className="gradient-text-secondary" style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>
                  📈 내 활동 현황
                </h3>
                <div className="d-flex" style={{ gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                  <div className="text-center p-3 glass-dark rounded-xl" style={{ minWidth: '200px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#667eea', marginBottom: '8px' }}>
                      {userStats.interviews}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600 }}>면접 참여</div>
                  </div>
                  <div className="text-center p-3 glass-dark rounded-xl" style={{ minWidth: '200px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#4ecdc4', marginBottom: '8px' }}>
                      {userStats.intros}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600 }}>자기소개서</div>
                  </div>
                  <div className="text-center p-3 glass-dark rounded-xl" style={{ minWidth: '200px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#764ba2', marginBottom: '8px' }}>
                      {userStats.resumes}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600 }}>이력서</div>
                  </div>
                  <div className="text-center p-3 glass-dark rounded-xl" style={{ minWidth: '200px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#ff6b6b', marginBottom: '8px' }}>
                      {userStats.companies}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600 }}>관심기업</div>
                  </div>
                </div>
              </div>
            )}

            {/* 조회 폼 */}
            <div className="card glass mb-4 animate-slide-in-right">
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label">📅 조회 기간</label>
                  <select 
                    value={period} 
                    onChange={e => setPeriod(e.target.value)} 
                    className="form-input"
                    disabled={isLoading}
                  >
                    <option value="all">전체 기간</option>
                    <option value="1week">최근 1주</option>
                    <option value="1month">최근 1개월</option>
                    <option value="3month">최근 3개월</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  className="btn-primary hover-lift"
                  disabled={isLoading}
                >
                  {isLoading ? '🔄 조회 중...' : '🔍 보고서 조회'}
                </button>
              </form>
            </div>
            
            {/* 통계 요약 */}
            {show && stats && (
              <div className="card glass mb-4 animate-fade-in">
                <h3 className="gradient-text" style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>
                  📊 누적 성과 분석
                </h3>
                <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div className="text-center p-3 glass-dark rounded-xl">
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#667eea', marginBottom: '8px' }}>
                      {stats.totalSessions}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600 }}>총 면접 횟수</div>
                  </div>
                  <div className="text-center p-3 glass-dark rounded-xl">
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#4ecdc4', marginBottom: '8px' }}>
                      {stats.averageScore}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600 }}>평균 점수</div>
                  </div>
                  <div className="text-center p-3 glass-dark rounded-xl">
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#ff6b6b', marginBottom: '8px' }}>
                      {stats.mostCommonWeakness}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600 }}>주요 개선점</div>
                  </div>
                </div>
                <div className="mt-3 p-3 glass-dark rounded-xl">
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>
                    💡 AI 피드백: <span className="gradient-text-secondary" style={{ fontWeight: 700 }}>
                      {stats.averageScore >= 80 ? '훌륭한 성과입니다! 계속해서 연습하세요.' :
                       stats.averageScore >= 60 ? '좋은 성과입니다. 약점을 보완하면 더 좋은 결과를 얻을 수 있습니다.' :
                       '더 많은 연습이 필요합니다. 기본기를 탄탄히 다지고 다시 도전해보세요.'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {show && !stats && (
              <div className="card glass mb-4 animate-fade-in">
                <div className="text-center p-4">
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                    아직 면접 기록이 없습니다
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '16px' }}>
                    AI 면접을 먼저 진행해보세요!
                  </p>
                </div>
              </div>
            )}

            {/* 보고서 목록 */}
            {reports && reports.length > 0 && (
              <div className="card glass mb-4 animate-fade-in">
                <h3 className="gradient-text" style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>
                  📋 보고서 목록
                </h3>
                <div className="d-flex flex-column gap-3">
                  {reports.map((r) => (
                    <div key={r.id} className="d-flex justify-between align-center p-3 glass-dark rounded-xl hover-lift">
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a1a' }}>
                          {r.company_name || '일반 면접'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                          {new Date(r.created_at).toLocaleString('ko-KR')}
                        </div>
                      </div>
                      <div className="d-flex align-center gap-3">
                        <span className="p-2 glass rounded-lg" style={{ fontSize: '14px', color: '#374151', fontWeight: 600 }}>
                          점수: {r.total_score ?? '-'}
                        </span>
                        <button 
                          onClick={() => handleSelectReport(r.id)} 
                          className={`btn-secondary hover-scale ${selectedReportId === r.id ? 'gradient-text' : ''}`}
                          style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                          {selectedReportId === r.id ? '✅ 선택됨' : '👁️ 보기'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 마크다운 보고서 */}
            {markdown && (
              <div className="card animate-fade-in">
                <div className="d-flex justify-between align-center mb-4">
                  <h3 className="gradient-text" style={{ fontSize: '24px', fontWeight: 800 }}>
                    📄 AI 면접 분석 보고서
                  </h3>
                  <div className="d-flex gap-2">
                    <button 
                      onClick={handleGenerateMarkdown}
                      className="btn-primary hover-scale"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                      disabled={isLoading}
                    >
                      🔄 재생성
                    </button>
                    <button 
                      onClick={() => setViewMode('preview')}
                      className={`btn-secondary ${viewMode === 'preview' ? 'gradient-text' : ''}`}
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      👁️ 미리보기
                    </button>
                    <button 
                      onClick={() => setViewMode('markdown')}
                      className={`btn-secondary ${viewMode === 'markdown' ? 'gradient-text' : ''}`}
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      📝 마크다운
                    </button>
                  </div>
                </div>
                
                {viewMode === 'preview' ? (
                  <div className="markdown-content">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {markdown}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="p-4 glass-dark rounded-xl">
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      wordBreak: 'break-word',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#e2e8f0',
                      fontFamily: 'Fira Code, Monaco, Consolas, monospace'
                    }}>
                      {markdown}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* 로딩 스피너 */}
            {isLoading && (
              <div className="loading">
                <div className="loading-spinner"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FinalReport;
