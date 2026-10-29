/**
 * FitAI Pulse - AI Nutrition & Macro Planner Engine
 */

(function () {
    'use strict';

    let macroChart = null;
    let loggedWaterMl = 1500;

    const mealsDatabase = [
        {
            goal: 'Weight Loss',
            breakfast: { name: 'Egg White Veggie Omelet & Berries', cal: 380, pro: '34g', desc: '4 egg whites, 1 whole egg, spinach, tomatoes, and 1/2 cup blueberries.' },
            lunch: { name: 'Grilled Lemon Herb Chicken & Quinoa', cal: 520, pro: '46g', desc: '170g grilled chicken, 1/2 cup cooked quinoa, steamed broccoli with olive oil.' },
            snack: { name: 'Whey Protein Shake & Rice Cake', cal: 210, pro: '27g', desc: '1 scoop isolate whey with water, 1 rice cake with 1 tbsp peanut butter.' },
            dinner: { name: 'Seared White Fish & Mediterranean Salad', cal: 460, pro: '40g', desc: '200g cod or tilapia, cucumber, olives, feta, olive oil and lemon.' }
        },
        {
            goal: 'Muscle Building',
            breakfast: { name: 'Loaded Power Oatmeal & Scrambled Eggs', cal: 680, pro: '48g', desc: '80g oats, scoop whey, banana, honey, with 3 whole scrambled eggs on the side.' },
            lunch: { name: 'Lean Beef Sirloin, Basmati Rice & Asparagus', cal: 750, pro: '58g', desc: '200g sirloin beef, 1.5 cups jasmine rice, grilled asparagus.' },
            snack: { name: 'Greek Yogurt, Mixed Nuts & Granola', cal: 420, pro: '32g', desc: '250g Greek yogurt, 30g walnuts, 20g organic honey granola.' },
            dinner: { name: 'Herb Salmon, Roasted Potatoes & Greens', cal: 710, pro: '52g', desc: '220g Atlantic salmon, 250g roasted potato wedges, garlic green beans.' }
        },
        {
            goal: 'Endurance',
            breakfast: { name: 'Banana Berry Smoothie Bowl & Chia Seeds', cal: 510, pro: '24g', desc: 'Almond milk, 2 bananas, chia seeds, flax seeds, and granola crunch.' },
            lunch: { name: 'Whole Grain Pasta with Turkey Meatballs', cal: 680, pro: '44g', desc: '120g whole grain pasta, marinara sauce, 180g lean minced turkey meatballs.' },
            snack: { name: 'Apple Slices with Almond Butter & Pretzels', cal: 290, pro: '10g', desc: '1 large Honeycrisp apple, 2 tbsp natural almond butter, salted pretzels.' },
            dinner: { name: 'Teriyaki Chicken Rice Bowl & Edamame', cal: 620, pro: '45g', desc: '180g chicken thigh, teriyaki glaze, brown rice, edamame and bell peppers.' }
        }
    ];

    function initMacroChart() {
        const ctx = document.getElementById('macroDonutChart');
        if (!ctx) return;

        macroChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Protein (30%)', 'Carbohydrates (45%)', 'Fats (25%)'],
                datasets: [{
                    data: [30, 45, 25],
                    backgroundColor: ['#06b6d4', '#f59e0b', '#f43f5e'],
                    borderWidth: 2,
                    borderColor: 'rgba(15, 23, 42, 0.9)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    function renderMeals(plan) {
        const container = document.getElementById('mealsContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="col-md-6">
                <div class="p-3 rounded-3 border h-100" style="border-color: var(--border-glass) !important; background: rgba(16,185,129,0.04);">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="badge bg-success-subtle text-success fw-bold">BREAKFAST &bull; ~${plan.breakfast.cal} kcal</span>
                        <span class="small text-secondary">${plan.breakfast.pro} Protein</span>
                    </div>
                    <div class="fw-bold">${plan.breakfast.name}</div>
                    <div class="small text-secondary mt-1">${plan.breakfast.desc}</div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="p-3 rounded-3 border h-100" style="border-color: var(--border-glass) !important; background: rgba(6,182,212,0.04);">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="badge bg-info-subtle text-info fw-bold">LUNCH &bull; ~${plan.lunch.cal} kcal</span>
                        <span class="small text-secondary">${plan.lunch.pro} Protein</span>
                    </div>
                    <div class="fw-bold">${plan.lunch.name}</div>
                    <div class="small text-secondary mt-1">${plan.lunch.desc}</div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="p-3 rounded-3 border h-100" style="border-color: var(--border-glass) !important; background: rgba(245,158,11,0.04);">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="badge bg-warning-subtle text-warning fw-bold">SNACK &bull; ~${plan.snack.cal} kcal</span>
                        <span class="small text-secondary">${plan.snack.pro} Protein</span>
                    </div>
                    <div class="fw-bold">${plan.snack.name}</div>
                    <div class="small text-secondary mt-1">${plan.snack.desc}</div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="p-3 rounded-3 border h-100" style="border-color: var(--border-glass) !important; background: rgba(99,102,241,0.04);">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="badge bg-primary-subtle text-primary fw-bold">DINNER &bull; ~${plan.dinner.cal} kcal</span>
                        <span class="small text-secondary">${plan.dinner.pro} Protein</span>
                    </div>
                    <div class="fw-bold">${plan.dinner.name}</div>
                    <div class="small text-secondary mt-1">${plan.dinner.desc}</div>
                </div>
            </div>
        `;
    }

    async function addWaterIntake() {
        loggedWaterMl += 250;
        const liters = (loggedWaterMl / 1000).toFixed(1);
        const waterDisplay = document.getElementById('nutriCurrentWater');
        if (waterDisplay) waterDisplay.textContent = `/ ${liters}L logged`;

        const toastEl = document.getElementById('nutriToast');
        const toastMsg = document.getElementById('nutriToastMessage');
        if (toastMsg) toastMsg.textContent = `Hydration updated! Logged ${liters}L of water today (+250ml)`;
        if (toastEl && window.bootstrap) {
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        }

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        try {
            await fetch('/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({
                    activity_date: new Date().toISOString().split('T')[0],
                    water_intake: 0.25,
                    workout_type: 'Other',
                    workout_duration: 0,
                    calories_burned: 0,
                    steps: 0,
                    sleep_duration: 7.5
                })
            });
        } catch (e) {
            console.warn('Water sync note:', e);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initMacroChart();

        const btnLogWater = document.getElementById('btnLogDailyWater');
        if (btnLogWater) btnLogWater.addEventListener('click', addWaterIntake);

        const btnRefreshMeals = document.getElementById('btnRefreshMeals');
        if (btnRefreshMeals) {
            btnRefreshMeals.addEventListener('click', () => {
                const randomPlan = mealsDatabase[Math.floor(Math.random() * mealsDatabase.length)];
                renderMeals(randomPlan);
            });
        }
    });

})();
