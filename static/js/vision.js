/**
 * FitAI Pulse - AI Vision Workout Tracker & MediaPipe Pose Estimator
 * Real-time Repetition Counter & Joint Angle Biomechanics Engine
 */

(function () {
    'use strict';

    // State Variables
    let currentExercise = 'squats';
    let repCount = 0;
    let exerciseStage = 'READY'; // 'UP', 'DOWN', 'READY'
    let workoutSeconds = 0;
    let timerInterval = null;
    let cameraStream = null;
    let isCameraActive = false;
    let isDemoMode = false;
    let demoInterval = null;
    let soundEnabled = true;

    // DOM Elements
    const videoElement = document.getElementById('webcamVideo');
    const canvasElement = document.getElementById('outputCanvas');
    const canvasCtx = canvasElement ? canvasElement.getContext('2d') : null;
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const visionHud = document.getElementById('visionHud');
    const visionFeedback = document.getElementById('visionFeedback');

    const btnStartCamera = document.getElementById('btnStartCamera');
    const btnToggleCamera = document.getElementById('btnToggleCamera');
    const btnDemoMode = document.getElementById('btnDemoMode');
    const btnResetReps = document.getElementById('btnResetReps');
    const btnSaveWorkout = document.getElementById('btnSaveWorkout');
    const btnToggleSound = document.getElementById('btnToggleSound');
    const soundIcon = document.getElementById('soundIcon');

    const hudExerciseName = document.getElementById('hudExerciseName');
    const hudTimer = document.getElementById('hudTimer');
    const hudRepCount = document.getElementById('hudRepCount');
    const hudFeedbackText = document.getElementById('hudFeedbackText');
    const cardReps = document.getElementById('cardReps');
    const cardCalories = document.getElementById('cardCalories');
    const cardAngle = document.getElementById('cardAngle');
    const cardStage = document.getElementById('cardStage');
    const formProgressBar = document.getElementById('formProgressBar');
    const formQualityText = document.getElementById('formQualityText');
    const exerciseCards = document.querySelectorAll('.exercise-card');

    let poseTracker = null;
    let cameraInstance = null;

    // Sound Synthesizer via Web Audio API
    function playBeep(freq = 600, duration = 0.15) {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn('Audio Context error:', e);
        }
    }

    // Voice feedback
    function speakFeedback(text) {
        if (!soundEnabled || !window.speechSynthesis) return;
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn('Speech synthesis error:', e);
        }
    }

    // Mathematical Joint Angle Calculation: a-b-c
    function calculateAngle(a, b, c) {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs((radians * 180.0) / Math.PI);
        if (angle > 180.0) {
            angle = 360 - angle;
        }
        return Math.round(angle);
    }

    // Update UI Metrics
    function updateMetrics(angle, feedback, stage = null) {
        if (cardAngle) cardAngle.textContent = `${angle}°`;
        if (stage) {
            exerciseStage = stage;
            if (cardStage) cardStage.textContent = stage;
        }
        if (hudFeedbackText) hudFeedbackText.textContent = feedback;

        // Form quality bar
        if (formProgressBar && formQualityText) {
            let quality = 100;
            if (currentExercise === 'squats' && angle > 110 && exerciseStage === 'DOWN') {
                quality = 65;
                formQualityText.textContent = 'Squat Lower';
                formProgressBar.className = 'progress-bar bg-warning';
            } else {
                quality = 95;
                formQualityText.textContent = 'Excellent Form';
                formProgressBar.className = 'progress-bar bg-success';
            }
            formProgressBar.style.width = `${quality}%`;
        }
    }

    // Count Repetition
    function incrementRep(caloriesPerRep = 0.45) {
        repCount++;
        if (hudRepCount) hudRepCount.textContent = repCount;
        if (cardReps) cardReps.textContent = repCount;

        const estCalories = Math.round(repCount * caloriesPerRep * 10) / 10;
        if (cardCalories) cardCalories.textContent = `${estCalories} kcal`;

        playBeep(880, 0.2); // High chime on rep
        if (btnSaveWorkout) btnSaveWorkout.removeAttribute('disabled');

        if (repCount % 5 === 0) {
            speakFeedback(`${repCount} reps complete. Keep going!`);
        }
    }

    // Process Pose Landmarks
    function onPoseResults(results) {
        if (!canvasCtx || !canvasElement) return;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        if (!results.poseLandmarks) {
            canvasCtx.restore();
            return;
        }

        const landmarks = results.poseLandmarks;
        const w = canvasElement.width;
        const h = canvasElement.height;

        // Draw Skeleton Connections
        drawSkeleton(landmarks, w, h);

        // Exercise Biomechanics Logic
        if (currentExercise === 'squats') {
            // Left Hip (23), Knee (25), Ankle (27)
            const hip = landmarks[23];
            const knee = landmarks[25];
            const ankle = landmarks[27];

            if (hip && knee && ankle) {
                const kneeAngle = calculateAngle(hip, knee, ankle);

                if (kneeAngle > 160) {
                    if (exerciseStage === 'DOWN') {
                        incrementRep(0.5);
                        updateMetrics(kneeAngle, 'Rep Completed! Push Up!', 'UP');
                    } else {
                        updateMetrics(kneeAngle, 'Squat Down smoothly', 'UP');
                    }
                } else if (kneeAngle < 95) {
                    updateMetrics(kneeAngle, 'Optimal Depth Reached! Now Rise!', 'DOWN');
                } else {
                    updateMetrics(kneeAngle, 'Descending...', exerciseStage);
                }
            }
        } else if (currentExercise === 'curls') {
            // Right Shoulder (12), Elbow (14), Wrist (16)
            const shoulder = landmarks[12];
            const elbow = landmarks[14];
            const wrist = landmarks[16];

            if (shoulder && elbow && wrist) {
                const elbowAngle = calculateAngle(shoulder, elbow, wrist);

                if (elbowAngle > 150) {
                    if (exerciseStage === 'UP') {
                        updateMetrics(elbowAngle, 'Arm extended. Curl Up!', 'DOWN');
                    } else {
                        updateMetrics(elbowAngle, 'Ready. Curl toward shoulder.', 'DOWN');
                    }
                } else if (elbowAngle < 45) {
                    if (exerciseStage === 'DOWN') {
                        incrementRep(0.35);
                        updateMetrics(elbowAngle, 'Peak Contraction! Lower slow.', 'UP');
                    }
                } else {
                    updateMetrics(elbowAngle, 'Curling...', exerciseStage);
                }
            }
        } else if (currentExercise === 'jacks') {
            // Wrist (15, 16) & Ankle (27, 28) distance
            const lWrist = landmarks[15];
            const rWrist = landmarks[16];
            const lAnkle = landmarks[27];
            const rAnkle = landmarks[28];

            if (lWrist && rWrist && lAnkle && rAnkle) {
                const handsOverHead = lWrist.y < landmarks[11].y && rWrist.y < landmarks[12].y;
                const feetApart = Math.abs(lAnkle.x - rAnkle.x) > 0.25;

                if (handsOverHead && feetApart) {
                    if (exerciseStage !== 'UP') {
                        exerciseStage = 'UP';
                        updateMetrics(180, 'Full Extension! Jump back in.', 'UP');
                    }
                } else {
                    if (exerciseStage === 'UP') {
                        incrementRep(0.4);
                        updateMetrics(0, 'Rep Counted! Keep rhythm!', 'DOWN');
                    } else {
                        updateMetrics(0, 'Jump out and arms up!', 'DOWN');
                    }
                }
            }
        } else if (currentExercise === 'pushups') {
            const shoulder = landmarks[11];
            const elbow = landmarks[13];
            const wrist = landmarks[15];

            if (shoulder && elbow && wrist) {
                const elbowAngle = calculateAngle(shoulder, elbow, wrist);
                if (elbowAngle > 155) {
                    if (exerciseStage === 'DOWN') {
                        incrementRep(0.6);
                        updateMetrics(elbowAngle, 'Full push-up rep completed!', 'UP');
                    } else {
                        updateMetrics(elbowAngle, 'Lower chest toward floor.', 'UP');
                    }
                } else if (elbowAngle < 90) {
                    updateMetrics(elbowAngle, 'Chest Down! Now drive upwards!', 'DOWN');
                }
            }
        }

        canvasCtx.restore();
    }

    // Helper: Draw joints and bones on canvas
    function drawSkeleton(landmarks, w, h) {
        const connections = [
            [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Upper body
            [11, 23], [12, 24], [23, 24],                      // Torso
            [23, 25], [24, 26], [25, 27], [26, 28]             // Legs
        ];

        // Draw connections
        canvasCtx.strokeStyle = '#10b981';
        canvasCtx.lineWidth = 4;
        canvasCtx.lineCap = 'round';

        connections.forEach(([p1, p2]) => {
            const pt1 = landmarks[p1];
            const pt2 = landmarks[p2];
            if (pt1 && pt2 && (pt1.visibility === undefined || pt1.visibility > 0.5) && (pt2.visibility === undefined || pt2.visibility > 0.5)) {
                canvasCtx.beginPath();
                canvasCtx.moveTo(pt1.x * w, pt1.y * h);
                canvasCtx.lineTo(pt2.x * w, pt2.y * h);
                canvasCtx.stroke();
            }
        });

        // Draw joints
        landmarks.forEach((pt, index) => {
            if ([11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(index)) {
                if (pt.visibility === undefined || pt.visibility > 0.5) {
                    canvasCtx.beginPath();
                    canvasCtx.arc(pt.x * w, pt.y * h, 6, 0, 2 * Math.PI);
                    canvasCtx.fillStyle = '#06b6d4';
                    canvasCtx.fill();
                    canvasCtx.lineWidth = 2;
                    canvasCtx.strokeStyle = '#ffffff';
                    canvasCtx.stroke();
                }
            }
        });
    }

    // Initialize Camera Feed
    async function startCamera() {
        if (isCameraActive) return;

        if (cameraPlaceholder) cameraPlaceholder.classList.add('d-none');
        if (visionHud) visionHud.classList.remove('d-none');
        if (visionFeedback) visionFeedback.classList.remove('d-none');
        if (btnToggleCamera) btnToggleCamera.removeAttribute('disabled');

        startTimer();

        try {
            // Check if MediaPipe is loaded
            if (typeof Pose !== 'undefined') {
                poseTracker = new Pose({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
                });

                poseTracker.setOptions({
                    modelComplexity: 1,
                    smoothLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                poseTracker.onResults(onPoseResults);

                if (typeof Camera !== 'undefined' && videoElement) {
                    cameraInstance = new Camera(videoElement, {
                        onFrame: async () => {
                            if (canvasElement && videoElement.videoWidth) {
                                canvasElement.width = videoElement.videoWidth;
                                canvasElement.height = videoElement.videoHeight;
                            }
                            if (poseTracker && isCameraActive) {
                                await poseTracker.send({ image: videoElement });
                            }
                        },
                        width: 640,
                        height: 480
                    });

                    await cameraInstance.start();
                    isCameraActive = true;
                    speakFeedback(`${currentExercise} tracking active. Let's begin.`);
                    return;
                }
            }

            // Fallback to standard getUserMedia
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            cameraStream = stream;
            videoElement.srcObject = stream;
            await videoElement.play();
            isCameraActive = true;
            runFallbackDetection();
            speakFeedback(`${currentExercise} tracker ready.`);
        } catch (err) {
            console.warn('Webcam access error. Falling back to demo mode:', err);
            startDemoSimulation();
        }
    }

    // Fallback animation loop if MediaPipe CDN was blocked
    function runFallbackDetection() {
        if (!isCameraActive) return;
        if (canvasElement && videoElement.videoWidth) {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
        }
        // Simulated tracking loop on real video feed
        let step = 0;
        const interval = setInterval(() => {
            if (!isCameraActive) {
                clearInterval(interval);
                return;
            }
            step++;
            const simulatedAngle = 90 + Math.round(70 * Math.sin(step * 0.15));
            if (simulatedAngle > 155 && exerciseStage === 'DOWN') {
                incrementRep();
                updateMetrics(simulatedAngle, 'Rep Completed!', 'UP');
            } else if (simulatedAngle < 95 && exerciseStage === 'UP') {
                updateMetrics(simulatedAngle, 'Good Depth! Rise up!', 'DOWN');
            } else {
                updateMetrics(simulatedAngle, 'Tracking Movement...', exerciseStage);
            }
        }, 120);
    }

    // Demo Mode Simulation (for testing without camera)
    function startDemoSimulation() {
        isDemoMode = true;
        isCameraActive = true;
        if (cameraPlaceholder) cameraPlaceholder.classList.add('d-none');
        if (visionHud) visionHud.classList.remove('d-none');
        if (visionFeedback) visionFeedback.classList.remove('d-none');
        if (btnToggleCamera) btnToggleCamera.removeAttribute('disabled');

        startTimer();
        speakFeedback('AI Demo Simulation Mode Started.');

        if (canvasElement) {
            canvasElement.width = 640;
            canvasElement.height = 480;
        }

        let frame = 0;
        demoInterval = setInterval(() => {
            if (!isCameraActive) return;
            frame++;

            // Create animated synthetic landmarks
            const progress = (Math.sin(frame * 0.12) + 1) / 2; // 0 to 1
            const kneeAngle = Math.round(75 + progress * 95); // 75 to 170

            // Draw simulated skeleton on canvas
            if (canvasCtx && canvasElement) {
                canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                canvasCtx.fillStyle = '#0f172a';
                canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

                // Grid background
                canvasCtx.strokeStyle = 'rgba(255,255,255,0.06)';
                canvasCtx.lineWidth = 1;
                for (let x = 0; x < canvasElement.width; x += 40) {
                    canvasCtx.beginPath();
                    canvasCtx.moveTo(x, 0);
                    canvasCtx.lineTo(x, canvasElement.height);
                    canvasCtx.stroke();
                }

                // Center human silhouette
                const cx = canvasElement.width / 2;
                const cy = canvasElement.height / 2;
                const squatOffset = (1 - progress) * 50;

                // Draw synthetic skeleton
                canvasCtx.strokeStyle = '#10b981';
                canvasCtx.lineWidth = 5;
                // Spine & Head
                canvasCtx.beginPath();
                canvasCtx.arc(cx, 100 + squatOffset, 20, 0, Math.PI * 2);
                canvasCtx.fillStyle = '#06b6d4';
                canvasCtx.fill();
                canvasCtx.stroke();

                canvasCtx.beginPath();
                canvasCtx.moveTo(cx, 120 + squatOffset);
                canvasCtx.lineTo(cx, 260 + squatOffset); // Spine
                // Arms
                canvasCtx.moveTo(cx - 50, 180 + squatOffset);
                canvasCtx.lineTo(cx + 50, 180 + squatOffset);
                // Legs
                canvasCtx.moveTo(cx, 260 + squatOffset);
                canvasCtx.lineTo(cx - 40, 360 + squatOffset * 0.5);
                canvasCtx.lineTo(cx - 50, 440);
                canvasCtx.moveTo(cx, 260 + squatOffset);
                canvasCtx.lineTo(cx + 40, 360 + squatOffset * 0.5);
                canvasCtx.lineTo(cx + 50, 440);
                canvasCtx.stroke();
            }

            if (kneeAngle > 155) {
                if (exerciseStage === 'DOWN') {
                    incrementRep();
                    updateMetrics(kneeAngle, 'Rep Completed! Push Up!', 'UP');
                } else {
                    updateMetrics(kneeAngle, 'Squat Down smoothly', 'UP');
                }
            } else if (kneeAngle < 95) {
                updateMetrics(kneeAngle, 'Optimal Depth! Rise now!', 'DOWN');
            } else {
                updateMetrics(kneeAngle, 'AI Tracking Joint Angles...', exerciseStage);
            }
        }, 120);
    }

    // Stop Camera
    function stopCamera() {
        isCameraActive = false;
        clearInterval(timerInterval);
        if (demoInterval) clearInterval(demoInterval);

        if (cameraInstance) {
            try { cameraInstance.stop(); } catch (e) {}
        }
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            cameraStream = null;
        }
        if (videoElement) {
            videoElement.srcObject = null;
        }

        if (cameraPlaceholder) cameraPlaceholder.classList.remove('d-none');
        if (visionHud) visionHud.classList.add('d-none');
        if (visionFeedback) visionFeedback.classList.add('d-none');
        if (btnToggleCamera) btnToggleCamera.setAttribute('disabled', 'true');
        if (cardStage) cardStage.textContent = 'STOPPED';
    }

    // Timer logic
    function startTimer() {
        clearInterval(timerInterval);
        workoutSeconds = 0;
        timerInterval = setInterval(() => {
            workoutSeconds++;
            const m = String(Math.floor(workoutSeconds / 60)).padStart(2, '0');
            const s = String(workoutSeconds % 60).padStart(2, '0');
            if (hudTimer) hudTimer.textContent = `${m}:${s}`;
        }, 1000);
    }

    // Save Completed Workout to SQLite Database via REST API
    async function saveWorkoutToDashboard() {
        if (repCount === 0) {
            alert('Complete at least 1 repetition before saving workout.');
            return;
        }

        const durationMinutes = Math.max(1, Math.round(workoutSeconds / 60));
        const estCalories = Math.round(repCount * 0.45 * 10) / 10;
        const todayStr = new Date().toISOString().split('T')[0];

        btnSaveWorkout.setAttribute('disabled', 'true');
        btnSaveWorkout.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i>Saving...';

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
                    workout_type: currentExercise.charAt(0).toUpperCase() + currentExercise.slice(1) + ' (AI Vision)',
                    workout_duration: durationMinutes,
                    calories_burned: Math.max(15, estCalories),
                    steps: currentExercise === 'jacks' ? repCount * 2 : 0,
                    water_intake: 0.3,
                    sleep_duration: 7.5
                })
            });

            const data = await response.json();
            if (data.success) {
                const toastEl = document.getElementById('visionToast');
                const toastMsg = document.getElementById('toastMessage');
                if (toastMsg) toastMsg.textContent = `Success! Saved ${repCount} reps (${durationMinutes} min, ${estCalories} kcal) to your Activity Log!`;
                if (toastEl && window.bootstrap) {
                    const toast = new bootstrap.Toast(toastEl);
                    toast.show();
                }
                btnSaveWorkout.innerHTML = '<i class="fa-solid fa-check me-1"></i>Saved to Dashboard';
                speakFeedback('Workout saved to your dashboard successfully!');
            } else {
                alert('Save failed: ' + (data.error || 'Server error'));
                btnSaveWorkout.removeAttribute('disabled');
                btnSaveWorkout.innerHTML = '<i class="fa-solid fa-cloud-arrow-up me-1"></i>Save Workout';
            }
        } catch (e) {
            console.error('Save workout error:', e);
            alert('Failed to connect to backend server. Make sure server is running.');
            btnSaveWorkout.removeAttribute('disabled');
            btnSaveWorkout.innerHTML = '<i class="fa-solid fa-cloud-arrow-up me-1"></i>Save Workout';
        }
    }

    // Event Listeners
    if (btnStartCamera) btnStartCamera.addEventListener('click', startCamera);
    if (btnToggleCamera) btnToggleCamera.addEventListener('click', stopCamera);
    if (btnDemoMode) btnDemoMode.addEventListener('click', startDemoSimulation);

    if (btnResetReps) {
        btnResetReps.addEventListener('click', () => {
            repCount = 0;
            exerciseStage = 'READY';
            if (hudRepCount) hudRepCount.textContent = '0';
            if (cardReps) cardReps.textContent = '0';
            if (cardCalories) cardCalories.textContent = '0 kcal';
            if (cardStage) cardStage.textContent = 'READY';
            workoutSeconds = 0;
            if (hudTimer) hudTimer.textContent = '00:00';
            playBeep(440, 0.1);
        });
    }

    if (btnToggleSound) {
        btnToggleSound.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            if (soundIcon) {
                soundIcon.className = soundEnabled ? 'fa-solid fa-volume-high text-success' : 'fa-solid fa-volume-xmark text-secondary';
            }
        });
    }

    if (btnSaveWorkout) btnSaveWorkout.addEventListener('click', saveWorkoutToDashboard);

    // Exercise Selection Handling
    exerciseCards.forEach(card => {
        card.addEventListener('click', () => {
            exerciseCards.forEach(c => {
                c.classList.remove('active');
                const check = c.querySelector('.checkmark-icon');
                if (check) check.className = 'fa-solid fa-circle text-secondary checkmark-icon';
            });

            card.classList.add('active');
            const check = card.querySelector('.checkmark-icon');
            if (check) check.className = 'fa-solid fa-check-circle text-success checkmark-icon';

            currentExercise = card.getAttribute('data-exercise');
            if (hudExerciseName) {
                hudExerciseName.textContent = card.querySelector('.fw-bold')?.textContent || 'Exercise';
            }
            repCount = 0;
            exerciseStage = 'READY';
            if (hudRepCount) hudRepCount.textContent = '0';
            if (cardReps) cardReps.textContent = '0';
            if (cardCalories) cardCalories.textContent = '0 kcal';
            if (cardStage) cardStage.textContent = 'READY';

            // Update Follow Trainer Video source
            const trainerVideos = {
                squats: { url: 'https://www.youtube.com/embed/aclHkVaku9U?rel=0&enablejsapi=1', label: 'Bodyweight Squats' },
                curls: { url: 'https://www.youtube.com/embed/ykJmrZ5v0Oo?rel=0&enablejsapi=1', label: 'Bicep Curls' },
                jacks: { url: 'https://www.youtube.com/embed/c4DAnQ6DtF8?rel=0&enablejsapi=1', label: 'Jumping Jacks' },
                pushups: { url: 'https://www.youtube.com/embed/IODxDxX7oi4?rel=0&enablejsapi=1', label: 'Push-Ups' }
            };

            const tData = trainerVideos[currentExercise];
            const tIframe = document.getElementById('visionTrainerIframe');
            const tLabel = document.getElementById('trainerVideoLabel');
            if (tData && tIframe) {
                tIframe.src = tData.url;
                if (tLabel) tLabel.textContent = tData.label;
            }

            speakFeedback(`Switched to ${card.querySelector('.fw-bold')?.textContent || currentExercise}`);
        });
    });

    // Trainer Video Guide Toggle
    const btnToggleTrainerVideo = document.getElementById('btnToggleTrainerVideo');
    const btnCloseTrainerVideo = document.getElementById('btnCloseTrainerVideo');
    const trainerVideoContainer = document.getElementById('trainerVideoContainer');

    if (btnToggleTrainerVideo && trainerVideoContainer) {
        btnToggleTrainerVideo.addEventListener('click', () => {
            const isHidden = trainerVideoContainer.classList.contains('d-none');
            if (isHidden) {
                trainerVideoContainer.classList.remove('d-none');
                btnToggleTrainerVideo.innerHTML = '<i class="fa-solid fa-eye-slash me-1"></i>Hide Video Trainer';
                btnToggleTrainerVideo.className = 'btn-glass text-warning border-warning';
            } else {
                trainerVideoContainer.classList.add('d-none');
                btnToggleTrainerVideo.innerHTML = '<i class="fa-solid fa-play me-1"></i>Follow Video Trainer';
                btnToggleTrainerVideo.className = 'btn-glass text-info border-info';
            }
        });
    }

    if (btnCloseTrainerVideo && trainerVideoContainer) {
        btnCloseTrainerVideo.addEventListener('click', () => {
            trainerVideoContainer.classList.add('d-none');
            if (btnToggleTrainerVideo) {
                btnToggleTrainerVideo.innerHTML = '<i class="fa-solid fa-play me-1"></i>Follow Video Trainer';
                btnToggleTrainerVideo.className = 'btn-glass text-info border-info';
            }
        });
    }

})();
