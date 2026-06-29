'use client';
import { useState, useEffect } from 'react';
import MathText from '@/components/MathText';
import styles from './QuizCard.module.css';

export default function QuizCard({ question, onNext, isLast, onCorrect, difficulty, questionIndex, totalQuestions }) {
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [answered, setAnswered] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelected(null);
    setShowResult(false);
    setAnswered(false);
  }, [question]);

  const handleSelect = (opt) => {
    if (showResult || answered) return;
    setSelected(opt);
  };

  const handleCheck = () => {
    if (!selected) return;
    setShowResult(true);
    setAnswered(true);
    if (selected === question.answer && onCorrect) {
      onCorrect();
    }
  };

  const isCorrect = selected === question.answer;

  // Difficulty color
  const difficultyColors = {
    easy: '#10b981',
    medium: '#f59e0b',
    hard: '#ef4444'
  };
  const diffColor = difficultyColors[difficulty] || '#6366f1';

  return (
    <div className={styles.card}>
      <div className={styles.questionNumber}>
        <span>Question {questionIndex} of {totalQuestions}</span>
        {difficulty && (
          <span 
            className={styles.difficultyBadge}
            style={{ 
              background: diffColor + '22',
              color: diffColor,
              border: `1px solid ${diffColor}44`
            }}
          >
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </span>
        )}
      </div>
      <h3 className={styles.question}><MathText text={question.question} /></h3>

      <div className={styles.options}>
        {question.options.map((opt, idx) => {
          const optLetter = ['A','B','C','D'][idx];
          const isThisSelected = selected === optLetter;
          const isCorrectAnswer = optLetter === question.answer;

          let className = styles.option;
          if (showResult) {
            if (isCorrectAnswer) className += ' ' + styles.correct;
            else if (isThisSelected) className += ' ' + styles.wrong;
          } else if (isThisSelected) {
            className += ' ' + styles.selected;
          }

          return (
            <button
              key={idx}
              className={className}
              onClick={() => handleSelect(optLetter)}
              disabled={showResult}
            >
              <span className={styles.optLabel}>{optLetter}.</span>
              <span className={styles.optText}>{opt.substring(3)}</span>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className={`${styles.explanation} ${isCorrect ? styles.correct : styles.wrong}`}>
          {isCorrect ? '✓ Correct!' : '✗ Incorrect'} — {question.explanation}
        </div>
      )}

      <div className={styles.actions}>
        {!showResult ? (
          <button
            className={styles.checkBtn}
            onClick={handleCheck}
            disabled={!selected}
          >
            Check Answer
          </button>
        ) : (
          <button className={styles.nextBtn} onClick={onNext}>
            {isLast ? 'Finish Quiz' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
}
