'use client';

import React from 'react';
import { AppStep } from '@/types';

interface StepperProps {
  currentStep: AppStep;
}

const STEPS: { key: AppStep; label: string }[] = [
  { key: 'upload', label: 'Upload CSV' },
  { key: 'preview', label: 'Preview Data' },
  { key: 'processing', label: 'AI Processing' },
  { key: 'results', label: 'Results' },
];

const STEP_ORDER: AppStep[] = ['upload', 'preview', 'processing', 'results'];

export default function Stepper({ currentStep }: StepperProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="stepper" id="progress-stepper">
      {STEPS.map((step, i) => (
        <React.Fragment key={step.key}>
          {i > 0 && (
            <div
              className={`step-connector ${i <= currentIndex ? 'completed' : ''}`}
            />
          )}
          <div
            className={`step-item ${
              step.key === currentStep
                ? 'active'
                : i < currentIndex
                ? 'completed'
                : ''
            }`}
          >
            <span className="step-number">
              {i < currentIndex ? '\u2713' : i + 1}
            </span>
            <span>{step.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
