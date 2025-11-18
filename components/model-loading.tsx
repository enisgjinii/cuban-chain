"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface ModelLoadingProps {
  className?: string;
  text?: string;
  overlay?: boolean;
}

export function ModelLoading({
  className = "",
  text = "Loading 3D Model...",
  overlay = false,
}: ModelLoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="space-y-3 w-full max-w-sm">
        <Skeleton className="h-2 w-full" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Preparing your custom chain...</span>
          <span>{text}</span>
        </div>
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm z-10 ${className}`}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center h-full bg-background ${className}`}
    >
      {content}
    </div>
  );
}
