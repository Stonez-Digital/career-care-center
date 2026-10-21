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
        // A relative fallback URL is resolved to an absolute URL by the browser.
        // Track the fallback attempt so a failed fallback cannot loop forever.
        if (image.dataset.fallbackApplied !== 'true') {
          image.dataset.fallbackApplied = 'true';
          image.src = fallbackSrc;
        }
      }}
    />
  );
}
