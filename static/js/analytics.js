/**
 * AI Based Fitness Tracking System - Progress Analytics Module (analytics.js)
 * Renders 6 interactive Chart.js charts with Daily, Weekly, Monthly & Date Range filters
 */

const analyticsCharts = {};
let currentFilterMode = 'weekly';

async function loadAnalytics(mode = 'weekly', customStart = '', customEnd = '') {
    currentFilterMode = mode;

    const endpoint = mode === 'monthly' ? '/api/analytics/monthly' : '/api/analytics/weekly';
    const params = new URLSearchParams();
    params.set('mode', mode);
    if (customStart) params.set('start_date', customStart);
    if (customEnd) params.set('end_date', customEnd);

    try {
        const [rangeData, monthlyData] = await Promise.all([
            FitApp.apiRequest(`${endpoint}?${params.toString()}`),
            FitApp.apiRequest('/api/analytics/monthly')
        ]);

        // Populate date inputs with active range
        const startInput = document.getElementById('analyticsStartDate');
        const endInput = document.getElementById('analyticsEndDate');
        if (startInput && !customStart) startInput.value = rangeData.start_date;
        if (endInput && !customEnd) endInput.value = rangeData.end_date;

        const emptyState = document.getElementById('analyticsEmptyState');
        const contentWrap = document.getElementById('analyticsContentWrap');

        if (!rangeData.has_data) {
            if (emptyState) emptyState.classList.remove('d-none');
            if (contentWrap) contentWrap.classList.add('d-none');
            return;
        } else {
            if (emptyState) emptyState.classList.add('d-none');
            if (contentWrap) contentWrap.classList.remove('d-none');
        }

        renderAnalyticsSummary(rangeData.summary, rangeData.comparison);
        renderAllAnalyticsCharts(rangeData.records, monthlyData.records, rangeData.goals);
    } catch (err) {
        FitApp.showToast(err.message || 'Failed to load analytics.', 'error');
    }
}

function renderAnalyticsSummary(summary, comparison) {
    const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setEl('anAvgSteps', summary.avg_steps.toLocaleString());
    setEl('anTotalSteps', `${summary.total_steps.toLocaleString()} total steps`);
    setEl('anAvgCalories', `${summary.avg_calories} kcal`);
    setEl('anTotalCalories', `${summary.total_calories.toLocaleString()} total kcal`);
    setEl('anAvgWorkout', `${summary.avg_workout_mins} mins`);
    setEl('anTotalWorkout', `${summary.total_workout_mins} total mins`);
    setEl('anWeightChange', `${summary.weight_change > 0 ? '+' : ''}${summary.weight_change} kg`);
    setEl('anWeightSpan', `${summary.start_weight} kg → ${summary.end_weight} kg`);
    setEl('anGoalCompletion', `${summary.goal_completion_percent}%`);
    setEl('anAvgScore', `${summary.avg_fitness_score} / 100`);

    const goalBar = document.getElementById('anGoalCompletionBar');
    if (goalBar) goalBar.style.width = `${summary.goal_completion_percent}%`;

    const formatComp = (id, pct) => {
        const el = document.getElementById(id);
        if (!el) return;
        const sign = pct >= 0 ? '+' : '';
        el.textContent = `${sign}${pct}% vs prior half`;
        el.className = `small fw-semibold ${pct >= 0 ? 'text-success' : 'text-warning'}`;
    };

    if (comparison) {
        formatComp('anCompSteps', comparison.steps_change_pct);
        formatComp('anCompCalories', comparison.calories_change_pct);
        formatComp('anCompWorkout', comparison.workout_change_pct);
    }
}

function getChartThemeColors() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    return {
        textColor: isLight ? '#475569' : '#94a3b8',
        gridColor: isLight ? 'rgba(15, 23, 42, 0.07)' : 'rgba(255, 255, 255, 0.06)'
    };
}

