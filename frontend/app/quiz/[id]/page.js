'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import QuizCard from '@/components/QuizCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import Link from 'next/link';
import styles from './page.module.css';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = params.id;

  // Step management: 'select' | 'playing' | 'result'
  const [step, setStep] = useState('select');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected difficulty & questions
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Scores per difficulty
  const [scores, setScores] = useState({ easy: 0, medium: 0, hard: 0 });
  const [completedLevels, setCompletedLevels] = useState([]);
  const [currentScore, setCurrentScore] = useState(0);

  // Track which levels have been generated
  const [generatedLevels, setGeneratedLevels] = useState({});

  const difficulties = [
    { key: 'easy', label: 'Easy', icon: '🟢', color: '#10b981', desc: 'Basic recall questions from the paper' },
    { key: 'medium', label: 'Medium', icon: '🟡', color: '#f59e0b', desc: 'Comprehension and application' },
    { key: 'hard', label: 'Hard', icon: '🔴', color: '#ef4444', desc: 'Analysis and deep understanding' },
  ];

  // Load generated state on mount
  useEffect(() => {
    checkGeneratedLevels();
  }, [paperId]);

  async function checkGeneratedLevels() {
    try {
      const data = await api.get(`/ai/quiz/${paperId}/results`);
      const gen = {};
      if (data.easy) gen.easy = true;
      if (data.medium) gen.medium = true;
      if (data.hard) gen.hard = true;
      setGeneratedLevels(gen);
    } catch (err) {
      console.log('No quizzes found yet');
    }
  }

  async function startDifficulty(difficulty) {
    setSelectedDifficulty(difficulty);
    setCurrentIdx(0);
    setCurrentScore(0);
    setErrorMsg('');
    setLoading(true);

    try {
      // Try to fetch existing questions
      const data = await api.get(`/ai/quiz/${paperId}/${difficulty}`);
      const qs = data.questions || [];
      if (qs.length === 0) throw new Error('No questions returned');
      setQuestions(qs);
      setStep('playing');
    } catch (err) {
      // Generate new questions
      setGenerating(true);
      setErrorMsg('');
      try {
        const data = await api.post(`/ai/quiz/${paperId}/${difficulty}`, {});
        const qs = data.questions || [];
        if (qs.length === 0) {
          setErrorMsg(`Failed to generate ${difficulty} questions. Please try again.`);
          setSelectedDifficulty(null);
        } else {
          setQuestions(qs);
          setStep('playing');
          setGeneratedLevels(prev => ({ ...prev, [difficulty]: true }));
        }
      } catch (genErr) {
        setErrorMsg('Failed to generate quiz: ' + genErr.message);
        setSelectedDifficulty(null);
      } finally {
        setGenerating(false);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCorrect() {
    setCurrentScore(prev => prev + 1);
  }

  function handleNext() {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Level completed
      const newScores = { ...scores, [selectedDifficulty]: currentScore };
      setScores(newScores);
      const newCompleted = [...completedLevels, selectedDifficulty];
      setCompletedLevels(newCompleted);

      // If all 3 levels completed, show results
      if (newCompleted.length >= 3) {
        setStep('result');
      } else {
        // Go back to level selection
        setSelectedDifficulty(null);
        setQuestions([]);
        setCurrentIdx(0);
        setStep('select');
      }
    }
  }

  function handleReset() {
    setStep('select');
    setSelectedDifficulty(null);
    setQuestions([]);
    setCurrentIdx(0);
    setScores({ easy: 0, medium: 0, hard: 0 });
    setCompletedLevels([]);
    setCurrentScore(0);
    setErrorMsg('');
  }

  function getDifficultyColor(key) {
    const map = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };
    return map[key] || '#6366f1';
  }

  // --- Step: Difficulty Selection ---
  if (step === 'select') {
    const allCompleted = completedLevels.length >= 3;

    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className={styles.selectScreen}>
          <div className={styles.topBar}>
            <Link href={`/paper/${paperId}`} className={styles.backToPaperBtn}>
              ← Back to Paper
            </Link>
          </div>
          <h1 className={styles.title}>📝 Quiz Challenge</h1>
          <p className={styles.subtitle}>
            {allCompleted 
              ? 'All levels completed! View your results below.'
              : 'Select a difficulty level to start. Complete all 3 levels to see your total score.'
            }
          </p>

          {/* Error message */}
          {errorMsg && (
            <div className={styles.errorBox}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Completed levels indicator */}
          <div className={styles.progressBar}>
            {difficulties.map(d => (
              <div key={d.key} className={styles.progressItem}>
                <div 
                  className={`${styles.progressDot} ${completedLevels.includes(d.key) ? styles.completed : ''}`}
                  style={{ borderColor: d.color }}
                >
                  {completedLevels.includes(d.key) ? '✓' : d.icon}
                </div>
                <span style={{ color: completedLevels.includes(d.key) ? d.color : 'var(--text-muted)' }}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>

          {/* Difficulty cards */}
          <div className={styles.difficultyGrid}>
            {difficulties.map(d => {
              const isCompleted = completedLevels.includes(d.key);
              const isDisabled = isCompleted || generating;

              return (
                <button
                  key={d.key}
                  className={`${styles.difficultyCard} ${isCompleted ? styles.completedCard : ''}`}
                  onClick={() => !isCompleted && startDifficulty(d.key)}
                  disabled={isDisabled}
                  style={{
                    borderColor: isCompleted ? d.color : isDisabled ? 'var(--border)' : d.color + '66',
                    background: isCompleted ? d.color + '15' : 'var(--glass)'
                  }}
                >
                  <span className={styles.diffIcon}>{isCompleted ? '✅' : d.icon}</span>
                  <h3 style={{ color: d.color }}>{d.label}</h3>
                  <p className={styles.diffDesc}>{d.desc}</p>
                  <span className={styles.diffCount}>10 questions</span>
                  {isCompleted && (
                    <span className={styles.completedBadge}>
                      Score: {scores[d.key]}/10
                    </span>
                  )}
                  {generating && selectedDifficulty === d.key && (
                    <span className={styles.generatingBadge}>Generating...</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className={styles.selectActions}>
            {allCompleted && (
              <button 
                className={styles.viewResultsBtn}
                onClick={() => setStep('result')}
              >
                View Final Results 📊
              </button>
            )}
            {completedLevels.length > 0 && completedLevels.length < 3 && (
              <button 
                className={styles.resetBtn}
                onClick={handleReset}
              >
                Reset All Progress
              </button>
            )}
          </div>

          {loading && <SkeletonLoader />}
        </div>
      </div>
    );
  }

  // --- Step: Playing Quiz ---
  if (step === 'playing') {
    const question = questions[currentIdx];
    if (!question) {
      return (
        <div className="container" style={{ paddingTop: '40px' }}>
          <SkeletonLoader />
        </div>
      );
    }

    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className={styles.playingHeader}>
          <button 
            className={styles.backBtn}
            onClick={() => {
              setSelectedDifficulty(null);
              setQuestions([]);
              setCurrentIdx(0);
              setCurrentScore(0);
              setStep('select');
            }}
          >
            ← Back to Levels
          </button>
          <div className={styles.playingInfo}>
            <span 
              className={styles.playingDifficulty}
              style={{ color: getDifficultyColor(selectedDifficulty) }}
            >
              {difficulties.find(d => d.key === selectedDifficulty)?.icon} {selectedDifficulty?.charAt(0).toUpperCase() + selectedDifficulty?.slice(1)}
            </span>
            <span className={styles.playingScore}>
              Score: {currentScore}/{currentIdx + (questions[currentIdx] ? 1 : 0)}
            </span>
          </div>
        </div>

        <QuizCard
          key={currentIdx}
          question={question}
          onNext={handleNext}
          isLast={currentIdx === questions.length - 1}
          onCorrect={handleCorrect}
          difficulty={selectedDifficulty}
          questionIndex={currentIdx + 1}
          totalQuestions={questions.length}
        />
      </div>
    );
  }

  // --- Step: Results ---
  if (step === 'result') {
    const totalScore = (scores.easy || 0) + (scores.medium || 0) + (scores.hard || 0);
    const totalPossible = 30;
    const percentage = Math.round((totalScore / totalPossible) * 100);

    let grade = 'F';
    let gradeColor = '#ef4444';
    if (percentage >= 90) { grade = 'A+'; gradeColor = '#10b981'; }
    else if (percentage >= 80) { grade = 'A'; gradeColor = '#22c55e'; }
    else if (percentage >= 70) { grade = 'B'; gradeColor = '#84cc16'; }
    else if (percentage >= 60) { grade = 'C'; gradeColor = '#f59e0b'; }
    else if (percentage >= 50) { grade = 'D'; gradeColor = '#f97316'; }

    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className={styles.resultScreen}>
          <div className={styles.topBar}>
            <Link href={`/paper/${paperId}`} className={styles.backToPaperBtn}>
              ← Back to Paper
            </Link>
          </div>
          <h1 className={styles.resultTitle}>🎉 Quiz Complete!</h1>
          
          <div className={styles.gradeCircle} style={{ borderColor: gradeColor }}>
            <span className={styles.gradeText} style={{ color: gradeColor }}>{grade}</span>
            <span className={styles.percentageText}>{percentage}%</span>
          </div>

          <div className={styles.totalScore}>
            <span className={styles.totalScoreNum}>{totalScore}</span>
            <span className={styles.totalScoreDen}>/ {totalPossible}</span>
          </div>

          <div className={styles.breakdown}>
            <h3>Score Breakdown</h3>
            <div className={styles.breakdownGrid}>
              {difficulties.map(d => (
                <div key={d.key} className={styles.breakdownItem}>
                  <div className={styles.breakdownHeader}>
                    <span>{d.icon} {d.label}</span>
                    <span style={{ color: d.color, fontWeight: 700 }}>
                      {scores[d.key] || 0}/10
                    </span>
                  </div>
                  <div className={styles.breakdownBar}>
                    <div 
                      className={styles.breakdownFill}
                      style={{ 
                        width: `${((scores[d.key] || 0) / 10) * 100}%`,
                        background: d.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.resultActions}>
            <button className={styles.tryAgainBtn} onClick={handleReset}>
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}