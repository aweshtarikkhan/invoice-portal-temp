import React from 'react';
import { PlanSelectorModal } from '@/components/shared/PlanSelectorModal';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (planId: string, interval: 'monthly' | 'yearly', price: number) => void;
  currentPlanName?: string;
  forceOrgId?: string | null;
}

export function UpgradeModal({ isOpen, onClose, currentPlanName, forceOrgId }: UpgradeModalProps) {
  return (
    <PlanSelectorModal
      open={isOpen}
      onClose={onClose}
      currentPlanName={currentPlanName}
      forceOrgId={forceOrgId}
    />
  );
}
