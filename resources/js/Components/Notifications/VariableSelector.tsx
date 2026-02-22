import React from 'react';
import { Button } from '@/Components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/Components/ui/popover';
import { Code } from 'lucide-react';

interface Variable {
  name: string;
  description: string;
}

interface Props {
  onSelect: (variable: string) => void;
}

const variables: Variable[] = [
  { name: '{{client_name}}', description: 'Имя клиента' },
  { name: '{{client_phone}}', description: 'Телефон клиента' },
  { name: '{{master_name}}', description: 'Имя мастера' },
  { name: '{{master_phone}}', description: 'Телефон мастера' },
  { name: '{{service_name}}', description: 'Название услуги' },
  { name: '{{appointment_date}}', description: 'Дата записи (дд.мм.гггг)' },
  { name: '{{appointment_time}}', description: 'Время записи (чч:мм)' },
  { name: '{{appointment_datetime}}', description: 'Дата и время записи' },
  { name: '{{price}}', description: 'Стоимость услуги' },
  { name: '{{duration}}', description: 'Длительность (минуты)' },
  { name: '{{address}}', description: 'Адрес мастера' },
  { name: '{{city}}', description: 'Город' },
];

export default function VariableSelector({ onSelect }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <Code className="w-4 h-4 mr-2" />
          Вставить переменную
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Доступные переменные</h4>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {variables.map((variable) => (
              <button
                key={variable.name}
                type="button"
                onClick={() => onSelect(variable.name)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="font-mono text-xs text-blue-600">{variable.name}</div>
                <div className="text-gray-600 text-xs mt-0.5">{variable.description}</div>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
