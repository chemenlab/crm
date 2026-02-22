
import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Package } from 'lucide-react';

interface DynamicIconProps extends Omit<React.ComponentProps<typeof Package>, 'name'> {
    name?: string | null;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
    if (!name) {
        return <Package {...props} />;
    }

    // Check if URL
    if (name.startsWith('http') || name.startsWith('/')) {
        return <img src={name} alt="Icon" className={props.className} />;
    }

    // Convert kebab-case to PascalCase (e.g. clipboard-list -> ClipboardList)
    // Also capitalize first letter if it's already camelCase but lowercase start
    const pascalName = name
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    // Try to find icon in Lucide exports
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Icon = (LucideIcons as any)[pascalName] || (LucideIcons as any)[name];

    if (Icon) {
        return <Icon {...props} />;
    }

    // If simple text or emoji (short string), render as text
    // Assuming regular icon names are longer or specific format
    // But let's just render it as text if not found as icon, 
    // wrapped in span if className is provided
    return (
        <span className={props.className} style={{ fontSize: 'inherit', lineHeight: '1' }}>
            {name}
        </span>
    );
}
