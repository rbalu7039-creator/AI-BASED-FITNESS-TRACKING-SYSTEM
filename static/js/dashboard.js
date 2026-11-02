/**
 * AI Based Fitness Tracking System - Dashboard Module (dashboard.js)
 * Loads dynamic metrics, Fitness Score ring, Quick Activity Log, and BMI & BMR Calculators
 */

let dashboardTrendChart = null;

async function loadDashboard() {
    try {
        const data = await FitApp.apiRequest('/api/dashboard');
        renderDashboardSummary(data);
        renderDashboardChart(data.weekly_trend || [], data.goals);
        renderRecentActivitiesTable(data.recent_activities || []);
        prefillCalculators(data.user, data.bmi_details, data.bmr_details);
    } catch (err) {
        FitApp.showToast(err.message || 'Failed to load dashboard data.', 'error');
    }
}

function renderDashboardSummary(data) {
    const { user, summary, progress, goals, current_date, active_day_label } = data;

    // Welcome Header & Sidebar User Card
    const welcomeName = document.getElementById('dashUserName');
    if (welcomeName) welcomeName.textContent = user.full_name;

    const sbName = document.getElementById('sidebarUserName');
    if (sbName) sbName.textContent = user.full_name;
    const sbGoal = document.getElementById('sidebarUserGoal');
    if (sbGoal) sbGoal.textContent = user.fitness_goal;
    const sbInit = document.getElementById('sidebarUserInitial');
    if (sbInit && user.full_name) sbInit.textContent = user.full_name[0].toUpperCase();

    const dateEl = document.getElementById('dashCurrentDate');
    if (dateEl) dateEl.textContent = current_date;

    const goalBadge = document.getElementById('dashUserGoal');
    if (goalBadge) goalBadge.textContent = user.fitness_goal;

    const dayLabelEl = document.getElementById('dashActiveDayLabel');
    if (dayLabelEl) dayLabelEl.textContent = active_day_label;

    // 6 Summary Cards
    setText('cardWeight', `${summary.current_weight} kg`);
    setText('cardSteps', summary.daily_steps.toLocaleString());
    setText('cardCalories', `${summary.calories_burned} kcal`);
    setText('cardDuration', `${summary.workout_duration} min`);
    setText('cardBmi', summary.bmi);
    setText('cardBmiCat', summary.bmi_category);
    setText('cardScore', `${summary.fitness_score} / 100`);
    setText('cardScoreStatus', summary.fitness_status);

    // Progress Bars
    setText('progStepsLabel', `${summary.daily_steps.toLocaleString()} / ${goals.daily_step_goal.toLocaleString()} steps`);
    setText('progStepsPct', `${progress.steps_percent}%`);
    setBarWidth('progStepsBar', progress.steps_percent);

    setText('progCalLabel', `${summary.calories_burned} / ${goals.daily_calorie_goal} kcal`);
    setText('progCalPct', `${progress.calories_percent}%`);
    setBarWidth('progCalBar', progress.calories_percent);

    setText('progWorkLabel', `${summary.workout_duration} / ${goals.daily_workout_goal} mins`);
    setText('progWorkPct', `${progress.workout_percent}%`);
    setBarWidth('progWorkBar', progress.workout_percent);

    setText('progOverallPct', `${progress.daily_goal_completion}%`);
    setBarWidth('progOverallBar', progress.daily_goal_completion);

    // Circular Fitness Score SVG Ring
    const ringCircle = document.getElementById('fitnessScoreCircle');
    if (ringCircle) {
        const circumference = 440;
        const offset = circumference - (Math.min(100, Math.max(0, summary.fitness_score)) / 100) * circumference;
        ringCircle.style.strokeDashoffset = offset;
    }
    setText('ringScoreValue', summary.fitness_score);
    const statusBadge = document.getElementById('ringStatusBadge');
    if (statusBadge) {
        statusBadge.textContent = summary.fitness_status;
        statusBadge.className = 'badge rounded-pill px-3 py-2 fw-semibold ' +
            (summary.fitness_score >= 75 ? 'badge-soft-emerald' : summary.fitness_score >= 40 ? 'badge-soft-cyan' : 'badge-soft-amber');
    }

    if (summary.score_breakdown) {
        setText('bdStepsPts', `${summary.score_breakdown.steps_points} / 35`);
        setText('bdCalPts', `${summary.score_breakdown.calories_points} / 25`);
        setText('bdWorkPts', `${summary.score_breakdown.workout_points} / 25`);
        setText('bdRecPts', `${summary.score_breakdown.recovery_points} / 15`);
    }

    // Pre-fill Quick Log modal defaults
    const quickDate = document.getElementById('quickDate');
    if (quickDate && !quickDate.value) quickDate.value = data.current_date_iso;
    const quickWeight = document.getElementById('quickWeight');
    if (quickWeight) quickWeight.value = summary.current_weight;
}

