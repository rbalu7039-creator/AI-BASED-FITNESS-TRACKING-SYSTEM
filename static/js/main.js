/**
 * AI Based Fitness Tracking System - Core Frontend Utilities (main.js)
 * Handles Dark/Light Theme, CSRF API Wrapper, Toast Notifications, Auth & Profile Forms
 */

const FitApp = {
    getApiBase() {
        if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000')) {
            return 'http://127.0.0.1:5000';
        }
        return '';
    },

    getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        const content = meta ? meta.getAttribute('content') : '';
        return content && !content.includes('{{') ? content : '';
    },

    async apiRequest(url, options = {}) {
        const fullUrl = url.startsWith('http') ? url : `${this.getApiBase()}${url}`;
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.getCsrfToken(),
            ...(options.headers || {})
        };

        const response = await fetch(fullUrl, {
            credentials: 'include',
            ...options,
            headers
        });

        let data = {};
        try {
            data = await response.json();
        } catch (err) {
            data = { success: false, error: 'Unexpected server response.' };
        }

        if (response.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
            window.location.href = `${this.getApiBase()}/login`;
            throw new Error('Session expired. Redirecting to login...');
        }

        if (!response.ok || data.success === false) {
            throw new Error(data.error || `Request failed (${response.status})`);
        }

        return data;
    },

    showToast(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `custom-toast ${type === 'error' ? 'toast-error' : ''}`;
        const iconClass = type === 'error' ? 'fa-circle-exclamation text-danger' : 'fa-circle-check text-success';
        toast.innerHTML = `
            <i class="fa-solid ${iconClass} fs-5"></i>
            <div class="small fw-medium">${this.escapeHtml(message)}</div>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = 'all 0.25s ease';
            setTimeout(() => toast.remove(), 260);
        }, 3800);
    },

    escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    initTheme() {
        const savedTheme = localStorage.getItem('fitai_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeButtons(savedTheme);

        document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme') || 'dark';
                const next = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('fitai_theme', next);
                this.updateThemeButtons(next);
                window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: next } }));
            });
        });
    },

    updateThemeButtons(theme) {
        document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
            const icon = btn.querySelector('i');
            const label = btn.querySelector('.theme-label');
            if (icon) {
                icon.className = theme === 'dark' ? 'fa-solid fa-sun text-warning' : 'fa-solid fa-moon text-primary';
            }
            if (label) {
                label.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
            }
        });
    },

    initSidebar() {
        const sidebar = document.getElementById('appSidebar');
        const backdrop = document.getElementById('sidebarBackdrop');
        const toggleBtns = document.querySelectorAll('[data-action="toggle-sidebar"]');

        if (!sidebar) return;

        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                sidebar.classList.toggle('show');
                if (backdrop) backdrop.classList.toggle('show');
            });
        });

        if (backdrop) {
            backdrop.addEventListener('click', () => {
                sidebar.classList.remove('show');
                backdrop.classList.remove('show');
            });
        }
    },

    initPasswordToggles() {
        document.querySelectorAll('[data-toggle-password]').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-toggle-password');
                const input = document.getElementById(targetId);
                if (!input) return;
                const isPwd = input.type === 'password';
                input.type = isPwd ? 'text' : 'password';
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = isPwd ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
                }
            });
        });
    },

    initLogout() {
        document.querySelectorAll('[data-action="logout"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await this.apiRequest('/api/logout', { method: 'POST' });
                } catch (_) {
                    // Proceed to login page regardless
                }
                window.location.href = '/login';
            });
        });
    },

    initAuthForms() {
        // Login Form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            const demoFillBtn = document.getElementById('fillDemoBtn');
            if (demoFillBtn) {
                demoFillBtn.addEventListener('click', () => {
                    document.getElementById('loginEmail').value = 'demo@fitai.com';
                    document.getElementById('loginPassword').value = 'Demo@1234';
                    this.showToast('Demo credentials filled! Click Sign In to continue.');
                });
            }

            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value;

                if (!email || !password) {
                    this.showToast('Please enter both email and password.', 'error');
                    return;
                }

                const origHtml = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';

                try {
                    const res = await this.apiRequest('/api/login', {
                        method: 'POST',
                        body: JSON.stringify({ email, password })
                    });
                    this.showToast(res.message || 'Login successful!');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 450);
                } catch (err) {
                    this.showToast(err.message, 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origHtml;
                }
            });
        }

        // Registration Form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                const payload = {
                    full_name: document.getElementById('regFullName').value.trim(),
                    email: document.getElementById('regEmail').value.trim(),
                    password: document.getElementById('regPassword').value,
                    age: parseInt(document.getElementById('regAge').value, 10),
                    gender: document.getElementById('regGender').value,
                    height: parseFloat(document.getElementById('regHeight').value),
                    weight: parseFloat(document.getElementById('regWeight').value),
                    fitness_goal: document.getElementById('regGoal').value
                };

                const origHtml = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating Account...';

                try {
                    const res = await this.apiRequest('/api/register', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                    this.showToast(res.message || 'Account created!');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 500);
                } catch (err) {
                    this.showToast(err.message, 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origHtml;
                }
            });
        }
    },

    initProfilePage() {
        const profileForm = document.getElementById('profileUpdateForm');
        const goalsForm = document.getElementById('goalsUpdateForm');
        if (!profileForm && !goalsForm) return;

        const loadProfileData = async () => {
            try {
                const res = await this.apiRequest('/api/profile');
                const u = res.user;
                const g = res.goals;

                if (profileForm) {
                    document.getElementById('profFullName').value = u.full_name;
                    document.getElementById('profEmail').value = u.email;
                    document.getElementById('profAge').value = u.age;
                    document.getElementById('profGender').value = u.gender;
                    document.getElementById('profHeight').value = u.height;
                    document.getElementById('profWeight').value = u.weight;
                    document.getElementById('profGoal').value = u.fitness_goal;
                }

                if (goalsForm && g) {
                    document.getElementById('goalSteps').value = g.daily_step_goal;
                    document.getElementById('goalCalories').value = g.daily_calorie_goal;
                    document.getElementById('goalWorkout').value = g.daily_workout_goal;
                }

                // Update profile summary badges
                const bmiBadge = document.getElementById('profSummaryBmi');
                const bmrBadge = document.getElementById('profSummaryBmr');
                const tdeeBadge = document.getElementById('profSummaryTdee');
                if (bmiBadge && res.bmi_details) {
                    bmiBadge.textContent = `${res.bmi_details.bmi} (${res.bmi_details.category})`;
                }
                if (bmrBadge && res.bmr_details) {
                    bmrBadge.textContent = `${res.bmr_details.bmr} kcal/day`;
                }
                if (tdeeBadge && res.bmr_details) {
                    tdeeBadge.textContent = `${res.bmr_details.tdee} kcal/day`;
                }
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        };

        loadProfileData();

        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = profileForm.querySelector('button[type="submit"]');
                const orig = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
                try {
                    const payload = {
                        full_name: document.getElementById('profFullName').value.trim(),
                        age: parseInt(document.getElementById('profAge').value, 10),
                        gender: document.getElementById('profGender').value,
                        height: parseFloat(document.getElementById('profHeight').value),
                        weight: parseFloat(document.getElementById('profWeight').value),
                        fitness_goal: document.getElementById('profGoal').value
                    };
                    const res = await this.apiRequest('/api/profile', {
                        method: 'PUT',
                        body: JSON.stringify(payload)
                    });
                    this.showToast(res.message);
                    await loadProfileData();
                } catch (err) {
                    this.showToast(err.message, 'error');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = orig;
                }
            });
        }

        if (goalsForm) {
            goalsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = goalsForm.querySelector('button[type="submit"]');
                const orig = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating Goals...';
                try {
                    const payload = {
                        daily_step_goal: parseInt(document.getElementById('goalSteps').value, 10),
                        daily_calorie_goal: parseFloat(document.getElementById('goalCalories').value),
                        daily_workout_goal: parseInt(document.getElementById('goalWorkout').value, 10)
                    };
                    const res = await this.apiRequest('/api/goals', {
                        method: 'PUT',
                        body: JSON.stringify(payload)
                    });
                    this.showToast(res.message);
                } catch (err) {
                    this.showToast(err.message, 'error');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = orig;
                }
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    FitApp.initTheme();
    FitApp.initSidebar();
    FitApp.initPasswordToggles();
    FitApp.initLogout();
    FitApp.initAuthForms();
    FitApp.initProfilePage();
});
