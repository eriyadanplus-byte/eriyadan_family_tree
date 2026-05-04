/**
 * Returns the avatar image URL with cache-busting.
 * Uses the Supabase public URL if available, otherwise falls back to local /avatars/.
 */
export function getAvatarUrl(
  profilePhotoUrl: string | null | undefined,
  id: string,
  avatarVersion: number = 0
): string {
  if (profilePhotoUrl) {
    const sep = profilePhotoUrl.includes('?') ? '&' : '?';
    return `${profilePhotoUrl}${sep}v=${avatarVersion}`;
  }
  return `/avatars/${id}.jpg?v=${avatarVersion}`;
}
