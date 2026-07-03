'use client';

import { CSSProperties, ReactNode, useEffect, useRef } from 'react';

interface RevealProps {
  children: ReactNode;
  /** 表示開始の遅延(ms)。カードの段差アニメーションに使う */
  delay?: number;
  style?: CSSProperties;
  className?: string;
}

// スクロールで画面内に入ったら .is-visible を付けてふわっと表示する
export default function Reveal({ children, delay = 0, style, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          el.classList.add('is-visible');
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -36px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className ? `reveal ${className}` : 'reveal'}
      style={delay ? { transitionDelay: `${delay}ms`, ...style } : style}
    >
      {children}
    </div>
  );
}
