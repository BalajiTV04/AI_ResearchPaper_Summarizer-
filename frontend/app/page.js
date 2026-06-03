'use client';
import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.headline}>
            Upload Research Papers. Get AI Insights Instantly.
          </h1>
          <p className={styles.subtext}>
            Summarize, Chat, Quiz and Create Presentations from any paper using AI.
          </p>
          <div className={styles.cta}>
            <Link href="/register" className={styles.getStartedBtn}>
              Get Started
            </Link>
            <Link href="/login" className={styles.loginBtn}>
              Login
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>📝</div>
          <h3>Summarization</h3>
          <p>Get short, detailed, and ELI5 summaries in seconds</p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>💬</div>
          <h3>AI Chat</h3>
          <p>Ask questions and get answers directly from the paper</p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>❓</div>
          <h3>Quiz Generator</h3>
          <p>Auto-generate MCQs and flashcards for self-testing</p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>📊</div>
          <h3>PPT Creator</h3>
          <p>Turn papers into presentation slides instantly</p>
        </div>
      </div>
      <div className={styles.adminLink}>
        <Link href="/admin/login">🔐 Admin Login</Link>
      </div>
    </div>
  );
}
