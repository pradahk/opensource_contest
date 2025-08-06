import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { selfIntroductionAPI, resumeAPI } from '../services/api';

const EditDocument = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [documentType, setDocumentType] = useState(''); // 'intro' or 'resume'

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true);
        
        // URL에서 문서 타입 확인
        const type = location.pathname.includes('intro') ? 'intro' : 'resume';
        setDocumentType(type);
        
        let document;
        if (type === 'intro') {
          const response = await selfIntroductionAPI.getAll();
          document = response.data.find(doc => doc.id == id);
        } else {
          const response = await resumeAPI.getAll();
          document = response.data.find(doc => doc.id == id);
        }
        
        if (document) {
          setTitle(document.title);
          setContent(document.content);
        } else {
          alert('문서를 찾을 수 없습니다.');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('문서 로드 오류:', error);
        alert('문서를 불러오는 중 오류가 발생했습니다.');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadDocument();
    }
  }, [id, location.pathname, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setIsSaving(true);
    
    try {
      const data = { title: title.trim(), content: content.trim() };
      
      if (documentType === 'intro') {
        await selfIntroductionAPI.update(id, data);
        alert('자기소개서가 수정되었습니다.');
      } else {
        await resumeAPI.update(id, data);
        alert('이력서가 수정되었습니다.');
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('수정 오류:', error);
      alert('수정 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      if (documentType === 'intro') {
        await selfIntroductionAPI.delete(id);
        alert('자기소개서가 삭제되었습니다.');
      } else {
        await resumeAPI.delete(id);
        alert('이력서가 삭제되었습니다.');
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f6f7fb' }}>
          <div style={{ fontSize: 18, color: '#666', fontWeight: 600 }}>문서를 불러오는 중...</div>
        </div>
      </Layout>
    );
  }

  const documentInfo = {
    intro: {
      label: '자기소개서',
      titlePlaceholder: '자기소개서 제목을 입력하세요',
      contentPlaceholder: '자기소개서 내용을 입력하세요'
    },
    resume: {
      label: '이력서',
      titlePlaceholder: '이력서 제목을 입력하세요',
      contentPlaceholder: '이력서 내용을 입력하세요'
    }
  };

  const currentInfo = documentInfo[documentType];

  return (
    <Layout>
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f6f7fb', padding: '32px 0' }}>
        <div style={{ width: '100%', maxWidth: 600, background: '#fff', borderRadius: 22, boxShadow: '0 8px 32px 0 rgba(24,26,27,0.13)', padding: '48px 32px 40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s', minHeight: 520 }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#181A1B', marginBottom: 30, letterSpacing: 1 }}>
            {currentInfo.label} 수정
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <label style={{ fontWeight: 700, marginBottom: 8, color: '#181A1B', fontSize: 16, letterSpacing: 0.5 }}>제목</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
              placeholder={currentInfo.titlePlaceholder} 
              style={{ padding: '15px 14px', borderRadius: 10, border: '1.5px solid #d1d5db', marginBottom: 22, fontSize: 16, outline: 'none', background: '#f9fafb', color: '#181A1B', boxSizing: 'border-box', transition: 'border 0.2s', fontWeight: 500 }} 
              onFocus={e => e.target.style.border = '1.5px solid #181A1B'} 
              onBlur={e => e.target.style.border = '1.5px solid #d1d5db'} 
              disabled={isSaving}
            />
            
            <label style={{ fontWeight: 700, marginBottom: 8, color: '#181A1B', fontSize: 16, letterSpacing: 0.5 }}>{currentInfo.label} 내용</label>
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              required 
              placeholder={currentInfo.contentPlaceholder} 
              rows={12} 
              style={{ padding: '15px 14px', borderRadius: 10, border: '1.5px solid #d1d5db', marginBottom: 28, fontSize: 16, outline: 'none', background: '#f9fafb', color: '#181A1B', boxSizing: 'border-box', resize: 'vertical', transition: 'border 0.2s', fontWeight: 500 }} 
              onFocus={e => e.target.style.border = '1.5px solid #181A1B'} 
              onBlur={e => e.target.style.border = '1.5px solid #d1d5db'} 
              disabled={isSaving}
            />
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                type="submit" 
                disabled={isSaving}
                style={{ 
                  flex: 1,
                  padding: '16px 0', 
                  fontSize: 19, 
                  borderRadius: 10, 
                  background: isSaving ? '#ccc' : 'linear-gradient(90deg, #181A1B 0%, #23272f 100%)', 
                  color: '#fff', 
                  fontWeight: 900, 
                  letterSpacing: 1, 
                  border: 'none', 
                  boxShadow: '0 2px 12px #181A1B22', 
                  cursor: isSaving ? 'not-allowed' : 'pointer', 
                  marginTop: 4, 
                  transition: 'all 0.2s' 
                }} 
                onMouseOver={e => {
                  if (!isSaving) {
                    e.target.style.background='#fff';
                    e.target.style.color='#181A1B';
                    e.target.style.border='2px solid #181A1B';
                  }
                }} 
                onMouseOut={e => {
                  if (!isSaving) {
                    e.target.style.background='linear-gradient(90deg, #181A1B 0%, #23272f 100%)';
                    e.target.style.color='#fff';
                    e.target.style.border='none';
                  }
                }}
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
              
              <button 
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                style={{ 
                  padding: '16px 24px', 
                  fontSize: 19, 
                  borderRadius: 10, 
                  background: isSaving ? '#ccc' : '#ff6b6b', 
                  color: '#fff', 
                  fontWeight: 900, 
                  letterSpacing: 1, 
                  border: 'none', 
                  boxShadow: '0 2px 12px #ff6b6b22', 
                  cursor: isSaving ? 'not-allowed' : 'pointer', 
                  marginTop: 4, 
                  transition: 'all 0.2s' 
                }}
              >
                삭제
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditDocument; 