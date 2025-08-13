import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { companyAPI, interestCompanyAPI } from '../services/api';

const SelectCompany = () => {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userCompanies, setUserCompanies] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setIsLoading(true);
        
        // 모든 기업 조회
        const companiesResponse = await companyAPI.getAll();
        console.log('기업 목록 응답:', companiesResponse);
        
        if (companiesResponse.success && companiesResponse.data) {
          setCompanies(companiesResponse.data);
        } else {
          console.warn('기업 목록 응답 구조가 예상과 다릅니다:', companiesResponse);
          setCompanies([]);
        }
        
        // 사용자의 관심기업 조회
        const userCompaniesResponse = await interestCompanyAPI.getUserCompanies();
        console.log('사용자 관심기업 응답:', userCompaniesResponse);
        
        if (userCompaniesResponse.success && userCompaniesResponse.data) {
          const userCompanyIds = userCompaniesResponse.data.map(company => company.id);
          setUserCompanies(userCompanyIds);
          
          // 이미 선택된 기업이 있다면 첫 번째로 설정
          if (userCompanyIds.length > 0) {
            setSelected(userCompanyIds[0]);
          }
        } else {
          console.warn('사용자 관심기업 응답 구조가 예상과 다릅니다:', userCompaniesResponse);
          setUserCompanies([]);
        }
      } catch (error) {
        console.error('기업 정보 로드 오류:', error);
        alert('기업 정보를 불러오는 중 오류가 발생했습니다.');
        // 에러 발생 시 빈 배열로 설정
        setCompanies([]);
        setUserCompanies([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanies();
  }, []);

  const handleSelect = async (company) => {
    try {
      setSelected(company.id);
      
      // 관심기업으로 추가
      await interestCompanyAPI.add(company.id);
      
      // 선택 효과 보여주고 면접 페이지로 이동
      setTimeout(() => navigate('/interview'), 350);
    } catch (error) {
      console.error('관심기업 추가 오류:', error);
      alert('관심기업 추가 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveCompany = async (companyId) => {
    try {
      await interestCompanyAPI.remove(companyId);
      
      // 사용자 관심기업 목록에서 제거
      setUserCompanies(prev => prev.filter(id => id !== companyId));
      
      // 현재 선택된 기업이 제거된 기업이라면 선택 해제
      if (selected === companyId) {
        setSelected(null);
      }
    } catch (error) {
      console.error('관심기업 제거 오류:', error);
      alert('관심기업 제거 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f6f7fb', padding: '32px 0' }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 22, boxShadow: '0 8px 32px 0 rgba(24,26,27,0.13)', padding: '48px 32px 40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 18, color: '#666', fontWeight: 600 }}>기업 정보를 불러오는 중...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f6f7fb', padding: '32px 0' }}>
        <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 22, boxShadow: '0 8px 32px 0 rgba(24,26,27,0.13)', padding: '48px 32px 40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#181A1B', marginBottom: 30, letterSpacing: 1 }}>관심 기업 선택</h2>
          
          {/* 내 관심기업 섹션 */}
          {userCompanies.length > 0 && (
            <div style={{ width: '100%', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1976d2', marginBottom: 16 }}>내 관심기업</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {companies
                  .filter(company => userCompanies.includes(company.id))
                  .map(company => (
                    <div key={company.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: '#f0f8ff',
                      borderRadius: 10,
                      border: '1.5px solid #e3f2fd'
                    }}>
                      <span style={{ fontWeight: 700, color: '#1976d2' }}>{company.name}</span>
                      <button
                        onClick={() => handleRemoveCompany(company.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: 14,
                          background: '#ff6b6b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        제거
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 기업 선택 섹션 */}
          <div style={{ width: '100%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#181A1B', marginBottom: 16 }}>기업 선택</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {companies
                .filter(company => !userCompanies.includes(company.id))
                .map(company => (
                  <button
                    key={company.id}
                    onClick={() => handleSelect(company)}
                    style={{
                      padding: '18px 0',
                      fontSize: 19,
                      background: selected === company.id ? 'linear-gradient(90deg, #1976d2 0%, #64b5f6 100%)' : '#f9fafb',
                      color: selected === company.id ? '#fff' : '#181A1B',
                      border: selected === company.id ? '2.5px solid #1976d2' : '1.5px solid #d1d5db',
                      fontWeight: selected === company.id ? 900 : 700,
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                      boxShadow: selected === company.id ? '0 2px 12px #1976d233' : '0 1px 4px #0001',
                      outline: 'none',
                      letterSpacing: 1,
                    }}
                  >
                    {company.name}
                  </button>
                ))}
            </div>
          </div>

          {companies.length === 0 && (
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
              등록된 기업이 없습니다.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SelectCompany;
