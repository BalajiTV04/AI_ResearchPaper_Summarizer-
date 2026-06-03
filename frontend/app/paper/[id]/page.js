'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import SkeletonLoader from '@/components/SkeletonLoader';
import FloatingChat from '@/components/FloatingChat';
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
    if (imageDescriptions.length > 0) return;
    setLoadingImages(true);
    try {
      const data = await api.post(`/ai/images/${paperId}`, {});
      setImageDescriptions(data.images || []);
    } catch (err) {
      console.error('Failed to load image descriptions:', err);
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
      info = summary?.detailed_summary || '';
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
    const content = collectedInfo.join('\n\n---\n\n');
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
    const allImages = [...imageDescriptions, ...images];
    if (allImages.length === 0 && !loadingImages) return null;

    return (
      <div className={styles.imagesSection}>
        <h3>📷 Important Figures & Images from Paper</h3>
        {loadingImages ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            Extracting image descriptions...
          </p>
        ) : (
          <div className={styles.imagesGrid}>
            {allImages.map((img, idx) => (
              <div key={idx} className={styles.imageCard}>
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
              return <li key={i} className={styles.expandedBullet}>{line}</li>;
            }
            if (line.match(/^\d+\./)) {
              return <li key={i} className={styles.expandedBullet}>{line}</li>;
            }
            return <p key={i} className={styles.expandedPara}>{line}</p>;
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
                      <p>{summary.detailed_summary}</p>
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
                      <p className={styles.shortSummaryText}>{summary.short_summary}</p>
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
                        <p>{summary.eli5_summary}</p>
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
                              <ul>{keyPoints.concepts.map((c,i) => <li key={i}>{c}</li>)}</ul>
                            </div>
                          )}
                          {keyPoints.methodology?.length > 0 && (
                            <div className={styles.bulletSection}>
                              <h4>🔬 Methodology</h4>
                              <ul>{keyPoints.methodology.map((m,i) => <li key={i}>{m}</li>)}</ul>
                            </div>
                          )}
                          {keyPoints.results?.length > 0 && (
                            <div className={styles.bulletSection}>
                              <h4>📈 Results</h4>
                              <ul>{keyPoints.results.map((r,i) => <li key={i}>{r}</li>)}</ul>
                            </div>
                          )}
                          {keyPoints.conclusions?.length > 0 && (
                            <div className={styles.bulletSection}>
                              <h4>✅ Conclusions</h4>
                              <ul>{keyPoints.conclusions.map((c,i) => <li key={i}>{c}</li>)}</ul>
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
                      <p>{summary.short_summary}</p>
                    </div>
                    <div className={styles.summaryCard}>
                      <h3>📖 Detailed Summary</h3>
                      <p>{summary.detailed_summary}</p>
                    </div>
                    <div className={styles.summaryCard}>
                      <h3>👶 ELI5</h3>
                      <p>{summary.eli5_summary}</p>
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
                    <ul>{keyPoints.concepts?.map((c,i) => <li key={i}>{c}</li>)}</ul>
                  </div>
                  <div className={styles.kpSection}>
                    <h3>🔬 Methodology</h3>
                    <ul>{keyPoints.methodology?.map((m,i) => <li key={i}>{m}</li>)}</ul>
                  </div>
                  <div className={styles.kpSection}>
                    <h3>📈 Results</h3>
                    <ul>{keyPoints.results?.map((r,i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                  <div className={styles.kpSection}>
                    <h3>✅ Conclusions</h3>
                    <ul>{keyPoints.conclusions?.map((c,i) => <li key={i}>{c}</li>)}</ul>
                  </div>
                </div>

                {renderExpandButton('bullets')}
                {renderExpandedContent('bullets')}

                {/* Images section */}
                <button
                  className={styles.loadImagesBtn}
                  onClick={loadImageDescriptions}
                  disabled={loadingImages || imageDescriptions.length > 0}
                >
                  {loadingImages ? 'Loading...' : imageDescriptions.length > 0 ? '✅ Images Loaded' : '📷 View Important Figures & Images'}
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