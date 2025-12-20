"use client";

import { useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Button } from "@/components/ui/button";

interface MeshInfo {
    name: string;
    type: string;
    geometry: string;
    materialName: string;
    visible: boolean;
    position: string;
}

interface ModelMeshData {
    modelUrl: string;
    meshes: MeshInfo[];
    nodes: string[];
}

// Component that loads and analyzes a single model
function ModelAnalyzer({ url, onData }: { url: string; onData: (data: ModelMeshData) => void }) {
    const { scene } = useGLTF(url);

    useEffect(() => {
        const meshes: MeshInfo[] = [];
        const nodes: string[] = [];

        scene.traverse((child) => {
            if (child.name) {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    meshes.push({
                        name: mesh.name,
                        type: mesh.type,
                        geometry: mesh.geometry?.type || "unknown",
                        materialName: Array.isArray(mesh.material)
                            ? mesh.material.map((m) => m.name).join(", ")
                            : (mesh.material as THREE.Material)?.name || "unnamed",
                        visible: mesh.visible,
                        position: `(${mesh.position.x.toFixed(3)}, ${mesh.position.y.toFixed(3)}, ${mesh.position.z.toFixed(3)})`,
                    });
                } else {
                    nodes.push(child.name);
                }
            }
        });

        onData({ modelUrl: url, meshes, nodes });
    }, [scene, url, onData]);

    return null;
}

// Available models to analyze
const MODEL_URLS = [
    "/models/part1.glb",
    "/models/part3.glb",
    "/models/part4.glb",
    "/models/part5.glb",
    "/models/part6.glb",
    "/models/part7.glb",
    "/models/enamel.glb",
    "/models/Pattern 1.glb",
    "/models/Cuban-Link.glb",
];

export function DebugMeshNames() {
    const [modelData, setModelData] = useState<ModelMeshData[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>(MODEL_URLS[0]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleModelData = (data: ModelMeshData) => {
        setModelData((prev) => {
            const existing = prev.findIndex((d) => d.modelUrl === data.modelUrl);
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = data;
                return updated;
            }
            return [...prev, data];
        });
        setIsAnalyzing(false);
    };

    const currentData = modelData.find((d) => d.modelUrl === selectedModel);

    const copyToClipboard = () => {
        if (currentData) {
            const text = JSON.stringify(currentData, null, 2);
            navigator.clipboard.writeText(text);
            alert("Copied to clipboard!");
        }
    };

    const exportAllModels = () => {
        const text = JSON.stringify(modelData, null, 2);
        const blob = new Blob([text], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mesh-analysis.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-lg font-bold mb-4">🔍 Mesh Name Diagnostic Tool</h2>

            {/* Model Selector */}
            <div className="mb-4">
                <label className="text-sm text-gray-600 block mb-1">Select Model to Analyze:</label>
                <select
                    value={selectedModel}
                    onChange={(e) => {
                        setSelectedModel(e.target.value);
                        setIsAnalyzing(true);
                    }}
                    className="w-full p-2 border rounded"
                >
                    {MODEL_URLS.map((url) => (
                        <option key={url} value={url}>
                            {url.split("/").pop()}
                        </option>
                    ))}
                </select>
            </div>

            {/* Hidden Canvas for Loading */}
            <div className="w-1 h-1 overflow-hidden">
                <Canvas>
                    <ModelAnalyzer url={selectedModel} onData={handleModelData} />
                </Canvas>
            </div>

            {/* Results */}
            {isAnalyzing ? (
                <div className="text-center py-8 text-gray-500">Analyzing model...</div>
            ) : currentData ? (
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm">
                            <strong>Model:</strong> {currentData.modelUrl}
                        </p>
                        <p className="text-sm">
                            <strong>Meshes:</strong> {currentData.meshes.length} |{" "}
                            <strong>Nodes:</strong> {currentData.nodes.length}
                        </p>
                    </div>

                    {/* Mesh List */}
                    <div>
                        <h3 className="font-medium mb-2">Meshes ({currentData.meshes.length})</h3>
                        <div className="max-h-64 overflow-y-auto border rounded">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="p-2 text-left">#</th>
                                        <th className="p-2 text-left">Name</th>
                                        <th className="p-2 text-left">Geometry</th>
                                        <th className="p-2 text-left">Material</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentData.meshes.map((mesh, i) => (
                                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                            <td className="p-2">{i + 1}</td>
                                            <td className="p-2 font-mono text-blue-600">{mesh.name}</td>
                                            <td className="p-2">{mesh.geometry}</td>
                                            <td className="p-2">{mesh.materialName}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Nodes List */}
                    <div>
                        <h3 className="font-medium mb-2">Nodes ({currentData.nodes.length})</h3>
                        <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                            <div className="flex flex-wrap gap-1">
                                {currentData.nodes.map((node, i) => (
                                    <span key={i} className="px-2 py-1 bg-white border rounded text-xs font-mono">
                                        {node}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyToClipboard}>
                            Copy JSON
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportAllModels}>
                            Export All Models
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">Select a model to analyze</div>
            )}
        </div>
    );
}
