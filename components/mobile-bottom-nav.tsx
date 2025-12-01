"use client";

import { useState } from "react";
import type { ChainConfig, SurfaceId } from "@/lib/chain-config-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  Download,
  Palette,
  RotateCw,
  Settings,
  Video,
  Bug,
  X,
  ChevronUp,
  Sparkles,
  Move3D,
} from "lucide-react";
import { CustomizerPanel } from "@/components/customizer-panel";

interface MobileBottomNavProps {
  chainConfig: ChainConfig;
  setChainConfig: (config: ChainConfig) => void;
  selectedSurface: SurfaceId;
  setSelectedSurface: (surface: SurfaceId) => void;
  onSaveConfiguration: () => void;
  onLoadConfiguration: () => void;
  meshes: string[];
  nodes: string[];
  onSelectMesh: (mesh: string | null) => void;
  onHoverMesh: (mesh: string | null) => void;
  selectedMesh: string | null;
  hoveredMesh: string | null;
  autoFitModel: boolean;
  setAutoFitModel: (fit: boolean) => void;
  chainSpacing: number;
  setChainSpacing: (spacing: number) => void;
  applyMode: boolean;
  setApplyMode: (mode: boolean) => void;
  undoCounter: number;
  setUndoCounter: (counter: number) => void;
  autoRotate: boolean;
  setAutoRotate: (rotate: boolean) => void;
  showBoundingBox: boolean;
  setShowBoundingBox: (show: boolean) => void;
  showDebug: boolean;
  setShowDebug: (show: boolean) => void;
  modelUrl: string;
  setModelUrl: (url: string) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  showRecordingIndicator: boolean;
  setShowRecordingIndicator: (show: boolean) => void;
  onUndo: () => void;
  autoZoom: boolean;
  setAutoZoom: (zoom: boolean) => void;
  onCaptureImage: () => void;
  onStartRecording: () => void;
}

