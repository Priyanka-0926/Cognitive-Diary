import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  JournalEntry,
  AggregatedSkill,
  CareerHypothesis,
  Roadmap,
  ProgressEvent,
  WeeklyReflectionReport,
  AppNotification,
} from '../types/index.ts';
import { api, getStoredToken } from '../services/api.ts';

export type TabKey =
  | 'overview'
  | 'journal'
  | 'history'
  | 'strengths'
  | 'careers'
  | 'roadmap'
  | 'insights'
  | 'settings';

interface AppContextValue {
  user: User | null;
  loadingUser: boolean;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  entries: JournalEntry[];
  skills: AggregatedSkill[];
  careers: CareerHypothesis[];
  roadmap: Roadmap | null;
  progressEvents: ProgressEvent[];
  weeklyReports: WeeklyReflectionReport[];
  notifications: AppNotification[];
  geminiConfigured: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  editingEntryId: string | null;
  setEditingEntryId: (id: string | null) => void;
  selectedSkillId: string | null;
  setSelectedSkillId: (id: string | null) => void;
  refreshData: () => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
  markNotificationRead: (id: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [skills, setSkills] = useState<AggregatedSkill[]>([]);
  const [careers, setCareers] = useState<CareerHypothesis[]>([]);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReflectionReport[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const fetchAppData = useCallback(async () => {
    try {
      const [entriesRes, skillsRes, careersRes, roadmapRes, eventsRes, reportsRes] = await Promise.all([
        api.getJournalEntries().catch(() => []),
        api.getSkills().catch(() => []),
        api.getCareers().catch(() => []),
        api.getActiveRoadmap().catch(() => null),
        api.getProgressEvents().catch(() => []),
        api.getWeeklyReports().catch(() => []),
      ]);

      setEntries(entriesRes);
      setSkills(skillsRes);
      setCareers(careersRes);
      setRoadmap(roadmapRes);
      setProgressEvents(eventsRes);
      setWeeklyReports(reportsRes);

      // Construct contextual notifications
      const notifs: AppNotification[] = [];
      const pendingEvents = eventsRes.filter((e) => e.userConfirmationStatus === 'pending');
      if (pendingEvents.length > 0) {
        notifs.push({
          id: 'notif-milestone-review',
          type: 'milestone_progress',
          title: 'Milestone Progress Detected',
          message: `Your latest entry may complete "${pendingEvents[0].milestoneTitle || 'an active milestone'}". Review and confirm when ready.`,
          createdAt: pendingEvents[0].createdAt,
          read: false,
          actionUrl: 'roadmap',
        });
      }

      if (entriesRes.length >= 3 && careersRes.length === 0) {
        notifs.push({
          id: 'notif-career-ready',
          type: 'career_discovery',
          title: 'Career Hypotheses Ready',
          message: 'You have enough journal evidence to synthesize preliminary career hypotheses.',
          createdAt: new Date().toISOString(),
          read: false,
          actionUrl: 'careers',
        });
      }

      // Check daily reminder
      const todayStr = new Date().toISOString().split('T')[0];
      const hasTodayEntry = entriesRes.some((e) => e.entryDate === todayStr);
      if (!hasTodayEntry) {
        notifs.push({
          id: 'notif-daily-checkin',
          type: 'reminder',
          title: 'Evening Reflection',
          message: 'What felt satisfying, difficult, or surprising today? Capture a few thoughts.',
          createdAt: new Date().toISOString(),
          read: false,
          actionUrl: 'journal',
        });
      }

      setNotifications(notifs);
    } catch (err) {
      console.error('Error fetching application state:', err);
    }
  }, []);

  // Initial user check
  useEffect(() => {
    async function initUser() {
      setLoadingUser(true);
      try {
        const sys = await api.getSystemStatus().catch(() => ({ geminiConfigured: true }));
        setGeminiConfigured(sys.geminiConfigured);

        const storedToken = getStoredToken();
        if (storedToken) {
          const current = await api.getMe();
          if (current) {
            setUser(current);
            if (!current.onboardingCompleted && !current.isDemo) {
              setShowOnboarding(true);
            }
          } else {
            // Default to demo user for instant interactive exploration!
            const demo = await api.loginDemo();
            setUser(demo);
          }
        } else {
          // First visit: auto-seed and log in as Demo User so user immediately sees real data and working workflows!
          const demo = await api.loginDemo();
          setUser(demo);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoadingUser(false);
      }
    }

    initUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAppData();
    }
  }, [user, fetchAppData]);

  const loginAsDemo = async () => {
    setLoadingUser(true);
    try {
      const demo = await api.loginDemo();
      setUser(demo);
      setActiveTab('overview');
      await fetchAppData();
    } finally {
      setLoadingUser(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setEntries([]);
    setSkills([]);
    setCareers([]);
    setRoadmap(null);
    setProgressEvents([]);
    setWeeklyReports([]);
    setShowAuthModal(true);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loadingUser,
        activeTab,
        setActiveTab,
        entries,
        skills,
        careers,
        roadmap,
        progressEvents,
        weeklyReports,
        notifications,
        geminiConfigured,
        showAuthModal,
        setShowAuthModal,
        showOnboarding,
        setShowOnboarding,
        editingEntryId,
        setEditingEntryId,
        selectedSkillId,
        setSelectedSkillId,
        refreshData: fetchAppData,
        loginAsDemo,
        logout,
        markNotificationRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
