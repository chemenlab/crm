"use client"

import * as React from "react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/Components/ui/button"
import { Calendar } from "@/Components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select"

interface DateTimePickerProps {
  value?: Date | string
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: Date
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Выберите дату и время",
  disabled = false,
  className,
  minDate,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  // Parse value to Date
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    // Handle datetime-local format: "2026-01-15T09:00"
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? undefined : parsed
  }, [value])

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(dateValue)
  const [selectedHour, setSelectedHour] = React.useState<string>(
    dateValue ? dateValue.getHours().toString().padStart(2, '0') : "09"
  )
  const [selectedMinute, setSelectedMinute] = React.useState<string>(
    dateValue ? dateValue.getMinutes().toString().padStart(2, '0') : "00"
  )

  // Sync with external value
  React.useEffect(() => {
    if (dateValue) {
      setSelectedDate(dateValue)
      setSelectedHour(dateValue.getHours().toString().padStart(2, '0'))
      setSelectedMinute(dateValue.getMinutes().toString().padStart(2, '0'))
    }
  }, [dateValue])

  // Generate hours (00-23)
  const hours = React.useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  }, [])

  // Generate minutes (00-59)
  const minutes = React.useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
  }, [])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const newDate = new Date(date)
      newDate.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0)
      onChange?.(newDate)
    }
  }

  const handleTimeChange = (hour: string, minute: string) => {
    setSelectedHour(hour)
    setSelectedMinute(minute)
    if (selectedDate) {
      const newDate = new Date(selectedDate)
      newDate.setHours(parseInt(hour), parseInt(minute), 0, 0)
      onChange?.(newDate)
    }
  }

  const displayValue = React.useMemo(() => {
    if (!selectedDate) return placeholder
    const date = new Date(selectedDate)
    date.setHours(parseInt(selectedHour), parseInt(selectedMinute))
    return format(date, "d MMMM yyyy, HH:mm", { locale: ru })
  }, [selectedDate, selectedHour, selectedMinute, placeholder])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col sm:flex-row">
          {/* Calendar */}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => minDate ? date < minDate : date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            locale={ru}
          />
          
          {/* Time Picker */}
          <div className="border-t sm:border-t-0 sm:border-l p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              <span>Время</span>
            </div>
            
            <div className="flex gap-2">
              {/* Hours */}
              <Select value={selectedHour} onValueChange={(h) => handleTimeChange(h, selectedMinute)}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder="Час" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="flex items-center text-lg">:</span>
              
              {/* Minutes */}
              <Select value={selectedMinute} onValueChange={(m) => handleTimeChange(selectedHour, m)}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder="Мин" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {minutes.map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick time buttons */}
            <div className="grid grid-cols-3 gap-1">
              {['09:00', '10:00', '11:00', '12:00', '14:00', '16:00'].map((time) => {
                const [h, m] = time.split(':')
                const isSelected = selectedHour === h && selectedMinute === m
                return (
                  <Button
                    key={time}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleTimeChange(h, m)}
                  >
                    {time}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
        
        {/* Confirm button */}
        <div className="border-t p-3">
          <Button 
            className="w-full" 
            onClick={() => setOpen(false)}
            disabled={!selectedDate}
          >
            Подтвердить
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
