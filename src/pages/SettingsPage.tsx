import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import {
  Settings,
  Shield,
  Download,
  Trash2,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  RotateCcw,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, geminiConfigured, refreshData, logout, loginAsDemo } = useApp();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [currentRole, setCurrentRole] = useState(user?.preferences?.currentRole || '');
  const [weeklyBudget, setWeeklyBudget] = useState(user?.preferences?.weeklyHoursBudget || 5);
  const [learningFormat, setLearningFormat] = useState(
    user?.preferences?.preferredLearningFormat || 'hands_on'
  );
  const [remindersEnabled, setRemindersEnabled] = useState(
    user?.preferences?.remindersEnabled ?? true
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setActionError(null);

    try {
      await api.updatePreferences({
        displayName,
        preferences: {
          currentRole,
          weeklyHoursBudget: weeklyBudget,
          preferredLearningFormat: learningFormat as any,
          remindersEnabled,
        },
      });
      await refreshData();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setActionError(null);
    try {
      await api.exportData();
    } catch (err: any) {
      setActionError(`Export failed: ${err.message}`);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setActionError(null);
    try {
      await api.deleteAccount();
      setShowDeleteModal(false);
      logout();
    } catch (err: any) {
      setActionError(`Deletion failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {actionError && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg text-xs text-[#991B1B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-[#991B1B] hover:text-[#7F1D1D] font-medium"
          >
            Dismiss
          </button>
        </div>
      )}
      {/* Top Header */}
      <div className="pb-4 border-b border-[#E6E3DE]">
        <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#222421]">
          Settings & Privacy
        </h1>
        <p className="text-xs text-[#5C6059] mt-1">
          Manage your profile preferences, AI extraction settings, and data exports.
        </p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white border border-[#E6E3DE] rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E6E3DE] pb-4">
          <div>
            <h2 className="text-base font-semibold text-[#222421]">Personal Preferences</h2>
            <p className="text-xs text-[#878D82]">
              Controls how career roadmaps and milestones are scoped.
            </p>
          </div>
          {savedSuccess && (
            <span className="text-xs text-[#3E5A46] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Preferences Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[#222421] mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#D5D2CC] rounded focus:outline-none focus:ring-1 focus:ring-[#3E5A46]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#222421] mb-1">
              Current Role or Occupation
            </label>
            <input
              type="text"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              placeholder="e.g. Developer, Student, Designer"
              className="w-full px-3 py-2 text-xs border border-[#D5D2CC] rounded focus:outline-none focus:ring-1 focus:ring-[#3E5A46]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#222421] mb-1">
              Weekly Learning Time Budget
            </label>
            <select
              value={weeklyBudget}
              onChange={(e) => setWeeklyBudget(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-[#D5D2CC] rounded focus:outline-none focus:ring-1 focus:ring-[#3E5A46]"
            >
              <option value={3}>3 hours / week</option>
              <option value={5}>5-6 hours / week</option>
              <option value={10}>10 hours / week</option>
              <option value={15}>15+ hours / week</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#222421] mb-1">
              Preferred Learning Mode
            </label>
            <select
              value={learningFormat}
              onChange={(e) => setLearningFormat(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-[#D5D2CC] rounded focus:outline-none focus:ring-1 focus:ring-[#3E5A46]"
            >
              <option value="hands_on">Hands-on applied prototypes</option>
              <option value="reading">Technical papers & reading</option>
              <option value="video">Guided walkthroughs</option>
              <option value="mentorship">Pairing & mentorship</option>
            </select>
          </div>
        </div>

        {/* Reminders Toggle */}
        <div className="pt-2 border-t border-[#F2EFEB] flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-[#222421] block">Gentle In-App Reminders</span>
            <p className="text-[#878D82] text-[11px]">
              Receive quiet daily invitations to write, with no guilt or aggressive streak gamification.
            </p>
          </div>
          <input
            type="checkbox"
            checked={remindersEnabled}
            onChange={(e) => setRemindersEnabled(e.target.checked)}
            className="w-4 h-4 text-[#3E5A46] rounded border-[#D5D2CC] focus:ring-[#3E5A46]"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded transition-colors shadow-xs flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>

      {/* AI Extraction Engine Status */}
      <div className="bg-white border border-[#E6E3DE] rounded-lg p-6 sm:p-8 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-[#E6E3DE] pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3E5A46]" />
            <h2 className="text-base font-semibold text-[#222421]">AI Extraction Engine</h2>
          </div>
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded ${
              geminiConfigured
                ? 'bg-[#EEF4EE] text-[#2A4031]'
                : 'bg-[#FFFBEB] text-[#92400E]'
            }`}
          >
            {geminiConfigured ? 'Gemini 3.8 Flash Active' : 'API Key Missing'}
          </span>
        </div>

        <p className="text-[#5C6059] leading-relaxed">
          Cognitive Diary operates with strict server-side model calls. All prompt templates, structured output validations, and telemetry checks happen on the server, ensuring zero exposure of credentials to browser code.
        </p>

        <div className="p-3 bg-[#FAF8F5] border border-[#E6E3DE] rounded text-[11px] text-[#6F746B] space-y-1">
          <p className="font-semibold text-[#222421]">Server Execution Pipeline:</p>
          <p>Model: <code className="font-mono text-[#222421]">gemini-3.8-flash</code> via <code className="font-mono text-[#222421]">@google/genai</code></p>
          <p>Structured Schema: Strict JSON output parsing with Zod/Type.OBJECT validation.</p>
        </div>
      </div>

      {/* Privacy, Export & Data Governance */}
      <div className="bg-white border border-[#E6E3DE] rounded-lg p-6 sm:p-8 shadow-xs space-y-6 text-xs">
        <div className="border-b border-[#E6E3DE] pb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#3E5A46]" />
            <h2 className="text-base font-semibold text-[#222421]">Privacy & Data Governance</h2>
          </div>
          <p className="text-xs text-[#878D82] mt-0.5">
            You own your thoughts. Your journal data is strictly isolated to your user ID.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export */}
          <div className="p-4 border border-[#E6E3DE] rounded-lg space-y-2 bg-[#FAF8F5]">
            <span className="font-semibold text-[#222421] block">Export Complete Archive</span>
            <p className="text-[11px] text-[#5C6059]">
              Download a clean JSON archive containing all your raw journal entries, AI analyses, observed skills, career hypotheses, and roadmaps.
            </p>
            <button
              onClick={handleExportData}
              className="mt-2 px-3 py-1.5 bg-white border border-[#D5D2CC] hover:bg-[#FAF8F5] text-[#222421] text-xs font-medium rounded transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Archive</span>
            </button>
          </div>

          {/* Reset or Switch Demo */}
          <div className="p-4 border border-[#E6E3DE] rounded-lg space-y-2 bg-[#FAF8F5]">
            <span className="font-semibold text-[#222421] block">Explore Demo Experience</span>
            <p className="text-[11px] text-[#5C6059]">
              Switch back to the curated persona &ldquo;Elena Vance&rdquo; with 5 interconnected journal entries and an active verification roadmap.
            </p>
            <button
              onClick={loginAsDemo}
              className="mt-2 px-3 py-1.5 bg-white border border-[#D5D2CC] hover:bg-[#FAF8F5] text-[#222421] text-xs font-medium rounded transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load Demo Persona</span>
            </button>
          </div>
        </div>

        {/* Permanent Deletion Zone */}
        <div className="pt-4 border-t border-[#F2EFEB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-[#991B1B] block">Permanent Account & Data Wipe</span>
            <p className="text-[11px] text-[#878D82]">
              Permanently purges all journal entries, analyses, and roadmaps from the database.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-3 py-1.5 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] hover:bg-[#FEE2E2] rounded text-xs font-semibold self-start sm:self-auto"
          >
            Delete Account & Wipe Data
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#E6E3DE] shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-semibold text-sm text-[#991B1B]">Confirm Irreversible Deletion</h3>
            <p className="text-xs text-[#5C6059] leading-relaxed">
              This will permanently delete your account, every journal entry, and all extracted skill models from the persistent server database. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 text-xs text-[#5C6059] hover:text-[#222421]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-3 py-1.5 bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold rounded disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
