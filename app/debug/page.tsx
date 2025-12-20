"use client";

import { DebugMeshNames } from "@/components/debug-mesh-names";

export default function DebugPage() {
    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto">
                <h1 className="text-2xl font-bold text-center mb-6">
                    🛠️ Mesh Diagnostic Tool
                </h1>
                <p className="text-center text-gray-600 mb-8">
                    Use this tool to discover mesh names in your GLB models for 4-zone mapping.
                </p>
                <DebugMeshNames />
            </div>
        </div>
    );
}
