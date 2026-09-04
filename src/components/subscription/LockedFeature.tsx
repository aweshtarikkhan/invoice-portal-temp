import React from 'react';
import { Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/app-store';

interface LockedFeatureProps {
  title: string;
  description: string;
  onUpgradeClick: () => void;
}

export function LockedFeature({ title, description, onUpgradeClick }: LockedFeatureProps) {
  const org = useAppStore((s) => s.organization);
  const currentPlan = org?.subscription_plan || 'free';

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50 p-6">
      <Card className="w-full max-w-md shadow-lg border-orange-100 bg-white">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-500 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl text-slate-900">{title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-4 pb-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600">
            Current Plan: <span className="font-semibold text-slate-900 uppercase">{currentPlan}</span>
          </div>
          
          <Button 
            onClick={onUpgradeClick} 
            size="lg" 
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md font-semibold group gap-2"
          >
            <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Upgrade Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
