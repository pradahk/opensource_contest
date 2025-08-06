import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const Introduction = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: 서버 저장 연동
    alert('자기소개가 저장되었습니다!');
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff' }}>
        <div style={{ width: 420, background: '#fff', borderRadius: 18, boxShadow: '0 4px 32px rgba(0,0,0,0.13)', padding: '44px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#181A1B', marginBottom: 30, letterSpacing: 1 }}>자기소개 작성</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <label style={{ fontWeight: 700, marginBottom: 6, color: '#181A1B' }}>제목</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="제목을 입력하세요" style={{ padding: '13px 12px', borderRadius: 8, border: '1.5px solid #181A1B', marginBottom: 18, fontSize: 16, outline: 'none', background: '#fff', color: '#181A1B', boxSizing: 'border-box', transition: 'border 0.2s' }} />
            <label style={{ fontWeight: 700, marginBottom: 6, color: '#181A1B' }}>내용</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} required placeholder="자기소개 내용을 입력하세요" rows={7} style={{ padding: '13px 12px', borderRadius: 8, border: '1.5px solid #181A1B', marginBottom: 24, fontSize: 16, outline: 'none', background: '#fff', color: '#181A1B', boxSizing: 'border-box', resize: 'vertical', transition: 'border 0.2s' }} />
            <button type="submit" style={{ padding: '15px 0', fontSize: 18, borderRadius: 8, background: '#181A1B', color: '#fff', fontWeight: 800, letterSpacing: 1, border: '2px solid #181A1B', boxShadow: '0 2px 8px #0002', cursor: 'pointer', marginTop: 4, transition: 'all 0.2s' }}>저장</button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Introduction; 