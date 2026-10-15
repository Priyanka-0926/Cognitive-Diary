import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import { Sparkles, Shield, Clock, BookOpen, ArrowRight, Check } from 'lucide-react';

export const OnboardingFlow: React.FC = () => {
  const { user, showOnboarding, setShowOnboarding, refreshData, setActiveTab } = useApp();
  const [step, setStep] = useState(1);
  const [currentRole, setCurrentRole] = useState(user?.preferences?.currentRole || '');
  const [careerInterests, setCareerInterests] = useState<string[]>(
    user?.preferences?.careerInterests || []
  );
  const [weeklyHoursBudget, setWeeklyHoursBudget] = useState(
    user?.preferences?.weeklyHoursBudget || 5
  );
  const [learningFormat, setLearningFormat] = useState(
    user?.preferences?.preferredLearningFormat || 'hands_on'
  );
  const [saving, setSaving] = useState(false);

  if (!showOnboarding) return null;

  const toggleInterest = (interest: string) => {
    if (careerInterests.includes(interest)) {
      setCareerInterests(careerInterests.filter((i) => i !== interest));
    } else {
      setCareerInterests([...careerInterests, interest]);
    }
  };

  const handleFinish = async (startWriting: boolean = false) => {
    setSaving(true);
    try {
      await api.updatePreferences({
        onboardingCompleted: true,
        preferences: {
          currentRole,
          careerInterests,
          weeklyHoursBudget,
          preferredLearningFormat: learningFormat as any,
          shareDataForAnalysis: true,
          remindersEnabled: true,
        },
      });
      await refreshData();
      setShowOnboarding(false);
      if (startWriting) {
        setActiveTab('journal');
      } else {
        setActiveTab('overview');
      }
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      setShowOnboarding(false);
    } finally {
      setSaving(false);
    }
  };

  const interestOptions = [
    'Software & Product Engineering',
    'Systems Architecture',
    'Data & Applied Analytics',
    'Product Design & UX Research',
    'Technical Writing & Docs',
    'Developer Experience & Education',
    'Operations & Strategy',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-[#E6E3DE] shadow-2xl max-w-xl w-full p-6 sm:p-10 relative">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E6E3DE] text-xs text-[#878D82]">
          <span className="font-semibold text-[#3E5A46]">Step {step} of 4</span>
          <button
            onClick={() => handleFinish(false)}
            className="hover:text-[#222421] text-xs hover:underline"
          >
            Skip for now
          </button>
        </div>

        {/* Step 1: Welcome & Concept */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#222421] tracking-tight">
              Your everyday work holds clues to your future.
            </h2>
            <p className="text-sm text-[#5C6059] leading-relaxed">
              Traditional career tests force you to guess who you are through abstract questions.
              Cognitive Diary observes real evidence from what you actually do each day.
            </p>
            <div className="bg-[#FAF8F5] border border-[#E6E3DE] p-4 rounded-md space-y-2 text-xs text-[#444840]">
              <p className="font-semibold text-[#222421]">The Philosophy:</p>
              <p className="italic">
                &ldquo;Don&apos;t tell us who you think you are. Show us how you work, and discover what you&apos;re capable of.&rdquo;
              </p>
            </div>
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="py-2.5 px-5 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded transition-colors flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Personalization (Optional) */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-editorial text-2xl font-semibold text-[#222421]">
                Tell us a little about your current context
              </h2>
              <p className="text-xs text-[#5C6059] mt-1">
                Optional context helps anchor roadmap timeframes and suggestions.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#222421] mb-1">
                  Current role or study focus
                </label>
                <input
                  type="text"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  placeholder="e.g. Frontend developer, student, product manager"
                  className="w-full px-3 py-2 text-sm border border-[#D5D2CC] rounded focus:outline-none focus:ring-1 focus:ring-[#3E5A46]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#222421] mb-1.5">
                  General career fields you are curious about
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {interestOptions.map((interest) => {
                    const selected = careerInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`text-left px-3 py-2 rounded border text-xs transition-colors flex items-center justify-between ${
                          selected
                            ? 'bg-[#EEF4EE] border-[#3E5A46] text-[#2A4031] font-medium'
                            : 'bg-white border-[#E6E3DE] text-[#5C6059] hover:border-[#D5D2CC]'
                        }`}
                      >
                        <span>{interest}</span>
                        {selected && <Check className="w-3.5 h-3.5 text-[#3E5A46] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#222421] mb-1">
                    Weekly learning budget
                  </label>
                  <select
                    value={weeklyHoursBudget}
                    onChange={(e) => setWeeklyHoursBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-[#D5D2CC] rounded focus:outline-none focus:ring-1 focus:ring-[#3E5A46]"
                  >
                    <option value={3}>3 hours/week</option>
                    <option value={5}>5-6 hours/week</option>
                    <option value={10}>10 hours/week</option>
                    <option value={15}>15+ hours/week</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#222421] mb-1">
                    Preferred learning style
                  </label>
                  <select
                    value={learningFormat}
                    onChange={(e) => setLearningFormat(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-[#D5D2CC] rounded focus:outline-none focus:ring-1 focus:ring-[#3E5A46]"
                  >
                    <option value="hands_on">Hands-on projects</option>
                    <option value="reading">Reading & technical briefs</option>
                    <option value="video">Video walkthroughs</option>
                    <option value="mentorship">Pairing & mentorship</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="py-2 px-4 text-xs text-[#5C6059] hover:text-[#222421]"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="py-2.5 px-5 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded transition-colors flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Privacy & Transparency */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-editorial text-2xl font-semibold text-[#222421]">
              Privacy, Trust & Explainability
            </h2>
            <p className="text-xs text-[#5C6059] leading-relaxed">
              Journal entries are personal. Here is our engineering commitment to how your data is treated:
            </p>

            <div className="space-y-2.5 text-xs text-[#444840]">
              <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded flex items-start gap-3">
                <Shield className="w-4 h-4 text-[#3E5A46] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#222421]">Private by Default</p>
                  <p className="text-[11px] text-[#6F746B] mt-0.5">
                    Your journal text is never shared publicly, never sold to third parties, and never used for advertising.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-[#3E5A46] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#222421]">Explainable AI Hypotheses</p>
                  <p className="text-[11px] text-[#6F746B] mt-0.5">
                    Every skill and career recommendation links directly back to your supporting journal excerpts.
                    Nothing is presented as an unquestionable verdict.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#3E5A46] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#222421]">You Own Your Data</p>
                  <p className="text-[11px] text-[#6F746B] mt-0.5">
                    Export your full journal and analysis history in JSON at any time, or permanently delete your account with one click.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="py-2 px-4 text-xs text-[#5C6059] hover:text-[#222421]"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="py-2.5 px-5 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded transition-colors flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Ready to Start */}
        {step === 4 && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-[#EEF4EE] text-[#3E5A46] flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>

            <h2 className="font-editorial text-2xl font-semibold text-[#222421]">
              You are ready to reflect
            </h2>

            <p className="text-xs text-[#5C6059] max-w-sm mx-auto leading-relaxed">
              No categories. No scoreboards. Just 3 to 5 sentences about something you worked on,
              what felt satisfying, or what felt difficult today.
            </p>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => handleFinish(true)}
                disabled={saving}
                className="w-full sm:w-auto py-2.5 px-6 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded transition-colors"
              >
                {saving ? 'Saving...' : "Write Today's First Entry"}
              </button>

              <button
                onClick={() => handleFinish(false)}
                disabled={saving}
                className="w-full sm:w-auto py-2.5 px-5 border border-[#D5D2CC] text-[#222421] text-xs font-medium rounded hover:bg-[#FAF8F5] transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
