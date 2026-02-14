"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Button,
  Typography,
  Box,
  IconButton,
  MobileStepper,
  LinearProgress,
} from "@mui/material";
import {
  Close,
  ChevronRight,
  ChevronLeft,
  AutoAwesome,
  Palette,
  Link as LinkIcon,
  CameraAlt,
  Star,
} from "@mui/icons-material";

interface OnboardingTourProps {
  onComplete: () => void;
}

const TOUR_STEPS = [
  {
    id: 1,
    title: "Welcome to Chain Customizer! 💎",
    description:
      "Create your perfect Cuban chain with our interactive 3D customizer. Let's take a quick tour!",
    icon: <AutoAwesome sx={{ fontSize: 32, color: "#eab308" }} />,
  },
  {
    id: 2,
    title: "Choose Your Material",
    description:
      "Select from premium materials like Gold, Silver, or Black. Your choice affects the entire chain or individual links.",
    icon: <Palette sx={{ fontSize: 32, color: "#d97706" }} />,
  },
  {
    id: 3,
    title: "Customize Link Zones",
    description:
      "Each link has 4 customizable zones. Add diamonds, moissanites, enamel, or engravings to any zone.",
    icon: <LinkIcon sx={{ fontSize: 32, color: "#3b82f6" }} />,
  },
  {
    id: 4,
    title: "Save & Share",
    description:
      "Capture stunning images, record videos, and share your designs. Save favorites for later!",
    icon: <CameraAlt sx={{ fontSize: 32, color: "#a855f7" }} />,
  },
  {
    id: 5,
    title: "You're Ready! 🎉",
    description:
      "Start designing your dream chain. Use keyboard shortcut '?' anytime to see all shortcuts.",
    icon: <Star sx={{ fontSize: 32, color: "#22c55e" }} />,
  },
];

const STORAGE_KEY = "cuban-chain-onboarding-complete";

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasCompleted = localStorage.getItem(STORAGE_KEY);
    if (!hasCompleted) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
    onComplete();
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <Dialog
      open={isVisible}
      onClose={handleSkip}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: "background.paper",
          overflow: "hidden",
        },
      }}
      slotProps={{
        backdrop: {
          sx: { bgcolor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" },
        },
      }}
    >
      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 4,
          "& .MuiLinearProgress-bar": {
            background: "linear-gradient(90deg, #3b82f6, #a855f7)",
          },
        }}
      />

      <DialogContent sx={{ p: 0 }}>
        {/* Content */}
        <Box sx={{ p: 4, textAlign: "center" }}>
          {/* Icon */}
          <Box
            sx={{
              width: 64,
              height: 64,
              mx: "auto",
              mb: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "action.hover",
              borderRadius: 3,
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            {step.icon}
          </Box>

          {/* Title */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            {step.title}
          </Typography>

          {/* Description */}
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mb: 3, lineHeight: 1.6 }}
          >
            {step.description}
          </Typography>

          {/* Step Indicators */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.75, mb: 1 }}>
            {TOUR_STEPS.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentStep(index)}
                sx={{
                  width: index === currentStep ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  bgcolor:
                    index === currentStep
                      ? "primary.main"
                      : index < currentStep
                      ? "primary.light"
                      : "divider",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Actions */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            bgcolor: "action.hover",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          {!isFirstStep ? (
            <Button
              onClick={handlePrevious}
              startIcon={<ChevronLeft />}
              sx={{ color: "text.secondary" }}
            >
              Back
            </Button>
          ) : (
            <Button onClick={handleSkip} sx={{ color: "text.secondary" }}>
              Skip Tour
            </Button>
          )}

          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={!isLastStep ? <ChevronRight /> : undefined}
            sx={{
              background: "linear-gradient(135deg, #d4a017, #ffd700)",
              color: "#000",
              fontWeight: 600,
              "&:hover": { background: "linear-gradient(135deg, #b8860b, #d4a017)" },
            }}
          >
            {isLastStep ? "Get Started" : "Next"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export function resetOnboardingTour() {
  localStorage.removeItem(STORAGE_KEY);
}
