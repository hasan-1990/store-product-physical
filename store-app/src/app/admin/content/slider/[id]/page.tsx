'use client';

import SliderForm from '@/components/SliderForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

const EditSlider = ({ params }: PageProps) => {
  return <SliderForm params={params} />;
};

export default EditSlider;
