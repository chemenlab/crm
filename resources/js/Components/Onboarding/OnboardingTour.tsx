import { useEffect, useState } from 'react';
import { driver, DriveStep, Config } from 'driver.js';
import 'driver.js/dist/driver.css';
import { router } from '@inertiajs/react';
import axios from 'axios';

interface OnboardingTourProps {
  autoStart?: boolean;
  onComplete?: () => void;
}

const tourSteps: DriveStep[] = [
  {
    element: '#dashboard-link',
    popover: {
      title: 'Добро пожаловать в MasterPlan! 👋',
      description: 'Давайте познакомимся с основными возможностями системы. Это займет всего пару минут.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#services-link',
    popover: {
      title: 'Услуги',
      description: 'Здесь вы можете создавать и управлять своими услугами. Добавьте название, цену и длительность.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#clients-link',
    popover: {
      title: 'Клиенты',
      description: 'Ведите базу клиентов с контактами, историей записей и заметками. Все в одном месте.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#calendar-link',
    popover: {
      title: 'Календарь',
      description: 'Управляйте записями в удобном календаре. Создавайте, редактируйте и отслеживайте статусы.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#finance-link',
    popover: {
      title: 'Финансы',
      description: 'Отслеживайте доходы и расходы. Система автоматически учитывает платежи от записей.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#subscription-link',
    popover: {
      title: 'Подписка',
      description: 'Управляйте своей подпиской, просматривайте лимиты и историю платежей.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#settings-link',
    popover: {
      title: 'Настройки',
      description: 'Настройте профиль, расписание, уведомления и публичную страницу для онлайн-записи.',
      side: 'right',
      align: 'start',
    },
  },
  {
    popover: {
      title: 'Готово! 🎉',
      description: 'Теперь вы знаете основы. Начните с создания первой услуги и настройки расписания. Удачи!',
    },
  },
];

export default function OnboardingTour({ autoStart = false, onComplete }: OnboardingTourProps) {
  const [driverObj, setDriverObj] = useState<ReturnType<typeof driver> | null>(null);

  useEffect(() => {
    const driverConfig: Config = {
      showProgress: true,
      steps: tourSteps,
      nextBtnText: 'Далее →',
      prevBtnText: '← Назад',
      doneBtnText: 'Завершить',
      progressText: '{{current}} из {{total}}',
      onDestroyed: () => {
        // Отмечаем тур как завершенный
        axios.post('/app/onboarding/tour/complete').catch(console.error);
        onComplete?.();
      },
      onPopoverRender: (popover, { config, state }) => {
        const skipButton = document.createElement('button');
        skipButton.innerText = 'Пропустить';
        skipButton.className = 'driver-popover-skip-btn';
        skipButton.style.cssText = `
          background: transparent;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 14px;
          padding: 8px 12px;
          margin-right: auto;
        `;
        skipButton.onclick = () => {
          driverObj?.destroy();
        };

        const footer = popover.footerButtons;
        if (footer && state.activeIndex !== undefined && state.activeIndex < tourSteps.length - 1) {
          footer.insertBefore(skipButton, footer.firstChild);
        }
      },
    };

    const newDriver = driver(driverConfig);
    setDriverObj(newDriver);

    if (autoStart) {
      // Небольшая задержка для загрузки DOM
      setTimeout(() => {
        newDriver.drive();
      }, 500);
    }

    return () => {
      newDriver.destroy();
    };
  }, [autoStart, onComplete]);

  return null;
}
