'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { resizeImage } from '@/lib/image';

const HARD_LIMIT = 220 * 1024; // server rejects above this

interface AvatarUploadProps {
  memberId: string;
  currentVersion: number;
  currentUrl: string | null;
  onUploaded?: (newVersion: number) => void;
}

export default function AvatarUpload({ memberId, currentVersion, currentUrl, onUploaded }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ? `${currentUrl}?v=${currentVersion}` : null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    try {
      setUploading(true);
      const compressed = await resizeImage(file);

      // Show preview immediately
      const previewUrl = URL.createObjectURL(compressed);
      setPreview(previewUrl);

      // Upload
      const formData = new FormData();
      formData.append('avatar', compressed, `${memberId}.jpg`);

      const res = await fetch(`/api/members/${memberId}/avatar`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      if (onUploaded) onUploaded(data.avatarVersion || currentVersion + 1);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      // Revert preview
      setPreview(currentUrl ? `${currentUrl}?v=${currentVersion}` : null);
    } finally {
      setUploading(false);
    }
  }, [memberId, currentVersion, currentUrl, onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-white/5 cursor-pointer group"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {preview ? (
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            <Camera className="w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Upload className="w-6 h-6 text-white" />
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-xs text-white/50 hover:text-white/80 transition-colors"
        disabled={uploading}
      >
        {uploading ? 'Compressing & uploading…' : 'Change photo'}
      </button>

      {error && (
        <div className="text-xs text-red-400 flex items-center gap-1">
          <X className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
}
