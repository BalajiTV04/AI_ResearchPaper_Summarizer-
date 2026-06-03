'use client';
import { useState, useCallback } from 'react';
import styles from './UploadZone.module.css';

export default function UploadZone({ onUpload, loading }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    validateAndSetFile(dropped);
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    validateAndSetFile(selected);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('File size exceeds 20MB limit');
      return;
    }
    setFile(file);
    setProgress(0);
  };

  const handleUpload = async () => {
    if (!file || loading) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await onUpload(formData, (p) => setProgress(p));
      setFile(null);
      setProgress(0);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropZone} ${dragActive ? styles.active : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className={styles.icon}>📁</div>
        <h3>Drag & Drop your PDF here</h3>
        <p>or click to browse</p>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className={styles.input}
        />
        <p className={styles.hint}>Max file size: 20MB</p>
      </div>

      {file && (
        <div className={styles.fileInfo}>
          <p>Selected: <strong>{file.name}</strong></p>
          <p>Size: {(file.size / (1024*1024)).toFixed(2)} MB</p>
        </div>
      )}

      {progress > 0 && (
        <div className={styles.progressBar}>
          <div className={styles.progress} style={{ width: `${progress}%` }}></div>
          <span>{progress}%</span>
        </div>
      )}

      {file && !progress && (
        <button
          className={styles.uploadBtn}
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Start Upload'}
        </button>
      )}
    </div>
  );
}
