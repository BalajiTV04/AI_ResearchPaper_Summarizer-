'use client';
import { useRef, useState, useEffect } from 'react';

export default function AnimatedFeatureCard({ icon, title, description, gradient, index }) {
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger based on index
          setTimeout(() => {
            setIsVisible(true);
          }, index * 120);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [index]);

  const handleMouseMove = (e) => {
    if (!cardRef.current || window.innerWidth < 768) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = (y - centerY) / 20;
    const tiltY = (centerX - x) / 20;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      className={`feature-card ${isVisible ? 'visible' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isVisible
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
          : 'perspective(1000px) rotateX(0) rotateY(0)',
        opacity: isVisible ? 1 : 0,
        transformStyle: 'preserve-3d',
        transition: isHovered
          ? 'box-shadow 0.3s, opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.1s ease-out'
          : 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s ease-out',
        background: 'var(--glass)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 'clamp(24px, 4vw, 32px) clamp(16px, 3vw, 24px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        willChange: 'transform, opacity',
      }}
    >
      {/* Animated gradient border on hover */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: 'calc(var(--radius) + 2px)',
            background: `linear-gradient(135deg, ${gradient}, transparent 50%, ${gradient})`,
            opacity: 0.3,
            zIndex: -1,
            animation: 'borderShimmer 2s linear infinite',
            backgroundSize: '200% 200%',
          }}
        />
      )}

      {/* Glow effect on hover */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '200px',
          height: '200px',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${gradient}22 0%, transparent 70%)`,
          opacity: isHovered ? 0.8 : 0,
          transition: 'opacity 0.4s',
          pointerEvents: 'none',
          borderRadius: '50%',
        }}
      />

      {/* Icon */}
      <div
        className="feature-icon-wrapper"
        style={{
          marginBottom: 'clamp(12px, 2vw, 16px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span
          className="feature-icon"
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            display: 'inline-block',
            animation: isHovered ? 'iconBounce 0.6s ease' : 'none',
          }}
        >
          {icon}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
          marginBottom: 'clamp(8px, 1.5vw, 12px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: 'clamp(0.85rem, 1.5vw, 0.95rem)',
          lineHeight: 1.6,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {description}
      </p>

      <style jsx>{`
        .feature-card {
          transform: translateY(30px);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: default;
        }
        .feature-card.visible {
          transform: translateY(0);
        }
        .feature-card:hover {
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        @keyframes iconBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-8px) scale(1.1); }
          50% { transform: translateY(-4px) scale(1.05); }
          70% { transform: translateY(-2px) scale(1.02); }
        }
        @keyframes borderShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}