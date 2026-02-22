import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent } from '@/Components/ui/dialog';
import { cn } from '@/lib/utils';

interface ScreenshotGalleryProps {
  screenshots: string[];
  moduleName: string;
}

/**
 * ScreenshotGallery displays module screenshots in a horizontal
 * scrollable gallery with lightbox preview.
 */
export function ScreenshotGallery({ screenshots, moduleName }: ScreenshotGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!screenshots || screenshots.length === 0) {
    return null;
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (selectedIndex === null) return;
    
    if (direction === 'prev') {
      setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : screenshots.length - 1);
    } else {
      setSelectedIndex(selectedIndex < screenshots.length - 1 ? selectedIndex + 1 : 0);
    }
  };

  return (
    <>
      <div className="relative group">
        {/* Scroll buttons */}
        {screenshots.length > 2 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Screenshots container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {screenshots.map((screenshot, index) => (
            <div
              key={index}
              className="relative flex-shrink-0 snap-start cursor-pointer group/item"
              onClick={() => openLightbox(index)}
            >
              <img
                src={screenshot}
                alt={`${moduleName} - Скриншот ${index + 1}`}
                className="h-48 w-auto rounded-lg border object-cover hover:border-primary transition-colors"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/item:bg-black/20 transition-colors rounded-lg">
                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover/item:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>

        {/* Dots indicator */}
        {screenshots.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {screenshots.map((_, index) => (
              <button
                key={index}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === selectedIndex
                    ? 'w-4 bg-primary'
                    : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
                onClick={() => openLightbox(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <div className="relative">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 text-white hover:bg-white/20"
              onClick={closeLightbox}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Navigation buttons */}
            {screenshots.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={() => navigateLightbox('prev')}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={() => navigateLightbox('next')}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Image */}
            {selectedIndex !== null && (
              <img
                src={screenshots[selectedIndex]}
                alt={`${moduleName} - Скриншот ${selectedIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}

            {/* Counter */}
            {screenshots.length > 1 && selectedIndex !== null && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
                {selectedIndex + 1} / {screenshots.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ScreenshotGallery;
