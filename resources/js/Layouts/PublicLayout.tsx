import { PropsWithChildren } from 'react';
import { Head } from '@inertiajs/react';
import { Toaster } from 'sonner';

interface Props {
    title?: string;
}

export default function PublicLayout({ title, children }: PropsWithChildren<Props>) {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
            <Head title={title} />
            <Toaster position="top-center" richColors />
            <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
                <div className="w-full max-w-md space-y-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
