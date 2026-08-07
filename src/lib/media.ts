import { supabase } from '@/lib/supabase';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const RESOURCE_TYPES = [...IMAGE_TYPES, 'application/pdf', 'video/mp4', 'video/webm'];

const safeName = (name: string) => {
  const extension = name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  return `${crypto.randomUUID()}.${extension}`;
};

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

  const path = `${folder}/${safeName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
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
