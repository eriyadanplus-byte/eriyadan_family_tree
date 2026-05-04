'use client';

import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  const sheetRef  = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const isDragging = useRef(false);

  // Trap body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Drag-to-dismiss
  const onTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    isDragging.current = true;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) sheetRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;
    const dy = e.changedTouches[0].clientY - startYRef.current;
    if (dy > 80) {
      onClose();
    } else {
      sheetRef.current.style.transform = '';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl overflow-hidden"
        style={{
          background: 'rgba(13,31,13,0.97)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderBottom: 'none',
          maxHeight: '85vh',
          transform: 'translateY(0)',
          transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
          willChange: 'transform',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
          <div className="h-1.5 w-10 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
          aria-label="Close"
        >
          <X size={16} style={{ color: 'rgba(232,245,233,0.55)' }} />
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto overscroll-contain scrollbar-thin"
          style={{ maxHeight: 'calc(85vh - 40px)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {children}
        </div>
      </div>
    </>
  );
}
