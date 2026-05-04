const MAX_DIM = 1024;
const MAX_BYTES = 200 * 1024; // 200 KB

export function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.85;
      const tryExport = (): Blob | null => {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Len = dataUrl.length - dataUrl.indexOf(',') - 1;
        const estimatedBytes = Math.round(base64Len * 3 / 4);
        if (estimatedBytes <= MAX_BYTES) {
          const byteString = atob(dataUrl.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          return new Blob([ab], { type: 'image/jpeg' });
        }
        return null;
      };

      let blob: Blob | null = null;
      while (quality > 0.1 && !blob) {
        blob = tryExport();
        quality -= 0.1;
      }
      if (!blob) {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.1);
        const byteString = atob(dataUrl.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        blob = new Blob([ab], { type: 'image/jpeg' });
      }
      resolve(blob);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadAvatar(memberId: string, file: File): Promise<number> {
  const compressed = await resizeImage(file);
  const formData = new FormData();
  formData.append('avatar', compressed, `${memberId}.jpg`);
  const res = await fetch(`/api/members/${memberId}/avatar`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || 'Avatar upload failed');
  }
  const data = await res.json();
  return data.avatarVersion || 1;
}
