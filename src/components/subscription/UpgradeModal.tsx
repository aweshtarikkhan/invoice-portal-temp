import React from 'react';
import { PlanSelectorModal } from '@/components/shared/PlanSelectorModal';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (planId: string, interval: 'monthly' | 'yearly', price: number) => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  return (
    <PlanSelectorModal
      open={isOpen}
      onClose={onClose}
    />
  );
}
