package com.cognitivediary.view;

public class LoginView {

    public static String render() {
        return """
            <!DOCTYPE html>
            <html lang="en">
            %s
            <body class="bg-[#F8F7F4] text-[#222421] min-h-screen antialiased flex items-center justify-center p-4">

                <div class="max-w-md w-full bg-white border border-[#E6E3DE] rounded-2xl p-8 shadow-sm space-y-6">
                    <div class="text-center space-y-2">
                        <div class="w-12 h-12 rounded-xl bg-[#3E5A46] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-xs">
                            CD
                        </div>
                        <h1 class="font-editorial text-2xl font-semibold text-[#222421]">Cognitive Diary</h1>
                        <p class="text-xs text-[#5C6059]">100%% Pure Java Architecture Edition</p>
                    </div>

                    <div class="space-y-4">
                        <button type="button" onclick="loginDemo()" class="w-full py-2.5 px-4 bg-[#EEF4EE] hover:bg-[#DCE7DC] text-[#2A4031] text-xs font-semibold rounded-lg border border-[#DCE7DC] transition-colors flex items-center justify-center gap-2">
                            <span>Explore as Elena Rostova (Staff Architect Demo)</span>
                        </button>

                        <div class="relative flex items-center justify-center">
                            <div class="border-t border-[#E6E3DE] w-full"></div>
                            <span class="bg-white px-3 text-[11px] text-[#878D82] uppercase">Or Sign In with Email</span>
                        </div>

                        <div class="space-y-3 text-xs">
                            <div>
                                <label class="block text-[#878D82] font-medium mb-1">Email Address</label>
                                <input type="email" id="loginEmail" placeholder="your.name@example.com" class="w-full px-3 py-2 border border-[#D5D2CC] rounded-lg text-[#222421] focus:ring-2 focus:ring-[#3E5A46] outline-none">
                            </div>
                            <button type="button" onclick="loginWithEmail()" class="w-full py-2.5 px-4 bg-[#3E5A46] hover:bg-[#2A4031] text-white font-semibold rounded-lg shadow-xs transition-colors">
                                Sign In or Register
                            </button>
                        </div>
                    </div>
                </div>

                <script>
                    async function loginDemo() {
                        try {
                            const res = await fetch('/api/auth/demo', { method: 'POST' });
                            const data = await res.json();
                            if (data.token) {
                                localStorage.setItem('cognitive_diary_session_token', data.token);
                                window.location.href = '/overview';
                            }
                        } catch (e) {
                            alert('Demo login failed');
                        }
                    }

                    async function loginWithEmail() {
                        const email = document.getElementById('loginEmail').value.trim();
                        if (!email) return alert('Enter email');
                        try {
                            const res = await fetch('/api/auth/register', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: email, displayName: email.split('@')[0] })
                            });
                            const data = await res.json();
                            if (data.token) {
                                localStorage.setItem('cognitive_diary_session_token', data.token);
                                window.location.href = '/overview';
                            }
                        } catch (e) {
                            alert('Sign in failed');
                        }
                    }
                </script>
            </body>
            </html>
            """.formatted(UiComponents.renderHead("Sign In"));
    }
}
