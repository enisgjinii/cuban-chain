import React from 'react';
import { Drawer } from 'vaul';
import { ChevronUp, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileCustomizerDrawerProps {
    children: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function MobileCustomizerDrawer({
    children,
    isOpen,
    onOpenChange
}: MobileCustomizerDrawerProps) {
    return (
        <Drawer.Root shouldScaleBackground>
            <Drawer.Trigger asChild>
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 flex flex-col items-center gap-2 pb-8 cursor-pointer shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
                    <GripHorizontal className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    <span className="text-sm font-medium text-gray-500">Tap or Drag to Customize & Price</span>
                </div>
            </Drawer.Trigger>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Drawer.Content className="bg-white dark:bg-gray-900 flex flex-col rounded-t-[10px] h-[85vh] fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-800">
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-t-[10px] flex-1 overflow-auto">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700 mb-6" />
                        <div className="max-w-md mx-auto h-full pb-20">
                            {children}
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
