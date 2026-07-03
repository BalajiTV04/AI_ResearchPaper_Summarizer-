'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import SkeletonLoader from '@/components/SkeletonLoader';
import MathText from '@/components/MathText';
import Link from 'next/link';
import styles from './page.module.css';

export default function PptPage() {
  const params = useParams();
  const paperId = params.id;
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadOrGenerate();
  }, [paperId]);

  async function loadOrGenerate() {
    try {
      const existing = await api.get(`/ai/ppt/${paperId}`);
      if (existing.slides && existing.slides.length > 0) {
        setSlides(existing.slides);
        setGenerating(false);
        setLoading(false);
        return;
      }
    } catch (err) {
      await generatePpt();
    }
  }

  async function generatePpt() {
    try {
      const data = await api.post(`/ai/ppt/${paperId}`, {});
      if (data.slides && data.slides.length > 0) {
        setSlides(data.slides);
      } else {
        // Retry with enhanced prompt if no slides
        await retryGeneratePpt();
      }
    } catch (err) {
      alert('Failed to generate presentation: ' + err.message);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  }

  async function retryGeneratePpt() {
    try {
      const data = await api.post(`/ai/ppt/${paperId}/regenerate`, {});
      setSlides(data.slides || []);
    } catch (err) {
      // Keep empty slides on failure
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/ppt/${paperId}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presentation-${paperId}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed: ' + err.message);
    } finally {
      setDownloading(false);
    }
  }

  if (loading || generating) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', marginBottom: '24px' }}>Presentation Slides</h1>
        <div className={styles.generatingMsg}>
          <div className={styles.spinner}></div>
          <p>Generating presentation slides from your paper...</p>
        </div>
        <SkeletonLoader />
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📊</span>
          <h2>No slides generated</h2>
          <p>Could not generate presentation slides. Please try again.</p>
          <button className={styles.retryBtn} onClick={generatePpt}>
            Retry Generation
          </button>
          <Link href={`/paper/${paperId}`} className={styles.backLink}>
            ← Back to Paper
          </Link>
        </div>
      </div>
    );
  }

  const slide = slides[currentSlide];

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <div className={styles.header}>
        <Link href={`/paper/${paperId}`} className={styles.backBtn}>
          ← Back to Paper
        </Link>
        <div className={styles.headerActions}>
          <button 
            className={styles.downloadBtn} 
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? '⏳ Downloading...' : '⬇ Download PPT'}
          </button>
        </div>
      </div>

      <h1 className={styles.pageTitle}>📊 Presentation Slides</h1>
      <p className={styles.subtitle}>{slides.length} slides • Research Paper Summary</p>

      {/* Slide navigation */}
      <div className={styles.slideCounter}>
        <button 
          className={styles.navBtn}
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
        >
          ← Previous
        </button>
        <span className={styles.counterText}>
          Slide {currentSlide + 1} of {slides.length}
        </span>
        <button 
          className={styles.navBtn}
          onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
          disabled={currentSlide === slides.length - 1}
        >
          Next →
        </button>
      </div>

      {/* Slide dots */}
      <div className={styles.slideDots}>
        {slides.map((_, idx) => (
          <button
            key={idx}
            className={`${styles.dot} ${idx === currentSlide ? styles.activeDot : ''}`}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Main slide display */}
      <div className={styles.slideContainer}>
        <div className={styles.slideCard}>
          <div className={styles.slideHeader}>
            <span className={styles.slideNum}>Slide {currentSlide + 1}</span>
            <div className={styles.slideDecor}></div>
          </div>
          <div className={styles.slideBody}>
            <h2 className={styles.slideTitle}>{slide.title}</h2>
            <div className={styles.slideDivider}></div>
            <ul className={styles.slideBullets}>
              {slide.bullets?.map((bullet, i) => (
                <li key={i} className={styles.slideBullet}>
                  <span className={styles.bulletIcon}>✦</span>
                  <MathText text={bullet} />
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.slideFooter}>
            <span className={styles.footerText}>AI Research Paper Summarizer</span>
            <span className={styles.footerPage}>{currentSlide + 1}/{slides.length}</span>
          </div>
        </div>
      </div>

      {/* Slide preview thumbs */}
      <div className={styles.thumbnails}>
        {slides.map((s, idx) => (
          <button
            key={idx}
            className={`${styles.thumbnail} ${idx === currentSlide ? styles.activeThumb : ''}`}
            onClick={() => setCurrentSlide(idx)}
          >
            <div className={styles.thumbNum}>{idx + 1}</div>
            <div className={styles.thumbTitle}>{s.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
}