function renderDashboardChart(trendList, goals) {
    const canvas = document.getElementById('dashWeeklyChart');
    if (!canvas) return;

    const labels = trendList.map(item => item.activity_date.slice(5));
    const stepsData = trendList.map(item => item.steps);
    const calData = trendList.map(item => item.calories_burned);

    if (dashboardTrendChart) {
        dashboardTrendChart.destroy();
    }

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const textColor = isLight ? '#475569' : '#94a3b8';
    const gridColor = isLight ? 'rgba(15, 23, 42, 0.07)' : 'rgba(255, 255, 255, 0.06)';

    dashboardTrendChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['No Data Yet'],
            datasets: [
                {
                    label: 'Daily Steps',
                    data: stepsData.length ? stepsData : [0],
                    backgroundColor: 'rgba(16, 185, 129, 0.75)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 8,
                    yAxisID: 'y'
                },
                {
                    label: 'Calories Burned (kcal)',
                    data: calData.length ? calData : [0],
                    type: 'line',
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.2)',
                    borderWidth: 3,
                    pointRadius: 4,
                    tension: 0.35,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { labels: { color: textColor, font: { family: 'Inter', weight: '600' } } }
            },
            scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: {
                    type: 'linear',
                    position: 'left',
                    ticks: { color: textColor },
                    grid: { color: gridColor },
                    title: { display: true, text: 'Steps', color: textColor }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    ticks: { color: textColor },
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'Calories (kcal)', color: textColor }
                }
            }
        }
    });
}

