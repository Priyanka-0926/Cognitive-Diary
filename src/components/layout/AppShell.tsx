import React, { useState } from 'react';
import { useApp, TabKey } from '../../context/AppContext.tsx';
import {
  BookOpen,
  Calendar,
  Sparkles,
  Compass,
  MapPin,
  TrendingUp,
  Settings,
  Edit3,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const {
    user,
    activeTab,
    setActiveTab,
    notifications,
    markNotificationRead,
    setShowAuthModal,
    logout,
    loginAsDemo,
    geminiConfigured,
    setEditingEntryId,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems: Array<{ id: TabKey; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'journal', label: 'Daily Journal', icon: Edit3 },
    { id: 'history', label: 'Journal Archive', icon: Calendar },
    { id: 'strengths', label: 'My Strengths', icon: Sparkles },
    { id: 'careers', label: 'Career Discovery', icon: Compass },
    { id: 'roadmap', label: 'Career Roadmap', icon: MapPin },
    { id: 'insights', label: 'Insights & Reflection', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tab: TabKey) => {
    if (tab === 'journal') {
      setEditingEntryId(null);
    }
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8F7F4] text-[#222421]">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E6E3DE] sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#5C6059] hover:text-[#222421] focus:outline-none focus:ring-1 focus:ring-[#3E5A46] rounded"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button
            onClick={() => handleNavClick('overview')}
            className="font-editorial text-lg font-semibold tracking-tight text-[#222421] text-left"
          >
            Cognitive Diary
          </button>
        </div>

        <div className="flex items-center gap-2">
          {user?.isDemo && (
            <span className="text-[11px] font-medium text-[#3E5A46] bg-[#EEF4EE] px-2 py-0.5 rounded">
              Demo Persona
            </span>
          )}
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 relative text-[#5C6059] hover:text-[#222421] focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#3E5A46] rounded-full" />
            )}
          </button>
          <button
            onClick={() => handleNavClick('journal')}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#3E5A46] rounded hover:bg-[#2A4031] transition-colors"
          >
            Write
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex">
          <div className="w-72 bg-white h-full p-5 flex flex-col border-r border-[#E6E3DE] shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E6E3DE]">
              <div>
                <span className="font-editorial text-lg font-semibold block text-[#222421]">
                  Cognitive Diary
                </span>
                <span className="text-[10px] text-[#878D82]">Evidence-based career growth</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-[#5C6059] hover:text-[#222421]"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium transition-colors text-left ${
                      active
                        ? 'bg-[#EEF4EE] text-[#2A4031] font-semibold'
                        : 'text-[#5C6059] hover:bg-[#F8F7F4] hover:text-[#222421]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${active ? 'text-[#3E5A46]' : 'text-[#878D82]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-[#3E5A46]" />}
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-[#E6E3DE] text-xs text-[#6F746B]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-[#222421] truncate max-w-[140px]">
                  {user?.displayName || 'Guest'}
                </span>
                {user?.isDemo ? (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowAuthModal(true);
                    }}
                    className="text-[#3E5A46] font-medium hover:underline text-xs"
                  >
                    Sign In
                  </button>
                ) : (
                  <button onClick={logout} className="text-[#878D82] hover:text-[#222421] text-xs">
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E6E3DE] shrink-0 sticky top-0 h-screen z-30">
        {/* Brand Lockup */}
        <div className="px-6 py-5 border-b border-[#E6E3DE]">
          <button
            onClick={() => handleNavClick('overview')}
            className="text-left group flex flex-col"
          >
            <span className="font-editorial text-xl font-semibold tracking-tight text-[#222421] group-hover:text-[#3E5A46] transition-colors">
              Cognitive Diary
            </span>
            <span className="text-[11px] text-[#878D82] tracking-normal mt-0.5">
              Evidence-based career growth
            </span>
          </button>
        </div>

        {/* Primary CTA: Write Today */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => handleNavClick('journal')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#3E5A46] hover:bg-[#2A4031] rounded transition-all shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Write Today&apos;s Entry</span>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors text-left group ${
                  active
                    ? 'bg-[#EEF4EE] text-[#2A4031] font-semibold'
                    : 'text-[#5C6059] hover:bg-[#F8F7F4] hover:text-[#222421]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    active ? 'text-[#3E5A46]' : 'text-[#878D82] group-hover:text-[#5C6059]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status notice if Gemini is not configured */}
        {!geminiConfigured && (
          <div className="mx-3 mb-3 p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded text-[11px] text-[#92400E] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Gemini Key Needed</p>
              <p className="text-[10px] mt-0.5 text-[#B45309]">
                Add GEMINI_API_KEY to Secrets for live AI analysis.
              </p>
            </div>
          </div>
        )}

        {/* Bottom User Account Strip */}
        <div className="p-3 border-t border-[#E6E3DE] bg-[#FAF8F5]">
          <div className="relative">
            <button
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded hover:bg-white text-left transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded bg-[#DCE7DC] text-[#2A4031] flex items-center justify-center text-xs font-semibold shrink-0">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 truncate">
                  <p className="text-xs font-semibold text-[#222421] truncate">
                    {user?.displayName || 'Elena Vance'}
                  </p>
                  <p className="text-[11px] text-[#878D82] truncate">
                    {user?.isDemo ? 'Demo Mode' : user?.email}
                  </p>
                </div>
              </div>
            </button>

            {/* Account Popover Menu */}
            {accountMenuOpen && (
              <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-[#E6E3DE] rounded shadow-lg py-1 text-xs z-50">
                {user?.isDemo ? (
                  <>
                    <div className="px-3 py-2 text-[11px] text-[#878D82] border-b border-[#E6E3DE]">
                      Viewing demo entries & roadmap.
                    </div>
                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        setShowAuthModal(true);
                      }}
                      className="w-full text-left px-3 py-2 text-[#2A4031] hover:bg-[#EEF4EE] font-medium flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5" />
                      Sign In / Register Account
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        handleNavClick('settings');
                      }}
                      className="w-full text-left px-3 py-2 text-[#5C6059] hover:bg-[#F8F7F4] flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Account Settings
                    </button>
                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        loginAsDemo();
                      }}
                      className="w-full text-left px-3 py-2 text-[#5C6059] hover:bg-[#F8F7F4] flex items-center gap-2"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Switch to Demo Mode
                    </button>
                    <div className="border-t border-[#E6E3DE] my-1" />
                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-[#B91C1C] hover:bg-[#FEF2F2] flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Desktop Top Header strictly following Top Bar Contract:
            Zone 1: Brand / Contextual Breadcrumb
            Zone 2: Navigation Links (single-line text)
            Zone 3: 1 Primary Action (Notifications & Mode) */}
        <header className="hidden md:flex items-center justify-between gap-8 px-8 py-3.5 bg-white border-b border-[#E6E3DE] sticky top-0 z-20">
          {/* Zone 1: Contextual Breadcrumb Wordmark */}
          <div className="flex items-center gap-2 text-xs text-[#878D82] whitespace-nowrap shrink-0">
            <span className="font-semibold text-[#222421]">Cognitive Diary</span>
            <span aria-hidden="true">/</span>
            <span className="capitalize text-[#3E5A46] font-medium">
              {navItems.find((n) => n.id === activeTab)?.label || activeTab}
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="flex items-center gap-6 text-xs text-[#5C6059] whitespace-nowrap shrink-0">
            <button
              onClick={() => handleNavClick('overview')}
              className={`hover:text-[#222421] transition-colors ${
                activeTab === 'overview' ? 'text-[#3E5A46] font-semibold' : ''
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => handleNavClick('strengths')}
              className={`hover:text-[#222421] transition-colors ${
                activeTab === 'strengths' ? 'text-[#3E5A46] font-semibold' : ''
              }`}
            >
              Strengths
            </button>
            <button
              onClick={() => handleNavClick('careers')}
              className={`hover:text-[#222421] transition-colors ${
                activeTab === 'careers' ? 'text-[#3E5A46] font-semibold' : ''
              }`}
            >
              Career Hypotheses
            </button>
            <button
              onClick={() => handleNavClick('roadmap')}
              className={`hover:text-[#222421] transition-colors ${
                activeTab === 'roadmap' ? 'text-[#3E5A46] font-semibold' : ''
              }`}
            >
              Learning Roadmap
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action & Notification */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-1.5 rounded text-[#5C6059] hover:text-[#222421] hover:bg-[#F8F7F4] transition-colors relative"
                title="Notifications & Reflections"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#3E5A46] rounded-full" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E6E3DE] rounded shadow-lg p-3 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E6E3DE]">
                    <span className="font-semibold text-[#222421]">Gentle Reminders</span>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[#878D82] hover:text-[#222421]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-[#878D82] py-4 text-center">No new notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded border transition-colors ${
                            n.read
                              ? 'bg-[#F8F7F4] border-[#E6E3DE] text-[#6F746B]'
                              : 'bg-[#EEF4EE]/60 border-[#DCE7DC] text-[#222421]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-semibold">{n.title}</span>
                            {!n.read && (
                              <button
                                onClick={() => markNotificationRead(n.id)}
                                className="text-[10px] text-[#3E5A46] hover:underline"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed">{n.message}</p>
                          {n.actionUrl && (
                            <button
                              onClick={() => {
                                handleNavClick(n.actionUrl as TabKey);
                                setNotificationsOpen(false);
                              }}
                              className="mt-2 text-[11px] font-medium text-[#3E5A46] hover:underline"
                            >
                              View details →
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {user?.isDemo ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-[#3E5A46] bg-[#EEF4EE] hover:bg-[#DCE7DC] rounded transition-colors whitespace-nowrap"
              >
                Sign In Real Diary
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('journal')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#3E5A46] hover:bg-[#2A4031] rounded transition-colors whitespace-nowrap"
              >
                + New Entry
              </button>
            )}
          </div>
        </header>

        {/* Main Viewport Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
