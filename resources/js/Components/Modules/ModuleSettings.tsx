import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Loader2, Save, RotateCcw } from 'lucide-react';

/**
 * Setting field schema from module manifest
 */
export interface SettingFieldSchema {
  type: 'string' | 'number' | 'boolean' | 'textarea' | 'select';
  label: string;
  description?: string;
  default?: any;
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  options?: string[] | { value: string; label: string }[];
  placeholder?: string;
}

export interface ModuleSettingsSchema {
  [key: string]: SettingFieldSchema;
}

interface ModuleSettingsProps {
  moduleSlug: string;
  moduleName: string;
  schema: ModuleSettingsSchema;
  values: Record<string, any>;
  onSave?: (values: Record<string, any>) => Promise<void>;
  onReset?: () => Promise<void>;
}

/**
 * ModuleSettings component renders a dynamic form based on the module's settings schema.
 * Supports different field types: string, number, boolean, textarea, select.
 * 
 * Uses shadcn/ui components: Card, Input, Label, Switch, Textarea, Select, Button
 * 
 * Requirements: 6.3
 */
export function ModuleSettings({
  moduleSlug,
  moduleName,
  schema,
  values: initialValues,
  onSave,
  onReset,
}: ModuleSettingsProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if values have changed from initial
  const hasChanges = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  // Get field keys in order
  const fieldKeys = useMemo(() => Object.keys(schema || {}), [schema]);

  // Handle field value change
  const handleChange = useCallback((key: string, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }));
    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }, []);

  // Validate a single field
  const validateField = useCallback((_key: string, value: any, fieldSchema: SettingFieldSchema): string | null => {
    if (fieldSchema.required && (value === null || value === undefined || value === '')) {
      return 'Это поле обязательно';
    }

    if (fieldSchema.type === 'number' && value !== null && value !== undefined && value !== '') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return 'Введите число';
      }
      if (fieldSchema.min !== undefined && numValue < fieldSchema.min) {
        return `Минимальное значение: ${fieldSchema.min}`;
      }
      if (fieldSchema.max !== undefined && numValue > fieldSchema.max) {
        return `Максимальное значение: ${fieldSchema.max}`;
      }
    }

    if ((fieldSchema.type === 'string' || fieldSchema.type === 'textarea') && typeof value === 'string') {
      if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
        return `Минимальная длина: ${fieldSchema.minLength} символов`;
      }
      if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
        return `Максимальная длина: ${fieldSchema.maxLength} символов`;
      }
    }

    return null;
  }, []);

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const safeSchema = schema || {};
    
    for (const key of fieldKeys) {
      const fieldSchema = safeSchema[key];
      if (fieldSchema) {
        const error = validateField(key, values[key], fieldSchema);
        if (error) {
          newErrors[key] = error;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fieldKeys, schema, values, validateField]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateAll()) {
      toast.error('Исправьте ошибки в форме');
      return;
    }

    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(values);
      } else {
        // Default save via API
        await axios.post(`/api/modules/${moduleSlug}/settings`, { settings: values });
      }
      toast.success('Настройки сохранены');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Не удалось сохранить настройки';
      toast.error('Ошибка', { description: message });
      
      // Handle validation errors from server
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsSaving(false);
    }
  }, [moduleSlug, values, validateAll, onSave]);

  // Handle reset to defaults
  const handleReset = useCallback(async () => {
    setIsResetting(true);
    try {
      if (onReset) {
        await onReset();
      } else {
        // Default reset via API
        const response = await axios.post(`/api/modules/${moduleSlug}/settings/reset`);
        setValues(response.data.settings || {});
      }
      setErrors({});
      toast.success('Настройки сброшены');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Не удалось сбросить настройки';
      toast.error('Ошибка', { description: message });
    } finally {
      setIsResetting(false);
    }
  }, [moduleSlug, onReset]);

  // Render a single field based on its type
  const renderField = useCallback((key: string, fieldSchema: SettingFieldSchema) => {
    const value = values[key] ?? fieldSchema.default ?? '';
    const error = errors[key];
    const fieldId = `module-setting-${key}`;

    switch (fieldSchema.type) {
      case 'boolean':
        return (
          <div key={key} className="flex items-center justify-between py-3">
            <div className="space-y-0.5">
              <Label htmlFor={fieldId} className="text-base font-medium">
                {fieldSchema.label}
              </Label>
              {fieldSchema.description && (
                <p className="text-sm text-muted-foreground">{fieldSchema.description}</p>
              )}
            </div>
            <Switch
              id={fieldId}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleChange(key, checked)}
            />
          </div>
        );

      case 'select':
        return (
          <div key={key} className="space-y-2 py-3">
            <Label htmlFor={fieldId}>{fieldSchema.label}</Label>
            {fieldSchema.description && (
              <p className="text-sm text-muted-foreground">{fieldSchema.description}</p>
            )}
            <Select
              value={String(value)}
              onValueChange={(newValue) => handleChange(key, newValue)}
            >
              <SelectTrigger id={fieldId} className={error ? 'border-destructive' : ''}>
                <SelectValue placeholder={fieldSchema.placeholder || 'Выберите...'} />
              </SelectTrigger>
              <SelectContent>
                {fieldSchema.options?.map((option) => {
                  const optionValue = typeof option === 'string' ? option : option.value;
                  const optionLabel = typeof option === 'string' ? option : option.label;
                  return (
                    <SelectItem key={optionValue} value={optionValue}>
                      {optionLabel}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={key} className="space-y-2 py-3">
            <Label htmlFor={fieldId}>{fieldSchema.label}</Label>
            {fieldSchema.description && (
              <p className="text-sm text-muted-foreground">{fieldSchema.description}</p>
            )}
            <Textarea
              id={fieldId}
              value={String(value)}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={fieldSchema.placeholder}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={key} className="space-y-2 py-3">
            <Label htmlFor={fieldId}>{fieldSchema.label}</Label>
            {fieldSchema.description && (
              <p className="text-sm text-muted-foreground">{fieldSchema.description}</p>
            )}
            <Input
              id={fieldId}
              type="number"
              value={value}
              onChange={(e) => handleChange(key, e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={fieldSchema.placeholder}
              min={fieldSchema.min}
              max={fieldSchema.max}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'string':
      default:
        return (
          <div key={key} className="space-y-2 py-3">
            <Label htmlFor={fieldId}>{fieldSchema.label}</Label>
            {fieldSchema.description && (
              <p className="text-sm text-muted-foreground">{fieldSchema.description}</p>
            )}
            <Input
              id={fieldId}
              type="text"
              value={String(value)}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={fieldSchema.placeholder}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );
    }
  }, [values, errors, handleChange]);

  // If no schema, show empty state
  if (fieldKeys.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Настройки модуля</CardTitle>
          <CardDescription>
            У модуля «{moduleName}» нет настраиваемых параметров
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройки модуля</CardTitle>
        <CardDescription>
          Настройте параметры модуля «{moduleName}»
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {fieldKeys.map((key) => {
            const fieldSchema = (schema || {})[key];
            return fieldSchema ? renderField(key, fieldSchema) : null;
          })}
        </div>

        <div className="flex items-center justify-between pt-6 mt-6 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isResetting || isSaving}
          >
            {isResetting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Сбросить
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Сохранить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ModuleSettings;
