/**
 * AI Based Fitness Tracking System - AI Recommendation Engine UI (recommendations.js)
 * Displays Scikit-learn Random Forest & Rule-Based personalized workout & recovery plan
 */

async function loadRecommendations() {
    try {
        const res = await FitApp.apiRequest('/api/ai/recommendations');
        if (res.current_plan) {
            renderRecommendationPlan(res.current_plan);
        }
        if (res.history) {
            renderRecommendationHistory(res.history);
        }
    } catch (err) {
        FitApp.showToast(err.message || 'Failed to load AI recommendations.', 'error');
    }
}

function renderRecommendationPlan(plan) {
    const { model_info, user_snapshot, recommendations, generated_at } = plan;

    const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    // Header & ML Model Metadata
    setEl('aiArchetypeTitle', model_info.regimen_archetype);
    setEl('aiModelConfidence', `${model_info.model_confidence}% Confidence`);
    setEl('aiAlgorithmName', model_info.algorithm);
    setEl('aiGeneratedTimestamp', `Generated: ${generated_at}`);
    if (model_info.training_metrics) {
        setEl('aiModelAccuracy', `${model_info.training_metrics.classification_accuracy}%`);
        setEl('aiModelR2', model_info.training_metrics.regression_r2_score);
    }

    // User Snapshot Inputs Analyzed
    setEl('snapGoal', user_snapshot.fitness_goal);
    setEl('snapBmi', `${user_snapshot.bmi} (${user_snapshot.bmi_category})`);
    setEl('snapAvgSteps', user_snapshot.recent_avg_steps.toLocaleString());
    setEl('snapAvgDuration', `${user_snapshot.recent_avg_workout_mins} mins/day`);
    setEl('snapConsistency', `${user_snapshot.consistency_percent}%`);

    // Pre-fill simulator form
    const simGoal = document.getElementById('aiInputGoal');
    const simWeight = document.getElementById('aiInputWeight');
    const simSteps = document.getElementById('aiInputSteps');
    const simDuration = document.getElementById('aiInputDuration');
    if (simGoal && !simGoal.dataset.edited) simGoal.value = user_snapshot.fitness_goal;
    if (simWeight && !simWeight.dataset.edited) simWeight.value = user_snapshot.weight_kg;
    if (simSteps && !simSteps.dataset.edited) simSteps.value = user_snapshot.recent_avg_steps;
    if (simDuration && !simDuration.dataset.edited) simDuration.value = user_snapshot.recent_avg_workout_mins;

    // Key Numerical Targets
    setEl('recDurationVal', `${recommendations.suggested_workout_duration.minutes_per_day} mins / day`);
    setEl('recDurationWeekly', `${recommendations.suggested_workout_duration.weekly_total_minutes} mins / week`);
    setEl('recDurationRationale', recommendations.suggested_workout_duration.rationale);

    setEl('recStepsVal', `${recommendations.daily_step_target.steps.toLocaleString()} steps`);
    setEl('recStepsKm', `≈ ${recommendations.daily_step_target.distance_km_approx} km / day`);
    setEl('recStepsRationale', recommendations.daily_step_target.rationale);

    const calInfo = recommendations.calorie_and_activity_guidance;
    setEl('recIntakeVal', `${calInfo.recommended_dietary_intake_kcal.toLocaleString()} kcal`);
    setEl('recActiveBurnVal', `${calInfo.recommended_active_burn_kcal.toLocaleString()} kcal`);
    setEl('recTdeeSub', `BMR: ${calInfo.bmr_kcal} kcal | TDEE: ${calInfo.tdee_kcal} kcal`);
    setEl('recCalorieGuidanceText', calInfo.guidance_text);

    // 1. Structured 7-Day Workout Plan Table
    setEl('recPlanFocus', recommendations.daily_workout_plan.focus);
    setEl('recPlanIntensity', recommendations.daily_workout_plan.intensity);

    const scheduleBody = document.getElementById('aiWorkoutScheduleBody');
    if (scheduleBody && recommendations.daily_workout_plan.schedule) {
        scheduleBody.innerHTML = recommendations.daily_workout_plan.schedule.map(row => `
            <tr>
                <td class="fw-bold text-info">${FitApp.escapeHtml(row.day)}</td>
                <td class="fw-semibold">${FitApp.escapeHtml(row.session)}</td>
                <td><span class="badge-soft-emerald font-mono-metric">${FitApp.escapeHtml(row.duration)}</span></td>
                <td class="small text-secondary">${FitApp.escapeHtml(row.details)}</td>
            </tr>
        `).join('');
    }

    // 5. Recovery & Rest Suggestions
    const recoveryList = document.getElementById('aiRecoveryList');
    if (recoveryList && recommendations.recovery_and_rest_suggestions) {
        recoveryList.innerHTML = recommendations.recovery_and_rest_suggestions.map(tip => `
            <li class="d-flex align-items-start gap-3 mb-3">
                <span class="stat-card-icon icon-cyan flex-shrink-0" style="width:36px;height:36px;font-size:0.95rem;">
                    <i class="fa-solid fa-bed-pulse"></i>
                </span>
                <span class="small">${FitApp.escapeHtml(tip)}</span>
            </li>
        `).join('');
    }

    // 6. Weekly Fitness Improvement Suggestions
    const weeklyList = document.getElementById('aiWeeklyImprovementList');
    if (weeklyList && recommendations.weekly_improvement_suggestions) {
        weeklyList.innerHTML = recommendations.weekly_improvement_suggestions.map(tip => `
            <li class="d-flex align-items-start gap-3 mb-3">
                <span class="stat-card-icon icon-emerald flex-shrink-0" style="width:36px;height:36px;font-size:0.95rem;">
                    <i class="fa-solid fa-arrow-trend-up"></i>
                </span>
                <span class="small">${FitApp.escapeHtml(tip)}</span>
            </li>
        `).join('');
    }
}

function renderRecommendationHistory(historyItems) {
    const tbody = document.getElementById('aiHistoryTableBody');
    if (!tbody) return;
    if (!historyItems.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-3">No previous logs.</td></tr>`;
        return;
    }
    tbody.innerHTML = historyItems.map(h => `
        <tr>
            <td class="small text-secondary">${FitApp.escapeHtml(h.recommendation_date)}</td>
            <td><span class="badge-soft-emerald">${FitApp.escapeHtml(h.recommendation_type)}</span></td>
            <td class="font-mono-metric">${Number(h.daily_steps_target).toLocaleString()} steps</td>
            <td class="font-mono-metric">${h.workout_duration_target} mins/day</td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('recommendationsPageRoot')) return;

    loadRecommendations();

    const genForm = document.getElementById('generateAiPlanForm');
    if (genForm) {
        genForm.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('change', () => { el.dataset.edited = '1'; });
        });

        genForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = genForm.querySelector('button[type="submit"]');
            const orig = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Running AI Model...';

            try {
                const payload = {
                    fitness_goal: document.getElementById('aiInputGoal').value,
                    weight: parseFloat(document.getElementById('aiInputWeight').value),
                    daily_steps: parseInt(document.getElementById('aiInputSteps').value, 10),
                    workout_duration: parseInt(document.getElementById('aiInputDuration').value, 10)
                };

                const res = await FitApp.apiRequest('/api/ai/recommendations', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                FitApp.showToast(res.message || 'AI Recommendations updated!');
                renderRecommendationPlan(res.current_plan);
                await loadRecommendations();
            } catch (err) {
                FitApp.showToast(err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = orig;
            }
        });
    }
});
