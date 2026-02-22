import './bootstrap';
import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from '@/Components/ThemeProvider';
import { ModuleProvider } from '@/contexts/ModuleContext';
import { LeadsModuleHooks } from '@/modules/leads';

const appName = import.meta.env.VITE_APP_NAME || 'SoloClient';

// Создаем QueryClient для React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 минут
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx')
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider defaultTheme="system" storageKey="soloclient-theme">
                    <ModuleProvider autoFetch={true}>
                        <LeadsModuleHooks />
                        <App {...props} />
                    </ModuleProvider>
                </ThemeProvider>
            </QueryClientProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
