'use client';
import { useEffect, useRef } from 'react';

/**
 * MathText - Renders text with LaTeX math expressions using KaTeX.
 * 
 * Detects $...$ for inline math and $$...$$ for display math.
 * Falls back to plain text if KaTeX fails to load or parse.
 * 
 * Usage:
 *   <MathText text="The value of $x_i$ is $$\\sum_{i=1}^{n} x_i$$" />
 *   <MathText>Children text with $math$ inside</MathText>
 */
export default function MathText({ text, children, as = 'span', className = '' }) {
  const containerRef = useRef(null);
  const content = text || children || '';

  useEffect(() => {
    if (!containerRef.current || !content) return;

    const renderMath = () => {
      const el = containerRef.current;
      if (!el) return;

      // Check if KaTeX is loaded
      if (typeof window.katex === 'undefined') {
        // KaTeX not loaded yet - show plain text
        el.textContent = content;
        return;
      }

      try {
        // Split content into math and non-math segments
        // Pattern: $$...$$ for display math, $...$ for inline math
        const parts = [];
        let remaining = content;
        let lastIndex = 0;

        // Match display math $$...$$ first, then inline $...$
        const regex = /\$\$([\s\S]*?)\$\$|\$([^$\n]+?)\$/g;
        let match;
        let result = [];
        let lastPos = 0;

        while ((match = regex.exec(content)) !== null) {
          // Add text before this match
          if (match.index > lastPos) {
            result.push({ type: 'text', value: content.slice(lastPos, match.index) });
          }

          if (match[1] !== undefined) {
            // Display math $$...$$
            result.push({ type: 'display', value: match[1] });
          } else if (match[2] !== undefined) {
            // Inline math $...$
            result.push({ type: 'inline', value: match[2] });
          }

          lastPos = regex.lastIndex;
        }

        // Add remaining text
        if (lastPos < content.length) {
          result.push({ type: 'text', value: content.slice(lastPos) });
        }

        // If no math found, just show plain text
        if (result.length === 0 || (result.length === 1 && result[0].type === 'text')) {
          el.textContent = content;
          return;
        }

        // Build DOM with rendered math
        el.innerHTML = '';
        for (const part of result) {
          if (part.type === 'text') {
            el.appendChild(document.createTextNode(part.value));
          } else {
            try {
              const span = document.createElement('span');
              if (part.type === 'display') {
                span.style.display = 'block';
                span.style.textAlign = 'center';
                span.style.margin = '8px 0';
                span.style.overflowX = 'auto';
              }
              window.katex.render(part.value, span, {
                displayMode: part.type === 'display',
                throwOnError: false,
                trust: true,
                macros: {
                  "\\R": "\\mathbb{R}",
                  "\\N": "\\mathbb{N}",
                  "\\Z": "\\mathbb{Z}",
                  "\\C": "\\mathbb{C}",
                  "\\Q": "\\mathbb{Q}"
                }
              });
              el.appendChild(span);
            } catch (e) {
              // Fallback: show raw LaTeX
              const fallback = document.createElement('code');
              fallback.textContent = part.type === 'display' ? `$$${part.value}$$` : `$${part.value}$`;
              fallback.style.background = 'rgba(255,255,255,0.05)';
              fallback.style.padding = '2px 4px';
              fallback.style.borderRadius = '3px';
              fallback.style.fontSize = '0.9em';
              el.appendChild(fallback);
            }
          }
        }
      } catch (e) {
        // Fallback to plain text
        el.textContent = content;
      }
    };

    // Wait for KaTeX to load if not already loaded
    if (typeof window.katex === 'undefined') {
      const checkKatex = setInterval(() => {
        if (typeof window.katex !== 'undefined') {
          clearInterval(checkKatex);
          renderMath();
        }
      }, 100);
      // Timeout after 5 seconds
      setTimeout(() => clearInterval(checkKatex), 5000);
    } else {
      renderMath();
    }
  }, [content]);

  if (!content) return null;

  const Tag = as;
  return <Tag ref={containerRef} className={className} />;
}