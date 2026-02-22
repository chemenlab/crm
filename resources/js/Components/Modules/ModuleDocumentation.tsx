import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Card, CardContent } from '@/Components/ui/card';
import { MarkdownRenderer } from '@/Components/ui/markdown-renderer';
import { FileText, History, BookOpen } from 'lucide-react';

interface ModuleDocumentationProps {
    longDescription?: string;
    documentation?: string;
    changelog?: string;
    className?: string;
}

/**
 * Tabbed documentation component for module details page
 */
export function ModuleDocumentation({
    longDescription,
    documentation,
    changelog,
    className
}: ModuleDocumentationProps) {
    const hasDocumentation = documentation && documentation.trim().length > 0;
    const hasChangelog = changelog && changelog.trim().length > 0;
    const hasDescription = longDescription && longDescription.trim().length > 0;

    // If no content at all, don't render
    if (!hasDescription && !hasDocumentation && !hasChangelog) {
        return null;
    }

    // If only description, render simple card
    if (!hasDocumentation && !hasChangelog) {
        return (
            <Card className={className}>
                <CardContent className="pt-6">
                    <MarkdownRenderer content={longDescription || ''} />
                </CardContent>
            </Card>
        );
    }

    // Determine default tab
    const defaultTab = hasDescription ? 'description' : hasDocumentation ? 'docs' : 'changelog';

    return (
        <Card className={className}>
            <CardContent className="pt-6">
                <Tabs defaultValue={defaultTab}>
                    <TabsList className="mb-4">
                        {hasDescription && (
                            <TabsTrigger value="description" className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Описание
                            </TabsTrigger>
                        )}
                        {hasDocumentation && (
                            <TabsTrigger value="docs" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Документация
                            </TabsTrigger>
                        )}
                        {hasChangelog && (
                            <TabsTrigger value="changelog" className="flex items-center gap-2">
                                <History className="h-4 w-4" />
                                История изменений
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {hasDescription && (
                        <TabsContent value="description">
                            <MarkdownRenderer content={longDescription || ''} />
                        </TabsContent>
                    )}

                    {hasDocumentation && (
                        <TabsContent value="docs">
                            <MarkdownRenderer content={documentation || ''} />
                        </TabsContent>
                    )}

                    {hasChangelog && (
                        <TabsContent value="changelog">
                            <MarkdownRenderer content={changelog || ''} />
                        </TabsContent>
                    )}
                </Tabs>
            </CardContent>
        </Card>
    );
}

export default ModuleDocumentation;
