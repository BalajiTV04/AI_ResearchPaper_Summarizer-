'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import SkeletonLoader from '@/components/SkeletonLoader';
import FloatingChat from '@/components/FloatingChat';
import MathText from '@/components/MathText';
import Link from 'next/link';
import styles from './page.module.css';

export default function PaperPage() {
  const params = useParams();
  const paperId = params.id;
  const [paper, setPaper] = useState(null);
  const [summary, setSummary] = useState(null);
  const [keyPoints, setKeyPoints] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [selectedPattern, setSelectedPattern] = useState('full');
  const [images, setImages] = useState([]);
  const [imageDescriptions, setImageDescriptions] = useState([]);
  const [collectedInfo, setCollectedInfo] = useState([]);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [expandingPattern, setExpandingPattern] = useState(null);
  const [expandedContent, setExpandedContent] = useState({});
  const [extractedImages, setExtractedImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [extractingMetadata, setExtractingMetadata] = useState(false);

  const summaryRef = useRef(null);

  useEffect(() => {
    loadPaper();
  }, [paperId]);

  async function loadPaper() {
    try {
      const data = await api.get(`/papers/${paperId}`);
      setPaper(data);
      // Auto-set metadata if it already exists in the paper document
      if (data.metadata) {
        setMetadata(data.metadata);
      }
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function generateSummaries() {
    setGenerating(true);
    try {
      const data = await api.post(`/ai/summarize/${paperId}`, {});
      setSummary(data);
      // Auto-scroll to summary section after generation
      setTimeout(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function extractKeyPoints() {
    setGenerating(true);
    try {
      const data = await api.post(`/ai/keypoints/${paperId}`, {});
      setKeyPoints(data);
      if (data.images) {
        setImages(data.images);
      }
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function loadImageDescriptions() {
    // Always allow refreshing if images haven't been extracted yet
    if (imageDescriptions.length > 0 && extractedImages.length > 0) return;
    setLoadingImages(true);
    
    // Load AI-generated image descriptions
    try {
      const descData = await api.post(`/ai/images/${paperId}`, {});
      setImageDescriptions(descData.images || []);
    } catch (err) {
      console.error('Failed to load image descriptions:', err);
    }
    
    // Load actual extracted images from the PDF
    try {
      const imgData = await api.get(`/papers/${paperId}/images`);
      console.log('Extracted images from PDF:', imgData.images);
      setExtractedImages(imgData.images || []);
    } catch (err) {
      console.error('Failed to load extracted images:', err);
      alert('Failed to extract images from PDF: ' + err.message);
    } finally {
      setLoadingImages(false);
    }
  }

  async function handleExpand(pattern) {
    setExpandingPattern(pattern);
    try {
      const data = await api.post(`/ai/expand/${paperId}/${pattern}`, {});
      setExpandedContent(prev => ({ ...prev, [pattern]: data.content }));
    } catch (err) {
      alert('Failed to expand: ' + err.message);
    } finally {
      setExpandingPattern(null);
    }
  }

  async function handleExtractMetadata() {
    setExtractingMetadata(true);
    try {
      const data = await api.post(`/papers/${paperId}/extract-metadata`, {});
      setMetadata(data);
    } catch (err) {
      alert('Failed to extract metadata: ' + err.message);
    } finally {
      setExtractingMetadata(false);
    }
  }

  function addToCollection(pattern) {
    let info = '';
    if (pattern === 'full') {
      const detail = summary?.detailed_summary;
      if (typeof detail === 'object' && detail !== null) {
        info = Object.values(detail).filter(Boolean).join('\n\n');
      } else {
        info = detail || '';
      }
    } else if (pattern === 'bullet') {
      info = Object.values(keyPoints || {}).flat().join('\n• ') || '';
    } else if (pattern === 'short') {
      info = summary?.short_summary || '';
    } else if (pattern === 'eli5') {
      info = summary?.eli5_summary || '';
    }
    
    // Add expanded content if available
    const expanded = expandedContent[pattern] || '';
    if (expanded) {
      info = info + '\n\n[EXPANDED SECTION]\n' + expanded;
    }
    
    setCollectedInfo(prev => {
      if (prev.includes(info)) return prev;
      return [...prev, info];
    });
    setShowCollectModal(true);
    setTimeout(() => setShowCollectModal(false), 2000);
  }

  function downloadCollection() {
    // Build comprehensive content from ALL available AI data
    const parts = [];

    // Paper title
    if (paper?.title) {
      parts.push(`# ${paper.title}`);
      parts.push('');
    }

    // Short summary
    if (summary?.short_summary) {
      parts.push('## 📝 Short Summary');
      parts.push(summary.short_summary);
      parts.push('');
    }

    // Detailed summary (all sections)
    if (summary?.detailed_summary) {
      parts.push('## 📖 Detailed Summary');
      const detail = summary.detailed_summary;
      if (typeof detail === 'object' && detail !== null) {
        if (detail.introduction) {
          parts.push('### 📌 Introduction & Background');
          parts.push(detail.introduction);
          parts.push('');
        }
        if (detail.methodology) {
          parts.push('### 🔬 Methodology');
          parts.push(detail.methodology);
          parts.push('');
        }
        if (detail.results) {
          parts.push('### 📈 Key Results');
          parts.push(detail.results);
          parts.push('');
        }
        if (detail.discussion) {
          parts.push('### 💡 Discussion & Analysis');
          parts.push(detail.discussion);
          parts.push('');
        }
        if (detail.conclusion) {
          parts.push('### ✅ Conclusions & Future Work');
          parts.push(detail.conclusion);
          parts.push('');
        }
      } else if (typeof detail === 'string' && detail.trim()) {
        parts.push(detail);
        parts.push('');
      }
    }

    // ELI5 summary
    if (summary?.eli5_summary) {
      parts.push('## 👶 Explain Like I\'m 5');
      parts.push(summary.eli5_summary);
      parts.push('');
    }

    // Key points
    if (keyPoints) {
      parts.push('## 📋 Key Points');
      if (keyPoints.concepts?.length > 0) {
        parts.push('### 🎯 Key Concepts');
        keyPoints.concepts.forEach(c => parts.push(`- ${c}`));
        parts.push('');
      }
      if (keyPoints.methodology?.length > 0) {
        parts.push('### 🔬 Methodology');
        keyPoints.methodology.forEach(m => parts.push(`- ${m}`));
        parts.push('');
      }
      if (keyPoints.results?.length > 0) {
        parts.push('### 📈 Results');
        keyPoints.results.forEach(r => parts.push(`- ${r}`));
        parts.push('');
      }
      if (keyPoints.conclusions?.length > 0) {
        parts.push('### ✅ Conclusions');
        keyPoints.conclusions.forEach(c => parts.push(`- ${c}`));
        parts.push('');
      }
    }

    // Expanded content
    Object.entries(expandedContent).forEach(([pattern, content]) => {
      if (content) {
        parts.push(`## 🔍 Expanded Content (${pattern})`);
        parts.push(content);
        parts.push('');
      }
    });

    // Image descriptions
    if (imageDescriptions.length > 0) {
      parts.push('## 📷 Figures & Images');
      imageDescriptions.forEach((img, idx) => {
        parts.push(`### Figure ${idx + 1}: ${img.title || img.type || 'Untitled'}`);
        if (img.description) parts.push(img.description);
        if (img.page_context) parts.push(`*📍 ${img.page_context}*`);
        parts.push('');
      });
    }

    // Metadata
    if (metadata) {
      parts.push('## 📋 Metadata');
      if (metadata.authors?.length > 0) parts.push(`**Authors:** ${metadata.authors.join(', ')}`);
      if (metadata.publication_date) parts.push(`**Publication Date:** ${metadata.publication_date}`);
      if (metadata.foundation) parts.push(`**Foundation:** ${metadata.foundation}`);
      if (metadata.journal) parts.push(`**Journal:** ${metadata.journal}`);
      if (metadata.doi) parts.push(`**DOI:** ${metadata.doi}`);
      parts.push('');
    }

    // Also include any manually collected items
    if (collectedInfo.length > 0) {
      parts.push('## 📚 Collected Notes');
      collectedInfo.forEach((info, i) => {
        parts.push(`### Note ${i + 1}`);
        parts.push(info);
        parts.push('');
      });
    }

    const content = parts.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paper-notes-${paperId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) return <SkeletonLoader />;
  if (error) return <div className="container">{error}</div>;

  function renderImagesSection() {
    const hasExtracted = extractedImages.length > 0;
    const hasDescriptions = imageDescriptions.length > 0 || images.length > 0;
    if (!hasExtracted && !hasDescriptions && !loadingImages) return null;

    return (
      <div className={styles.imagesSection}>
        <h3>📷 Important Figures & Images from Paper</h3>
        {loadingImages ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            Extracting image descriptions...
          </p>
        ) : (
          <>
            {/* Actual extracted images from the PDF */}
            {hasExtracted && (
              <>
                <h4 style={{ margin: '16px 0 8px' }}>📸 Extracted Images from PDF</h4>
                <div className={styles.imagesGrid}>
                  {extractedImages.map((img, idx) => (
                    <div key={`ext-${idx}`} className={styles.imageCard}>
                      <div className={styles.imagePlaceholder} style={{ padding: '4px', background: 'var(--card-bg)' }}>
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}${img.url}`}
                          alt={`Figure from page ${img.page_number}`}
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '300px',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            background: 'white'
                          }}
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div className={styles.imagePlaceholder} style={{ display: 'none' }}>
                          <span>📊</span>
                        </div>
                      </div>
                      <p className={styles.imageCaption}>
                        <strong>Figure from Page {img.page_number}</strong>
                        {img.width && img.height && (
                          <><br /><em style={{opacity: 0.6, fontSize: '0.85em'}}>{img.width} × {img.height}px</em></>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* AI-generated image descriptions (fallback/extra info) */}
            {hasDescriptions && (
              <>
                <h4 style={{ margin: '16px 0 8px' }}>📝 AI-Identified Figures</h4>
                <div className={styles.imagesGrid}>
                  {(imageDescriptions.length > 0 ? imageDescriptions : images).map((img, idx) => (
                    <div key={`desc-${idx}`} className={styles.imageCard}>
                      <div className={styles.imagePlaceholder}>
                        <span>📊</span>
                      </div>
                      <p className={styles.imageCaption}>
                        <strong>{img.title || img.type || `Figure ${idx + 1}`}</strong>
                        {img.description && <><br />{img.description}</>}
                        {img.page_context && <><br /><em style={{opacity: 0.7}}>📍 {img.page_context}</em></>}
                        {img.caption && <><br />{img.caption}</>}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  function renderExpandButton(pattern) {
    return (
      <button
        className={styles.expandBtn}
        onClick={() => handleExpand(pattern)}
        disabled={expandingPattern === pattern}
      >
        {expandingPattern === pattern ? '✨ Expanding...' : '✨ Expand with More Details'}
      </button>
    );
  }

  function renderExpandedContent(pattern) {
    if (!expandedContent[pattern]) return null;
    return (
      <div className={styles.expandedBox}>
        <div className={styles.expandedHeader}>
          <h4>📚 Additional Details</h4>
          <button
            className={styles.collectBtn}
            onClick={() => addToCollection(pattern)}
          >
            📥 Collect This
          </button>
        </div>
        <div className={styles.expandedBody}>
          {expandedContent[pattern].split('\n').map((line, i) => {
            if (line.startsWith('•') || line.startsWith('-')) {
              return <li key={i} className={styles.expandedBullet}><MathText text={line} /></li>;
            }
            if (line.match(/^\d+\./)) {
              return <li key={i} className={styles.expandedBullet}><MathText text={line} /></li>;
            }
            return <MathText key={i} as="p" className={styles.expandedPara} text={line} />;
          })}
        </div>
      </div>
    );
  }

  function renderMetadataSection() {
    if (!metadata) return null;

    return (
      <div className={styles.metadataCard}>
        <h3>📋 Research Paper Metadata</h3>
        <div className={styles.metadataGrid}>
          {metadata.authors && metadata.authors.length > 0 && (
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>👤 Authors</span>
              <div className={styles.authorTags}>
                {metadata.authors.map((author, i) => (
                  <span key={i} className={styles.authorTag}>{author}</span>
                ))}
              </div>
            </div>
          )}
          {metadata.publication_date && (
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>📅 Publication Date</span>
              <span className={styles.metadataValue}>{metadata.publication_date}</span>
            </div>
          )}
          {metadata.foundation && (
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>🏛️ Foundation / Organization</span>
              <span className={styles.metadataValue}>{metadata.foundation}</span>
            </div>
          )}
          {metadata.journal && (
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>📰 Journal / Venue</span>
              <span className={styles.metadataValue}>{metadata.journal}</span>
            </div>
          )}
          {metadata.doi && (
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>🔗 DOI</span>
              <span className={styles.metadataValue}>{metadata.doi}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /**
   * Parse a plain text detailed summary into structured sections
   * by detecting section headers like "Introduction", "Methodology", etc.
   */
  function parseDetailedSummary(text) {
    if (!text || typeof text !== 'string') return null;
    
    const sectionHeaders = {
      introduction: ['introduction', 'background', 'introduction & background', 'introduction and background', 'problem'],
      methodology: ['methodology', 'methods', 'approach', 'method', 'experimental setup'],
      results: ['results', 'key results', 'findings', 'key findings', 'main findings', 'outcomes'],
      discussion: ['discussion', 'analysis', 'discussion & analysis', 'discussion and analysis', 'interpretation'],
      conclusion: ['conclusion', 'conclusions', 'conclusions & future work', 'conclusions and future work', 'future work']
    };
    
    const lines = text.split('\n');
    const sections = {
      introduction: '',
      methodology: '',
      results: '',
      discussion: '',
      conclusion: ''
    };
    
    let currentSection = null;
    for (const line of lines) {
      const lineLower = line.trim().toLowerCase();
      let matched = false;
      
      for (const [sectionName, headers] of Object.entries(sectionHeaders)) {
        for (const header of headers) {
          if (lineLower.startsWith(header) || 
              lineLower.startsWith(`1. ${header}`) || 
              lineLower.startsWith(`2. ${header}`) || 
              lineLower.startsWith(`3. ${header}`) || 
              lineLower.startsWith(`4. ${header}`) || 
              lineLower.startsWith(`5. ${header}`) ||
              lineLower.startsWith(`**${header}`) ||
              lineLower.startsWith(`### ${header}`)) {
            currentSection = sectionName;
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
      
      if (currentSection && !matched && line.trim()) {
        if (sections[currentSection]) {
          sections[currentSection] += '\n' + line.trim();
        } else {
          sections[currentSection] = line.trim();
        }
      }
    }
    
    // Only return if at least one section was found
    if (Object.values(sections).some(v => v.trim())) {
      return sections;
    }
    return null;
  }

  /**
   * Render detailed summary content, handling both structured objects and plain text
   */
  function renderDetailedSummary(detail) {
    // If it's already a structured object, render sections
    if (typeof detail === 'object' && detail !== null) {
      return (
        <div className={styles.detailedSections}>
          {detail.introduction && (
            <div className={styles.detailCard}>
              <h4 className={styles.detailTitle}>📌 Introduction & Background</h4>
              <MathText as="p" className={styles.detailText} text={detail.introduction} />
            </div>
          )}
          {detail.methodology && (
            <div className={styles.detailCard}>
              <h4 className={styles.detailTitle}>🔬 Methodology</h4>
              <MathText as="p" className={styles.detailText} text={detail.methodology} />
            </div>
          )}
          {detail.results && (
            <div className={styles.detailCard}>
              <h4 className={styles.detailTitle}>📈 Key Results</h4>
              <MathText as="p" className={styles.detailText} text={detail.results} />
            </div>
          )}
          {detail.discussion && (
            <div className={styles.detailCard}>
              <h4 className={styles.detailTitle}>💡 Discussion & Analysis</h4>
              <MathText as="p" className={styles.detailText} text={detail.discussion} />
            </div>
          )}
          {detail.conclusion && (
            <div className={styles.detailCard}>
              <h4 className={styles.detailTitle}>✅ Conclusions & Future Work</h4>
              <MathText as="p" className={styles.detailText} text={detail.conclusion} />
            </div>
          )}
        </div>
      );
    }
    
    // If it's a plain string, try to parse it into sections
    if (typeof detail === 'string' && detail.trim()) {
      const parsed = parseDetailedSummary(detail);
      if (parsed) {
        return (
          <div className={styles.detailedSections}>
            {parsed.introduction && (
              <div className={styles.detailCard}>
                <h4 className={styles.detailTitle}>📌 Introduction & Background</h4>
                <MathText as="p" className={styles.detailText} text={parsed.introduction} />
              </div>
            )}
            {parsed.methodology && (
              <div className={styles.detailCard}>
                <h4 className={styles.detailTitle}>🔬 Methodology</h4>
                <MathText as="p" className={styles.detailText} text={parsed.methodology} />
              </div>
            )}
            {parsed.results && (
              <div className={styles.detailCard}>
                <h4 className={styles.detailTitle}>📈 Key Results</h4>
                <MathText as="p" className={styles.detailText} text={parsed.results} />
              </div>
            )}
            {parsed.discussion && (
              <div className={styles.detailCard}>
                <h4 className={styles.detailTitle}>💡 Discussion & Analysis</h4>
                <MathText as="p" className={styles.detailText} text={parsed.discussion} />
              </div>
            )}
            {parsed.conclusion && (
              <div className={styles.detailCard}>
                <h4 className={styles.detailTitle}>✅ Conclusions & Future Work</h4>
                <MathText as="p" className={styles.detailText} text={parsed.conclusion} />
              </div>
            )}
          </div>
        );
      }
      // Fallback: render as plain text
      return <MathText as="p" text={detail} />;
    }
    
    return null;
  }

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <FloatingChat paperId={paperId} paperTitle={paper?.title} />
      <div className={styles.header}>
        <div>
          <h1>{paper.title || 'Untitled Paper'}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            {paper.page_count} pages • Uploaded {new Date(paper.uploaded_at).toLocaleDateString()}
          </p>
        </div>
        <div className={styles.actions}>
          <Link href={`/quiz/${paperId}`} className={styles.actionBtn}>
            ❓ Quiz
          </Link>
          <Link href={`/ppt/${paperId}`} className={styles.actionBtn}>
            📊 PPT
          </Link>
        </div>
      </div>

      {/* Collection success toast */}
      {showCollectModal && (
        <div className={styles.toast}>
          ✅ Information collected! <button onClick={downloadCollection} className={styles.downloadNotesBtn}>Download Notes</button>
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'summary' ? styles.active : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'keypoints' ? styles.active : ''}`}
          onClick={() => setActiveTab('keypoints')}
        >
          Key Points
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'info' ? styles.active : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Information
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'summary' && (
          <div ref={summaryRef}>
            {!summary ? (
              <div className={styles.generateSection}>
                <p className={styles.genText}>Generate AI summaries of this paper</p>
                <button
                  className="btn-primary"
                  onClick={generateSummaries}
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Generate Summary'}
                </button>
              </div>
            ) : (
              <>
                {/* Pattern Selection - shown IMMEDIATELY after generation */}
                <div className={styles.patternQuickSelect}>
                  <h3>📖 Choose your reading style:</h3>
                  <div className={styles.patternQuickButtons}>
                    <button
                      className={`${styles.quickPatternBtn} ${selectedPattern === 'short' ? styles.quickActive : ''}`}
                      onClick={() => setSelectedPattern('short')}
                    >
                      🔖 Short Summary
                    </button>
                    <button
                      className={`${styles.quickPatternBtn} ${selectedPattern === 'full' ? styles.quickActive : ''}`}
                      onClick={() => setSelectedPattern('full')}
                    >
                      📝 Detailed Summary
                    </button>
                    <button
                      className={`${styles.quickPatternBtn} ${selectedPattern === 'eli5' ? styles.quickActive : ''}`}
                      onClick={() => setSelectedPattern('eli5')}
                    >
                      👶 Explain Like I'm 5
                    </button>
                    <button
                      className={`${styles.quickPatternBtn} ${selectedPattern === 'bullet' ? styles.quickActive : ''}`}
                      onClick={() => { setSelectedPattern('bullet'); if (!keyPoints) extractKeyPoints(); }}
                    >
                      📋 Bullet Points
                    </button>
                  </div>
                </div>

                {/* Pattern Content Display */}
                {selectedPattern === 'full' && (
                  <div className={styles.summaryCard} style={{ marginTop: '20px' }}>
                    <div className={styles.patternHeader}>
                      <h3>📝 Detailed Summary</h3>
                      <div className={styles.patternActions}>
                        <button className={styles.collectBtn} onClick={() => addToCollection('full')}>
                          📥 Collect
                        </button>
                      </div>
                    </div>
                    <div className={styles.patternBody}>
                      {renderDetailedSummary(summary.detailed_summary)}
                      {renderExpandButton('detailed')}
                      {renderExpandedContent('detailed')}
                    </div>
                    {images.length > 0 && (
                      <div className={styles.patternImages}>
                        <h4>Key Figures:</h4>
                        {images.map((img, idx) => (
                          <div key={idx} className={styles.patternImageItem}>
                            <span className={styles.patternImageIcon}>📊</span>
                            <span>{img.caption || `Figure ${idx + 1} from paper`}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedPattern === 'short' && (
                  <div className={styles.summaryCard} style={{ marginTop: '20px' }}>
                    <div className={styles.patternHeader}>
                      <h3>🔖 Short Summary</h3>
                      <div className={styles.patternActions}>
                        <button className={styles.collectBtn} onClick={() => addToCollection('short')}>
                          📥 Collect
                        </button>
                      </div>
                    </div>
                    <div className={styles.patternBody}>
                      <MathText as="p" className={styles.shortSummaryText} text={summary.short_summary} />
                      {renderExpandButton('short')}
                      {renderExpandedContent('short')}
                    </div>
                  </div>
                )}

                {selectedPattern === 'eli5' && (
                  <div className={styles.summaryCard} style={{ marginTop: '20px' }}>
                    <div className={styles.patternHeader}>
                      <h3>👶 Explain Like I'm 5</h3>
                      <div className={styles.patternActions}>
                        <button className={styles.collectBtn} onClick={() => addToCollection('eli5')}>
                          📥 Collect
                        </button>
                      </div>
                    </div>
                    <div className={styles.patternBody}>
                      <div className={styles.eli5Box}>
                        <MathText as="p" text={summary.eli5_summary} />
                      </div>
                      {renderExpandButton('eli5')}
                      {renderExpandedContent('eli5')}
                    </div>
                  </div>
                )}

                {selectedPattern === 'bullet' && (
                  <div className={styles.summaryCard} style={{ marginTop: '20px' }}>
                    <div className={styles.patternHeader}>
                      <h3>📋 Bullet Points</h3>
                      <div className={styles.patternActions}>
                        <button className={styles.collectBtn} onClick={() => addToCollection('bullet')}>
                          📥 Collect
                        </button>
                      </div>
                    </div>
                    <div className={styles.patternBody}>
                      {keyPoints ? (
                        <>
                          {keyPoints.concepts?.length > 0 && (
                            <div className={styles.bulletSection}>
                              <h4>🎯 Key Concepts</h4>
                              <ul>{keyPoints.concepts.map((c,i) => <li key={i}><MathText text={c} /></li>)}</ul>
                            </div>
                          )}
                          {keyPoints.methodology?.length > 0 && (
                            <div className={styles.bulletSection}>
                              <h4>🔬 Methodology</h4>
                              <ul>{keyPoints.methodology.map((m,i) => <li key={i}><MathText text={m} /></li>)}</ul>
                            </div>
                          )}
                          {keyPoints.results?.length > 0 && (
                            <div className={styles.bulletSection}>
                              <h4>📈 Results</h4>
                              <ul>{keyPoints.results.map((r,i) => <li key={i}><MathText text={r} /></li>)}</ul>
                            </div>
                          )}
                          {keyPoints.conclusions?.length > 0 && (
                            <div className={styles.bulletSection}>
                              <h4>✅ Conclusions</h4>
                              <ul>{keyPoints.conclusions.map((c,i) => <li key={i}><MathText text={c} /></li>)}</ul>
                            </div>
                          )}
                          {renderExpandButton('bullets')}
                          {renderExpandedContent('bullets')}
                        </>
                      ) : (
                        <div className={styles.subGenerate}>
                          <p>Extract key points to see bullet pattern</p>
                          <button className="btn-primary" onClick={extractKeyPoints} disabled={generating}>
                            {generating ? 'Extracting...' : 'Extract Key Points'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Show all patterns below for reference */}
                <div className={styles.allPatternsRef}>
                  <h3>📚 All Summary Patterns</h3>
                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryCard}>
                      <h3>📌 Short Summary</h3>
                      <MathText as="p" text={summary.short_summary} />
                    </div>
                    <div className={styles.summaryCard}>
                      <h3>📖 Detailed Summary</h3>
                      {renderDetailedSummary(summary.detailed_summary)}
                    </div>
                    <div className={styles.summaryCard}>
                      <h3>👶 ELI5</h3>
                      <MathText as="p" text={summary.eli5_summary} />
                    </div>
                  </div>
                </div>

                {/* Images section */}
                {renderImagesSection()}

                {/* Collection section */}
                {collectedInfo.length > 0 && (
                  <div className={styles.collectedSection}>
                    <div className={styles.collectedHeader}>
                      <h3>📚 Your Collected Information ({collectedInfo.length} items)</h3>
                      <button className={styles.downloadBtn} onClick={downloadCollection}>
                        ⬇ Download All
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'keypoints' && (
          <div>
            {!keyPoints ? (
              <div className={styles.generateSection}>
                <p className={styles.genText}>Extract key points from the paper</p>
                <button
                  className="btn-primary"
                  onClick={extractKeyPoints}
                  disabled={generating}
                >
                  {generating ? 'Extracting...' : 'Extract Key Points'}
                </button>
              </div>
            ) : (
              <>
                <div className={styles.keypointsGrid}>
                  <div className={styles.kpSection}>
                    <h3>🎯 Concepts</h3>
                    <ul>{keyPoints.concepts?.map((c,i) => <li key={i}><MathText text={c} /></li>)}</ul>
                  </div>
                  <div className={styles.kpSection}>
                    <h3>🔬 Methodology</h3>
                    <ul>{keyPoints.methodology?.map((m,i) => <li key={i}><MathText text={m} /></li>)}</ul>
                  </div>
                  <div className={styles.kpSection}>
                    <h3>📈 Results</h3>
                    <ul>{keyPoints.results?.map((r,i) => <li key={i}><MathText text={r} /></li>)}</ul>
                  </div>
                  <div className={styles.kpSection}>
                    <h3>✅ Conclusions</h3>
                    <ul>{keyPoints.conclusions?.map((c,i) => <li key={i}><MathText text={c} /></li>)}</ul>
                  </div>
                </div>

                {renderExpandButton('bullets')}
                {renderExpandedContent('bullets')}

                {/* Images section */}
                <button
                  className={styles.loadImagesBtn}
                  onClick={loadImageDescriptions}
                  disabled={loadingImages}
                >
                  {loadingImages ? 'Loading...' : extractedImages.length > 0 ? '✅ Images Loaded' : imageDescriptions.length > 0 ? '📝 Descriptions Loaded, 📸 Click to Extract Images' : '📷 View Important Figures & Images'}
                </button>
                {renderImagesSection()}
              </>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div>
            <div className={styles.infoCard}>
              <h3>Paper Details</h3>
              <p><strong>Filename:</strong> {paper.filename}</p>
              <p><strong>File Size:</strong> {paper.file_size ? `${(paper.file_size / 1024).toFixed(1)} KB` : 'N/A'}</p>
              <p><strong>Uploaded:</strong> {new Date(paper.uploaded_at).toLocaleString()}</p>
              <p><strong>Pages:</strong> {paper.page_count || 'N/A'}</p>
            </div>

            {/* Metadata Section */}
            <div className={styles.metadataSection}>
              <div className={styles.metadataHeader}>
                <h3>📋 Research Paper Metadata</h3>
                {!metadata && (
                  <button
                    className={styles.extractMetadataBtn}
                    onClick={handleExtractMetadata}
                    disabled={extractingMetadata}
                  >
                    {extractingMetadata ? '🔍 Extracting...' : '🔍 Extract Metadata'}
                  </button>
                )}
                {metadata && (
                  <button
                    className={styles.extractMetadataBtn}
                    onClick={handleExtractMetadata}
                    disabled={extractingMetadata}
                    style={{ opacity: 0.7 }}
                  >
                    {extractingMetadata ? '🔄 Re-extracting...' : '🔄 Re-extract'}
                  </button>
                )}
              </div>
              {extractingMetadata && (
                <div className={styles.metadataLoading}>
                  <p>🔍 Analyzing paper content to extract metadata...</p>
                </div>
              )}
              {metadata && renderMetadataSection()}
              {!metadata && !extractingMetadata && (
                <div className={styles.metadataEmpty}>
                  <p>Metadata not yet extracted. Click "Extract Metadata" to analyze this paper and get author names, publication date, foundation, and more.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}