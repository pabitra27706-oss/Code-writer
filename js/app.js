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
    const resSelect        = document.getElementById('resolutionSelect');
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

    // ---- State ----
    let parsedData    = null;
    let isAnimating   = false;
    let isRecordMode  = false;
    let recStart      = 0;
    let recInterval   = null;
    let recBlob       = null;
    let recUrl        = null;

    const LANG_NAMES = {
        javascript:'JavaScript',python:'Python',java:'Java',
        cpp:'C++',c:'C',csharp:'C#',typescript:'TypeScript',
        html:'HTML',css:'CSS',php:'PHP',ruby:'Ruby',
        go:'Go',rust:'Rust',swift:'Swift',kotlin:'Kotlin',
        dart:'Dart',sql:'SQL',bash:'Bash',json:'JSON',
        xml:'XML',yaml:'YAML',markdown:'Markdown'
    };

    // ========================
    //  INIT
    // ========================

    function init() {
        EditorUI.init();
        EditorUI.reset();
        bindEvents();
        syncUI();

        if (!Recorder.isSupported()) {
            btnRecord.disabled = true;
            btnRecord.title = 'Not supported in this browser';
            btnRecord.style.opacity = '0.4';
        }
    }

    // ========================
    //  EVENTS
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

        btnPlay.addEventListener('click', onPlay);
        btnRecord.addEventListener('click', onRecord);
        btnReset.addEventListener('click', onReset);

        codeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const s = codeInput.selectionStart, en = codeInput.selectionEnd;
                codeInput.value = codeInput.value.substring(0, s) + '    ' + codeInput.value.substring(en);
                codeInput.selectionStart = codeInput.selectionEnd = s + 4;
            }
        });

        window.addEventListener('resize', () => EditorUI.updateEditorHeight());
        btnDl.addEventListener('click', downloadVideo);
        btnCloseDl.addEventListener('click', closeDlOverlay);
    }

    // ========================
    //  PLAY (DOM editor only)
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
    //  RECORD (canvas + video)
    // ========================

    function onRecord() {
        if (isRecordMode) { stopRecEarly(); return; }

        if (!Recorder.isSupported()) {
            alert('Recording not supported.\nUse Chrome, Firefox, or Edge.');
            return;
        }

        const code = codeInput.value;
        if (!code.trim()) { shake(btnRecord); return; }

        // Stop any running play animation
        if (isAnimating) {
            TypingEngine.stop();
            isAnimating = false;
            setPlayBtn('play');
        }

        showCanvas();
        runAnimation(true);
    }

    async function startRec() {
        const [w, h] = resSelect.value.split('x').map(Number);

        Recorder.init({
            width: w, height: h, fps: 30,
            bitrate: Math.max(w, h) >= 1920 ? 8000000 : 5000000,
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
        if (buf > 0) { Recorder.setComplete(true); await wait(buf * 1000); }

        const blob = await Recorder.stopRecording();
        isRecordMode = false;
        hideRecUI();
        setRecBtn('rec');
        showEditor();

        if (blob && blob.size > 0) { recBlob = blob; showDlOverlay(blob); }
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

        if (blob && blob.size > 0) { recBlob = blob; showDlOverlay(blob); }
    }

    // ========================
    //  ANIMATION ENGINE
    // ========================

    function runAnimation(withRec) {
        const code = codeInput.value;
        if (!code.trim()) { shake(withRec ? btnRecord : btnPlay); return; }

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
                if (isRecordMode) Recorder.updateState(li, cc, rev, tot);
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
                EditorUI.setLineHTML(last,
                    HighlightParser.buildFullLine(parsedData.lines[last - 1].tokens), true);

                if (isRecordMode) {
                    const ll = parsedData.lines[last - 1];
                    Recorder.updateState(last - 1, ll.charCount,
                        parsedData.totalChars, parsedData.totalChars);
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
        EditorUI.setLineHTML(num,
            HighlightParser.buildPartialLine(parsedData.lines[li].tokens, cc), true);
    }

    // ========================
    //  RESET
    // ========================

    function onReset() {
        if (isRecordMode) { stopRecEarly(); return; }
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
    //  VIEW SWITCH
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
    //  RECORDING UI
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
        if (recInterval) { clearInterval(recInterval); recInterval = null; }
    }

    // ========================
    //  DOWNLOAD
    // ========================

    function showDlOverlay(blob) {
        if (recUrl) URL.revokeObjectURL(recUrl);
        recUrl = URL.createObjectURL(blob);
        dlVideo.src = recUrl;
        dlVideo.load();
        dlSize.textContent = (blob.size / 1048576).toFixed(2) + ' MB';
        dlDur.textContent  = ((Date.now() - recStart) / 1000).toFixed(1) + 's';
        dlRes.textContent  = resSelect.value.replace('x', '×');
        dlOverlay.classList.add('active');
    }
    function closeDlOverlay() {
        dlOverlay.classList.remove('active');
        dlVideo.pause(); dlVideo.src = '';
    }
    function downloadVideo() {
        if (!recBlob) return;
        const ext  = recBlob.type.includes('mp4') ? 'mp4' : 'webm';
        const name = (fileNameInput.value || 'codetype').replace(/\.[^.]+$/, '');
        const a = document.createElement('a');
        a.href = recUrl || URL.createObjectURL(recBlob);
        a.download = `${name}_typing.${ext}`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }

    // ========================
    //  HELPERS
    // ========================

    function setPlayBtn(s) {
        const map = { play: ['▶','Play',false], pause: ['⏸','Pause',false], resume: ['▶','Resume',true] };
        const [icon, text, paused] = map[s];
        playIcon.textContent = icon; playText.textContent = text;
        btnPlay.classList.toggle('paused', paused);
    }
    function setRecBtn(s) {
        if (s === 'rec') {
            recordIcon.textContent = '⏺'; recordText.textContent = 'Record';
            btnRecord.classList.remove('recording');
        } else {
            recordIcon.textContent = '⏹'; recordText.textContent = 'Stop Rec';
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
        nlValue.textContent    = nlSlider.value;
        bufValue.textContent   = bufSlider.value;
        EditorUI.setFileName(fileNameInput.value || 'index.js');
        EditorUI.setLanguage(languageSelect.value);
    }
    function autoFileName() {
        const map = {
            javascript:'index.js',python:'main.py',java:'Main.java',
            cpp:'main.cpp',c:'main.c',csharp:'Program.cs',
            typescript:'index.ts',html:'index.html',css:'style.css',
            php:'index.php',ruby:'main.rb',go:'main.go',
            rust:'main.rs',swift:'main.swift',kotlin:'Main.kt',
            dart:'main.dart',sql:'query.sql',bash:'script.sh',
            json:'data.json',xml:'data.xml',yaml:'config.yml',
            markdown:'README.md'
        };
        const n = map[languageSelect.value] || 'untitled';
        fileNameInput.value = n;
        EditorUI.setFileName(n);
    }
    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
    function waitFonts() {
        return document.fonts && document.fonts.ready ? document.fonts.ready : wait(500);
    }

    // Shake keyframes
    const sty = document.createElement('style');
    sty.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}50%{transform:translateX(6px)}75%{transform:translateX(-4px)}}`;
    document.head.appendChild(sty);

    // Boot
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init);
    else init();

})();