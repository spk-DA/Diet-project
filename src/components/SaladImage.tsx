import { useState } from 'react';
import { Leaf } from 'lucide-react';
import heroImg from '../assets/images/hero_fresh_salad_1794716157514.jpg';
import quinoaImg from '../assets/images/salad_mediterranean_quinoa_1794716158637.jpg';
import ketoImg from '../assets/images/salad_keto_avocado_cobb_1794716158856.jpg';
import detoxImg from '../assets/images/salad_vegan_greens_detox_1794716160028.jpg';
import tofuImg from '../assets/images/salad_protein_tofu_crunch_1794716160536.jpg';

const BUNDLED_IMAGE_MAP: Record<string, string> = {
  '/src/assets/images/hero_fresh_salad_1794716157514.jpg': heroImg,
  '/src/assets/images/salad_mediterranean_quinoa_1794716158637.jpg': quinoaImg,
  '/src/assets/images/salad_keto_avocado_cobb_1794716158856.jpg': ketoImg,
  '/src/assets/images/salad_vegan_greens_detox_1794716160028.jpg': detoxImg,
  '/src/assets/images/salad_protein_tofu_crunch_1794716160536.jpg': tofuImg,
};

interface SaladImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export default function SaladImage({ src, alt, className = '' }: SaladImageProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = src ? BUNDLED_IMAGE_MAP[src] || src : undefined;

  if (!resolvedSrc || failed) {
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
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
