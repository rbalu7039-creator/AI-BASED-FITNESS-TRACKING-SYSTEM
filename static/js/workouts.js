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

    // =========================================================================
    // AI Voice Workout Search & Speech Assistant Engine
    // =========================================================================

    let isListening = false;
    let lastSpokenText = '';
    let lastRecommendedIndex = 0;
    let currentCategory = 'all';

    // AI Voice Suggestion Intent Classifier
    function getAIVoiceRecommendation(query) {
        const q = (query || '').toLowerCase().trim();

        if (q.includes('squat') || q.includes('leg') || q.includes('quad') || q.includes('glute') || q.includes('lower') || q.includes('calf')) {
            return {
                index: 0,
                text: "For strong legs and glute power, I recommend Bodyweight Squats & Leg Power Mastery. Focus on keeping your chest proud and descending until your hips are below your knees for 140 active calories.",
                meta: "Recommended: Bodyweight Squats • Glutes & Quads • 15 Mins (~140 kcal)"
            };
        } else if (q.includes('bicep') || q.includes('arm') || q.includes('curl') || q.includes('tricep') || q.includes('forearm')) {
            return {
                index: 1,
                text: "For arm sculpt and upper body definition, I suggest Dumbbell Bicep & Arm Sculpt. Keep your elbows glued to your sides and use controlled 2-second eccentrics for 150 calories.",
                meta: "Recommended: Bicep & Arm Sculpt • Arms & Hypertrophy • 18 Mins (~150 kcal)"
            };
        } else if (q.includes('hiit') || q.includes('fat') || q.includes('burn') || q.includes('cardio') || q.includes('sweat') || q.includes('weight loss') || q.includes('shred') || q.includes('fast')) {
            return {
                index: 2,
                text: "For rapid calorie burn and high-energy conditioning, Explosive Metabolic HIIT Shred is your best choice. 260 calories in 22 minutes with high-metabolic intervals!",
                meta: "Recommended: Metabolic HIIT Shred • Full Body & Cardio • 22 Mins (~260 kcal)"
            };
        } else if (q.includes('push') || q.includes('chest') || q.includes('pec') || q.includes('upper') || q.includes('shoulder')) {
            return {
                index: 3,
                text: "For chest strength and pressing power, I recommend Push-Up Mechanics & Chest Form. Keep your elbows tucked at a 45-degree angle to protect your shoulder joints.",
                meta: "Recommended: Push-Up Mechanics • Chest & Triceps • 15 Mins (~135 kcal)"
            };
        } else if (q.includes('core') || q.includes('abs') || q.includes('six pack') || q.includes('belly') || q.includes('stomach') || q.includes('plank')) {
            return {
                index: 4,
                text: "For rotational stability and a shredded midsection, 360-Degree Core Stability & Six-Pack Conditioning is perfect! It strengthens your deep transverse core and protects your lower spine.",
                meta: "Recommended: 360° Core Stability • Rectus Abdominis & Obliques • 14 Mins (~120 kcal)"
            };
        } else if (q.includes('yoga') || q.includes('mobility') || q.includes('stretch') || q.includes('flexibility') || q.includes('recovery') || q.includes('spine') || q.includes('back')) {
            return {
                index: 5,
                text: "For active recovery and joint longevity, Full Body Mobility & Spinal Decompression Yoga is unmatched. Sync deep nasal breathing with each fluid flow.",
                meta: "Recommended: Full Body Mobility Yoga • Hamstrings, Hips & Spine • 20 Mins (~95 kcal)"
            };
        } else {
            return {
                index: 2,
                text: "Hello athlete! Today I recommend kicking off with our Explosive Metabolic HIIT Shred or Bodyweight Squats to elevate your metabolism and build stamina!",
                meta: "Recommended: Metabolic HIIT Shred • Full Body Cardio • 22 Mins (~260 kcal)"
            };
        }
    }

    // Text-to-Speech Vocalizer
    function speakVoiceCoach(text, onComplete) {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported in this browser.');
            return;
        }

        window.speechSynthesis.cancel();
        lastSpokenText = text;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.02;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('David')));
        if (preferredVoice) utterance.voice = preferredVoice;

        const wave = document.getElementById('soundWaveAnimation');
        const badge = document.getElementById('speechStatusBadge');

        utterance.onstart = () => {
            if (wave) wave.classList.remove('paused');
            if (badge) {
                badge.textContent = 'Speaking';
                badge.className = 'badge bg-success-subtle text-success small';
            }
        };

        utterance.onend = () => {
            if (wave) wave.classList.add('paused');
            if (badge) {
                badge.textContent = 'Ready';
                badge.className = 'badge bg-info-subtle text-info small';
            }
            if (onComplete) onComplete();
        };

        utterance.onerror = () => {
            if (wave) wave.classList.add('paused');
            if (badge) badge.textContent = 'Ready';
        };

        window.speechSynthesis.speak(utterance);
    }

    function stopVoiceCoach() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        const wave = document.getElementById('soundWaveAnimation');
        const badge = document.getElementById('speechStatusBadge');
        if (wave) wave.classList.add('paused');
        if (badge) {
            badge.textContent = 'Paused';
            badge.className = 'badge bg-secondary-subtle text-secondary small';
        }
    }

    function triggerAIVoiceSuggestion(query, autoSpeak = true) {
        const suggestion = getAIVoiceRecommendation(query);
        lastRecommendedIndex = suggestion.index;

        const bubble = document.getElementById('aiSpeechBubble');
        const speechText = document.getElementById('aiSpeechText');
        const speechMeta = document.getElementById('aiSpeechMeta');

        if (bubble) bubble.classList.remove('d-none');
        if (speechText) speechText.textContent = `"${suggestion.text}"`;
        if (speechMeta) speechMeta.textContent = suggestion.meta;

        if (autoSpeak) {
            speakVoiceCoach(suggestion.text);
        }
    }

    // Unified Card Filter
    function filterWorkouts(query, category) {
        const q = (query || '').toLowerCase().trim();
        const cat = category !== undefined ? category : currentCategory;
        currentCategory = cat;

        const cards = document.querySelectorAll('.workout-item');
        let visibleCount = 0;

        cards.forEach(card => {
            const cardCat = card.getAttribute('data-category') || '';
            const cardText = card.textContent.toLowerCase();

            const matchCat = (cat === 'all' || cardCat === cat);
            const matchQuery = (!q || cardText.includes(q));

            if (matchCat && matchQuery) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        const noFound = document.getElementById('noWorkoutsFoundCard');
        const noQuerySpan = document.getElementById('noMatchQuery');
        if (noFound) {
            if (visibleCount === 0) {
                noFound.classList.remove('d-none');
                if (noQuerySpan) noQuerySpan.textContent = q || cat;
            } else {
                noFound.classList.add('d-none');
            }
        }

        const clearBtn = document.getElementById('btnClearSearch');
        if (clearBtn) {
            if (q) clearBtn.classList.remove('d-none');
            else clearBtn.classList.add('d-none');
        }
    }

    // Speech-to-Text Microphone Integration
    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const micBtn = document.getElementById('btnVoiceSearch');
        const inputMicBtn = document.getElementById('btnVoiceSearchInput');
        const listeningBar = document.getElementById('voiceListeningBar');
        const stopListeningBtn = document.getElementById('btnStopListening');
        const searchInput = document.getElementById('searchWorkoutInput');
        const micLabel = document.getElementById('micLabel');

        if (!SpeechRecognition) {
            const showFallback = () => {
                alert('Voice microphone search is supported in Google Chrome, Microsoft Edge, and Safari. You can also type into the search bar and tap "AI Voice Suggest"!');
            };
            if (micBtn) micBtn.addEventListener('click', showFallback);
            if (inputMicBtn) inputMicBtn.addEventListener('click', showFallback);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        function startListening() {
            try {
                recognition.start();
            } catch (err) {
                console.log('Recognition already started:', err);
            }
        }

        function stopListening() {
            try {
                recognition.stop();
            } catch (err) {}
        }

        recognition.onstart = () => {
            isListening = true;
            if (listeningBar) listeningBar.classList.remove('d-none');
            if (micBtn) micBtn.classList.add('voice-mic-listening');
            if (inputMicBtn) inputMicBtn.classList.add('voice-mic-listening');
            if (micLabel) micLabel.textContent = 'Listening...';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (searchInput) {
                searchInput.value = transcript;
            }
            filterWorkouts(transcript, currentCategory);
            triggerAIVoiceSuggestion(transcript, true);
        };

        recognition.onerror = (event) => {
            console.warn('Speech recognition notice:', event.error);
            if (event.error === 'not-allowed') {
                alert('Microphone access was blocked. Please enable microphone permissions in your browser address bar.');
            }
        };

        recognition.onend = () => {
            isListening = false;
            if (listeningBar) listeningBar.classList.add('d-none');
            if (micBtn) micBtn.classList.remove('voice-mic-listening');
            if (inputMicBtn) inputMicBtn.classList.remove('voice-mic-listening');
            if (micLabel) micLabel.textContent = 'Speak Search';
        };

        if (micBtn) {
            micBtn.addEventListener('click', () => {
                if (isListening) stopListening();
                else startListening();
            });
        }

        if (inputMicBtn) {
            inputMicBtn.addEventListener('click', () => {
                if (isListening) stopListening();
                else startListening();
            });
        }

        if (stopListeningBtn) {
            stopListeningBtn.addEventListener('click', stopListening);
        }
    }

    // Category Tabs & Quick Chips Filter
    function initFilters() {
        const filterButtons = document.querySelectorAll('#categoryFilterBar button');
        const chips = document.querySelectorAll('.chip-filter');
        const searchInput = document.getElementById('searchWorkoutInput');

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter') || 'all';
                currentCategory = filter;
                const query = searchInput ? searchInput.value : '';
                filterWorkouts(query, filter);
            });
        });

        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                const keyword = chip.getAttribute('data-chip') || '';
                if (searchInput) {
                    searchInput.value = keyword === 'all' ? '' : keyword;
                }
                filterWorkouts(keyword === 'all' ? '' : keyword, currentCategory);
                if (keyword !== 'all') {
                    triggerAIVoiceSuggestion(keyword, true);
                }
            });
        });
    }

    // Search Input Listener
    function initSearch() {
        const searchInput = document.getElementById('searchWorkoutInput');
        const clearBtn = document.getElementById('btnClearSearch');

        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            filterWorkouts(e.target.value, currentCategory);
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                filterWorkouts('', currentCategory);
                searchInput.focus();
            });
        }

        const resetBtn = document.getElementById('btnResetSearch');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                searchInput.value = '';
                currentCategory = 'all';
                const filterButtons = document.querySelectorAll('#categoryFilterBar button');
                filterButtons.forEach(b => b.classList.remove('active'));
                if (filterButtons[0]) filterButtons[0].classList.add('active');
                filterWorkouts('', 'all');
            });
        }

        const voiceSuggestBtn = document.getElementById('btnVoiceSuggest');
        if (voiceSuggestBtn) {
            voiceSuggestBtn.addEventListener('click', () => {
                const query = searchInput.value.trim() || currentCategory;
                triggerAIVoiceSuggestion(query, true);
            });
        }

        const voiceAltBtn = document.getElementById('btnVoiceSuggestAlternative');
        if (voiceAltBtn) {
            voiceAltBtn.addEventListener('click', () => {
                triggerAIVoiceSuggestion('', true);
            });
        }

        const replayBtn = document.getElementById('btnReplayVoice');
        if (replayBtn) {
            replayBtn.addEventListener('click', () => {
                if (lastSpokenText) {
                    speakVoiceCoach(lastSpokenText);
                } else {
                    triggerAIVoiceSuggestion('', true);
                }
            });
        }

        const stopBtn = document.getElementById('btnStopVoice');
        if (stopBtn) {
            stopBtn.addEventListener('click', stopVoiceCoach);
        }

        const quickStartBtn = document.getElementById('btnQuickSelectSuggested');
        if (quickStartBtn) {
            quickStartBtn.addEventListener('click', () => {
                selectWorkout(lastRecommendedIndex);
                const playerCard = document.getElementById('featuredWorkoutCard');
                if (playerCard) {
                    playerCard.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
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

        // Check if URL has ?search= or ?q= or ?action=voice
        const params = new URLSearchParams(window.location.search);
        const searchParam = params.get('search') || params.get('q');
        const actionParam = params.get('action');

        if (searchParam) {
            const searchInput = document.getElementById('searchWorkoutInput');
            if (searchInput) searchInput.value = searchParam;
            filterWorkouts(searchParam, 'all');
            triggerAIVoiceSuggestion(searchParam, true);
        } else if (actionParam === 'voice') {
            triggerAIVoiceSuggestion('', true);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initFilters();
        initSearch();
        initSpeechRecognition();
        initEvents();
    });

})();
