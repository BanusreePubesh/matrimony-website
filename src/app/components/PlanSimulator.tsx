import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Crown } from 'lucide-react';

interface Props {
  currentUser: any;
  onPlanChange: (user: any) => void;
}

export default function PlanSimulator({ currentUser, onPlanChange }: Props) {
  const [isMinimized, setIsMinimized] = useState(false);

  const rawPlan = currentUser?.premium_plan || currentUser?.plan || 'Basic';
  const currentPlanNorm = rawPlan.toLowerCase();

  const handleSwitch = (planName: string) => {
    const updatedUser = {
      ...currentUser,
      premium_plan: planName,
      plan: planName
    };
    onPlanChange(updatedUser);
  };

  const plans = [
    {
      name: 'Basic',
      displayName: 'Basic Plan',
      badgeText: '48/50 views',
      activeGradient: 'bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] text-white border-sky-500 shadow-md shadow-sky-200',
      activeBadgeBg: 'bg-white/25 text-white',
      usageViews: '48/50',
      usageInterests: '3/10'
    },
    {
      name: 'Gold',
      displayName: 'Gold Plan',
      badgeText: '0/50 ints',
      activeGradient: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-md shadow-amber-200',
      activeBadgeBg: 'bg-white/25 text-white',
      usageViews: 'Unlimited',
      usageInterests: '12/50'
    },
    {
      name: 'Premium',
      displayName: 'Premium Plan',
      badgeText: 'Unlimited',
      activeGradient: 'bg-gradient-to-r from-[#003B7B] to-[#0284C7] text-white border-sky-500 shadow-md shadow-sky-200',
      activeBadgeBg: 'bg-white/25 text-white',
      usageViews: 'Unlimited',
      usageInterests: 'Unlimited'
    }
  ];

  const activePlanObj = plans.find(p => p.name.toLowerCase() === currentPlanNorm) || plans[0];

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 bg-white/95 backdrop-blur-md border border-sky-200 shadow-2xl rounded-full px-4 py-2.5 flex items-center gap-2 text-xs font-bold text-gray-800 hover:scale-105 transition-all group"
      >
        <Sparkles className="w-4 h-4 text-sky-600 group-hover:rotate-12 transition-transform" />
        <span>Plan Simulator</span>
        <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-700 uppercase">
          {activePlanObj.name}
        </span>
        <ChevronUp className="w-4 h-4 text-gray-400" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-sky-100 shadow-2xl max-w-[310px] w-full transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-sky-50 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-sky-600" />
          </div>
          <h3 className="font-display font-bold text-gray-900 text-base">Plan Simulator</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-sky-100 text-sky-700 uppercase">
            REVIEW
          </span>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            title="Minimize"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-[12px] text-gray-500 mt-2 mb-4 leading-relaxed font-normal">
        Switch active membership tiers to test locked/unlocked UX features instantly.
      </p>

      {/* Plan Option Buttons */}
      <div className="space-y-2.5">
        {plans.map((p) => {
          const isActive = currentPlanNorm === p.name.toLowerCase();
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => handleSwitch(p.name)}
              className={`w-full py-3 px-4 rounded-2xl flex items-center justify-between text-sm font-semibold transition-all duration-200 border ${
                isActive
                  ? `${p.activeGradient}`
                  : 'bg-gray-50/90 border-gray-200/80 text-gray-800 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              <span>{p.displayName}</span>
              <span
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                  isActive ? p.activeBadgeBg : 'bg-gray-200/70 text-gray-600'
                }`}
              >
                {p.badgeText}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Footer Usage Bar */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-3 border-t border-gray-100 mt-4 font-medium">
        <span>Views: {activePlanObj.usageViews}</span>
        <span>Interests: {activePlanObj.usageInterests}</span>
      </div>
    </div>
  );
}