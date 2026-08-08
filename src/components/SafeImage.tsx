import type { ImgHTMLAttributes } from 'react';

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc: string;
}

export default function SafeImage({ fallbackSrc, onError, ...props }: SafeImageProps) {
  return (
    <img
      {...props}
      onError={(event) => {
        onError?.(event);
        const image = event.currentTarget;
        if (image.src !== fallbackSrc) image.src = fallbackSrc;
      }}
    />
  );
}