function createOrReplaceChart(key, canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (analyticsCharts[key]) {
        analyticsCharts[key].destroy();
    }
    analyticsCharts[key] = new Chart(canvas, config);
}

function renderAllAnalyticsCharts(records, monthlyRecords, goals) {
    const { textColor, gridColor } = getChartThemeColors();
    const labels = records.map(r => r.activity_date.slice(5));
    const stepsArr = records.map(r => r.steps);
    const weightArr = records.map(r => r.weight);
    const calArr = records.map(r => r.calories_burned);
    const durArr = records.map(r => r.workout_duration);
    const scoreArr = records.map(r => r.fitness_score);

    const mLabels = monthlyRecords.map(r => r.activity_date.slice(5));
    const mStepsArr = monthlyRecords.map(r => r.steps);

    const commonScales = {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor }, grid: { color: gridColor } }
    };

    // 1. Weekly / Filtered Steps Chart
    createOrReplaceChart('weeklySteps', 'chartWeeklySteps', {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Daily Steps',
                    data: stepsArr,
                    backgroundColor: 'rgba(16, 185, 129, 0.78)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor } } },
            scales: commonScales
        }
    });

    // 2. Monthly Steps Trend Chart (30-Day Overview)
    createOrReplaceChart('monthlySteps', 'chartMonthlySteps', {
        type: 'line',
        data: {
            labels: mLabels,
            datasets: [
                {
                    label: '30-Day Steps Trajectory',
                    data: mStepsArr,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.16)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor } } },
            scales: commonScales
        }
    });

    // 3. Weight Changes Chart
    createOrReplaceChart('weightTrend', 'chartWeightChanges', {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Body Weight (kg)',
                    data: weightArr,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.18)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#6366f1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor } } },
            scales: commonScales
        }
    });

    // 4. Calories Burned Chart
    createOrReplaceChart('caloriesBurned', 'chartCaloriesBurned', {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Active Calories Burned (kcal)',
                    data: calArr,
                    backgroundColor: 'rgba(245, 158, 11, 0.78)',
                    borderColor: '#f59e0b',
                    borderWidth: 1,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor } } },
            scales: commonScales
        }
    });

    // 5. Workout Duration Chart
    createOrReplaceChart('workoutDuration', 'chartWorkoutDuration', {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Workout Duration (mins)',
                    data: durArr,
                    borderColor: '#ec4899',
                    backgroundColor: 'rgba(236, 72, 153, 0.18)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor } } },
            scales: commonScales
        }
    });

    // 6. Fitness Score Trends Chart
    createOrReplaceChart('fitnessScore', 'chartFitnessScore', {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Daily Fitness Score (/100)',
                    data: scoreArr,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor } } },
            scales: {
                x: commonScales.x,
                y: { min: 0, max: 100, ticks: { color: textColor }, grid: { color: gridColor } }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('analyticsPageRoot')) return;

    loadAnalytics('weekly');

    // Period filter buttons (Daily 7d, Weekly 7d, Monthly 30d)
    document.querySelectorAll('[data-analytics-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-analytics-mode]').forEach(b => b.classList.remove('btn-brand'));
            document.querySelectorAll('[data-analytics-mode]').forEach(b => b.classList.add('btn-glass'));
            btn.classList.remove('btn-glass');
            btn.classList.add('btn-brand');

            const mode = btn.getAttribute('data-analytics-mode');
            loadAnalytics(mode);
        });
    });

    // Custom Date Range Filter
    const rangeForm = document.getElementById('dateRangeFilterForm');
    if (rangeForm) {
        rangeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const start = document.getElementById('analyticsStartDate').value;
            const end = document.getElementById('analyticsEndDate').value;
            if (start && end && start > end) {
                FitApp.showToast('Start date cannot be after end date.', 'error');
                return;
            }
            loadAnalytics(currentFilterMode, start, end);
        });
    }

    window.addEventListener('themeChanged', () => {
        loadAnalytics(currentFilterMode);
    });
});
