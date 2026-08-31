import { supabase } from '@/lib/supabase';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const RESOURCE_TYPES = [...IMAGE_TYPES, 'application/pdf', 'video/mp4', 'video/webm'];
export const GALLERY_VIDEO_TYPES = ['video/mp4', 'video/webm'];
export const GALLERY_MEDIA_TYPES = [...IMAGE_TYPES, ...GALLERY_VIDEO_TYPES];

export async function uploadPublicMedia(options: {
  bucket: 'profile-images' | 'resource-media';
  folder: string;
  file: File;
  allowedTypes: string[];
  maxBytes: number;
}) {
  const { bucket, folder, file, allowedTypes, maxBytes } = options;
  if (!allowedTypes.includes(file.type)) throw new Error('Unsupported file type. Choose a permitted image, PDF, MP4, or WebM file.');
  if (file.size > maxBytes) throw new Error(`File is too large. Maximum size is ${Math.round(maxBytes / 1024 / 1024)} MB.`);

  const path = bucket === 'profile-images'
    ? `${folder}/avatar`
    : `${folder}/${crypto.randomUUID()}.${file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: bucket === 'profile-images',
  });
  if (error) throw new Error(error.message || 'Upload failed. Please check your connection and try again.');

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export function storagePathFromPublicUrl(url: string, bucket: string) {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}
