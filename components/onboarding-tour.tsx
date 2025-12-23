"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, Palette, Link, Camera, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingTourProps {
    onComplete: () => void;
}

const TOUR_STEPS = [
    {
        id: 1,
        title: "Welcome to Chain Customizer! 💎",
        description:
            "Create your perfect Cuban chain with our interactive 3D customizer. Let's take a quick tour!",
        icon: <Sparkles className="w-8 h-8 text-yellow-500" />,
        highlight: null,
    },
    {
        id: 2,
        title: "Choose Your Material",
        description:
            "Select from premium materials like Gold, Silver, or Black. Your choice affects the entire chain or individual links.",
        icon: <Palette className="w-8 h-8 text-amber-500" />,
        highlight: "material-selector",
    },
    {
        id: 3,
        title: "Customize Link Zones",
        description:
            "Each link has 4 customizable zones. Add diamonds, moissanites, enamel, or engravings to any zone.",
        icon: <Link className="w-8 h-8 text-blue-500" />,
        highlight: "zone-selector",
    },
    {
        id: 4,
        title: "Save & Share",
        description:
            "Capture stunning images, record videos, and share your designs. Save favorites for later!",
        icon: <Camera className="w-8 h-8 text-purple-500" />,
        highlight: "export-section",
    },
    {
        id: 5,
        title: "You're Ready! 🎉",
        description:
            "Start designing your dream chain. Use keyboard shortcut '?' anytime to see all shortcuts.",
        icon: <Star className="w-8 h-8 text-green-500" />,
        highlight: null,
    },
];

const STORAGE_KEY = "cuban-chain-onboarding-complete";

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Check if user has already completed the tour
        const hasCompleted = localStorage.getItem(STORAGE_KEY);
        if (!hasCompleted) {
            // Delay showing to let the page load
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            {/* Tour Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform animate-in zoom-in-95 duration-300">
                {/* Progress Bar */}
                <div className="h-1 bg-gray-100 dark:bg-gray-800">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center shadow-inner">
                        {step.icon}
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {step.title}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                        {step.description}
                    </p>

                    {/* Step Indicators */}
                    <div className="flex justify-center gap-2 mb-6">
                        {TOUR_STEPS.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentStep(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentStep
                                        ? "w-6 bg-blue-500"
                                        : index < currentStep
                                            ? "bg-blue-300"
                                            : "bg-gray-200 dark:bg-gray-700"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                    {!isFirstStep ? (
                        <Button variant="ghost" onClick={handlePrevious} className="gap-1">
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </Button>
                    ) : (
                        <Button variant="ghost" onClick={handleSkip} className="text-gray-500">
                            Skip Tour
                        </Button>
                    )}

                    <Button onClick={handleNext} className="gap-1">
                        {isLastStep ? (
                            "Get Started"
                        ) : (
                            <>
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Export function to reset tour for testing
export function resetOnboardingTour() {
    localStorage.removeItem(STORAGE_KEY);
}