export function MobileBottomNav({
  chainConfig,
  setChainConfig,
  selectedSurface,
  setSelectedSurface,
  onSaveConfiguration,
  onLoadConfiguration,
  meshes,
  nodes,
  onSelectMesh,
  onHoverMesh,
  chainSpacing,
  setChainSpacing,
  onUndo,
  autoRotate,
  setAutoRotate,
  showDebug,
  setShowDebug,
  autoZoom,
  setAutoZoom,
  onCaptureImage,
  onStartRecording,
  isRecording,
}: MobileBottomNavProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "rotate":
        setAutoRotate(!autoRotate);
        break;
      case "debug":
        setShowDebug(!showDebug);
        break;
      case "capture":
        onCaptureImage();
        break;
      case "record":
        onStartRecording();
        break;
      case "save":
        onSaveConfiguration();
        break;
      case "load":
        onLoadConfiguration();
        break;
    }
  };

  return (
    <>
      {/* Main Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around py-1">
          {/* Customize Tab */}
          <button
            onClick={() =>
              setActivePanel(activePanel === "customize" ? null : "customize")
            }
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
              activePanel === "customize"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Palette className="w-5 h-5" />
            <span className="text-xs font-medium">Customize</span>
          </button>

          {/* Actions Tab */}
          <button
            onClick={() =>
              setActivePanel(activePanel === "actions" ? null : "actions")
            }
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
              activePanel === "actions"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-medium">Actions</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() =>
              setActivePanel(activePanel === "settings" ? null : "settings")
            }
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
              activePanel === "settings"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Sliding Panels */}
      {activePanel && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/20 z-30"
            onClick={() => setActivePanel(null)}
          />

          {/* Panel */}
          <div
            className={`lg:hidden fixed bottom-16 left-0 right-0 z-35 bg-white rounded-t-2xl shadow-xl transition-transform duration-300 ${
              activePanel ? "translate-y-0" : "translate-y-full"
            }`}
          >
            {/* Drag Handle */}
            <div className="flex justify-center py-2">
              <div className="w-8 h-0.5 bg-gray-300 rounded-full" />
            </div>

            {/* Customize Panel */}
            {activePanel === "customize" && (
              <div className="max-h-[60vh] flex flex-col">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100">
                  <h2 className="text-xs font-semibold text-gray-900">
                    Customize
                  </h2>
                  <button
                    onClick={() => setActivePanel(null)}
                    className="p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <CustomizerPanel
                    chainConfig={chainConfig}
                    setChainConfig={setChainConfig}
                    selectedSurface={selectedSurface}
                    setSelectedSurface={setSelectedSurface}
                    onSaveConfiguration={onSaveConfiguration}
                    onLoadConfiguration={onLoadConfiguration}
                    meshes={meshes}
                    nodes={nodes}
                    onSelectMesh={onSelectMesh}
                    onHoverMesh={onHoverMesh}
                    chainSpacing={chainSpacing}
                    setChainSpacing={setChainSpacing}
                    onUndo={onUndo}
                    autoRotate={autoRotate}
                    setAutoRotate={setAutoRotate}
                    showDebug={showDebug}
                    setShowDebug={setShowDebug}
                    onCaptureImage={onCaptureImage}
                    onStartRecording={onStartRecording}
                    isRecording={isRecording}
                    isInSheet={false}
                  />
                </div>
              </div>
            )}

            {/* Actions Panel */}
            {activePanel === "actions" && (
              <div className="max-h-[60vh] flex flex-col">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100">
                  <h2 className="text-xs font-semibold text-gray-900">
                    Actions
                  </h2>
                  <button
                    onClick={() => setActivePanel(null)}
                    className="p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
                <div className="flex-1 p-1.5 space-y-1.5">
                  {/* Media Controls */}
                  <div className="grid grid-cols-2 gap-1">
                    <Card className="p-1.5 border-gray-200 hover:border-gray-300 transition-colors">
                      <button
                        onClick={() => onCaptureImage?.()}
                        disabled={isRecording}
                        className="w-full flex flex-col items-center gap-1"
                      >
                        <div className="p-1 bg-blue-50 rounded-full">
                          <Camera className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          Photo
                        </span>
                      </button>
                    </Card>

                    <Card className="p-1.5 border-gray-200 hover:border-gray-300 transition-colors">
                      <button
                        onClick={() => onStartRecording?.()}
                        disabled={isRecording}
                        className="w-full flex flex-col items-center gap-1"
                      >
                        <div
                          className={`p-1 rounded-full ${isRecording ? "bg-red-50" : "bg-green-50"}`}
                        >
                          <Video
                            className={`w-4 h-4 ${isRecording ? "text-red-600" : "text-green-600"}`}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          {isRecording ? "Stop" : "Video"}
                        </span>
                      </button>
                    </Card>
                  </div>

                  {/* View Controls */}
                  <div className="grid grid-cols-2 gap-1">
                    <Card className="p-1.5 border-gray-200 hover:border-gray-300 transition-colors">
                      <button
                        onClick={() => setAutoRotate?.(!autoRotate)}
                        className="w-full flex flex-col items-center gap-1"
                      >
                        <div
                          className={`p-1 rounded-full ${autoRotate ? "bg-blue-50" : "bg-gray-50"}`}
                        >
                          <RotateCw
                            className={`w-4 h-4 ${autoRotate ? "text-blue-600" : "text-gray-600"}`}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          Rotate
                        </span>
                      </button>
                    </Card>

                    <Card className="p-1 border-gray-200 hover:border-gray-300 transition-colors">
                      <button
                        onClick={() => setShowDebug?.(!showDebug)}
                        className="w-full flex flex-col items-center gap-0.5"
                      >
                        <div
                          className={`p-1 rounded-full ${showDebug ? "bg-blue-50" : "bg-gray-50"}`}
                        >
                          <Bug
                            className={`w-4 h-4 ${showDebug ? "text-blue-600" : "text-gray-600"}`}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          Debug
                        </span>
                      </button>
                    </Card>
                  </div>

                  {/* Zoom Controls */}
                  <div className="grid grid-cols-2 gap-1">
                    <Card className="p-1.5 border-gray-200 hover:border-gray-300 transition-colors">
                      <button
                        onClick={() => setAutoZoom?.(!autoZoom)}
                        className="w-full flex flex-col items-center gap-1"
                      >
                        <div
                          className={`p-1 rounded-full ${autoZoom ? "bg-blue-50" : "bg-gray-50"}`}
                        >
                          <Move3D
                            className={`w-4 h-4 ${autoZoom ? "text-blue-600" : "text-gray-600"}`}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          Auto Zoom
                        </span>
                      </button>
                    </Card>

                    <Card className="p-1 border-gray-200 hover:border-gray-300 transition-colors">
                      <button
                        onClick={() => {
                          setAutoZoom?.(false);
                          // Reset to default scale
                          if (typeof window !== "undefined") {
                            const event = new CustomEvent("resetModelScale");
                            window.dispatchEvent(event);
                          }
                        }}
                        className="w-full flex flex-col items-center gap-1"
                      >
                        <div className="p-1 bg-gray-50 rounded-full">
                          <RotateCw className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          Reset Size
                        </span>
                      </button>
                    </Card>
                  </div>

                  {/* Recording Status */}
                  <div className="bg-gray-50 rounded-sm p-1.5">
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-1 h-1 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
                      />
                      <div>
                        <p className="text-xs font-medium text-gray-900">
                          {isRecording ? "Recording" : "Ready"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isRecording ? "Active" : "Standby"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Panel */}
            {activePanel === "settings" && (
              <div className="max-h-[60vh] flex flex-col">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100">
                  <h2 className="text-xs font-semibold text-gray-900">
                    Settings
                  </h2>
                  <button
                    onClick={() => setActivePanel(null)}
                    className="p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
                <div className="flex-1 p-2 space-y-1.5">
                  <Card className="p-1.5 border-gray-200">
                    <button
                      onClick={() => handleQuickAction("save")}
                      className="w-full flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3 text-gray-600" />
                        <p className="text-xs font-medium text-gray-900">
                          Save Config
                        </p>
                      </div>
                      <ChevronUp className="w-3 h-3 text-gray-400 rotate-90" />
                    </button>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
