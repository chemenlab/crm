import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Sparkles, X } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  onStartTour: () => void;
  userName?: string;
}

export default function WelcomeModal({
  open,
  onClose,
  onStartTour,
  userName,
}: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl">
                Добро пожаловать{userName ? `, ${userName}` : ''}! 👋
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-base pt-4">
            Рады видеть вас в <strong>MasterPlan</strong> — системе для управления записями и клиентами.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-900">
              Что вы можете делать:
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Управлять записями в удобном календаре</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Вести базу клиентов с историей</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Принимать онлайн-записи через публичную страницу</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Отслеживать финансы и аналитику</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Настраивать уведомления для клиентов</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Совет:</strong> Пройдите быстрый тур по системе, чтобы узнать, где что находится. Это займет всего 2 минуты!
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Пропустить
          </Button>
          <Button
            onClick={() => {
              onClose();
              onStartTour();
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Начать тур
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
