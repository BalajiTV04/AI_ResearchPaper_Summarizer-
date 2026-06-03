'use client';
import Link from 'next/link';
import styles from './PaperCard.module.css';

export default function PaperCard({ paper }) {
  const date = new Date(paper.uploaded_at).toLocaleDateString();
  return (
    <div className={styles.card}>
      <div className={styles.icon}>📄</div>
      <h3 className={styles.title}>
        {paper.title || 'Untitled Paper'}
      </h3>
      <p className={styles.meta}>
        {paper.page_count} pages • {date}
      </p>
      <Link href={`/paper/${paper.id}`} className={styles.viewBtn}>
        View & Analyze
      </Link>
    </div>
  );
}
