"use client";

import { useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DebugNodeVisibilityProps {
  root: THREE.Object3D | null;
}

interface NodeEntry {
  id: number;
  name: string;
  object: THREE.Object3D;
  visible: boolean;
  isMesh: boolean;
}

// Debug panel to list all nodes / meshes and toggle visibility.
// This is purely for development / inspection purposes.
export function DebugNodeVisibility({ root }: DebugNodeVisibilityProps) {
  const [nodes, setNodes] = useState<NodeEntry[]>([]);
  const [expanded, setExpanded] = useState<boolean>(true);

  // Collect nodes once root is available.
  useEffect(() => {
    if (!root) return;
    const collected: NodeEntry[] = [];
    let unnamedCounter = 0;

    root.traverse((child: THREE.Object3D) => {
      // Skip helper objects that often clutter (optional filtering)
      if (child.type === "Scene") return;
      const name = child.name && child.name.trim().length > 0 ? child.name : `Unnamed-${++unnamedCounter}`;
      collected.push({
        id: collected.length,
        name,
        object: child,
        visible: child.visible,
        isMesh: (child as THREE.Mesh).isMesh === true,
      });
    });
    setNodes(collected);
  }, [root]);

  const toggleVisibility = useCallback(
    (entry: NodeEntry) => {
      entry.object.visible = !entry.object.visible;
      setNodes((prev) =>
        prev.map((n) => (n.id === entry.id ? { ...n, visible: entry.object.visible } : n)),
      );
    },
    [],
  );

  if (!root) return null;

  return (
    <div className="pointer-events-auto absolute top-2 right-2 z-50 w-72 select-none rounded-md bg-black/70 p-2 text-xs text-white shadow-lg backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold">Scene Nodes ({nodes.length})</span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Hide" : "Show"}
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
          {nodes.map((n) => (
            <div
              key={n.id}
              className="flex items-center justify-between rounded bg-white/5 px-2 py-1"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="inline-block rounded bg-white/10 px-1 py-0.5 text-[10px] uppercase tracking-wide">
                  {n.isMesh ? "Mesh" : n.object.type}
                </span>
                <span className="truncate" title={n.name}>
                  {n.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleVisibility(n)}
                className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-white/10"
                title={n.visible ? "Hide" : "Show"}
              >
                {n.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 opacity-60" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
