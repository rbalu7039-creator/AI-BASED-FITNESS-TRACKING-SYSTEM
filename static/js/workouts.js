/**
 * FitAI Pulse - AI Video Workout Studio Engine (100 Routines Edition)
 * Dynamic 100-Routine Catalog, Biomechanical Form Cues, Voice Search & Direct Activity Sync
 */

(function () {
    'use strict';

    // 1. Fallback Routine Array (in case workout_data.js is loading asynchronously)
    const fallbackRoutines = [
        {
            id: 1,
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
            thumbnail: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80",
            desc: "Learn optimal hip-hinge mechanics, knee alignment, and 90° depth control to maximize glute and quad engagement without spinal strain.",
            checkpoints: [
                "Maintain neutral lumbar spine; avoid rounding or hyperextending back",
                "Descend until hip crease is below knee cap (<90° depth)",
                "Keep knees tracking over 2nd & 3rd toes (prevent valgus collapse)"
            ],
            muscles: ["Quadriceps", "Gluteus Maximus", "Hamstrings & Core"]
        }
    ];

    // Get 100 Workouts Catalog
    function getWorkoutsCatalog() {
        if (window.FITAI_100_WORKOUTS && Array.isArray(window.FITAI_100_WORKOUTS) && window.FITAI_100_WORKOUTS.length > 0) {
            return window.FITAI_100_WORKOUTS;
        }
        return fallbackRoutines;
    }

    let currentWorkoutIndex = 0;
    let currentCategory = 'all';
    let currentSearchQuery = '';
    let visibleCount = 12;
    const PAGE_CHUNK = 12;

    let isListening = false;
    let lastSpokenText = '';
    let lastRecommendedIndex = 0;

    // Helper: Category badge styling
    function getCategoryBadgeClass(filterCat) {
        switch (filterCat) {
            case 'strength': return 'bg-danger';
            case 'hiit': return 'bg-warning text-dark';
            case 'core': return 'bg-success';
            case 'mobility': return 'bg-info text-dark';
            case 'calisthenics': return 'bg-primary';
            default: return 'bg-secondary';
        }
    }

    // Audio chime for workout completion
    function playSuccessChime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;
            
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.frequency.setValueAtTime(523.25, now);
            gain1.gain.setValueAtTime(0.15, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.2);

            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.frequency.setValueAtTime(659.25, now + 0.15);
            gain2.gain.setValueAtTime(0.15, now + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.15);
            osc2.stop(now + 0.35);

            const osc3 = ctx.createOscillator();
            const gain3 = ctx.createGain();
            osc3.frequency.setValueAtTime(783.99, now + 0.3);
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
        const catalog = getWorkoutsCatalog();
        if (index < 0 || index >= catalog.length) return;
        currentWorkoutIndex = index;
        const w = catalog[index];

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

        let embedUrl = w.videoEmbed || '';
        if (embedUrl && !embedUrl.includes('autoplay=1')) {
            embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1';
        }

        if (iframe) iframe.src = embedUrl;
        if (catBadge) catBadge.textContent = w.category || 'WORKOUT';
        if (levelBadge) levelBadge.innerHTML = `<i class="fa-solid fa-gauge-simple me-1"></i>${w.level || 'All Levels'}`;
        if (titleEl) titleEl.textContent = w.title;
        if (descEl) descEl.textContent = w.desc;
        if (durationEl) durationEl.textContent = w.duration;
        if (calEl) calEl.textContent = w.calories;
        if (repsEl) repsEl.textContent = w.sets;

        // Render AI Form Checkpoints
        const checkpointsWrap = document.querySelector('#featuredWorkoutCard .ai-cue-item')?.parentElement;
        if (checkpointsWrap && Array.isArray(w.checkpoints)) {
            checkpointsWrap.innerHTML = `
                <div class="small fw-bold text-success text-uppercase mb-2"><i class="fa-solid fa-circle-check me-1"></i>AI Biomechanical Form Checkpoints</div>
                ${w.checkpoints.map(cp => `<div class="ai-cue-item"><i class="fa-solid fa-check"></i><span>${cp}</span></div>`).join('')}
            `;
        }

        if (musclesEl && Array.isArray(w.muscles)) {
            musclesEl.innerHTML = w.muscles.map((m, i) => {
                const bg = i === 0 ? 'bg-primary' : (i === 1 ? 'bg-info text-dark' : 'bg-secondary');
                return `<span class="badge ${bg} px-2 py-1">${m}</span>`;
            }).join('');
        }

        if (logBtn) {
            logBtn.innerHTML = `<i class="fa-solid fa-check-double me-1"></i>Log Completed Workout (+${w.caloriesNum || 120} kcal)`;
            logBtn.removeAttribute('disabled');
        }

        // Scroll smoothly to player
        const card = document.getElementById('featuredWorkoutCard');
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Log Completed Workout to Backend
    async function logCurrentWorkout() {
        const catalog = getWorkoutsCatalog();
        const w = catalog[currentWorkoutIndex] || catalog[0];
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
                    workout_duration: w.durationNum || 15,
                    calories_burned: w.caloriesNum || 140,
                    steps: w.filterCat === 'hiit' ? 1800 : (w.filterCat === 'calisthenics' ? 950 : 450),
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
                    toastMsg.textContent = `Completed! ${w.title} logged (+${w.caloriesNum || 140} kcal, ${w.durationNum || 15} mins) to your dashboard!`;
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

    // Dynamic Card Generator
    function getFilteredWorkouts() {
        const catalog = getWorkoutsCatalog();
        const q = (currentSearchQuery || '').toLowerCase().trim();
        const cat = currentCategory;

        return catalog.filter(w => {
            const matchCat = (cat === 'all' || w.filterCat === cat);
            if (!matchCat) return false;

            if (!q) return true;

            const searchableText = [
                w.title,
                w.category,
                w.desc,
                (w.muscles || []).join(' '),
                (w.checkpoints || []).join(' ')
            ].join(' ').toLowerCase();

            return searchableText.includes(q);
        });
    }

    function renderWorkoutGrid() {
        const grid = document.getElementById('workoutCardsGrid');
        if (!grid) return;

        const filtered = getFilteredWorkouts();
        const totalCount = filtered.length;
        const catalog = getWorkoutsCatalog();

        // Update counts
        const displayedCountEl = document.getElementById('displayedCount');
        const totalCountEl = document.getElementById('totalCount');
        const catCountAll = document.getElementById('catCountAll');

        if (catCountAll) catCountAll.textContent = catalog.length;
        if (displayedCountEl) displayedCountEl.textContent = Math.min(visibleCount, totalCount);
        if (totalCountEl) totalCountEl.textContent = totalCount;

        // No results check
        const noFound = document.getElementById('noWorkoutsFoundCard');
        const noQuerySpan = document.getElementById('noMatchQuery');
        if (noFound) {
            if (totalCount === 0) {
                noFound.classList.remove('d-none');
                if (noQuerySpan) noQuerySpan.textContent = currentSearchQuery || currentCategory;
            } else {
                noFound.classList.add('d-none');
            }
        }

        // Pagination buttons state
        const loadMoreBtn = document.getElementById('btnLoadMoreWorkouts');
        const showAllBtn = document.getElementById('btnShowAllWorkouts');

        if (loadMoreBtn) {
            if (visibleCount >= totalCount) {
                loadMoreBtn.setAttribute('disabled', 'true');
                loadMoreBtn.innerHTML = '<i class="fa-solid fa-check me-1"></i>All Workouts Displayed';
            } else {
                loadMoreBtn.removeAttribute('disabled');
                const remaining = totalCount - visibleCount;
                const nextBatch = Math.min(PAGE_CHUNK, remaining);
                loadMoreBtn.innerHTML = `<i class="fa-solid fa-plus me-1"></i>Load More Workouts (+${nextBatch})`;
            }
        }

        if (showAllBtn) {
            if (visibleCount >= totalCount) {
                showAllBtn.classList.add('d-none');
            } else {
                showAllBtn.classList.remove('d-none');
                showAllBtn.innerHTML = `<i class="fa-solid fa-eye me-1"></i>Show All (${totalCount})`;
            }
        }

        // Render card items
        const visibleSlice = filtered.slice(0, visibleCount);
        grid.innerHTML = visibleSlice.map(w => {
            // Find global index in catalog for player targeting
            const globalIndex = catalog.findIndex(item => item.id === w.id);
            const badgeClass = getCategoryBadgeClass(w.filterCat);

            const musclesHtml = (w.muscles || []).slice(0, 3).map(m => 
                `<span class="muscle-pill">${m}</span>`
            ).join('');

            return `
                <div class="col-md-6 col-lg-4 workout-item" data-category="${w.filterCat}">
                    <div class="glass-card video-card h-100 p-3">
                        <div class="video-thumbnail-wrap mb-3">
                            <img src="${w.thumbnail || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80'}" 
                                 alt="${w.title}" 
                                 class="video-thumbnail-img" 
                                 loading="lazy">
                            <span class="badge ${badgeClass} video-category-badge">${w.filterCat.toUpperCase()}</span>
                            <span class="video-duration-badge"><i class="fa-regular fa-clock me-1"></i>${w.duration}</span>
                            <div class="video-play-overlay">
                                <button class="play-button-circle border-0" data-workout-index="${globalIndex}" title="Watch Video">
                                    <i class="fa-solid fa-play"></i>
                                </button>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="small text-secondary"><i class="fa-solid fa-fire text-danger me-1"></i>${w.calories}</span>
                            <span class="badge-soft-cyan small">${w.level || 'All Levels'}</span>
                        </div>
                        <h5 class="fw-bold mb-1 fs-6 text-truncate" title="${w.title}">#${w.id} ${w.title}</h5>
                        <p class="small text-secondary mb-3" style="min-height: 38px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${w.desc}
                        </p>

                        <div class="d-flex flex-wrap gap-1 mb-3">
                            ${musclesHtml}
                        </div>

                        <div class="d-flex gap-2 mt-auto pt-2 border-top" style="border-color: var(--border-glass) !important;">
                            <button class="btn-brand flex-grow-1 py-1 small btn-select-workout" data-workout-index="${globalIndex}">
                                <i class="fa-solid fa-play me-1"></i>Watch &amp; Train
                            </button>
                            <a href="/vision" class="btn-glass py-1 px-2" title="Track with AI Camera">
                                <i class="fa-solid fa-video text-warning"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Re-attach card click listeners
        grid.querySelectorAll('[data-workout-index]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const idx = parseInt(btn.getAttribute('data-workout-index'), 10);
                selectWorkout(idx);
            });
        });

        // Clear search button visibility
        const clearBtn = document.getElementById('btnClearSearch');
        if (clearBtn) {
            if (currentSearchQuery) clearBtn.classList.remove('d-none');
            else clearBtn.classList.add('d-none');
        }
    }

    // AI Voice Assistant & Smart Keyword Matcher over 100 Routines
    function findBestWorkoutMatch(query) {
        const catalog = getWorkoutsCatalog();
        const q = (query || '').toLowerCase().trim();
        if (!q) {
            return {
                index: 0,
                workout: catalog[0],
                text: "Welcome to the AI Workout Studio! I've loaded 100 high-definition workout routines across Strength, HIIT, Core, Yoga, and Calisthenics. Tell me what muscle or workout you'd like to do today!"
            };
        }

        const keywords = q.split(/\s+/).filter(w => w.length > 2);
        let bestScore = -1;
        let bestIndex = 0;

        catalog.forEach((w, idx) => {
            let score = 0;
            const titleLower = w.title.toLowerCase();
            const catLower = (w.category + ' ' + w.filterCat).toLowerCase();
            const musclesLower = (w.muscles || []).join(' ').toLowerCase();
            const descLower = (w.desc || '').toLowerCase();
            const cuesLower = (w.checkpoints || []).join(' ').toLowerCase();

            keywords.forEach(kw => {
                if (titleLower.includes(kw)) score += 12;
                if (musclesLower.includes(kw)) score += 10;
                if (catLower.includes(kw)) score += 8;
                if (cuesLower.includes(kw)) score += 6;
                if (descLower.includes(kw)) score += 4;
            });

            if (score > bestScore) {
                bestScore = score;
                bestIndex = idx;
            }
        });

        const matched = catalog[bestIndex] || catalog[0];
        const cue = (matched.checkpoints && matched.checkpoints[0]) ? matched.checkpoints[0] : "Hit full range of motion and maintain steady breathing";

        const text = `For ${matched.title}, I recommend focusing on this key AI form checkpoint: ${cue}. This session will burn ${matched.calories} over ${matched.duration}!`;

        return {
            index: bestIndex,
            workout: matched,
            text: text
        };
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
        const result = findBestWorkoutMatch(query);
        lastRecommendedIndex = result.index;

        const bubble = document.getElementById('aiSpeechBubble');
        const speechText = document.getElementById('aiSpeechText');
        const speechMeta = document.getElementById('aiSpeechMeta');

        if (bubble) bubble.classList.remove('d-none');
        if (speechText) speechText.textContent = `"${result.text}"`;
        if (speechMeta) speechMeta.textContent = `Target: ${result.workout.title} • ${(result.workout.muscles || []).slice(0, 2).join(' & ')} • ${result.workout.calories}`;

        if (autoSpeak) {
            speakVoiceCoach(result.text);
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
                console.log('Recognition already running:', err);
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
            currentSearchQuery = transcript;
            visibleCount = PAGE_CHUNK;
            renderWorkoutGrid();
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
                visibleCount = PAGE_CHUNK;
                renderWorkoutGrid();
            });
        });

        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                const keyword = chip.getAttribute('data-chip') || '';
                const queryVal = keyword === 'all' ? '' : keyword;
                if (searchInput) {
                    searchInput.value = queryVal;
                }
                currentSearchQuery = queryVal;
                visibleCount = PAGE_CHUNK;
                renderWorkoutGrid();

                if (queryVal) {
                    triggerAIVoiceSuggestion(queryVal, true);
                }
            });
        });
    }

    // Search Input Listener
    function initSearch() {
        const searchInput = document.getElementById('searchWorkoutInput');
        const clearBtn = document.getElementById('btnClearSearch');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentSearchQuery = e.target.value;
                visibleCount = PAGE_CHUNK;
                renderWorkoutGrid();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                currentSearchQuery = '';
                visibleCount = PAGE_CHUNK;
                renderWorkoutGrid();
                if (searchInput) searchInput.focus();
            });
        }

        const resetBtn = document.getElementById('btnResetSearch');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                currentSearchQuery = '';
                currentCategory = 'all';
                visibleCount = PAGE_CHUNK;

                const filterButtons = document.querySelectorAll('#categoryFilterBar button');
                filterButtons.forEach(b => b.classList.remove('active'));
                if (filterButtons[0]) filterButtons[0].classList.add('active');

                renderWorkoutGrid();
            });
        }

        const voiceSuggestBtn = document.getElementById('btnVoiceSuggest');
        if (voiceSuggestBtn) {
            voiceSuggestBtn.addEventListener('click', () => {
                const query = (searchInput ? searchInput.value.trim() : '') || currentCategory;
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

    // Pagination Listeners
    function initPagination() {
        const loadMoreBtn = document.getElementById('btnLoadMoreWorkouts');
        const showAllBtn = document.getElementById('btnShowAllWorkouts');

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                visibleCount += PAGE_CHUNK;
                renderWorkoutGrid();
            });
        }

        if (showAllBtn) {
            showAllBtn.addEventListener('click', () => {
                visibleCount = 1000;
                renderWorkoutGrid();
            });
        }
    }

    // Bind Featured Video & URL Params
    function initEvents() {
        const logBtn = document.getElementById('btnLogFeaturedWorkout');
        if (logBtn) {
            logBtn.addEventListener('click', logCurrentWorkout);
        }

        const params = new URLSearchParams(window.location.search);
        const searchParam = params.get('search') || params.get('q');
        const actionParam = params.get('action');

        if (searchParam) {
            const searchInput = document.getElementById('searchWorkoutInput');
            if (searchInput) searchInput.value = searchParam;
            currentSearchQuery = searchParam;
            renderWorkoutGrid();
            triggerAIVoiceSuggestion(searchParam, true);
        } else if (actionParam === 'voice') {
            triggerAIVoiceSuggestion('', true);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Initial setup
        initFilters();
        initSearch();
        initSpeechRecognition();
        initPagination();
        initEvents();

        // Render initial 12 cards from 100 workouts catalog
        renderWorkoutGrid();
    });

})();
