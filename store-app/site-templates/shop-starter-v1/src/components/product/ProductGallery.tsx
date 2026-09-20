'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type ProductGalleryProps = {
  images: string[];
  name: string;
};

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-4 md:flex-row-reverse">
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-lg bg-surface-container">
        <Image
          src={images[active]}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 58vw"
          priority
        />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(index)}
            className={cn(
              'relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-surface-container md:w-24',
              active === index ? 'border border-outline' : 'border border-transparent hover:border-outline/60',
            )}
          >
            <Image src={src} alt="" fill className="object-cover" sizes="96px" />
          </button>
        ))}
      </div>
    </div>
  );
}
