import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/Components/ui/alert-dialog';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    itemName?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'destructive' | 'default';
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title = 'Подтверждение удаления',
    description,
    itemName,
    confirmText = 'Да, удалить',
    cancelText = 'Отмена',
    variant = 'destructive',
}: ConfirmDialogProps) {
    const defaultDescription = itemName
        ? `Вы точно хотите удалить "${itemName}"?`
        : 'Вы точно хотите удалить этот элемент?';

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description || defaultDescription}
                        {' '}Это действие нельзя будет отменить.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
