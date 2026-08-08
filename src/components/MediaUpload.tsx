import { useState } from 'react';
import { Upload } from 'lucide-react';
import Spinner from '@/components/Spinner';
import { uploadPublicMedia } from '@/lib/media';

interface MediaUploadProps {
  bucket: 'profile-images' | 'resource-media';
  folder: string;
  accept: string;
  allowedTypes: string[];
  maxBytes: number;
  label: string;
  disabled?: boolean;
  onUploaded: (url: string) => void;
  onError: (message: string) => void;
}

export default function MediaUpload(props: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    props.onError('');
    try {
      const result = await uploadPublicMedia({ ...props, file });
      props.onUploaded(result.publicUrl);
    } catch (error) {
      props.onError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className={`btn-outline text-sm ${props.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      {uploading ? <Spinner /> : <Upload className="h-4 w-4" />}
      {uploading ? 'Uploading…' : props.label}
      <input
        type="file"
        className="sr-only"
        accept={props.accept}
        disabled={uploading || props.disabled}
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </label>
  );
}
