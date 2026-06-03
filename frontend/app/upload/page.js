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
    <div className="container" style={{ paddingTop: '60px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem', marginBottom: '12px' }}>
          Upload Research Paper
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Select a PDF file to analyze with AI
        </p>
      </div>

      <UploadZone onUpload={handleUpload} loading={loading} />
    </div>
  );
}
