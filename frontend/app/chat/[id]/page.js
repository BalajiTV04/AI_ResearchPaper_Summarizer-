'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import ChatBox from '@/components/ChatBox';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const params = useParams();
  const paperId = params.id;
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadPaper();
  }, [paperId]);

  async function loadPaper() {
    try {
      const data = await api.get(`/papers/${paperId}`);
      setPaper(data);
    } catch (err) {
      console.error(err);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="skeleton-card">
          <div className="skeleton" style={{ width: '30%', height: '32px', marginBottom: '16px' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '60vh' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px', height: 'calc(100vh - 120px)' }}>
      <ChatBox paperId={paperId} paperTitle={paper.title} />
    </div>
  );
}
