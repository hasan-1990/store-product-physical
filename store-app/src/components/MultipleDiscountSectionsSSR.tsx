// SSR-enabled wrapper with build-time fallback
import MultipleDiscountSectionsFallback from './MultipleDiscountSectionsFallback';

interface MultipleDiscountSectionsSSRProps {
  position?: string;
}

export default function MultipleDiscountSectionsSSR({ position = 'home-top' }: MultipleDiscountSectionsSSRProps) {
  return <MultipleDiscountSectionsFallback position={position} />;
}