"use client";

import * as React from "react";
import Image from "next/image";
import { OnboardingProgress } from "./onboarding-progress";
import { StepWelcome } from "./step-welcome";
import { StepAddHome } from "./step-add-home";
import { StepScanItem } from "./step-scan-item";
import { StepReviewItem } from "./step-review-item";
import { StepMaintenance } from "./step-maintenance";

interface ScannedItem {
  name: string;
  brand: string | null;
  model: string | null;
  category: string;
  description: string;
  condition: string;
  estimatedAge: string | null;
}

interface OnboardingWizardProps {
  firstName: string | null;
}

export function OnboardingWizard({ firstName }: OnboardingWizardProps) {
  const [step, setStep] = React.useState(1);
  const [homeId, setHomeId] = React.useState<string | null>(null);
  const [homeName, setHomeName] = React.useState<string | null>(null);
  const [scanResult, setScanResult] = React.useState<ScannedItem | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [itemCount, setItemCount] = React.useState(0);

  function handleSkip() {
    document.cookie = "onboarding_skipped=1; path=/; max-age=31536000; SameSite=Lax; Secure";
    window.location.href = "/dashboard";
  }

  function handleComplete() {
    // Clear the skipped cookie if it was set, since they completed onboarding
    document.cookie = "onboarding_skipped=; path=/; max-age=0; SameSite=Lax; Secure";
    window.location.href = "/dashboard";
  }

  return (
    <>
      {/* Top bar with logo */}
      <div className="flex items-center justify-between px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/icon-192.png"
            alt="HomeOS"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <span className="font-heading text-sm font-semibold text-[#0A2E4D] dark:text-white">
            HomeOS
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <OnboardingProgress currentStep={step} />

      {/* Step content */}
      {step === 1 && (
        <StepWelcome
          firstName={firstName}
          onNext={() => setStep(2)}
          onSkip={handleSkip}
        />
      )}

      {step === 2 && (
        <StepAddHome
          onNext={(id, name) => {
            setHomeId(id);
            setHomeName(name);
            setStep(3);
          }}
          onBack={() => setStep(1)}
          onSkip={handleSkip}
        />
      )}

      {step === 3 && (
        <StepScanItem
          onNext={(result, preview) => {
            setScanResult(result);
            setImagePreview(preview);
            setStep(4);
          }}
          onBack={() => {
            // Reset home state so user doesn't create duplicate homes
            setHomeId(null);
            setHomeName(null);
            setStep(2);
          }}
          onSkip={handleSkip}
        />
      )}

      {step === 4 && scanResult && homeId && (
        <StepReviewItem
          homeId={homeId}
          scanResult={scanResult}
          imagePreview={imagePreview}
          onNext={(id) => {
            setItemCount((c) => c + 1);
            setStep(5);
          }}
          onBack={() => {
            setScanResult(null);
            setImagePreview(null);
            setStep(3);
          }}
          onSkip={handleSkip}
        />
      )}

      {step === 5 && homeId && homeName && (
        <StepMaintenance
          homeId={homeId}
          homeName={homeName}
          itemCount={itemCount}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
