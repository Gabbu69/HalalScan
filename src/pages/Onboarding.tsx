import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/Button';
import { Scan, Cpu, BookOpen } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const SLIDES = [
  {
    title: 'Scan. Verify. Trust.',
    text: 'Instantly check if a product is Halal, Haram, or Mashbooh by scanning its barcode. (Configurable in settings for general dietary needs).',
    icon: <Scan size={120} className="text-[var(--color-primary)]" />
  },
  {
    title: 'AI-Powered Analysis',
    text: 'Our advanced AI engine cross-references ingredients with strict dietary laws and allergy lists.',
    icon: <Cpu size={120} className="text-[var(--color-primary)]" />
  },
  {
    title: 'Your Dietary Companion',
    text: 'Designed originally for the Muslim community in BARMM, now providing transparent ingredient analysis for everyone.',
    icon: <BookOpen size={120} className="text-[var(--color-primary)]" />
  }
];

export function Onboarding() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const setHasOnboarded = useAppStore(state => state.setHasOnboarded);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      setStep(step + 1);
    } else {
      setHasOnboarded(true);
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--color-light-bg)] dark:bg-[var(--color-dark-bg)] p-6 dark:text-gray-100 transition-colors">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {SLIDES[step].icon}
        <h1 className="font-amiri font-bold text-4xl text-[var(--color-primary)] dark:text-green-400 mt-8 mb-4">
          {t(`onboarding.s${step + 1}_title`) || SLIDES[step].title}
        </h1>
        <p className="font-nunito text-lg text-gray-600 dark:text-gray-400 px-4">
          {t(`onboarding.s${step + 1}_desc`) || SLIDES[step].text}
        </p>
      </div>
      
      <div className="w-full pb-8">
        <div className="flex flex-row justify-center mb-8">
          {SLIDES.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full mx-1 transition-all duration-300 ${i === step ? 'w-8 bg-[var(--color-primary)]' : 'w-2 bg-gray-300 dark:bg-gray-600'}`} 
            />
          ))}
        </div>
        <Button 
          title={step === SLIDES.length - 1 ? (t('onboarding.get_started') || "Get Started") : (t('onboarding.next') || "Next")} 
          onClick={handleNext}
          className="w-full"
        />
      </div>
    </div>
  );
}
