'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ParticleBackground from '@/components/ParticleBackground';
import AnimatedFeatureCard from '@/components/AnimatedFeatureCard';
import styles from './page.module.css';

const features = [
  {
    icon: '📝',
    title: 'Summarization',
    description: 'Get short, detailed, and ELI5 summaries in seconds',
    gradient: 'rgba(59,130,246,0.5)',
  },
  {
    icon: '💬',
    title: 'AI Chat',
    description: 'Ask questions and get answers directly from the paper',
    gradient: 'rgba(139,92,246,0.5)',
  },
  {
    icon: '❓',
    title: 'Quiz Generator',
    description: 'Auto-generate MCQs and flashcards for self-testing',
    gradient: 'rgba(236,72,153,0.5)',
  },
  {
    icon: '📊',
    title: 'PPT Creator',
    description: 'Turn papers into presentation slides instantly',
    gradient: 'rgba(34,211,238,0.5)',
  },
];

export default function LandingPage() {
  const [badgeVisible, setBadgeVisible] = useState(false);
  const [headlineVisible, setHeadlineVisible] = useState(false);
  const [subtextComplete, setSubtextComplete] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const heroRef = useRef(null);
  const subtextRef = useRef(null);

  // Badge appears first, then headline
  useEffect(() => {
    const t = setTimeout(() => setBadgeVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Staggered headline animation (slightly delayed for badge)
  useEffect(() => {
    const t = setTimeout(() => setHeadlineVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Typewriter subtext
  useEffect(() => {
    if (!headlineVisible) return;
    const text = 'Summarize, Chat, Quiz and Create Presentations from any paper using AI.';
    let index = 0;
    const el = subtextRef.current;
    if (!el) return;
    el.textContent = '';
    const type = () => {
      if (index < text.length) {
        el.textContent += text[index];
        index++;
        setTimeout(type, 25 + Math.random() * 15);
      } else {
        setSubtextComplete(true);
      }
    };
    const t = setTimeout(type, 400);
    return () => clearTimeout(t);
  }, [headlineVisible]);

  // CTA buttons appear after subtext
  useEffect(() => {
    if (!subtextComplete) return;
    const t = setTimeout(() => setCtaVisible(true), 200);
    return () => clearTimeout(t);
  }, [subtextComplete]);

  // Mouse tracking for hero glow
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const handleMove = (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setGlowPos({ x, y });
    };
    hero.addEventListener('mousemove', handleMove);
    return () => hero.removeEventListener('mousemove', handleMove);
  }, []);

  // Floating paper/document icons
  const floatingDocs = [
    { emoji: '📄', top: '15%', left: '8%', delay: '0s', size: '2.5rem' },
    { emoji: '📑', top: '25%', right: '10%', delay: '1s', size: '2rem' },
    { emoji: '📃', bottom: '20%', left: '15%', delay: '2s', size: '1.8rem' },
    { emoji: '📜', bottom: '30%', right: '8%', delay: '0.5s', size: '2.2rem' },
    { emoji: '🔬', top: '10%', left: '50%', delay: '1.5s', size: '1.6rem' },
    { emoji: '🧪', top: '40%', right: '5%', delay: '2.5s', size: '1.4rem' },
  ];

  return (
    <div className={styles.landing}>
      <ParticleBackground />

      {/* Floating document icons */}
      {floatingDocs.map((doc, i) => (
        <span
          key={i}
          className={styles.floatingDoc}
          style={{
            position: 'absolute',
            top: doc.top,
            left: doc.left,
            right: doc.right,
            bottom: doc.bottom,
            fontSize: doc.size,
            animationDelay: doc.delay,
            zIndex: 1,
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        >
          {doc.emoji}
        </span>
      ))}

      {/* Ambient gradient mesh orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <div className={styles.hero} ref={heroRef}>
        {/* Mouse-following glow */}
        <div
          className={styles.mouseGlow}
          style={{
            left: `${glowPos.x}%`,
            top: `${glowPos.y}%`,
          }}
        />

        <div className={styles.heroContent}>
          {/* AI Badge */}
          <div className={`${styles.aiBadge} ${badgeVisible ? styles.aiBadgeVisible : ''}`}>
            AI-Based Research Paper Summarizer
          </div>

          {/* Staggered headline */}
          <h1 className={`${styles.headline} ${headlineVisible ? styles.headlineVisible : ''}`}>
            {'Upload Research Papers. Get AI Insights Instantly.'.split(' ').map((word, i) => (
              <span
                key={i}
                className={styles.headlineWord}
                style={{
                  animationDelay: `${i * 0.08}s`,
                  display: 'inline-block',
                }}
              >
                {word}
                {i < 5 ? '\u00A0' : ''}
              </span>
            ))}
          </h1>

          {/* Typewriter subtext */}
          <p className={styles.subtext}>
            <span ref={subtextRef} className={styles.typewriter} />
            <span className={styles.cursor}>|</span>
          </p>

          {/* CTA Buttons */}
          <div className={`${styles.cta} ${ctaVisible ? styles.ctaVisible : ''}`}>
            <Link href="/register" className={`${styles.getStartedBtn} ${styles.rippleBtn}`}>
              <span className={styles.btnContent}>
                Get Started
                <svg className={styles.btnArrow} width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </Link>
            <Link href="/login" className={`${styles.loginBtn} ${styles.rippleBtn}`}>
              Login
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={styles.scrollIndicator}>
          <div className={styles.scrollMouse}>
            <div className={styles.scrollDot} />
          </div>
          <span>Scroll to explore</span>
        </div>
      </div>

      {/* Features Section */}
      <div className={styles.featuresSection}>
        <div className={styles.featuresHeader}>
          <h2 className={styles.featuresTitle}>Everything you need</h2>
          <p className={styles.featuresSubtitle}>
            Powerful AI tools to transform how you consume research
          </p>
        </div>
        <div className={styles.features}>
          {features.map((feature, i) => (
            <AnimatedFeatureCard
              key={i}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Stats section */}
      <div className={styles.statsSection}>
        <div className={styles.stat}>
          <span className={styles.statNumber}>10K+</span>
          <span className={styles.statLabel}>Papers Processed</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>50K+</span>
          <span className={styles.statLabel}>Summaries Generated</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>95%</span>
          <span className={styles.statLabel}>Satisfaction Rate</span>
        </div>
      </div>

      {/* Admin Link */}
      <div className={styles.footer}>
        <Link href="/admin/login" className={styles.adminLink}>
          <span className={styles.adminIcon}>🔐</span>
          Admin Login
        </Link>
        <p className={styles.copyright}>
          © 2026 AI Research Paper Summarizer
        </p>
      </div>
    </div>
  );
}