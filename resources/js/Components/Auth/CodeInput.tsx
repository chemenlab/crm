import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { Input } from '@/Components/ui/input';

interface CodeInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
}

export default function CodeInput({ value, onChange, error }: CodeInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const digits = value.split('').concat(Array(6 - value.length).fill(''));

    useEffect(() => {
        // Auto-focus first input on mount
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (index: number, digit: string) => {
        // Only allow digits
        if (digit && !/^\d$/.test(digit)) return;

        const newDigits = [...digits];
        newDigits[index] = digit;
        const newValue = newDigits.join('').replace(/\s/g, '');
        onChange(newValue);

        // Auto-focus next input
        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!digits[index] && index > 0) {
                // If current input is empty, focus previous and delete its value
                const newDigits = [...digits];
                newDigits[index - 1] = '';
                onChange(newDigits.join('').replace(/\s/g, ''));
                inputRefs.current[index - 1]?.focus();
            } else if (digits[index]) {
                // Delete current digit
                const newDigits = [...digits];
                newDigits[index] = '';
                onChange(newDigits.join('').replace(/\s/g, ''));
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(pastedData);

        // Focus the next empty input or last input
        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    return (
        <div className="flex justify-center gap-2">
            {digits.map((digit, index) => (
                <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit || ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`w-12 h-14 text-center text-2xl font-semibold ${
                        error ? 'border-destructive' : ''
                    }`}
                />
            ))}
        </div>
    );
}
