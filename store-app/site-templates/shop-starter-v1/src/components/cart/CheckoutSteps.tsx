type CheckoutStepsProps = {
  currentStep?: 1 | 2 | 3;
};

const steps = [
  { id: 1, label: 'سبد خرید' },
  { id: 2, label: 'اطلاعات ارسال' },
  { id: 3, label: 'پرداخت' },
] as const;

export function CheckoutSteps({ currentStep = 1 }: CheckoutStepsProps) {
  return (
    <div className="mb-8 flex items-center justify-center gap-4">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isPast = step.id < currentStep;

        return (
          <div key={step.id} className="flex items-center gap-4">
            <div className={`flex flex-col items-center gap-2 ${isActive || isPast ? '' : 'opacity-40'}`}>
              <div
                className={
                  isActive || isPast
                    ? 'flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-white'
                    : 'flex h-8 w-8 items-center justify-center rounded-full border border-outline font-bold'
                }
              >
                {step.id.toLocaleString('fa-IR')}
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-primary' : ''}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="h-0.5 max-w-[60px] flex-grow bg-outline" />
            )}
          </div>
        );
      })}
    </div>
  );
}
