/**
 * FitAI Pulse - AI Video Workout Studio Engine
 * Interactive Video Training & Direct Activity Sync
 */

(function () {
    'use strict';

    // Video Routines Database
    const workoutRoutines = [
        {
            title: "Bodyweight Squats & Leg Power Mastery",
            category: "STRENGTH • MASTERCLASS",
            filterCat: "strength",
            level: "All Levels",
            duration: "15 Mins",
            durationNum: 15,
            calories: "~140 kcal",
            caloriesNum: 140,
            sets: "3 Sets • 15 Reps",
            videoEmbed: "https://www.youtube.com/embed/aclHkVaku9U?rel=0&enablejsapi=1&autoplay=1",
            desc: "Learn optimal hip-hinge mechanics, knee alignment, and 90° depth control to maximize glute and quad engagement without spinal strain.",
            checkpoints: [
                "Maintain neutral lumbar spine; avoid rounding or hyperextending back",
                "Descend until hip crease is below knee cap (<90° depth)",
                "Keep knees tracking over 2nd & 3rd toes (prevent valgus collapse)"
            ],
            muscles: ["Quadriceps", "Gluteus Maximus", "Hamstrings & Core"]
        },
        {
            title: "Dumbbell Bicep & Arm Sculpt",
            category: "STRENGTH • HYPERTROPHY",
            filterCat: "strength",
            level: "All Levels",
            duration: "18 Mins",
            durationNum: 18,
            calories: "~150 kcal",
            caloriesNum: 150,
            sets: "4 Sets • 12 Reps",
            videoEmbed: "https://www.youtube.com/embed/ykJmrZ5v0Oo?rel=0&enablejsapi=1&autoplay=1",
            desc: "Lock in strict elbow positioning, eliminate back swing momentum, and master continuous tension throughout the concentric and eccentric phases.",
            checkpoints: [
                "Keep elbows pinned to ribcage; do not flare outwards",
                "Rotate palms upward (supination) at the apex for peak biceps contraction",
                "Control the eccentric (lowering) phase for a minimum of 2 seconds"
            ],
            muscles: ["Biceps Brachii", "Brachialis", "Forearms"]
        },
        {
            title: "Explosive Metabolic HIIT Shred",
            category: "HIIT • FAT BURN",
            filterCat: "hiit",
            level: "High Intensity",
            duration: "22 Mins",
            durationNum: 22,
            calories: "~260 kcal",
            caloriesNum: 260,
            sets: "5 Rounds • 40s On / 20s Off",
            videoEmbed: "https://www.youtube.com/embed/ml6cT4AZdqI?rel=0&enablejsapi=1&autoplay=1",
            desc: "High-metabolic output circuit combining burpees, jump squats, speed skaters, and mountain climbers designed for sustained EPOC caloric burn.",
            checkpoints: [
                "Absorb landing impact through midfoot with bent knees",
                "Maintain rapid diaphragmatic breathing rhythm during rest intervals",
                "Drive through heels explosively on jump transitions"
            ],
            muscles: ["Full Body", "Cardiovascular", "Calves & Core"]
        },
        {
            title: "Push-Up Mechanics & Chest Form",
            category: "STRENGTH • UPPER BODY",
            filterCat: "strength",
            level: "All Levels",
            duration: "15 Mins",
            durationNum: 15,
            calories: "~135 kcal",
            caloriesNum: 135,
            sets: "4 Sets • 15 Reps",
            videoEmbed: "https://www.youtube.com/embed/IODxDxX7oi4?rel=0&enablejsapi=1&autoplay=1",
            desc: "Scapular protraction, 45° elbow tuck angle, and full chest-to-floor depth for comprehensive chest, shoulder, and triceps development.",
            checkpoints: [
                "Position hands slightly wider than shoulder width; fingers spread wide",
                "Tuck elbows at 45 degrees relative to torso (avoid T-shape flare)",
                "Engage glutes and brace core into a solid rigid hollow-body plank"
            ],
            muscles: ["Pectoralis Major", "Triceps Brachii", "Anterior Deltoids"]
        },
        {
            title: "360° Core Stability & Six-Pack Conditioning",
            category: "CORE • ABS",
            filterCat: "core",
            level: "Intermediate",
            duration: "14 Mins",
            durationNum: 14,
            calories: "~120 kcal",
            caloriesNum: 120,
            sets: "3 Rounds • 45s Work",
            videoEmbed: "https://www.youtube.com/embed/1919eTCoESo?rel=0&enablejsapi=1&autoplay=1",
            desc: "Comprehensive anterior and rotational core training utilizing deadbugs, hollow holds, Russian twists, and side planks for spinal protection.",
            checkpoints: [
                "Press lower back firmly flat against floor on supine movements",
                "Initiate torso rotation from thoracic spine rather than jerking neck",
                "Maintain constant tension on transverse abdominis throughout"
            ],
            muscles: ["Rectus Abdominis", "Internal & External Obliques", "Transverse Abs"]
        },
        {
            title: "Full Body Mobility & Spinal Decompression Yoga",
            category: "YOGA • ACTIVE RECOVERY",
            filterCat: "mobility",
            level: "All Levels",
            duration: "20 Mins",
            durationNum: 20,
            calories: "~95 kcal",
            caloriesNum: 95,
            sets: "Continuous Flow",
            videoEmbed: "https://www.youtube.com/embed/v7AYKMP6rOE?rel=0&enablejsapi=1&autoplay=1",
            desc: "Targeted mobility flows opening up tight hip flexors, lengthening hamstrings, decompressing the lumbar spine, and inducing parasympathetic recovery.",
            checkpoints: [
                "Sync deep nasal inhalations and extended exhalations with pose transitions",
                "Never force joint range of motion into sharp pain; honor your natural boundaries",
                "Lengthen cervical spine by keeping eye gaze relaxed"
            ],
            muscles: ["Hip Flexors", "Thoracic Spine", "Hamstrings & Shoulders"]
        }
    ];

    let currentWorkoutIndex = 0;

    // Audio chime for workout completion
    function playSuccessChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;
            
            // First note
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.frequency.setValueAtTime(523.25, now); // C5
            gain1.gain.setValueAtTime(0.15, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.2);

            // Second note
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
            gain2.gain.setValueAtTime(0.15, now + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.15);
            osc2.stop(now + 0.35);

            // Third note
            const osc3 = ctx.createOscillator();
            const gain3 = ctx.createGain();
            osc3.frequency.setValueAtTime(783.99, now + 0.3); // G5
            gain3.gain.setValueAtTime(0.2, now + 0.3);
            gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            osc3.connect(gain3);
            gain3.connect(ctx.destination);
            osc3.start(now + 0.3);
            osc3.stop(now + 0.6);
        } catch (e) {
            console.warn('Audio Context error:', e);
        }
    }

    // Switch Featured Video Player
    function selectWorkout(index) {
        if (index < 0 || index >= workoutRoutines.length) return;
        currentWorkoutIndex = index;
        const w = workoutRoutines[index];

        const iframe = document.getElementById('mainWorkoutIframe');
        const catBadge = document.getElementById('featuredCategory');
        const levelBadge = document.getElementById('featuredLevel');
        const titleEl = document.getElementById('featuredTitle');
        const descEl = document.getElementById('featuredDesc');
        const durationEl = document.getElementById('featuredDuration');
        const calEl = document.getElementById('featuredCalories');
        const repsEl = document.getElementById('featuredReps');
        const musclesEl = document.getElementById('featuredMuscles');
        const logBtn = document.getElementById('btnLogFeaturedWorkout');

        if (iframe) iframe.src = w.videoEmbed;
        if (catBadge) catBadge.textContent = w.category;
        if (levelBadge) levelBadge.innerHTML = `<i class="fa-solid fa-gauge-simple me-1"></i>${w.level}`;
        if (titleEl) titleEl.textContent = w.title;
        if (descEl) descEl.textContent = w.desc;
        if (durationEl) durationEl.textContent = w.duration;
        if (calEl) calEl.textContent = w.calories;
        if (repsEl) repsEl.textContent = w.sets;

        if (musclesEl) {
            musclesEl.innerHTML = w.muscles.map((m, i) => {
                const bg = i === 0 ? 'bg-primary' : (i === 1 ? 'bg-info' : 'bg-secondary');
                return `<span class="badge ${bg} px-2 py-1">${m}</span>`;
            }).join('');
        }

        if (logBtn) {
            logBtn.innerHTML = `<i class="fa-solid fa-check-double me-1"></i>Log Completed Workout (+${w.caloriesNum} kcal)`;
            logBtn.removeAttribute('disabled');
        }

        // Smooth scroll to featured card
        const card = document.getElementById('featuredWorkoutCard');
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Log Completed Workout to Backend SQLite Database
    async function logCurrentWorkout() {
        const w = workoutRoutines[currentWorkoutIndex];
        const logBtn = document.getElementById('btnLogFeaturedWorkout');
        if (logBtn) {
            logBtn.setAttribute('disabled', 'true');
            logBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i>Logging to Activity Tracker...';
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

        try {
            const response = await fetch('/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({
                    activity_date: todayStr,
                    workout_type: w.title + ' (AI Video)',
                    workout_duration: w.durationNum,
                    calories_burned: w.caloriesNum,
                    steps: w.filterCat === 'hiit' ? 1800 : 450,
                    water_intake: 0.4,
                    sleep_duration: 7.5
                })
            });

            const data = await response.json();
            if (data.success) {
                playSuccessChime();
                const toastEl = document.getElementById('workoutToast');
                const toastMsg = document.getElementById('workoutToastMessage');
                if (toastMsg) {
                    toastMsg.textContent = `Completed! ${w.title} logged (+${w.caloriesNum} kcal, ${w.durationNum} mins) to your dashboard!`;
                }
                if (toastEl && window.bootstrap) {
                    const toast = new bootstrap.Toast(toastEl);
                    toast.show();
                }
                if (logBtn) {
                    logBtn.innerHTML = '<i class="fa-solid fa-circle-check text-success me-1"></i>Completed & Logged to Dashboard!';
                }
            } else {
                alert('Logging failed: ' + (data.error || 'Server error'));
                if (logBtn) {
                    logBtn.removeAttribute('disabled');
                    logBtn.innerHTML = `<i class="fa-solid fa-check-double me-1"></i>Log Completed Workout (+${w.caloriesNum} kcal)`;
                }
            }
        } catch (e) {
            console.error('Error logging workout:', e);
            alert('Failed to connect to backend server. Make sure server is running.');
            if (logBtn) {
                logBtn.removeAttribute('disabled');
                logBtn.innerHTML = `<i class="fa-solid fa-check-double me-1"></i>Log Completed Workout (+${w.caloriesNum} kcal)`;
            }
        }
    }

    // Category Filter Buttons
    function initFilters() {
        const filterButtons = document.querySelectorAll('#categoryFilterBar button');
        const cards = document.querySelectorAll('.workout-item');

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter');
                cards.forEach(card => {
                    const cat = card.getAttribute('data-category');
                    if (filter === 'all' || cat === filter) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // Search Input Filter
    function initSearch() {
        const searchInput = document.getElementById('searchWorkoutInput');
        const cards = document.querySelectorAll('.workout-item');

        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(query)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Bind Click Events
    function initEvents() {
        document.querySelectorAll('[data-workout-index]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const idx = parseInt(btn.getAttribute('data-workout-index'), 10);
                selectWorkout(idx);
            });
        });

        const logBtn = document.getElementById('btnLogFeaturedWorkout');
        if (logBtn) {
            logBtn.addEventListener('click', logCurrentWorkout);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initFilters();
        initSearch();
        initEvents();
    });

})();
