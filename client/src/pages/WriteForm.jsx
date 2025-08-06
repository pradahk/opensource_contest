import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { selfIntroductionAPI, resumeAPI } from '../services/api';

const tabInfo = {
  intro: {
    label: '자기소개서',
    titlePlaceholder: '자기소개서 제목을 입력하세요',
    contentPlaceholder: '자기소개서 내용을 입력하세요',
    saveMsg: '자기소개서가 저장되었습니다!'
  },
  resume: {
    label: '이력서',
    titlePlaceholder: '이력서 제목을 입력하세요',
    contentPlaceholder: '이력서 내용을 입력하세요',
    saveMsg: '이력서가 저장되었습니다!'
  }
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const WriteForm = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const [tab, setTab] = useState(query.get('type') === 'resume' ? 'resume' : 'intro');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTab = (type) => {
    setTab(type);
    setTitle('');
    setContent('');
    navigate(`/write?type=${type}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      const data = { title: title.trim(), content: content.trim() };
      
      if (tab === 'intro') {
        await selfIntroductionAPI.create(data);
      } else {
        await resumeAPI.create(data);
      }
      
      alert(tabInfo[tab].saveMsg);
      navigate('/dashboard');
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f6f7fb', padding: '32px 0' }}>
        <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 22, boxShadow: '0 8px 32px 0 rgba(24,26,27,0.13)', padding: '48px 32px 40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s', minHeight: 520 }}>
          {/* 탭 */}
          <div style={{ display: 'flex', width: '100%', marginBottom: 36, background: '#f1f3f7', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px #0001' }}>
            <button onClick={() => handleTab('intro')} style={{ flex: 1, padding: '16px 0', fontSize: 18, fontWeight: 800, border: 'none', background: tab === 'intro' ? '#181A1B' : 'transparent', color: tab === 'intro' ? '#fff' : '#888', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: 1, outline: 'none' }}>자기소개서</button>
            <button onClick={() => handleTab('resume')} style={{ flex: 1, padding: '16px 0', fontSize: 18, fontWeight: 800, border: 'none', background: tab === 'resume' ? '#181A1B' : 'transparent', color: tab === 'resume' ? '#fff' : '#888', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: 1, outline: 'none' }}>이력서</button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <label style={{ fontWeight: 700, marginBottom: 8, color: '#181A1B', fontSize: 16, letterSpacing: 0.5 }}>제목</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
              placeholder={tabInfo[tab].titlePlaceholder} 
              style={{ padding: '15px 14px', borderRadius: 10, border: '1.5px solid #d1d5db', marginBottom: 22, fontSize: 16, outline: 'none', background: '#f9fafb', color: '#181A1B', boxSizing: 'border-box', transition: 'border 0.2s', fontWeight: 500 }} 
              onFocus={e => e.target.style.border = '1.5px solid #181A1B'} 
              onBlur={e => e.target.style.border = '1.5px solid #d1d5db'} 
              disabled={isLoading}
            />
            <label style={{ fontWeight: 700, marginBottom: 8, color: '#181A1B', fontSize: 16, letterSpacing: 0.5 }}>{tabInfo[tab].label} 내용</label>
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              required 
              placeholder={tabInfo[tab].contentPlaceholder} 
              rows={8} 
              style={{ padding: '15px 14px', borderRadius: 10, border: '1.5px solid #d1d5db', marginBottom: 28, fontSize: 16, outline: 'none', background: '#f9fafb', color: '#181A1B', boxSizing: 'border-box', resize: 'vertical', transition: 'border 0.2s', fontWeight: 500 }} 
              onFocus={e => e.target.style.border = '1.5px solid #181A1B'} 
              onBlur={e => e.target.style.border = '1.5px solid #d1d5db'} 
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading}
              style={{ 
                padding: '16px 0', 
                fontSize: 19, 
                borderRadius: 10, 
                background: isLoading ? '#ccc' : 'linear-gradient(90deg, #181A1B 0%, #23272f 100%)', 
                color: '#fff', 
                fontWeight: 900, 
                letterSpacing: 1, 
                border: 'none', 
                boxShadow: '0 2px 12px #181A1B22', 
                cursor: isLoading ? 'not-allowed' : 'pointer', 
                marginTop: 4, 
                transition: 'all 0.2s' 
              }} 
              onMouseOver={e => {
                if (!isLoading) {
                  e.target.style.background='#fff';
                  e.target.style.color='#181A1B';
                  e.target.style.border='2px solid #181A1B';
                }
              }} 
              onMouseOut={e => {
                if (!isLoading) {
                  e.target.style.background='linear-gradient(90deg, #181A1B 0%, #23272f 100%)';
                  e.target.style.color='#fff';
                  e.target.style.border='none';
                }
              }}
            >
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default WriteForm; 