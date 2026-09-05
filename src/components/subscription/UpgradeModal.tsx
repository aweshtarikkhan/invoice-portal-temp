import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, Building2, Users, FileText, Megaphone, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string, interval: 'monthly' | 'yearly', price: number) => void;
}

const PLANS = [
  {
    id: 'free',
    name: 'Business Starter',
    icon: Building2,
    priceMonthly: 0,
    priceYearly: 0,
    color: 'slate',
    features: [
      '100 Invoices Free / Year',
      '3 Employees Free',
      '50 Leads Free (Manual)',
      'Festival Posts Only',
      '100 WhatsApp Msgs',
      'No Admin Panel'
    ]
  },
  {
    id: 'accounting',
    name: 'Business Accounting',
    icon: FileText,
    priceMonthly: 599,
    priceYearly: 5999,
    color: 'blue',
    features: [
      'Unlimited Invoices',
      'Estimates & POs',
      'Inventory Management',
      '10 Employees Included',
      '+ ₹29 / Extra Employee',
      '500 WhatsApp Msgs / Mo'
    ]
  },
  {
    id: 'hr',
    name: 'Business HR',
    icon: Users,
    priceMonthly: 599,
    priceYearly: 5999,
    color: 'indigo',
    features: [
      '10 Employees Included',
      '+ ₹29 / Extra Employee',
      'Attendance & Payroll',
      'Shifts & Leaves',
      '500 WhatsApp Msgs / Mo'
    ]
  },
  {
    id: 'crm',
    name: 'Business CRM',
    icon: CheckCircle2,
    priceMonthly: 349,
    priceYearly: 3499,
    color: 'emerald',
    features: [
      'Unlimited Leads',
      'API Integrations',
      'Sales Pipeline',
      '10 Employees Included',
      '+ ₹29 / Extra Employee',
      '500 WhatsApp Msgs / Mo'
    ]
  },
  {
    id: 'promotion',
    name: 'Business Promotion',
    icon: Megaphone,
    priceMonthly: 349,
    priceYearly: 3499,
    color: 'rose',
    features: [
      'All Poster Categories',
      'Email Campaigns',
      '10 Employees Included',
      '+ ₹29 / Extra Employee',
      '500 WhatsApp Msgs / Mo'
    ]
  },
  {
    id: 'suite',
    name: 'Business Suite',
    icon: Building2,
    priceMonthly: 1499,
    priceYearly: 14999,
    color: 'orange',
    popular: true,
    features: [
      'All Premium Features',
      '10 Employees Included',
      '+ ₹29 / Extra Employee',
      'Full Suite Admin',
      '500 WhatsApp Msgs / Mo'
    ]
  }
];

export function UpgradeModal({ isOpen, onClose, onSelectPlan }: UpgradeModalProps) {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 bg-slate-50 overflow-hidden">
        <DialogHeader className="p-6 bg-white border-b border-slate-100 flex-shrink-0 text-center">
          <DialogTitle className="text-3xl font-bold text-slate-900">Choose Your Plan</DialogTitle>
          <DialogDescription className="text-base text-slate-500 mt-2">
            Select the modules you need or get everything with Business Suite
          </DialogDescription>
          
          <div className="flex items-center justify-center gap-4 mt-6">
            <Label htmlFor="billing-toggle" className={`text-sm ${!isYearly ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
              Monthly billing
            </Label>
            <Switch 
              id="billing-toggle" 
              checked={isYearly} 
              onCheckedChange={setIsYearly} 
              className="data-[state=checked]:bg-orange-500"
            />
            <Label htmlFor="billing-toggle" className={`text-sm flex items-center gap-2 ${isYearly ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
              Yearly billing
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">Save ~15%</span>
            </Label>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 flex items-start justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full pb-10">
            {PLANS.map(plan => {
              const Icon = plan.icon;
              const price = isYearly ? plan.priceYearly : plan.priceMonthly;
              const priceStr = price === 0 ? 'Free' : `₹${price.toLocaleString()}`;
              
              return (
                <div 
                  key={plan.id}
                  className={`relative bg-white rounded-2xl p-6 shadow-sm border-2 transition-all hover:shadow-md flex flex-col ${
                    plan.popular ? 'border-orange-500 shadow-orange-100/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                      Best Value
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl ${
                      plan.popular ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  </div>
                  
                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-extrabold text-slate-900">{priceStr}</span>
                      {price > 0 && <span className="text-slate-500 font-medium mb-1">/{isYearly ? 'year' : 'mo'}</span>}
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 text-sm leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md' 
                        : plan.id === 'free' 
                          ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' 
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                    variant={plan.id === 'free' ? 'secondary' : 'default'}
                    onClick={() => {
                      if (plan.id !== 'free') {
                        onSelectPlan(plan.id, isYearly ? 'yearly' : 'monthly', price);
                      } else {
                        onClose();
                      }
                    }}
                  >
                    {plan.id === 'free' ? 'Current Plan' : 'Select Plan'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
