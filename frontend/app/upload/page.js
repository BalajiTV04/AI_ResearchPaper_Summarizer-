'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/components/UploadZone';
import { api } from '@/lib/api';

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUpload(formData, onProgress) {
    setLoading(true);
    try {
      const result = await api.upload('/papers/upload', formData, onProgress);
      router.push(`/paper/${result.paper_id}`);
    } catch (err) {
      alert('Upload failed: ' + err.message);
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 'clamp(32px, 8vw, 60px)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 5vw, 40px)' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', marginBottom: '12px' }}>
          Upload Research Paper
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.85rem, 1.5vw, 1rem)' }}>
          Select a PDF file to analyze with AI
        </p>
      </div>

      <UploadZone onUpload={handleUpload} loading={loading} />
    </div>
  );
}
