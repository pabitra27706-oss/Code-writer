/* =============================================
   APP.JS — Main Controller
   Play  = DOM editor animation only
   Record = Canvas recording + animation
   ============================================= */

(function () {
    'use strict';

    // ---- DOM ----
    const codeInput        = document.getElementById('codeInput');
    const languageSelect   = document.getElementById('languageSelect');
    const fileNameInput    = document.getElementById('fileNameInput');
    const speedSlider      = document.getElementById('speedSlider');
    const speedValue       = document.getElementById('speedValue');
    const nlSlider         = document.getElementById('newlineDelay');
    const nlValue          = document.getElementById('newlineDelayValue');
    const humanizeToggle   = document.getElementById('humanizeToggle');
    const soundToggle      = document.getElementById('soundToggle');

    const formatSelect     = document.getElementById('formatSelect');
    const qualitySelect    = document.getElementById('qualitySelect');
    const formatInfo       = document.getElementById('formatInfo');
    const qualityWarning   = document.getElementById('qualityWarning');
    const formatRow        = document.getElementById('formatRow');

    const bufSlider        = document.getElementById('endBufferSlider');
    const bufValue         = document.getElementById('endBufferValue');

    const btnPlay          = document.getElementById('btnPlay');
    const playIcon         = document.getElementById('playIcon');
    const playText         = document.getElementById('playText');
    const btnRecord        = document.getElementById('btnRecord');
    const recordIcon       = document.getElementById('recordIcon');
    const recordText       = document.getElementById('recordText');
    const btnReset         = document.getElementById('btnReset');

    const editorWindow     = document.getElementById('editorWindow');
    const canvasPreview    = document.getElementById('canvasPreview');
    const progressWrap     = document.getElementById('progressContainer');
    const progressBar      = document.getElementById('progressBar');
    const progressTxt      = document.getElementById('progressText');
    const recIndicator     = document.getElementById('recordingIndicator');
    const recTimer         = document.getElementById('recTimer');

    const dlOverlay        = document.getElementById('downloadOverlay');
    const dlVideo          = document.getElementById('previewVideo');
    const btnDl            = document.getElementById('btnDownload');
    const btnCloseDl       = document.getElementById('btnCloseOverlay');
    const dlSize           = document.getElementById('downloadSize');
    const dlDur            = document.getElementById('downloadDuration');
    const dlRes            = document.getElementById('downloadResolution');
    const dlFmt            = document.getElementById('downloadFormat');

    // ---- State ----
    let parsedData    = null;
    let isAnimating   = false;
    let isRecordMode  = false;
    let recStart      = 0;
    let recInterval   = null;
    let recBlob       = null;
    let recUrl        = null;

    const LANG_NAMES = {
        javascript:'JavaScript', python:'Python', java:'Java',
        cpp:'C++', c:'C', csharp:'C#', typescript:'TypeScript',
        html:'HTML', css:'CSS', php:'PHP', ruby:'Ruby',
        go:'Go', rust:'Rust', swift:'Swift', kotlin:'Kotlin',
        dart:'Dart', sql:'SQL', bash:'Bash', json:'JSON',
        xml:'XML', yaml:'YAML', markdown:'Markdown'
    };

    // ========================
    // INIT
    // ========================

    function init() {
        EditorUI.init();
        EditorUI.reset();
        bindEvents();
        setupRecordingOptions();
        syncUI();

        if (!Recorder.isSupported()) {
            btnRecord.disabled = true;
            btnRecord.title = 'Not supported in this browser';
            btnRecord.style.opacity = '0.4';
        }
    }

    function setupRecordingOptions() {
        const browserSupport = Recorder.getBrowserSupport();
        const presets = Recorder.getQualityPresets();

        formatSelect.innerHTML = '';

        if (browserSupport.supportsMP4) {
            formatSelect.innerHTML += '<option value="mp4">MP4 (H.264)</option>';
        }
        if (browserSupport.supportsWebM) {
            formatSelect.innerHTML += '<option value="webm">WebM</option>';
        }

        formatSelect.value = browserSupport.preferredFormat;

        if (!browserSupport.supportsMP4) {
            if (formatRow) formatRow.style.display = 'none';
            formatInfo.style.display = 'block';
            formatInfo.textContent = 'This browser records in WebM. MP4 is shown only when supported.';
        } else {
            if (formatRow) formatRow.style.display = '';
            formatInfo.style.display = 'none';
        }

        qualitySelect.innerHTML = '';
        Object.keys(presets).forEach(key => {
            const p = presets[key];
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = `${p.label} (${p.width}×${p.height}) • ${p.fileSize}`;
            qualitySelect.appendChild(opt);
        });

        qualitySelect.value = browserSupport.getRecommendedQuality();
        updateQualityWarning();
    }

    function updateQualityWarning() {
        const preset = Recorder.getQualityPresets()[qualitySelect.value];
        if (!preset || !preset.warning) {
            qualityWarning.style.display = 'none';
            qualityWarning.textContent = '';
            return;
        }
        qualityWarning.style.display = 'block';
        qualityWarning.textContent = preset.warning;
    }

    // ========================
    // EVENTS
    // ========================

    function bindEvents() {
        speedSlider.addEventListener('input', () => {
            speedValue.textContent = speedSlider.value;
            TypingEngine.configure({ speed: +speedSlider.value });
        });

        nlSlider.addEventListener('input', () => {
            nlValue.textContent = nlSlider.value;
            TypingEngine.configure({ newlineDelay: +nlSlider.value });
        });

        humanizeToggle.addEventListener('change', () =>
            TypingEngine.configure({ humanize: humanizeToggle.checked }));

        soundToggle.addEventListener('change', () =>
            TypingEngine.configure({ soundEnabled: soundToggle.checked }));

        bufSlider.addEventListener('input', () =>
            bufValue.textContent = bufSlider.value);

        fileNameInput.addEventListener('input', () =>
            EditorUI.setFileName(fileNameInput.value || 'untitled'));

        languageSelect.addEventListener('change', () => {
            EditorUI.setLanguage(languageSelect.value);
            autoFileName();
        });

        qualitySelect.addEventListener('change', updateQualityWarning);

        btnPlay.addEventListener('click', onPlay);
        btnRecord.addEventListener('click', onRecord);
        btnReset.addEventListener('click', onReset);

        codeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const s = codeInput.selectionStart;
                const en = codeInput.selectionEnd;
                codeInput.value = codeInput.value.substring(0, s) + '    ' + codeInput.value.substring(en);
                codeInput.selectionStart = codeInput.selectionEnd = s + 4;
            }
        });

        window.addEventListener('resize', () => EditorUI.updateEditorHeight());
        btnDl.addEventListener('click', downloadVideo);
        btnCloseDl.addEventListener('click', closeDlOverlay);
    }

    // ========================
    // PLAY
    // ========================

    function onPlay() {
        if (isRecordMode) return;

        const st = TypingEngine.getState();
        if (st.isRunning) {
            TypingEngine.pause();
            setPlayBtn('resume');
            EditorUI.setCursorBlink();
            return;
        }
        if (st.isPaused) {
            TypingEngine.play();
            setPlayBtn('pause');
            EditorUI.setCursorSolid();
            return;
        }

        showEditor();
        runAnimation(false);
    }

    // ========================
    // RECORD
    // ========================

    function onRecord() {
        if (isRecordMode) {
            stopRecEarly();
            return;
        }

        if (!Recorder.isSupported()) {
            alert('Recording not supported in this browser.');
            return;
        }

        const code = codeInput.value;
        if (!code.trim()) {
            shake(btnRecord);
            return;
        }

        const preset = Recorder.getQualityPresets()[qualitySelect.value];
        if (qualitySelect.value === '4k') {
            const ok = confirm(
                '4K recording uses a lot of memory and may be slow or fail on some phones.\n\nContinue?'
            );
            if (!ok) return;
        }

        if (isAnimating) {
            TypingEngine.stop();
            isAnimating = false;
            setPlayBtn('play');
        }

        showCanvas();
        runAnimation(true);
    }

    async function startRec() {
        const quality = qualitySelect.value;
        const format = formatSelect.value || Recorder.getBrowserSupport().preferredFormat;
        const preset = Recorder.getQualityPresets()[quality];

        Recorder.init({
            quality: quality,
            format: format,
            fps: 30,
            bitrate: preset.bitrate
        });

        Recorder.setParsedData(parsedData);
        Recorder.setMeta(
            fileNameInput.value || 'untitled',
            LANG_NAMES[languageSelect.value] || languageSelect.value
        );

        canvasPreview.innerHTML = '';
        canvasPreview.appendChild(Recorder.getCanvas());

        try {
            await Recorder.startRecording();
        } catch (e) {
            alert('Recording failed:\n' + e.message);
            isRecordMode = false;
            showEditor();
            setRecBtn('rec');
            return;
        }

        isRecordMode = true;
        setRecBtn('stop');
        showRecUI();
    }

    async function finishRec() {
        const buf = parseFloat(bufSlider.value) || 0;
        if (buf > 0) {
            Recorder.setComplete(true);
            await wait(buf * 1000);
        }

        const blob = await Recorder.stopRecording();
        isRecordMode = false;
        hideRecUI();
        setRecBtn('rec');
        showEditor();

        if (blob && blob.size > 0) {
            recBlob = blob;
            showDlOverlay(blob);
        }
    }

    async function stopRecEarly() {
        TypingEngine.stop();
        isAnimating = false;

        const blob = await Recorder.stopRecording();
        isRecordMode = false;
        hideRecUI();
        setRecBtn('rec');
        setPlayBtn('play');
        btnPlay.disabled = false;
        showEditor();

        if (blob && blob.size > 0) {
            recBlob = blob;
            showDlOverlay(blob);
        }
    }

    // ========================
    // ANIMATION ENGINE
    // ========================

    function runAnimation(withRec) {
        const code = codeInput.value;
        if (!code.trim()) {
            shake(withRec ? btnRecord : btnPlay);
            return;
        }

        const lang = languageSelect.value;
        const fn   = fileNameInput.value || 'untitled';

        parsedData = HighlightParser.parse(code, lang);
        if (!parsedData || !parsedData.lines.length) return;

        EditorUI.reset();
        EditorUI.setLanguage(lang);
        EditorUI.setFileName(fn);
        progressWrap.classList.add('active');
        pct(0, parsedData.totalChars);

        TypingEngine.configure({
            speed: +speedSlider.value,
            newlineDelay: +nlSlider.value,
            humanize: humanizeToggle.checked,
            soundEnabled: withRec ? false : soundToggle.checked,

            onStart: () => {
                isAnimating = true;
                setPlayBtn('pause');
                if (!withRec) EditorUI.setCursorSolid();
                btnPlay.disabled = withRec;
            },

            onTick: (li, cc, rev, tot) => {
                renderLine(li, cc);
                pct(rev, tot);
                EditorUI.updateCursor(li + 1, cc + 1);

                if (!withRec) {
                    EditorUI.scrollIfNeeded();
                    EditorUI.updateEditorHeight();
                }

                if (isRecordMode) {
                    Recorder.updateState(li, cc, rev, tot);
                }
            },

            onLineComplete: (li) => {
                const line = parsedData.lines[li];
                EditorUI.setLineHTML(li + 1, HighlightParser.buildFullLine(line.tokens), false);
            },

            onComplete: async () => {
                isAnimating = false;
                setPlayBtn('play');
                EditorUI.setCursorBlink();
                pct(parsedData.totalChars, parsedData.totalChars);
                btnPlay.disabled = false;

                const last = parsedData.lines.length;
                EditorUI.addCursorToLine(last);
                EditorUI.setLineHTML(
                    last,
                    HighlightParser.buildFullLine(parsedData.lines[last - 1].tokens),
                    true
                );

                if (isRecordMode) {
                    const ll = parsedData.lines[last - 1];
                    Recorder.updateState(last - 1, ll.charCount, parsedData.totalChars, parsedData.totalChars);
                    await finishRec();
                }
            }
        });

        TypingEngine.load(parsedData);
        renderLine(0, 0);

        if (withRec) {
            waitFonts().then(() => startRec().then(() => {
                Recorder.updateState(0, 0, 0, parsedData.totalChars);
                TypingEngine.play();
            }));
        } else {
            TypingEngine.play();
        }
    }

    function renderLine(li, cc) {
        const num = li + 1;
        if (!EditorUI.getLineContent(num)) EditorUI.addLine(num);

        EditorUI.setLineHTML(
            num,
            HighlightParser.buildPartialLine(parsedData.lines[li].tokens, cc),
            true
        );
    }

    // ========================
    // RESET
    // ========================

    function onReset() {
        if (isRecordMode) {
            stopRecEarly();
            return;
        }

        TypingEngine.stop();
        EditorUI.reset();
        setPlayBtn('play');
        setRecBtn('rec');
        progressWrap.classList.remove('active');
        isAnimating = false;
        btnPlay.disabled = false;
        showEditor();
    }

    // ========================
    // VIEW SWITCH
    // ========================

    function showEditor() {
        editorWindow.style.display = '';
        canvasPreview.classList.remove('active');
    }

    function showCanvas() {
        editorWindow.style.display = 'none';
        canvasPreview.classList.add('active');
    }

    // ========================
    // RECORDING UI
    // ========================

    function showRecUI() {
        recStart = Date.now();
        recIndicator.classList.add('active');

        recInterval = setInterval(() => {
            const s = Math.floor((Date.now() - recStart) / 1000);
            recTimer.textContent =
                String(Math.floor(s / 60)).padStart(2, '0') + ':' +
                String(s % 60).padStart(2, '0');
        }, 500);
    }

    function hideRecUI() {
        recIndicator.classList.remove('active');
        if (recInterval) {
            clearInterval(recInterval);
            recInterval = null;
        }
    }

    // ========================
    // DOWNLOAD
    // ========================

    function showDlOverlay(blob) {
        if (recUrl) URL.revokeObjectURL(recUrl);
        recUrl = URL.createObjectURL(blob);

        const cfg = Recorder.getConfig();

        dlVideo.src = recUrl;
        dlVideo.load();

        dlSize.textContent = (blob.size / 1048576).toFixed(2) + ' MB';
        dlDur.textContent  = ((Date.now() - recStart) / 1000).toFixed(1) + 's';
        dlRes.textContent  = `${cfg.width}×${cfg.height}`;
        if (dlFmt) dlFmt.textContent = cfg.format.toUpperCase();

        dlOverlay.classList.add('active');
    }

    function closeDlOverlay() {
        dlOverlay.classList.remove('active');
        dlVideo.pause();
        dlVideo.src = '';
    }

    function downloadVideo() {
        if (!recBlob) return;

        const cfg = Recorder.getConfig();
        const ext = cfg.format === 'mp4' ? 'mp4' : 'webm';
        const name = (fileNameInput.value || 'codetype').replace(/\.[^.]+$/, '');
        const a = document.createElement('a');
        a.href = recUrl || URL.createObjectURL(recBlob);
        a.download = `${name}_${cfg.quality}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // ========================
    // HELPERS
    // ========================

    function setPlayBtn(s) {
        const map = {
            play: ['▶', 'Play', false],
            pause: ['⏸', 'Pause', false],
            resume: ['▶', 'Resume', true]
        };
        const [icon, text, paused] = map[s];
        playIcon.textContent = icon;
        playText.textContent = text;
        btnPlay.classList.toggle('paused', paused);
    }

    function setRecBtn(s) {
        if (s === 'rec') {
            recordIcon.textContent = '⏺';
            recordText.textContent = 'Record';
            btnRecord.classList.remove('recording');
        } else {
            recordIcon.textContent = '⏹';
            recordText.textContent = 'Stop Rec';
            btnRecord.classList.add('recording');
        }
    }

    function pct(cur, tot) {
        if (!tot) return;
        const p = Math.round(cur / tot * 100);
        progressBar.style.width = p + '%';
        progressTxt.textContent = p + '%';
    }

    function shake(el) {
        el.style.animation = 'shake .4s ease';
        setTimeout(() => el.style.animation = '', 400);
    }

    function syncUI() {
        speedValue.textContent = speedSlider.value;
        nlValue.textContent = nlSlider.value;
        bufValue.textContent = bufSlider.value;
        EditorUI.setFileName(fileNameInput.value || 'index.js');
        EditorUI.setLanguage(languageSelect.value);
    }

    function autoFileName() {
        const map = {
            javascript:'index.js', python:'main.py', java:'Main.java',
            cpp:'main.cpp', c:'main.c', csharp:'Program.cs',
            typescript:'index.ts', html:'index.html', css:'style.css',
            php:'index.php', ruby:'main.rb', go:'main.go',
            rust:'main.rs', swift:'main.swift', kotlin:'Main.kt',
            dart:'main.dart', sql:'query.sql', bash:'script.sh',
            json:'data.json', xml:'data.xml', yaml:'config.yml',
            markdown:'README.md'
        };

        const n = map[languageSelect.value] || 'untitled';
        fileNameInput.value = n;
        EditorUI.setFileName(n);
    }

    function wait(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function waitFonts() {
        return document.fonts && document.fonts.ready ? document.fonts.ready : wait(500);
    }

    const sty = document.createElement('style');
    sty.textContent = `
        @keyframes shake {
            0%,100% { transform: translateX(0) }
            25% { transform: translateX(-6px) }
            50% { transform: translateX(6px) }
            75% { transform: translateX(-4px) }
        }
    `;
    document.head.appendChild(sty);

    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init);
    else init();

})();