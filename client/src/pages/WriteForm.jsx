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
      <div className="container">
        <div className="card animate-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="text-center mb-4">
            <h2 className="gradient-text" style={{ fontSize: '28px', fontWeight: 900 }}>
              {tab === 'intro' ? '자기소개서 작성' : '이력서 작성'}
            </h2>
            <p style={{ color: '#6b7280', fontWeight: 600 }}>문서를 저장하면 대시보드에서 관리할 수 있습니다.</p>
          </div>

          <div className="d-flex gap-2 mb-4" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className={`btn-secondary ${tab === 'intro' ? 'gradient-text' : ''}`}
              onClick={() => handleTab('intro')}
            >
              자기소개서
            </button>
            <button
              type="button"
              className={`btn-secondary ${tab === 'resume' ? 'gradient-text' : ''}`}
              onClick={() => handleTab('resume')}
            >
              이력서
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">제목</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="form-input"
                placeholder={tabInfo[tab].titlePlaceholder}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{tabInfo[tab].label} 내용</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                className="form-input"
                placeholder={tabInfo[tab].contentPlaceholder}
                rows={10}
                disabled={isLoading}
              />
            </div>

            <div className="d-flex justify-center">
              <button type="submit" className="btn-primary hover-lift" disabled={isLoading}>
                {isLoading ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default WriteForm; 