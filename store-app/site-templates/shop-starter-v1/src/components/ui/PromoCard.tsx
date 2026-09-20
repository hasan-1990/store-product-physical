import Image from 'next/image';
import Link from 'next/link';

type PromoCardProps = {
  tag: string;
  title: string;
  image: string;
  href: string;
};

export function PromoCard({ tag, title, image, href }: PromoCardProps) {
  return (
    <Link href={href} className="group relative block h-64 overflow-hidden rounded-xl">
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-110"
        sizes="288px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-6 right-6 left-6 text-right text-white">
        <p className="mb-1 text-xs font-bold tracking-widest opacity-80">{tag}</p>
        <h4 className="mb-2 font-display text-xl leading-tight">{title}</h4>
        <span className="border-b border-white pb-1 text-sm">مشاهده بیشتر</span>
      </div>
    </Link>
  );
}
