"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Collapse,
} from "@mui/material";
import { Star, StarBorder, Delete, Download, ExpandMore, ExpandLess } from "@mui/icons-material";
import type { ChainConfig } from "@/lib/chain-config-types";

interface FavoriteConfig {
  id: string;
  name: string;
  chainConfig: ChainConfig;
  modelUrls: string[];
  createdAt: number;
}

interface FavoritesPanelProps {
  chainConfig: ChainConfig;
  modelUrls: string[];
  onLoadFavorite: (config: ChainConfig, urls: string[]) => void;
  className?: string;
}

const STORAGE_KEY = "cuban-chain-favorites";

export function FavoritesPanel({ chainConfig, modelUrls, onLoadFavorite }: FavoritesPanelProps) {
  const [favorites, setFavorites] = useState<FavoriteConfig[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [newName, setNewName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setFavorites(JSON.parse(stored)); }
      catch { console.error("Failed to parse favorites"); }
    }
  }, []);

  const saveFavorites = (newFavorites: FavoriteConfig[]) => {
    setFavorites(newFavorites);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
  };

  const handleSaveFavorite = () => {
    if (!newName.trim()) return;
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
  };

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <Box>
      {/* Header */}
      <Box
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          py: 1,
          "&:hover": { opacity: 0.8 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Star sx={{ fontSize: 18, color: "primary.main" }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Favorites</Typography>
          {favorites.length > 0 && (
            <Box sx={{ bgcolor: "rgba(212,160,23,0.15)", px: 1, borderRadius: 4, py: 0.2 }}>
              <Typography variant="caption" sx={{ color: "primary.light", fontWeight: 600 }}>{favorites.length}</Typography>
            </Box>
          )}
        </Box>
        {isExpanded ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
          {/* Save */}
          {!showSaveInput ? (
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<StarBorder />}
              onClick={() => setShowSaveInput(true)}
              sx={{ borderColor: "primary.dark", color: "primary.light" }}
            >
              Save Current Design
            </Button>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name..."
                onKeyDown={(e) => e.key === "Enter" && handleSaveFavorite()}
                autoFocus
                sx={{ flex: 1 }}
              />
              <Button size="small" variant="contained" onClick={handleSaveFavorite}>Save</Button>
              <Button size="small" onClick={() => { setShowSaveInput(false); setNewName(""); }}>×</Button>
            </Box>
          )}

          {/* List */}
          {favorites.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <StarBorder sx={{ fontSize: 32, color: "text.disabled", mb: 1 }} />
              <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>No favorites yet</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 200, overflowY: "auto" }}>
              {favorites.map((fav) => (
                <Box
                  key={fav.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1.5,
                    bgcolor: "action.hover",
                    borderRadius: 2,
                    "&:hover .fav-actions": { opacity: 1 },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{fav.name}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {fav.chainConfig.chainLength} links • {formatDate(fav.createdAt)}
                    </Typography>
                  </Box>
                  <Box className="fav-actions" sx={{ opacity: 0, transition: "opacity 0.15s", display: "flex" }}>
                    <IconButton size="small" onClick={() => onLoadFavorite(fav.chainConfig, fav.modelUrls)}>
                      <Download sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => saveFavorites(favorites.filter((f) => f.id !== fav.id))} sx={{ color: "error.main" }}>
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
