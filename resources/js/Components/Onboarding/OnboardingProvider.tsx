import { useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import OnboardingTour from './OnboardingTour';
import ProgressBar from './ProgressBar';
import WelcomeModal from './WelcomeModal';

interface OnboardingProviderProps {
  children: ReactNode;
  userName?: string;
}

export default function OnboardingProvider({ children, userName }: OnboardingProviderProps) {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [startTour, setStartTour] = useState(false);
  const [onboardingProgress, setOnboardingProgress] = useState<any>(null);

  // Загрузка прогресса онбординга
  useEffect(() => {
    axios.get('/app/onboarding/progress')
      .then(response => {
        setOnboardingProgress(response.data.progress);
        
        // Показываем приветственную модалку только для новых пользователей
        if (!response.data.progress.is_completed && response.data.progress.completed_steps.length === 0) {
          setShowWelcomeModal(true);
        }
      })
      .catch(console.error);
  }, []);

  const handleStartTour = () => {
    setShowWelcomeModal(false);
    setStartTour(true);
  };

  const handleTourComplete = () => {
    setStartTour(false);
    // Перезагружаем прогресс
    axios.get('/app/onboarding/progress')
      .then(response => {
        setOnboardingProgress(response.data.progress);
      })
      .catch(console.error);
  };

  const handleProgressDismiss = () => {
    // Сохраняем состояние "скрыто" в localStorage
    localStorage.setItem('onboarding_progress_dismissed', 'true');
  };

  const handleProgressRestart = () => {
    setStartTour(true);
  };

  return (
    <>
      {/* Приветственная модалка */}
      <WelcomeModal
        open={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        onStartTour={handleStartTour}
        userName={userName}
      />

      {/* Интерактивный тур */}
      {startTour && (
        <OnboardingTour
          autoStart={true}
          onComplete={handleTourComplete}
        />
      )}

      {/* Прогресс-бар онбординга */}
      {onboardingProgress && !onboardingProgress.is_completed && !localStorage.getItem('onboarding_progress_dismissed') && (
        <ProgressBar
          percentage={onboardingProgress.completed_steps?.length ? (onboardingProgress.completed_steps.length / 7) * 100 : 0}
          completedSteps={onboardingProgress.completed_steps || []}
          totalSteps={7}
          isCompleted={onboardingProgress.is_completed}
          onDismiss={handleProgressDismiss}
          onRestart={handleProgressRestart}
        />
      )}

      {/* Основной контент */}
      {children}
    </>
  );
}
