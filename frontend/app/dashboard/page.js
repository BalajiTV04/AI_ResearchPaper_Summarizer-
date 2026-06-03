'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import PaperCard from '@/components/PaperCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import Link from 'next/link';
import styles from './page.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [papers, setPapers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) fetchPapers();
  }, [loading]);

  async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }

  async function fetchPapers() {
    try {
      const data = await api.get('/papers/');
      setPapers(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(paperId) {
    if (!confirm('Delete this paper and all its analysis?')) return;
    try {
      await api.delete(`/papers/${paperId}`);
      setPapers(papers.filter(p => p.id !== paperId));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  }

  const filtered = papers.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {[1,2,3].map(i => <SkeletonLoader key={i} type="card" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <div>
            <h1>My Papers</h1>
            <p className={styles.subtitle}>You have {papers.length} papers uploaded</p>
          </div>
          <Link href="/upload" className={styles.uploadBtn}>
            + Upload New
          </Link>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search papers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            {papers.length === 0 ? (
              <>
                <div className={styles.emptyIcon}>📄</div>
                <h3>No papers yet</h3>
                <p>Upload your first research paper to get started</p>
                <Link href="/upload" className={styles.uploadLink}>Upload Paper</Link>
              </>
            ) : (
              <p>No papers match your search</p>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(paper => (
              <div key={paper.id} className={styles.cardWrapper}>
                <PaperCard paper={paper} />
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(paper.id)}
                  title="Delete paper"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
