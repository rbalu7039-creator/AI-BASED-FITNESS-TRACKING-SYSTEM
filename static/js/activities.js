/**
 * AI Based Fitness Tracking System - Activity Tracking Module (activities.js)
 * Handles Add, Edit, Delete, Search by Date, and Filter by Workout Type
 */

let allLoadedActivities = [];

async function fetchActivities() {
    const searchDate = document.getElementById('filterDateInput')?.value || '';
    const workoutType = document.getElementById('filterWorkoutSelect')?.value || 'All';

    const params = new URLSearchParams();
    if (searchDate) params.set('date', searchDate);
    if (workoutType && workoutType !== 'All') params.set('workout_type', workoutType);

    try {
        const res = await FitApp.apiRequest(`/api/activities?${params.toString()}`);
        allLoadedActivities = res.activities || [];
        renderActivitiesTable(allLoadedActivities);
        updateActivitySummaryBar(allLoadedActivities);
    } catch (err) {
        FitApp.showToast(err.message || 'Failed to load activities.', 'error');
    }
}

function updateActivitySummaryBar(items) {
    const totalCount = items.length;
    const totalSteps = items.reduce((acc, a) => acc + a.steps, 0);
    const totalCalories = Math.round(items.reduce((acc, a) => acc + a.calories_burned, 0));
    const totalDuration = items.reduce((acc, a) => acc + a.workout_duration, 0);

    const setEl = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setEl('actSummaryCount', totalCount);
    setEl('actSummarySteps', totalSteps.toLocaleString());
    setEl('actSummaryCalories', `${totalCalories.toLocaleString()} kcal`);
    setEl('actSummaryDuration', `${totalDuration.toLocaleString()} mins`);
}

function renderActivitiesTable(items) {
    const tbody = document.getElementById('activitiesTableBody');
    if (!tbody) return;

    if (!items.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5 text-secondary">
                    <i class="fa-solid fa-dumbbell fs-2 mb-2 d-block opacity-50"></i>
                    No fitness activity records match your current filter. Log a new workout using the form above!
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td class="fw-semibold">${FitApp.escapeHtml(item.activity_date)}</td>
            <td><span class="badge-soft-cyan">${FitApp.escapeHtml(item.workout_type)}</span></td>
            <td class="font-mono-metric">${item.weight} kg</td>
            <td class="font-mono-metric">${item.steps.toLocaleString()}</td>
            <td class="font-mono-metric">${item.calories_burned} kcal</td>
            <td class="font-mono-metric">${item.workout_duration} min</td>
            <td class="font-mono-metric">${item.water_intake} L</td>
            <td class="font-mono-metric">${item.sleep_duration} hrs</td>
            <td class="text-end">
                <button class="btn btn-sm btn-glass me-1" onclick="openEditActivityModal(${item.id})" title="Edit Record">
                    <i class="fa-solid fa-pen-to-square text-info"></i>
                </button>
                <button class="btn btn-sm btn-glass" onclick="deleteActivityRecord(${item.id})" title="Delete Record">
                    <i class="fa-solid fa-trash-can text-danger"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

window.openEditActivityModal = function (id) {
    const record = allLoadedActivities.find(a => a.id === id);
    if (!record) return;

    document.getElementById('editActivityId').value = record.id;
    document.getElementById('editDate').value = record.activity_date;
    document.getElementById('editWeight').value = record.weight;
    document.getElementById('editSteps').value = record.steps;
    document.getElementById('editCalories').value = record.calories_burned;
    document.getElementById('editDuration').value = record.workout_duration;
    document.getElementById('editWorkoutType').value = record.workout_type;
    document.getElementById('editWater').value = record.water_intake;
    document.getElementById('editSleep').value = record.sleep_duration;

    const modalEl = document.getElementById('editActivityModal');
    if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }
};

window.deleteActivityRecord = async function (id) {
    if (!confirm('Are you sure you want to delete this fitness activity record?')) return;
    try {
        const res = await FitApp.apiRequest(`/api/activities/${id}`, { method: 'DELETE' });
        FitApp.showToast(res.message || 'Activity deleted.');
        await fetchActivities();
    } catch (err) {
        FitApp.showToast(err.message, 'error');
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!document.getElementById('activitiesPageRoot')) return;

    // Default today's date in add form
    const dateInput = document.getElementById('addDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Load user's current weight to pre-fill the add activity form
    try {
        const prof = await FitApp.apiRequest('/api/profile');
        const weightInput = document.getElementById('addWeight');
        if (weightInput && prof.user) weightInput.value = prof.user.weight;
    } catch (_) {}

    await fetchActivities();

    // Add Activity Form
    const addForm = document.getElementById('addActivityForm');
    if (addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = addForm.querySelector('button[type="submit"]');
            const orig = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging...';

            try {
                const payload = {
                    activity_date: document.getElementById('addDate').value,
                    weight: parseFloat(document.getElementById('addWeight').value),
                    steps: parseInt(document.getElementById('addSteps').value, 10),
                    calories_burned: parseFloat(document.getElementById('addCalories').value),
                    workout_duration: parseInt(document.getElementById('addDuration').value, 10),
                    workout_type: document.getElementById('addWorkoutType').value,
                    water_intake: parseFloat(document.getElementById('addWater').value),
                    sleep_duration: parseFloat(document.getElementById('addSleep').value)
                };

                const res = await FitApp.apiRequest('/api/activities', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                FitApp.showToast(res.message);
                addForm.reset();
                document.getElementById('addDate').value = payload.activity_date;
                document.getElementById('addWeight').value = payload.weight;
                await fetchActivities();
            } catch (err) {
                FitApp.showToast(err.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = orig;
            }
        });
    }

    // Edit Activity Modal Form
    const editForm = document.getElementById('editActivityForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editActivityId').value;
            const submitBtn = editForm.querySelector('button[type="submit"]');
            const orig = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';

            try {
                const payload = {
                    activity_date: document.getElementById('editDate').value,
                    weight: parseFloat(document.getElementById('editWeight').value),
                    steps: parseInt(document.getElementById('editSteps').value, 10),
                    calories_burned: parseFloat(document.getElementById('editCalories').value),
                    workout_duration: parseInt(document.getElementById('editDuration').value, 10),
                    workout_type: document.getElementById('editWorkoutType').value,
                    water_intake: parseFloat(document.getElementById('editWater').value),
                    sleep_duration: parseFloat(document.getElementById('editSleep').value)
                };

                const res = await FitApp.apiRequest(`/api/activities/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                FitApp.showToast(res.message);

                const modalEl = document.getElementById('editActivityModal');
                if (modalEl && window.bootstrap) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }
                await fetchActivities();
            } catch (err) {
                FitApp.showToast(err.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = orig;
            }
        });
    }

    // Search & Filter Listeners
    document.getElementById('filterDateInput')?.addEventListener('change', fetchActivities);
    document.getElementById('filterWorkoutSelect')?.addEventListener('change', fetchActivities);
    document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
        document.getElementById('filterDateInput').value = '';
        document.getElementById('filterWorkoutSelect').value = 'All';
        fetchActivities();
    });
});
