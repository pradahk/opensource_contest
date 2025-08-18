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
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
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
      <div className="container">
        <div className="card animate-fade-in" style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="text-center mb-4">
            <h2 className="gradient-text" style={{ fontSize: '28px', fontWeight: 900 }}>{currentInfo.label} 수정</h2>
            <p style={{ color: '#6b7280', fontWeight: 600 }}>수정 후 저장하면 대시보드에서 바로 확인할 수 있습니다.</p>
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
                placeholder={currentInfo.titlePlaceholder}
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{currentInfo.label} 내용</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                className="form-input"
                placeholder={currentInfo.contentPlaceholder}
                rows={12}
                disabled={isSaving}
              />
            </div>

            <div className="d-flex gap-2" style={{ justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleDelete} className="btn-danger hover-lift" disabled={isSaving}>
                삭제
              </button>
              <button type="submit" className="btn-primary hover-lift" disabled={isSaving}>
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditDocument; 