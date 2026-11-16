import { useState } from 'react';
import { Leaf } from 'lucide-react';

interface SaladImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export default function SaladImage({ src, alt, className = '' }: SaladImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F2F5F0] to-[#E4EBE1] text-[#1B6B3A] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Leaf className="w-8 h-8 mb-2 opacity-70" />
        <span className="text-xs font-medium text-[#526056] line-clamp-2 max-w-[180px]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
