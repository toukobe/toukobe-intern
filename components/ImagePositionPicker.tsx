'use client';
import { useRef, useCallback } from 'react';

interface Props {
  src: string;
  position: string; // e.g. "50% 30%"
  onChange: (pos: string) => void;
  height?: number;
  aspectRatio?: string; // 指定すると高さ固定ではなくこの比率（例 "16 / 6"）で表示
}

export default function ImagePositionPicker({ src, position, onChange, height = 200, aspectRatio }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const calc = useCallback((clientX: number, clientY: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)));
    onChange(`${x}% ${y}%`);
  }, [onChange]);

  const parts = position.split(' ');
  const px = parts[0] || '50%';
  const py = parts[1] || '50%';

  return (
    <div
      ref={ref}
      style={{ position: 'relative', width: '100%', ...(aspectRatio ? { aspectRatio } : { height }), borderRadius: 12, overflow: 'hidden', cursor: 'crosshair', userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
      onMouseDown={e => { dragging.current = true; calc(e.clientX, e.clientY); }}
      onMouseMove={e => { if (dragging.current) calc(e.clientX, e.clientY); }}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onTouchStart={e => { dragging.current = true; calc(e.touches[0].clientX, e.touches[0].clientY); }}
      onTouchMove={e => { e.preventDefault(); if (dragging.current) calc(e.touches[0].clientX, e.touches[0].clientY); }}
      onTouchEnd={() => { dragging.current = false; }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, pointerEvents: 'none', display: 'block' }}
      />
      {/* focal point indicator */}
      <div style={{ position: 'absolute', left: px, top: py, transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid #fff', background: 'rgba(242,98,12,0.75)', boxShadow: '0 0 0 2px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.3)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 11, letterSpacing: '.02em' }}>
          ドラッグして表示位置を調整
        </div>
      </div>
    </div>
  );
}
