/* =============================================
   APP.JS — Main Controller
   Wires everything together: UI events,
   parser, engine, editor, and recorder.
   ============================================= */

(function () {
    'use strict';

    // ---- DOM Elements ----
    const codeInput          = document.getElementById('codeInput');
    const languageSelect     = document.getElementById('languageSelect');
    const fileNameInput      = document.getElementById('fileNameInput');
    const speedSlider        = document.getElementById('speedSlider');
    const speedValue         = document.getElementById('speedValue');
    const newlineDelaySlider = document.getElementById('newlineDelay');
    const newlineDelayValue  = document.getElementById('newlineDelayValue');
    const humanizeToggle     = document.getElementById('humanizeToggle');
    const soundToggle        = document.getElementById('soundToggle');
    const resolutionSelect   = document.getElementById('resolutionSelect');
    const endBufferSlider    = document.getElementById('endBufferSlider');
    const endBufferValue     = document.getElementById('endBufferValue');

    const btnPlay            = document.getElementById('btnPlay');
    const playIcon           = document.getElementById('playIcon');
    const playText           = document.getElementById('playText');
    const btnRecord          = document.getElementById('btnRecord');
    const recordText         = document.getElementById('recordText');
    const btnReset           = document.getElementById('btnReset');
    const btnFullscreen      = document.getElementById('btnFullscreen');
    const btnExitFullscreen  = document.getElementById('btnExitFullscreen');

    const progressContainer  = document.getElementById('progressContainer');
    const progressBar        = document.getElementById('progressBar');
    const progressText       = document.getElementById('progressText');

    const recordingIndicator = document.getElementById('recordingIndicator');
    const recTimer           = document.getElementById('recTimer');

    const downloadOverlay    = document.getElementById('downloadOverlay');
    const previewVideo       = document.getElementById('previewVideo');
    const btnDownload        = document.getElementById('btnDownload');
    const btnCloseOverlay    = document.getElementById('btnCloseOverlay');
    const downloadSize       = document.getElementById('downloadSize');
    const downloadDuration   = document.getElementById('downloadDuration');
    const downloadResolution = document.getElementById('downloadResolution');

    // ---- State ----
    let parsedData     = null;
    let isAnimating    = false;
    let isRecordMode   = false;
    let recordStartTime = 0;
    let recTimerInterval = null;
    let recordedBlob   = null;
    let recordedUrl    = null;

    // ---- Initialize ----
    function init() {
        EditorUI.init();
        EditorUI.reset();
        bindEvents();
        updateUIFromInputs();

        // Disable record button if not supported
        if (!Recorder.isSupported()) {
            btnRecord.disabled = true;
            btnRecord.title = 'Recording not supported in this browser';
            btnRecord.style.opacity = '0.4';
        }
    }

    // ---- Event Bindings ----
    function bindEvents() {
        speedSlider.addEventListener('input', () => {
            speedValue.textContent = speedSlider.value;
            TypingEngine.configure({ speed: parseInt(speedSlider.value) });
        });

        newlineDelaySlider.addEventListener('input', () => {
            newlineDelayValue.textContent = newlineDelaySlider.value;
            TypingEngine.configure({ newlineDelay: parseInt(newlineDelaySlider.value) });
        });

        humanizeToggle.addEventListener('change', () => {
            TypingEngine.configure({ humanize: humanizeToggle.checked });
        });

        soundToggle.addEventListener('change', () => {
            TypingEngine.configure({ soundEnabled: soundToggle.checked });
        });

        endBufferSlider.addEventListener('input', () => {
            endBufferValue.textContent = endBufferSlider.value;
        });

        fileNameInput.addEventListener('input', () => {
            EditorUI.setFileName(fileNameInput.value || 'untitled');
        });

        languageSelect.addEventListener('change', () => {
            EditorUI.setLanguage(languageSelect.value);
            autoSetFileName();
        });

        // Play button
        btnPlay.addEventListener('click', handlePlay);

        // Record button
        btnRecord.addEventListener('click', handleRecord);

        // Reset button
        btnReset.addEventListener('click', handleReset);

        // Fullscreen button
        btnFullscreen.addEventListener('click', () => {
            if (EditorUI.isFullscreen()) {
                EditorUI.exitFullscreen();
            } else {
                EditorUI.enterFullscreen();
            }
        });

        btnExitFullscreen.addEventListener('click', () => {
            EditorUI.exitFullscreen();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && EditorUI.isFullscreen()) {
                EditorUI.exitFullscreen();
            }
        });

        // Tab key support in textarea
        codeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = codeInput.selectionStart;
                const end   = codeInput.selectionEnd;
                codeInput.value = codeInput.value.substring(0, start) + '    ' +
                    codeInput.value.substring(end);
                codeInput.selectionStart = codeInput.selectionEnd = start + 4;
            }
        });

        window.addEventListener('resize', () => {
            EditorUI.updateEditorHeight();
        });

        // Download overlay
        btnDownload.addEventListener('click', handleDownload);
        btnCloseOverlay.addEventListener('click', closeDownloadOverlay);
    }

    // ==========================================
    //  PLAY (no recording)
    // ==========================================

    function handlePlay() {
        const state = TypingEngine.getState();

        if (state.isRunning) {
            TypingEngine.pause();
            setPlayButton('resume');
            EditorUI.setCursorBlink();
            return;
        }

        if (state.isPaused) {
            TypingEngine.play();
            setPlayButton('pause');
            EditorUI.setCursorSolid();
            return;
        }

        startAnimation(false);
    }

    // ==========================================
    //  RECORD
    // ==========================================

    function handleRecord() {
        if (isRecordMode) {
            // Stop recording early
            stopRecordingEarly();
            return;
        }

        if (!Recorder.isSupported()) {
            alert('Recording is not supported in this browser.\nTry Chrome, Firefox, or Edge.');
            return;
        }

        startAnimation(true);
    }

    async function beginRecording() {
        const res = resolutionSelect.value.split('x');
        const width  = parseInt(res[0]);
        const height = parseInt(res[1]);

        Recorder.init({
            width: width,
            height: height,
            fps: 30,
            bitrate: width >= 1920 ? 8000000 : 4000000,
        });

        const language = languageSelect.value;
        const fileName = fileNameInput.value || 'untitled';

        // Language display names
        const langNames = {
            'javascript':'JavaScript','python':'Python','java':'Java',
            'cpp':'C++','c':'C','csharp':'C#','typescript':'TypeScript',
            'html':'HTML','css':'CSS','php':'PHP','ruby':'Ruby',
            'go':'Go','rust':'Rust','swift':'Swift','kotlin':'Kotlin',
            'dart':'Dart','sql':'SQL','bash':'Bash','json':'JSON',
            'xml':'XML','yaml':'YAML','markdown':'Markdown'
        };

        Recorder.setParsedData(parsedData);
        Recorder.setMeta(fileName, langNames[language] || language);

        try {
            await Recorder.startRecording();
        } catch (e) {
            alert('Failed to start recording: ' + e.message);
            isRecordMode = false;
            setRecordButton('record');
            return;
        }

        // Show recording indicator
        isRecordMode = true;
        setRecordButton('stop');
        showRecordingIndicator();
    }

    async function finishRecording() {
        const endBuffer = parseFloat(endBufferSlider.value) || 0;

        // Keep recording for the end buffer duration
        if (endBuffer > 0) {
            Recorder.setComplete(true);
            await wait(endBuffer * 1000);
        }

        const blob = await Recorder.stopRecording();
        isRecordMode = false;
        hideRecordingIndicator();
        setRecordButton('record');

        if (blob && blob.size > 0) {
            recordedBlob = blob;
            showDownloadOverlay(blob);
        }
    }

    async function stopRecordingEarly() {
        TypingEngine.stop();
        isAnimating = false;

        const blob = await Recorder.stopRecording();
        isRecordMode = false;
        hideRecordingIndicator();
        setRecordButton('record');
        setPlayButton('play');

        if (blob && blob.size > 0) {
            recordedBlob = blob;
            showDownloadOverlay(blob);
        }
    }

    // ==========================================
    //  SHARED ANIMATION STARTER
    // ==========================================

    function startAnimation(withRecording) {
        const code = codeInput.value;
        if (!code.trim()) {
            shakeButton(withRecording ? btnRecord : btnPlay);
            return;
        }

        const language = languageSelect.value;
        const fileName = fileNameInput.value || 'untitled';

        // Parse code
        parsedData = HighlightParser.parse(code, language);
        if (!parsedData || parsedData.lines.length === 0) return;

        // Setup editor
        EditorUI.reset();
        EditorUI.setLanguage(language);
        EditorUI.setFileName(fileName);

        // Show progress
        progressContainer.classList.add('active');
        updateProgress(0, parsedData.totalChars);

        // Configure engine
        TypingEngine.configure({
            speed: parseInt(speedSlider.value),
            newlineDelay: parseInt(newlineDelaySlider.value),
            humanize: humanizeToggle.checked,
            soundEnabled: soundToggle.checked,

            onStart: () => {
                isAnimating = true;
                setPlayButton('pause');
                EditorUI.setCursorSolid();

                if (withRecording) {
                    // Disable play button during recording
                    btnPlay.disabled = true;
                    btnPlay.style.opacity = '0.4';
                }
            },

            onTick: (lineIndex, charCount, totalRevealed, totalChars) => {
                // Update DOM editor
                renderTick(lineIndex, charCount);
                updateProgress(totalRevealed, totalChars);
                EditorUI.updateCursor(lineIndex + 1, charCount + 1);
                EditorUI.scrollIfNeeded();
                EditorUI.updateEditorHeight();

                // Update recorder state
                if (isRecordMode) {
                    Recorder.updateState(lineIndex, charCount, totalRevealed, totalChars);
                }
            },

            onLineComplete: (lineIndex) => {
                const line = parsedData.lines[lineIndex];
                const fullHTML = HighlightParser.buildFullLine(line.tokens);
                EditorUI.setLineHTML(lineIndex + 1, fullHTML, false);
            },

            onComplete: async () => {
                isAnimating = false;
                setPlayButton('play');
                EditorUI.setCursorBlink();
                updateProgress(parsedData.totalChars, parsedData.totalChars);

                // Finalize last line in DOM editor
                const lastLine = parsedData.lines.length;
                EditorUI.addCursorToLine(lastLine);
                const lastLineData = parsedData.lines[lastLine - 1];
                const fullHTML = HighlightParser.buildFullLine(lastLineData.tokens);
                EditorUI.setLineHTML(lastLine, fullHTML, true);

                // Re-enable play button
                btnPlay.disabled = false;
                btnPlay.style.opacity = '1';

                // Finish recording if active
                if (isRecordMode) {
                    await finishRecording();
                }
            }
        });

        // Load & play
        TypingEngine.load(parsedData);
        renderTick(0, 0);

        if (withRecording) {
            // Wait for fonts, then start recorder, then play
            waitForFonts().then(() => {
                beginRecording().then(() => {
                    // Initial state for recorder
                    Recorder.updateState(0, 0, 0, parsedData.totalChars);
                    TypingEngine.play();
                });
            });
        } else {
            TypingEngine.play();
        }
    }

    // ==========================================
    //  RESET
    // ==========================================

    function handleReset() {
        if (isRecordMode) {
            stopRecordingEarly();
        }

        TypingEngine.stop();
        EditorUI.reset();
        setPlayButton('play');
        setRecordButton('record');
        progressContainer.classList.remove('active');
        isAnimating = false;

        btnPlay.disabled = false;
        btnPlay.style.opacity = '1';
    }

    // ==========================================
    //  RENDER TICK
    // ==========================================

    function renderTick(lineIndex, charCount) {
        const lineNum = lineIndex + 1;
        const line = parsedData.lines[lineIndex];

        const existingContent = EditorUI.getLineContent(lineNum);
        if (!existingContent) {
            EditorUI.addLine(lineNum);
        }

        const partialHTML = HighlightParser.buildPartialLine(line.tokens, charCount);
        EditorUI.setLineHTML(lineNum, partialHTML, true);
    }

    // ==========================================
    //  RECORDING UI
    // ==========================================

    function showRecordingIndicator() {
        recordStartTime = Date.now();
        recordingIndicator.classList.add('active');

        recTimerInterval = setInterval(() => {
            const elapsed = Date.now() - recordStartTime;
            const s = Math.floor(elapsed / 1000);
            const m = Math.floor(s / 60);
            recTimer.textContent =
                String(m).padStart(2, '0') + ':' +
                String(s % 60).padStart(2, '0');
        }, 500);
    }

    function hideRecordingIndicator() {
        recordingIndicator.classList.remove('active');
        if (recTimerInterval) {
            clearInterval(recTimerInterval);
            recTimerInterval = null;
        }
    }

    function showDownloadOverlay(blob) {
        // Revoke previous URL
        if (recordedUrl) {
            URL.revokeObjectURL(recordedUrl);
        }

        recordedUrl = URL.createObjectURL(blob);

        // Set preview video
        previewVideo.src = recordedUrl;
        previewVideo.load();

        // Info
        const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        downloadSize.textContent = `${sizeMB} MB`;

        const elapsed = Date.now() - recordStartTime;
        const durationSec = (elapsed / 1000).toFixed(1);
        downloadDuration.textContent = `${durationSec}s`;

        const res = resolutionSelect.value.replace('x', '×');
        downloadResolution.textContent = res;

        downloadOverlay.classList.add('active');
    }

    function closeDownloadOverlay() {
        downloadOverlay.classList.remove('active');
        previewVideo.pause();
        previewVideo.src = '';
    }

    function handleDownload() {
        if (!recordedBlob) return;

        const ext = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
        const fileName = (fileNameInput.value || 'codetype').replace(/\.[^.]+$/, '');
        const downloadName = `${fileName}_typing.${ext}`;

        const a = document.createElement('a');
        a.href = recordedUrl || URL.createObjectURL(recordedBlob);
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // ==========================================
    //  UI HELPERS
    // ==========================================

    function setPlayButton(state) {
        switch (state) {
            case 'play':
                playIcon.textContent = '▶';
                playText.textContent = 'Play';
                btnPlay.classList.remove('paused');
                break;
            case 'pause':
                playIcon.textContent = '⏸';
                playText.textContent = 'Pause';
                btnPlay.classList.remove('paused');
                break;
            case 'resume':
                playIcon.textContent = '▶';
                playText.textContent = 'Resume';
                btnPlay.classList.add('paused');
                break;
        }
    }

    function setRecordButton(state) {
        switch (state) {
            case 'record':
                recordText.textContent = 'Record';
                btnRecord.classList.remove('recording');
                break;
            case 'stop':
                recordText.textContent = 'Stop Rec';
                btnRecord.classList.add('recording');
                break;
        }
    }

    function updateProgress(current, total) {
        if (total === 0) return;
        const pct = Math.round((current / total) * 100);
        progressBar.style.width = pct + '%';
        progressText.textContent = pct + '%';
    }

    function shakeButton(btn) {
        btn.style.animation = 'shake 0.4s ease';
        setTimeout(() => { btn.style.animation = ''; }, 400);
    }

    function updateUIFromInputs() {
        speedValue.textContent = speedSlider.value;
        newlineDelayValue.textContent = newlineDelaySlider.value;
        endBufferValue.textContent = endBufferSlider.value;
        EditorUI.setFileName(fileNameInput.value || 'index.js');
        EditorUI.setLanguage(languageSelect.value);
    }

    function autoSetFileName() {
        const lang = languageSelect.value;
        const extMap = {
            'javascript':'index.js','python':'main.py','java':'Main.java',
            'cpp':'main.cpp','c':'main.c','csharp':'Program.cs',
            'typescript':'index.ts','html':'index.html','css':'style.css',
            'php':'index.php','ruby':'main.rb','go':'main.go',
            'rust':'main.rs','swift':'main.swift','kotlin':'Main.kt',
            'dart':'main.dart','sql':'query.sql','bash':'script.sh',
            'json':'data.json','xml':'data.xml','yaml':'config.yml',
            'markdown':'README.md'
        };
        const newName = extMap[lang] || 'untitled';
        fileNameInput.value = newName;
        EditorUI.setFileName(newName);
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function waitForFonts() {
        if (document.fonts && document.fonts.ready) {
            return document.fonts.ready;
        }
        return wait(500); // fallback
    }

    // ---- Shake animation ----
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-6px); }
            50% { transform: translateX(6px); }
            75% { transform: translateX(-4px); }
        }
    `;
    document.head.appendChild(style);

    // ---- Boot ----
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();