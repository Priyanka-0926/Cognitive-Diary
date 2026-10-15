import {
  User,
  JournalEntry,
  AggregatedSkill,
  CareerHypothesis,
  Roadmap,
  ProgressEvent,
  WeeklyReflectionReport,
  UserFeedbackType,
  MilestoneStatus,
} from '../types/index.ts';

const SESSION_TOKEN_KEY = 'cognitive_diary_session_token';
const USER_ID_KEY = 'cognitive_diary_active_user_id';

export function getStoredToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

export function getStoredUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

export function setStoredUserId(id: string): void {
  localStorage.setItem(USER_ID_KEY, id);
}

export function clearStoredUserId(): void {
  localStorage.removeItem(USER_ID_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(email: string): Promise<User> {
    const res = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    setStoredToken(res.token);
    setStoredUserId(res.user.id);
    return res.user;
  },

  async register(displayName: string, email: string): Promise<User> {
    const res = await request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ displayName, email }),
    });
    setStoredToken(res.token);
    setStoredUserId(res.user.id);
    return res.user;
  },

  async loginDemo(): Promise<User> {
    const res = await request<{ user: User; token: string }>('/api/auth/demo', {
      method: 'POST',
    });
    setStoredToken(res.token);
    setStoredUserId(res.user.id);
    return res.user;
  },

  async getMe(): Promise<User | null> {
    try {
      const res = await request<{ user: User | null }>('/api/auth/me');
      return res.user;
    } catch {
      return null;
    }
  },

  async updatePreferences(data: {
    displayName?: string;
    onboardingCompleted?: boolean;
    preferences?: Partial<User['preferences']>;
  }): Promise<User> {
    const res = await request<{ user: User }>('/api/auth/preferences', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.user;
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    clearStoredToken();
    clearStoredUserId();
  },

  // Journal
  async getJournalEntries(): Promise<JournalEntry[]> {
    const res = await request<{ entries: JournalEntry[] }>('/api/journal');
    return res.entries;
  },

  async getJournalEntry(id: string): Promise<JournalEntry> {
    const res = await request<{ entry: JournalEntry }>(`/api/journal/${id}`);
    return res.entry;
  },

  async createJournalEntry(originalText: string, entryDate?: string): Promise<JournalEntry> {
    const res = await request<{ entry: JournalEntry }>('/api/journal', {
      method: 'POST',
      body: JSON.stringify({ originalText, entryDate }),
    });
    return res.entry;
  },

  async updateJournalEntry(id: string, originalText: string, entryDate?: string): Promise<JournalEntry> {
    const res = await request<{ entry: JournalEntry }>(`/api/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ originalText, entryDate }),
    });
    return res.entry;
  },

  async deleteJournalEntry(id: string): Promise<void> {
    await request(`/api/journal/${id}`, {
      method: 'DELETE',
    });
  },

  async retryAnalysis(id: string): Promise<JournalEntry> {
    const res = await request<{ entry: JournalEntry }>(`/api/journal/${id}/analyze`, {
      method: 'POST',
    });
    return res.entry;
  },

  // Skills
  async getSkills(): Promise<AggregatedSkill[]> {
    const res = await request<{ skills: AggregatedSkill[] }>('/api/skills');
    return res.skills;
  },

  async submitSkillFeedback(skillId: string, feedback: UserFeedbackType): Promise<void> {
    await request(`/api/skills/${skillId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  },

  // Careers
  async getCareers(): Promise<CareerHypothesis[]> {
    const res = await request<{ careers: CareerHypothesis[] }>('/api/careers');
    return res.careers;
  },

  async synthesizeCareers(): Promise<CareerHypothesis[]> {
    const res = await request<{ careers: CareerHypothesis[] }>('/api/careers/synthesize', {
      method: 'POST',
    });
    return res.careers;
  },

  async updateCareerStatus(id: string, status: 'active' | 'saved' | 'dismissed'): Promise<void> {
    await request(`/api/careers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Roadmaps
  async getActiveRoadmap(): Promise<Roadmap | null> {
    const res = await request<{ roadmap: Roadmap | null }>('/api/roadmaps/active');
    return res.roadmap;
  },

  async generateRoadmap(careerTitle: string, careerRecommendationId?: string, weeklyTimeBudget?: number): Promise<Roadmap> {
    const res = await request<{ roadmap: Roadmap }>('/api/roadmaps/generate', {
      method: 'POST',
      body: JSON.stringify({ careerTitle, careerRecommendationId, weeklyTimeBudget }),
    });
    return res.roadmap;
  },

  async updateMilestoneStatus(roadmapId: string, milestoneId: string, status: MilestoneStatus): Promise<Roadmap> {
    const res = await request<{ roadmap: Roadmap }>(`/api/roadmaps/milestones/${milestoneId}`, {
      method: 'PATCH',
      body: JSON.stringify({ roadmapId, status }),
    });
    return res.roadmap;
  },

  // Progress Events
  async getProgressEvents(): Promise<ProgressEvent[]> {
    const res = await request<{ events: ProgressEvent[] }>('/api/progress-events');
    return res.events;
  },

  async confirmProgressEvent(eventId: string): Promise<{ event: ProgressEvent; roadmap: Roadmap | null }> {
    return request<{ event: ProgressEvent; roadmap: Roadmap | null }>(`/api/progress-events/${eventId}/confirm`, {
      method: 'POST',
    });
  },

  async rejectProgressEvent(eventId: string): Promise<ProgressEvent> {
    const res = await request<{ event: ProgressEvent }>(`/api/progress-events/${eventId}/reject`, {
      method: 'POST',
    });
    return res.event;
  },

  // Insights
  async getWeeklyReports(): Promise<WeeklyReflectionReport[]> {
    const res = await request<{ reports: WeeklyReflectionReport[] }>('/api/insights/weekly');
    return res.reports;
  },

  async generateWeeklyReport(): Promise<WeeklyReflectionReport> {
    const res = await request<{ report: WeeklyReflectionReport }>('/api/insights/weekly/generate', {
      method: 'POST',
    });
    return res.report;
  },

  // Account
  async exportData(): Promise<void> {
    const token = getStoredToken();
    const url = `/api/user/export`;
    const res = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error(`Export failed: ${res.statusText}`);
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `cognitive-diary-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  async deleteAccount(): Promise<void> {
    await request('/api/user/delete', {
      method: 'POST',
    });
    clearStoredToken();
    clearStoredUserId();
  },

  // System
  async getSystemStatus(): Promise<{ geminiConfigured: boolean; environment: string; serverTime: string }> {
    return request('/api/system/status');
  },
};