function renderRecentActivitiesTable(activities) {
    const tbody = document.getElementById('dashRecentTableBody');
    if (!tbody) return;

    if (!activities.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-secondary">
                    No fitness activities logged yet. Click <strong>"Log Today's Activity"</strong> above to record your first workout!
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = activities.map(act => `
        <tr>
            <td class="fw-semibold">${FitApp.escapeHtml(act.activity_date)}</td>
            <td><span class="badge-soft-cyan">${FitApp.escapeHtml(act.workout_type)}</span></td>
            <td class="font-mono-metric">${act.steps.toLocaleString()}</td>
            <td class="font-mono-metric">${act.calories_burned} kcal</td>
            <td class="font-mono-metric">${act.workout_duration} min</td>
            <td>
                <span class="${act.fitness_score >= 75 ? 'badge-soft-emerald' : act.fitness_score >= 40 ? 'badge-soft-cyan' : 'badge-soft-amber'}">
                    ${act.fitness_score} / 100
                </span>
            </td>
        </tr>
    `).join('');
}

function prefillCalculators(user, bmiDetails, bmrDetails) {
    const bmiWeight = document.getElementById('calcBmiWeight');
    const bmiHeight = document.getElementById('calcBmiHeight');
    if (bmiWeight && !bmiWeight.dataset.touched) bmiWeight.value = user.weight;
    if (bmiHeight && !bmiHeight.dataset.touched) bmiHeight.value = user.height;

    const bmrWeight = document.getElementById('calcBmrWeight');
    const bmrHeight = document.getElementById('calcBmrHeight');
    const bmrAge = document.getElementById('calcBmrAge');
    const bmrGender = document.getElementById('calcBmrGender');
    if (bmrWeight && !bmrWeight.dataset.touched) bmrWeight.value = user.weight;
    if (bmrHeight && !bmrHeight.dataset.touched) bmrHeight.value = user.height;
    if (bmrAge && !bmrAge.dataset.touched) bmrAge.value = user.age;
    if (bmrGender && !bmrGender.dataset.touched) bmrGender.value = user.gender;

    if (bmiDetails) displayBmiResult(bmiDetails);
    if (bmrDetails) displayBmrResult(bmrDetails);
}

function displayBmiResult(res) {
    setText('bmiResultValue', res.bmi);
    setText('bmiResultRange', res.healthy_weight_range);
    setText('bmiResultGuidance', res.guidance);

    const catBadge = document.getElementById('bmiResultCategory');
    if (catBadge) {
        catBadge.textContent = res.category;
        const badgeMap = {
            'Underweight': 'badge-soft-cyan',
            'Normal': 'badge-soft-emerald',
            'Overweight': 'badge-soft-amber',
            'Obese': 'badge-soft-rose'
        };
        catBadge.className = badgeMap[res.category] || 'badge-soft-emerald';
    }

    const pointer = document.getElementById('bmiScalePointer');
    if (pointer) {
        pointer.style.left = `${res.scale_percent}%`;
    }
}

function displayBmrResult(res) {
    setText('bmrResultValue', `${res.bmr.toLocaleString()} kcal/day`);
    setText('tdeeResultValue', `${res.tdee.toLocaleString()} kcal/day`);
    setText('bmrFormulaText', res.formula_used);
    setText('bmrExplanationText', res.explanation);

    if (res.calorie_targets) {
        setText('tdeeWeightLoss', `${res.calorie_targets.weight_loss.toLocaleString()} kcal`);
        setText('tdeeMaintenance', `${res.calorie_targets.maintenance.toLocaleString()} kcal`);
        setText('tdeeMuscleGain', `${res.calorie_targets.muscle_gain.toLocaleString()} kcal`);
    }
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function setBarWidth(id, pct) {
    const el = document.getElementById(id);
    if (el) el.style.width = `${Math.min(100, Math.max(0, pct))}%`;
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('dashboardPageRoot')) return;

    loadDashboard();

    window.addEventListener('themeChanged', () => {
        loadDashboard();
    });

    // Quick Log Activity Form in Dashboard Modal
    const quickForm = document.getElementById('quickLogForm');
    if (quickForm) {
        quickForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = quickForm.querySelector('button[type="submit"]');
            const orig = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

            try {
                const payload = {
                    activity_date: document.getElementById('quickDate').value,
                    weight: parseFloat(document.getElementById('quickWeight').value),
                    steps: parseInt(document.getElementById('quickSteps').value, 10),
                    calories_burned: parseFloat(document.getElementById('quickCalories').value),
                    workout_duration: parseInt(document.getElementById('quickDuration').value, 10),
                    workout_type: document.getElementById('quickWorkoutType').value,
                    water_intake: parseFloat(document.getElementById('quickWater').value),
                    sleep_duration: parseFloat(document.getElementById('quickSleep').value)
                };

                const res = await FitApp.apiRequest('/api/activities', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                FitApp.showToast(res.message || 'Activity logged!');
                const modalEl = document.getElementById('quickLogModal');
                if (modalEl && window.bootstrap) {
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) modalInstance.hide();
                }
                await loadDashboard();
            } catch (err) {
                FitApp.showToast(err.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = orig;
            }
        });
    }

    // BMI Calculator Form
    const bmiForm = document.getElementById('bmiCalculatorForm');
    if (bmiForm) {
        bmiForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const weight = parseFloat(document.getElementById('calcBmiWeight').value);
                const height = parseFloat(document.getElementById('calcBmiHeight').value);
                document.getElementById('calcBmiWeight').dataset.touched = '1';
                document.getElementById('calcBmiHeight').dataset.touched = '1';

                const res = await FitApp.apiRequest('/api/calculate-bmi', {
                    method: 'POST',
                    body: JSON.stringify({ weight, height })
                });
                displayBmiResult(res.data);
                FitApp.showToast(`BMI Calculated: ${res.data.bmi} (${res.data.category})`);
            } catch (err) {
                FitApp.showToast(err.message, 'error');
            }
        });
    }

    // BMR Calculator Form
    const bmrForm = document.getElementById('bmrCalculatorForm');
    if (bmrForm) {
        bmrForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const payload = {
                    weight: parseFloat(document.getElementById('calcBmrWeight').value),
                    height: parseFloat(document.getElementById('calcBmrHeight').value),
                    age: parseInt(document.getElementById('calcBmrAge').value, 10),
                    gender: document.getElementById('calcBmrGender').value,
                    activity_level: document.getElementById('calcBmrActivity').value
                };
                document.getElementById('calcBmrWeight').dataset.touched = '1';

                const res = await FitApp.apiRequest('/api/calculate-bmr', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                displayBmrResult(res.data);
                FitApp.showToast(`BMR: ${res.data.bmr} kcal | TDEE: ${res.data.tdee} kcal`);
            } catch (err) {
                FitApp.showToast(err.message, 'error');
            }
        });
    }

    // Smooth scroll for Calculate BMI quick action button
    const scrollCalcBtn = document.getElementById('btnScrollToCalculators');
    if (scrollCalcBtn) {
        scrollCalcBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const section = document.getElementById('calculatorsSection');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        });
    }
});
