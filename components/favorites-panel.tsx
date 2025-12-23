"use client";

import { useState, useEffect } from "react";
import { Star, StarOff, Trash2, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ChainConfig } from "@/lib/chain-config-types";
import { toast } from "@/components/ui/toast";

interface FavoriteConfig {
    id: string;
    name: string;
    chainConfig: ChainConfig;
    modelUrls: string[];
    createdAt: number;
    thumbnail?: string;
}

interface FavoritesPanelProps {
    chainConfig: ChainConfig;
    modelUrls: string[];
    onLoadFavorite: (config: ChainConfig, urls: string[]) => void;
    className?: string;
}

const STORAGE_KEY = "cuban-chain-favorites";

export function FavoritesPanel({
    chainConfig,
    modelUrls,
    onLoadFavorite,
    className = "",
}: FavoritesPanelProps) {
    const [favorites, setFavorites] = useState<FavoriteConfig[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [newName, setNewName] = useState("");
    const [showSaveInput, setShowSaveInput] = useState(false);

    // Load favorites from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setFavorites(parsed);
            } catch {
                console.error("Failed to parse favorites");
            }
        }
    }, []);

    // Save favorites to localStorage
    const saveFavorites = (newFavorites: FavoriteConfig[]) => {
        setFavorites(newFavorites);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    };

    const handleSaveFavorite = () => {
        if (!newName.trim()) {
            toast.error("Please enter a name for this configuration");
            return;
        }

        const newFavorite: FavoriteConfig = {
            id: `fav-${Date.now()}`,
            name: newName.trim(),
            chainConfig,
            modelUrls,
            createdAt: Date.now(),
        };

        saveFavorites([newFavorite, ...favorites]);
        setNewName("");
        setShowSaveInput(false);
        toast.success(`"${newName}" saved to favorites!`);
    };

    const handleLoadFavorite = (favorite: FavoriteConfig) => {
        onLoadFavorite(favorite.chainConfig, favorite.modelUrls);
        toast.success(`Loaded "${favorite.name}"`);
    };

    const handleDeleteFavorite = (id: string) => {
        const updated = favorites.filter((f) => f.id !== id);
        saveFavorites(updated);
        toast.success("Favorite deleted");
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Favorites
                    </span>
                    {favorites.length > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                            {favorites.length}
                        </span>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
            </button>

            {isExpanded && (
                <div className="p-3 pt-0 space-y-3">
                    {/* Save Current */}
                    {!showSaveInput ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSaveInput(true)}
                            className="w-full gap-2 text-yellow-600 border-yellow-300 hover:bg-yellow-50 dark:border-yellow-700 dark:hover:bg-yellow-900/20"
                        >
                            <Star className="w-4 h-4" />
                            Save Current Design
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Enter name..."
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                                onKeyDown={(e) => e.key === "Enter" && handleSaveFavorite()}
                                autoFocus
                            />
                            <Button size="sm" onClick={handleSaveFavorite}>
                                Save
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setShowSaveInput(false);
                                    setNewName("");
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}

                    {/* Favorites List */}
                    {favorites.length === 0 ? (
                        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                            <StarOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            No favorites yet
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {favorites.map((favorite) => (
                                <div
                                    key={favorite.id}
                                    className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                            {favorite.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {favorite.chainConfig.chainLength} links • {formatDate(favorite.createdAt)}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleLoadFavorite(favorite)}
                                        className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteFavorite(favorite.id)}
                                        className="h-8 px-2 text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
