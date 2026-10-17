package com.cognitivediary.view;

import com.cognitivediary.model.Models.User;

public class SettingsView {

    public static String render(User user) {
        String displayName = (user != null && user.displayName() != null) ? user.displayName() : "Elena Rostova";
        String email = (user != null && user.email() != null) ? user.email() : "elena.rostova@example.com";

        String body = """
            <div class="max-w-4xl mx-auto space-y-8">
                <div class="pb-3 border-b border-[#E6E3DE]">
                    <h1 class="font-editorial text-2xl font-semibold text-[#222421]">Settings &amp; Data Sovereignty</h1>
                    <p class="text-xs text-[#5C6059] mt-0.5">Manage your preferences, download full personal archives, or permanently wipe your account.</p>
                </div>

                <!-- Profile Section -->
                <div class="bg-white border border-[#E6E3DE] rounded-xl p-6 shadow-xs space-y-4">
                    <h3 class="font-editorial text-lg font-semibold text-[#222421]">Account Profile</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                            <label class="block text-[#878D82] font-medium mb-1">Display Name</label>
                            <input type="text" value="%s" readonly class="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5D2CC] rounded text-[#222421]">
                        </div>
                        <div>
                            <label class="block text-[#878D82] font-medium mb-1">Email Address</label>
                            <input type="text" value="%s" readonly class="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D5D2CC] rounded text-[#222421]">
                        </div>
                    </div>
                </div>

                <!-- Data Export & Privacy Section -->
                <div class="bg-white border border-[#E6E3DE] rounded-xl p-6 shadow-xs space-y-4">
                    <h3 class="font-editorial text-lg font-semibold text-[#222421]">Data Sovereignty (GDPR Export)</h3>
                    <p class="text-xs text-[#5C6059] leading-relaxed">
                        Export your complete cognitive diary history, including all reflections, extracted skill evidence, AI analyses, career hypotheses, and roadmap progress events in standard JSON format.
                    </p>
                    <div>
                        <a href="/api/user/export" download class="px-4 py-2 bg-[#3E5A46] hover:bg-[#2A4031] text-white text-xs font-semibold rounded shadow-xs transition-colors inline-flex items-center gap-2">
                            <span>Export Complete Archive (.json)</span>
                        </a>
                    </div>
                </div>

                <!-- Danger Zone -->
                <div class="bg-white border border-[#FCA5A5] rounded-xl p-6 shadow-xs space-y-4">
                    <h3 class="font-editorial text-lg font-semibold text-[#991B1B]">Danger Zone</h3>
                    <p class="text-xs text-[#7F1D1D] leading-relaxed">
                        Permanently wipe your account, session credentials, and all recorded journal reflections from the local database. This operation is immediate and irreversible.
                    </p>
                    <div>
                        <button type="button" onclick="deleteAccount()" class="px-4 py-2 bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold rounded shadow-xs transition-colors">
                            Permanently Delete Account &amp; Wipe Data
                        </button>
                    </div>
                </div>
            </div>

            <script>
                async function deleteAccount() {
                    if (!confirm('Are you sure you want to permanently wipe all your journal entries and account data?')) {
                        return;
                    }
                    try {
                        const res = await fetch('/api/user/delete', { method: 'POST' });
                        if (res.ok) {
                            alert('Account wiped.');
                            window.location.href = '/login';
                        }
                    } catch (e) {
                        alert('Deletion failed.');
                    }
                }
            </script>
            """.formatted(
                UiComponents.escape(displayName),
                UiComponents.escape(email)
        );

        return UiComponents.wrapPage("Settings & Privacy", "settings", user, body);
    }
}
