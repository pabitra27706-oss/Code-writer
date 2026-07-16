/* =============================================
   APP.JS — Main Controller
   - Speed fix (1 to 200 chars/sec accurate)
   - SVG file icon drawn on canvas tab
   - Mobile drawer sync
   - All features wired
   ============================================= */

(function () {
    'use strict';

    // ============================================================
    // HELPERS — get desktop or mobile control value
    // ============================================================
    function $d(id) { return document.getElementById(id); }

    function getVal(desktopId, mobileId) {
        const isMobile = window.innerWidth <= 768;
        const el = isMobile ? $d(mobileId) : $d(desktopId);
        return el ? el.value : ($d(desktopId) ? $d(desktopId).value : '');
    }

    function getChecked(desktopId, mobileId) {
        const isMobile = window.innerWidth <= 768;
        const el = isMobile ? $d(mobileId) : $d(desktopId);
        return el ? el.checked : ($d(desktopId) ? $d(desktopId).checked : false);
    }

    function syncBothInputs(desktopId, mobileId, value) {
        const d = $d(desktopId);
        const m = $d(mobileId);
        if (d) d.value = value;
        if (m) m.value = value;
    }

    function syncBothChecked(desktopId, mobileId, checked) {
        const d = $d(desktopId);
        const m = $d(mobileId);
        if (d) d.checked = checked;
        if (m) m.checked = checked;
    }

    // ============================================================
    // DOM — Desktop
    // ============================================================
    const codeInput          = $d('codeInput');
    const languageSelect     = $d('languageSelect');
    const fileNameInput      = $d('fileNameInput');
    const speedSlider        = $d('speedSlider');
    const speedValue         = $d('speedValue');
    const speedHint          = $d('speedHint');
    const nlSlider           = $d('newlineDelay');
    const nlValue            = $d('newlineDelayValue');
    const humanizeToggle     = $d('humanizeToggle');
    const mistakeToggle      = $d('mistakeToggle');
    const soundToggle        = $d('soundToggle');
    const minimapToggle      = $d('minimapToggle');
    const themeSelect        = $d('themeSelect');
    const backgroundSelect   = $d('backgroundSelect');
    const customBgGroup      = $d('customBgGroup');
    const customBgColor      = $d('customBgColor');
    const customBgHex        = $d('customBgHex');
    const cursorStyleSelect  = $d('cursorStyleSelect');
    const fontSizeSelect     = $d('fontSizeSelect');
    const aspectSelect       = $d('aspectSelect');
    const qualitySelect      = $d('qualitySelect');
    const formatSelect       = $d('formatSelect');
    const formatInfo         = $d('formatInfo');
    const qualityWarning     = $d('qualityWarning');
    const bufSlider          = $d('endBufferSlider');
    const bufValue           = $d('endBufferValue');
    const watermarkInput     = $d('watermarkInput');
    const watermarkPos       = $d('watermarkPos');
    const watermarkOpacity   = $d('watermarkOpacity');
    const watermarkOpVal     = $d('watermarkOpacityValue');
    const btnPlay            = $d('btnPlay');
    const playIcon           = $d('playIcon');
    const playText           = $d('playText');
    const btnRecord          = $d('btnRecord');
    const recordIcon         = $d('recordIcon');
    const recordText         = $d('recordText');
    const btnReset           = $d('btnReset');
    const editorWindow       = $d('editorWindow');
    const canvasPreview      = $d('canvasPreview');
    const progressWrap       = $d('progressContainer');
    const progressBar        = $d('progressBar');
    const progressTxt        = $d('progressText');
    const recIndicator       = $d('recordingIndicator');
    const recTimerEl         = $d('recTimer');
    const dlOverlay          = $d('downloadOverlay');
    const dlVideo            = $d('previewVideo');
    const btnDl              = $d('btnDownload');
    const btnCopyLink        = $d('btnCopyLink');
    const btnCloseDl         = $d('btnCloseOverlay');
    const dlSize             = $d('downloadSize');
    const dlDur              = $d('downloadDuration');
    const dlRes              = $d('downloadResolution');
    const dlFmt              = $d('downloadFormat');
    const charCountEl        = $d('charCount');
    const lineCountEl        = $d('lineCount');
    const estimatedTimeEl    = $d('estimatedTime');
    const fileImportInput    = $d('fileImportInput');
    const btnImportFile      = $d('btnImportFile');
    const btnClearCode       = $d('btnClearCode');
    const btnExitFullscreen  = $d('btnExitFullscreen');

    // ---- Mobile DOM ----
    const mobileHeader       = $d('mobileHeader');
    const mobileBtnPlay      = $d('mobileBtnPlay');
    const mobilePlayIcon     = $d('mobilePlayIcon');
    const mobileBtnRecord    = $d('mobileBtnRecord');
    const mobileRecordIcon   = $d('mobileRecordIcon');
    const mobileBtnReset     = $d('mobileBtnReset');
    const mobileBtnSettings  = $d('mobileBtnSettings');
    const hamburgerIcon      = $d('hamburgerIcon');
    const drawerOverlay      = $d('drawerOverlay');
    const settingsDrawer     = $d('settingsDrawer');
    const drawerTabs         = $d('drawerTabs');
    const mobileCodeInput    = $d('mobileCodeInput');
    const mobileBtnImport    = $d('mobileBtnImport');
    const mobileBtnClear     = $d('mobileBtnClear');
    const mobileCharCount    = $d('mobileCharCount');
    const mobileLineCount    = $d('mobileLineCount');
    const mobileEstTime      = $d('mobileEstTime');
    const mobileProgressWrap = $d('mobileProgressContainer');
    const mobileProgressBar  = $d('mobileProgressBar');
    const mobileProgressTxt  = $d('mobileProgressText');
    const mobileSpeedSlider  = $d('mobileSpeedSlider');
    const mobileSpeedValue   = $d('mobileSpeedValue');
    const mobileSpeedHint    = $d('mobileSpeedHint');
    const mobileNlSlider     = $d('mobileNewlineDelay');
    const mobileNlValue      = $d('mobileNlValue');
    const mobileQualityWarning = $d('mobileQualityWarning');
    const mobileEndBufSlider = $d('mobileEndBufferSlider');
    const mobileEndBufValue  = $d('mobileEndBufferValue');
    const mobileWatermarkOpacity = $d('mobileWatermarkOpacity');
    const mobileWatermarkOpVal   = $d('mobileWatermarkOpacityValue');

    // ============================================================
    // STATE
    // ============================================================
    let parsedData   = null;
    let isAnimating  = false;
    let isRecordMode = false;
    let recStart     = 0;
    let recInterval  = null;
    let recBlob      = null;
    let recUrl       = null;
    let drawerOpen   = false;

    const STORAGE_KEY = 'codetype_v2_settings';

    const LANG_NAMES = {
        javascript:'JavaScript', python:'Python',   java:'Java',
        cpp:'C++',  c:'C',       csharp:'C#',       typescript:'TypeScript',
        html:'HTML',css:'CSS',   php:'PHP',          ruby:'Ruby',
        go:'Go',    rust:'Rust', swift:'Swift',      kotlin:'Kotlin',
        dart:'Dart',sql:'SQL',   bash:'Bash',        json:'JSON',
        xml:'XML',  yaml:'YAML', markdown:'Markdown',scss:'SCSS',
        sass:'Sass',less:'Less', graphql:'GraphQL',  lua:'Lua',
        perl:'Perl',r:'R',       toml:'TOML',        ini:'INI',
        powershell:'PowerShell', vue:'Vue',          svelte:'Svelte',
        plaintext:'Plain Text'
    };

    const EXT_TO_LANG = {
        js:'javascript',  ts:'typescript',  jsx:'javascript', tsx:'typescript',
        py:'python',      java:'java',      cpp:'cpp',        cc:'cpp',
        cxx:'cpp',        c:'c',            cs:'csharp',      go:'go',
        rs:'rust',        swift:'swift',    kt:'kotlin',      kts:'kotlin',
        dart:'dart',      php:'php',        rb:'ruby',        sql:'sql',
        sh:'bash',        bash:'bash',      zsh:'bash',       ps1:'powershell',
        json:'json',      xml:'xml',        yml:'yaml',       yaml:'yaml',
        md:'markdown',    markdown:'markdown', scss:'scss',   sass:'sass',
        less:'less',      vue:'vue',        svelte:'svelte',  lua:'lua',
        pl:'perl',        r:'r',            tf:'plaintext',   toml:'toml',
        ini:'ini',        env:'plaintext',  txt:'plaintext',  html:'html',
        htm:'html',       css:'css',        svg:'xml',        graphql:'graphql',
        proto:'plaintext',m:'plaintext'
    };

    const AUTO_FILENAME = {
        javascript:'index.js',    typescript:'index.ts',  python:'main.py',
        java:'Main.java',         cpp:'main.cpp',         c:'main.c',
        csharp:'Program.cs',      go:'main.go',           rust:'main.rs',
        swift:'main.swift',       kotlin:'Main.kt',       dart:'main.dart',
        php:'index.php',          ruby:'main.rb',         sql:'query.sql',
        bash:'script.sh',         json:'data.json',       xml:'data.xml',
        yaml:'config.yml',        markdown:'README.md',   html:'index.html',
        css:'style.css',          scss:'style.scss',      sass:'style.sass',
        less:'style.less',        vue:'App.vue',          svelte:'App.svelte',
        lua:'main.lua',           perl:'script.pl',       r:'analysis.r',
        toml:'config.toml',       ini:'config.ini',       graphql:'schema.graphql',
        powershell:'script.ps1',  plaintext:'notes.txt'
    };

    const SPEED_HINTS = [
        [1,   15,  '🐢 Very Slow'],
        [16,  30,  '🐌 Slow'],
        [31,  60,  '👆 Medium'],
        [61,  100, '⚡ Fast'],
        [101, 150, '🚀 Very Fast'],
        [151, 200, '🔥 Blazing'],
    ];

    // ============================================================
    // INIT
    // ============================================================
    function init() {
        Toast.init();
        EditorUI.init();
        EditorUI.reset();

        loadSettings();
        bindDesktopEvents();
        bindMobileEvents();
        bindSharedEvents();
        setupRecordingOptions();
        syncAllUI();
        updateCodeMeta();

        if (!Recorder.isSupported()) {
            if (btnRecord)       { btnRecord.disabled       = true; btnRecord.style.opacity       = '0.4'; }
            if (mobileBtnRecord) { mobileBtnRecord.disabled = true; mobileBtnRecord.style.opacity = '0.4'; }
        }

        EditorUI.setTheme(themeSelect       ? themeSelect.value       : 'tokyo-night');
        EditorUI.setCursorStyle(cursorStyleSelect ? cursorStyleSelect.value : 'line');
        EditorUI.setFontSize(fontSizeSelect  ? fontSizeSelect.value    : 'medium');
    }

    // ============================================================
    // RECORDING OPTIONS
    // ============================================================
    function setupRecordingOptions() {
        const bs = Recorder.getBrowserSupport();

        [formatSelect, $d('mobileFormatSelect')].forEach(sel => {
            if (!sel) return;
            sel.innerHTML = '';
            if (bs.supportsMP4)  sel.innerHTML += '<option value="mp4">MP4 (H.264)</option>';
            if (bs.supportsWebM) sel.innerHTML += '<option value="webm">WebM (VP9)</option>';
            sel.value = bs.preferredFormat;
        });

        const msg = !bs.supportsMP4 && !bs.supportsWebM
            ? '⚠️ Your browser may not support recording.'
            : !bs.supportsMP4
                ? 'ℹ️ MP4 not supported — using WebM.'
                : '';

        [formatInfo, $d('mobileFormatInfo')].forEach(el => {
            if (!el) return;
            if (msg) { el.style.display = 'block'; el.textContent = msg; }
            else     { el.style.display = 'none'; }
        });

        const presets = Recorder.getQualityPresets();
        [$d('qualitySelect'), $d('mobileQualitySelect')].forEach(sel => {
            if (!sel) return;
            sel.innerHTML = '';
            Object.entries(presets).forEach(([key, p]) => {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = `${p.label} • ${p.fileSize}`;
                sel.appendChild(opt);
            });
            sel.value = bs.getRecommendedQuality();
        });

        updateQualityWarning();
    }

    function updateQualityWarning() {
        const qVal   = getVal('qualitySelect', 'mobileQualitySelect');
        const preset = Recorder.getQualityPresets()[qVal];
        const msg    = preset && preset.warning ? '⚠️ ' + preset.warning : '';

        [qualityWarning, mobileQualityWarning].forEach(el => {
            if (!el) return;
            if (msg) { el.style.display = 'block'; el.textContent = msg; }
            else     { el.style.display = 'none'; }
        });
    }

    // ============================================================
    // DESKTOP EVENTS
    // ============================================================
    function bindDesktopEvents() {
        if (codeInput) {
            codeInput.addEventListener('input', () => {
                if (mobileCodeInput) mobileCodeInput.value = codeInput.value;
                updateCodeMeta();
                debouncedSave();
            });

            codeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const s = codeInput.selectionStart;
                    codeInput.value =
                        codeInput.value.substring(0, s) + '    ' +
                        codeInput.value.substring(codeInput.selectionEnd);
                    codeInput.selectionStart = codeInput.selectionEnd = s + 4;
                    updateCodeMeta();
                }
            });
        }

        if (languageSelect) {
            languageSelect.addEventListener('change', () => {
                if ($d('mobileLanguageSelect'))
                    $d('mobileLanguageSelect').value = languageSelect.value;
                EditorUI.setLanguage(languageSelect.value);
                autoFileName();
                saveSettings();
            });
        }

        if (fileNameInput) {
            fileNameInput.addEventListener('input', () => {
                if ($d('mobileFileNameInput'))
                    $d('mobileFileNameInput').value = fileNameInput.value;
                EditorUI.setFileName(fileNameInput.value || 'untitled');
                saveSettings();
            });
        }

        if (speedSlider) {
            speedSlider.addEventListener('input', () => {
                const v = parseInt(speedSlider.value, 10);
                if (speedValue) speedValue.textContent = v;
                if (speedHint)  speedHint.textContent  = getSpeedHint(v);
                if (mobileSpeedSlider) mobileSpeedSlider.value       = v;
                if (mobileSpeedValue)  mobileSpeedValue.textContent  = v;
                if (mobileSpeedHint)   mobileSpeedHint.textContent   = getSpeedHint(v);
                TypingEngine.configure({ speed: v });
                updateCodeMeta();
                saveSettings();
            });
        }

        if (nlSlider) {
            nlSlider.addEventListener('input', () => {
                const v = parseInt(nlSlider.value, 10);
                if (nlValue) nlValue.textContent = v;
                if (mobileNlSlider) mobileNlSlider.value      = v;
                if (mobileNlValue)  mobileNlValue.textContent = v;
                TypingEngine.configure({ newlineDelay: v });
                saveSettings();
            });
        }

        if (humanizeToggle) {
            humanizeToggle.addEventListener('change', () => {
                if ($d('mobileHumanizeToggle'))
                    $d('mobileHumanizeToggle').checked = humanizeToggle.checked;
                TypingEngine.configure({ humanize: humanizeToggle.checked });
                saveSettings();
            });
        }

        if (mistakeToggle) {
            mistakeToggle.addEventListener('change', () => {
                if ($d('mobileMistakeToggle'))
                    $d('mobileMistakeToggle').checked = mistakeToggle.checked;
                TypingEngine.configure({ mistakeEnabled: mistakeToggle.checked });
                saveSettings();
            });
        }

        if (soundToggle) {
            soundToggle.addEventListener('change', () => {
                if ($d('mobileSoundToggle'))
                    $d('mobileSoundToggle').checked = soundToggle.checked;
                TypingEngine.configure({ soundEnabled: soundToggle.checked });
                saveSettings();
            });
        }

        if (minimapToggle) {
            minimapToggle.addEventListener('change', () => {
                if ($d('mobileMinimapToggle'))
                    $d('mobileMinimapToggle').checked = minimapToggle.checked;
                EditorUI.setMinimapVisible(minimapToggle.checked);
                saveSettings();
            });
        }

        if (themeSelect) {
            themeSelect.addEventListener('change', () => {
                if ($d('mobileThemeSelect'))
                    $d('mobileThemeSelect').value = themeSelect.value;
                EditorUI.setTheme(themeSelect.value);
                saveSettings();
            });
        }

        if (backgroundSelect) {
            backgroundSelect.addEventListener('change', () => {
                if ($d('mobileBackgroundSelect'))
                    $d('mobileBackgroundSelect').value = backgroundSelect.value;
                const isCustom = backgroundSelect.value === 'custom-color';
                if (customBgGroup)
                    customBgGroup.style.display = isCustom ? 'flex' : 'none';
                if ($d('mobileCustomBgGroup'))
                    $d('mobileCustomBgGroup').style.display = isCustom ? 'flex' : 'none';
                saveSettings();
            });
        }

        if (customBgColor) {
            customBgColor.addEventListener('input', () => {
                if (customBgHex) customBgHex.value = customBgColor.value;
                if ($d('mobileCustomBgColor'))
                    $d('mobileCustomBgColor').value = customBgColor.value;
                if ($d('mobileCustomBgHex'))
                    $d('mobileCustomBgHex').value = customBgColor.value;
                saveSettings();
            });
        }

        if (customBgHex) {
            customBgHex.addEventListener('input', () => {
                if (/^#[0-9A-Fa-f]{6}$/.test(customBgHex.value)) {
                    if (customBgColor) customBgColor.value = customBgHex.value;
                    saveSettings();
                }
            });
        }

        if (cursorStyleSelect) {
            cursorStyleSelect.addEventListener('change', () => {
                if ($d('mobileCursorStyleSelect'))
                    $d('mobileCursorStyleSelect').value = cursorStyleSelect.value;
                EditorUI.setCursorStyle(cursorStyleSelect.value);
                saveSettings();
            });
        }

        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', () => {
                if ($d('mobileFontSizeSelect'))
                    $d('mobileFontSizeSelect').value = fontSizeSelect.value;
                EditorUI.setFontSize(fontSizeSelect.value);
                saveSettings();
            });
        }

        if (qualitySelect) {
            qualitySelect.addEventListener('change', () => {
                if ($d('mobileQualitySelect'))
                    $d('mobileQualitySelect').value = qualitySelect.value;
                updateQualityWarning();
            });
        }

        if (bufSlider) {
            bufSlider.addEventListener('input', () => {
                if (bufValue) bufValue.textContent = bufSlider.value;
                if (mobileEndBufSlider) mobileEndBufSlider.value      = bufSlider.value;
                if (mobileEndBufValue)  mobileEndBufValue.textContent = bufSlider.value;
                saveSettings();
            });
        }

        if (watermarkOpacity) {
            watermarkOpacity.addEventListener('input', () => {
                if (watermarkOpVal) watermarkOpVal.textContent = watermarkOpacity.value;
                if (mobileWatermarkOpacity)
                    mobileWatermarkOpacity.value = watermarkOpacity.value;
                if (mobileWatermarkOpVal)
                    mobileWatermarkOpVal.textContent = watermarkOpacity.value;
                saveSettings();
            });
        }

        if (btnPlay)   btnPlay.addEventListener('click',   onPlay);
        if (btnRecord) btnRecord.addEventListener('click', onRecord);
        if (btnReset)  btnReset.addEventListener('click',  onReset);

        if (btnImportFile) btnImportFile.addEventListener('click', () => fileImportInput.click());
        if (btnClearCode)  btnClearCode.addEventListener('click',  onClearCode);
        if (btnExitFullscreen) {
            btnExitFullscreen.addEventListener('click', () => EditorUI.exitFullscreen());
        }
    }

    // ============================================================
    // MOBILE EVENTS
    // ============================================================
    function bindMobileEvents() {

        if (mobileBtnPlay)   mobileBtnPlay.addEventListener('click',   onPlay);
        if (mobileBtnRecord) mobileBtnRecord.addEventListener('click', onRecord);
        if (mobileBtnReset)  mobileBtnReset.addEventListener('click',  onReset);

        if (mobileBtnSettings) {
            mobileBtnSettings.addEventListener('click', toggleDrawer);
        }

        if (drawerOverlay) {
            drawerOverlay.addEventListener('click', closeDrawer);
        }

        if (drawerTabs) {
            drawerTabs.querySelectorAll('.drawer-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    const section = tab.getAttribute('data-section');
                    switchDrawerSection(section);
                });
            });
        }

        if (mobileCodeInput) {
            mobileCodeInput.addEventListener('input', () => {
                if (codeInput) codeInput.value = mobileCodeInput.value;
                updateCodeMeta();
                debouncedSave();
            });

            mobileCodeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const s = mobileCodeInput.selectionStart;
                    mobileCodeInput.value =
                        mobileCodeInput.value.substring(0, s) + '    ' +
                        mobileCodeInput.value.substring(mobileCodeInput.selectionEnd);
                    mobileCodeInput.selectionStart =
                        mobileCodeInput.selectionEnd = s + 4;
                    if (codeInput) codeInput.value = mobileCodeInput.value;
                    updateCodeMeta();
                }
            });
        }

        const mLang = $d('mobileLanguageSelect');
        if (mLang) {
            mLang.addEventListener('change', () => {
                if (languageSelect) languageSelect.value = mLang.value;
                EditorUI.setLanguage(mLang.value);
                autoFileName();
                saveSettings();
            });
        }

        const mFile = $d('mobileFileNameInput');
        if (mFile) {
            mFile.addEventListener('input', () => {
                if (fileNameInput) fileNameInput.value = mFile.value;
                EditorUI.setFileName(mFile.value || 'untitled');
                saveSettings();
            });
        }

        if (mobileSpeedSlider) {
            mobileSpeedSlider.addEventListener('input', () => {
                const v = parseInt(mobileSpeedSlider.value, 10);
                if (mobileSpeedValue) mobileSpeedValue.textContent = v;
                if (mobileSpeedHint)  mobileSpeedHint.textContent  = getSpeedHint(v);
                if (speedSlider)      speedSlider.value      = v;
                if (speedValue)       speedValue.textContent = v;
                if (speedHint)        speedHint.textContent  = getSpeedHint(v);
                TypingEngine.configure({ speed: v });
                updateCodeMeta();
                saveSettings();
            });
        }

        if (mobileNlSlider) {
            mobileNlSlider.addEventListener('input', () => {
                const v = parseInt(mobileNlSlider.value, 10);
                if (mobileNlValue) mobileNlValue.textContent = v;
                if (nlSlider)      nlSlider.value      = v;
                if (nlValue)       nlValue.textContent  = v;
                TypingEngine.configure({ newlineDelay: v });
                saveSettings();
            });
        }

        const mobileToggles = [
            ['mobileHumanizeToggle', 'humanizeToggle', v => TypingEngine.configure({ humanize: v })],
            ['mobileMistakeToggle',  'mistakeToggle',  v => TypingEngine.configure({ mistakeEnabled: v })],
            ['mobileSoundToggle',    'soundToggle',    v => TypingEngine.configure({ soundEnabled: v })],
            ['mobileMinimapToggle',  'minimapToggle',  v => EditorUI.setMinimapVisible(v)],
        ];

        mobileToggles.forEach(([mId, dId, cb]) => {
            const mEl = $d(mId);
            if (mEl) {
                mEl.addEventListener('change', () => {
                    const dEl = $d(dId);
                    if (dEl) dEl.checked = mEl.checked;
                    cb(mEl.checked);
                    saveSettings();
                });
            }
        });

        const mTheme = $d('mobileThemeSelect');
        if (mTheme) {
            mTheme.addEventListener('change', () => {
                if (themeSelect) themeSelect.value = mTheme.value;
                EditorUI.setTheme(mTheme.value);
                saveSettings();
            });
        }

        const mBg = $d('mobileBackgroundSelect');
        if (mBg) {
            mBg.addEventListener('change', () => {
                if (backgroundSelect) backgroundSelect.value = mBg.value;
                const isCustom = mBg.value === 'custom-color';
                if ($d('mobileCustomBgGroup'))
                    $d('mobileCustomBgGroup').style.display = isCustom ? 'flex' : 'none';
                if (customBgGroup)
                    customBgGroup.style.display = isCustom ? 'flex' : 'none';
                saveSettings();
            });
        }

        const mBgColor = $d('mobileCustomBgColor');
        if (mBgColor) {
            mBgColor.addEventListener('input', () => {
                if (customBgColor) customBgColor.value = mBgColor.value;
                if ($d('mobileCustomBgHex'))
                    $d('mobileCustomBgHex').value = mBgColor.value;
                if (customBgHex) customBgHex.value = mBgColor.value;
                saveSettings();
            });
        }

        const mCursor = $d('mobileCursorStyleSelect');
        if (mCursor) {
            mCursor.addEventListener('change', () => {
                if (cursorStyleSelect) cursorStyleSelect.value = mCursor.value;
                EditorUI.setCursorStyle(mCursor.value);
                saveSettings();
            });
        }

        const mFont = $d('mobileFontSizeSelect');
        if (mFont) {
            mFont.addEventListener('change', () => {
                if (fontSizeSelect) fontSizeSelect.value = mFont.value;
                EditorUI.setFontSize(mFont.value);
                saveSettings();
            });
        }

        const mQuality = $d('mobileQualitySelect');
        if (mQuality) {
            mQuality.addEventListener('change', () => {
                if (qualitySelect) qualitySelect.value = mQuality.value;
                updateQualityWarning();
            });
        }

        if (mobileEndBufSlider) {
            mobileEndBufSlider.addEventListener('input', () => {
                if (mobileEndBufValue)
                    mobileEndBufValue.textContent = mobileEndBufSlider.value;
                if (bufSlider) bufSlider.value      = mobileEndBufSlider.value;
                if (bufValue)  bufValue.textContent = mobileEndBufSlider.value;
                saveSettings();
            });
        }

        if (mobileWatermarkOpacity) {
            mobileWatermarkOpacity.addEventListener('input', () => {
                if (mobileWatermarkOpVal)
                    mobileWatermarkOpVal.textContent = mobileWatermarkOpacity.value;
                if (watermarkOpacity)
                    watermarkOpacity.value = mobileWatermarkOpacity.value;
                if (watermarkOpVal)
                    watermarkOpVal.textContent = mobileWatermarkOpacity.value;
                saveSettings();
            });
        }

        if (mobileBtnImport) {
            mobileBtnImport.addEventListener('click', () => fileImportInput.click());
        }
        if (mobileBtnClear) {
            mobileBtnClear.addEventListener('click', onClearCode);
        }

        let touchStartY = 0;
        if (settingsDrawer) {
            settingsDrawer.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
            }, { passive: true });

            settingsDrawer.addEventListener('touchmove', (e) => {
                const dy = e.touches[0].clientY - touchStartY;
                if (dy > 60) closeDrawer();
            }, { passive: true });
        }
    }

    // ============================================================
    // SHARED EVENTS
    // ============================================================
    function bindSharedEvents() {
        if (fileImportInput) {
            fileImportInput.addEventListener('change', onFileImport);
        }
        if (btnDl)       btnDl.addEventListener('click',       downloadVideo);
        if (btnCloseDl)  btnCloseDl.addEventListener('click',  closeDlOverlay);
        if (btnCopyLink) btnCopyLink.addEventListener('click', copyShareLink);

        setupKeyboardShortcuts();
        window.addEventListener('resize', () => {
            EditorUI.updateEditorHeight();
            updateCodeMeta();
        });
    }

    // ============================================================
    // DRAWER
    // ============================================================
    function toggleDrawer() {
        if (drawerOpen) closeDrawer();
        else openDrawer();
    }

    function openDrawer() {
        drawerOpen = true;
        if (settingsDrawer) settingsDrawer.classList.add('open');
        if (drawerOverlay)  drawerOverlay.classList.add('active');
        if (hamburgerIcon)  hamburgerIcon.classList.add('open');
        syncMobileFromDesktop();
    }

    function closeDrawer() {
        drawerOpen = false;
        if (settingsDrawer) settingsDrawer.classList.remove('open');
        if (drawerOverlay)  drawerOverlay.classList.remove('active');
        if (hamburgerIcon)  hamburgerIcon.classList.remove('open');
    }

    function switchDrawerSection(sectionId) {
        if (drawerTabs) {
            drawerTabs.querySelectorAll('.drawer-tab').forEach(t => {
                t.classList.toggle('active', t.getAttribute('data-section') === sectionId);
            });
        }
        document.querySelectorAll('.drawer-section').forEach(s => {
            s.classList.toggle('active', s.id === 'section-' + sectionId);
        });
    }

    function syncMobileFromDesktop() {
        if (mobileCodeInput && codeInput)
            mobileCodeInput.value = codeInput.value;

        const mLang = $d('mobileLanguageSelect');
        if (mLang && languageSelect) mLang.value = languageSelect.value;

        const mFile = $d('mobileFileNameInput');
        if (mFile && fileNameInput) mFile.value = fileNameInput.value;

        const spd = speedSlider ? speedSlider.value : '40';
        if (mobileSpeedSlider) mobileSpeedSlider.value       = spd;
        if (mobileSpeedValue)  mobileSpeedValue.textContent  = spd;
        if (mobileSpeedHint)   mobileSpeedHint.textContent   = getSpeedHint(+spd);

        const nl = nlSlider ? nlSlider.value : '300';
        if (mobileNlSlider) mobileNlSlider.value      = nl;
        if (mobileNlValue)  mobileNlValue.textContent = nl;

        if ($d('mobileHumanizeToggle') && humanizeToggle)
            $d('mobileHumanizeToggle').checked = humanizeToggle.checked;
        if ($d('mobileMistakeToggle') && mistakeToggle)
            $d('mobileMistakeToggle').checked = mistakeToggle.checked;
        if ($d('mobileSoundToggle') && soundToggle)
            $d('mobileSoundToggle').checked = soundToggle.checked;
        if ($d('mobileMinimapToggle') && minimapToggle)
            $d('mobileMinimapToggle').checked = minimapToggle.checked;

        if ($d('mobileThemeSelect') && themeSelect)
            $d('mobileThemeSelect').value = themeSelect.value;
        if ($d('mobileBackgroundSelect') && backgroundSelect)
            $d('mobileBackgroundSelect').value = backgroundSelect.value;
        if ($d('mobileCursorStyleSelect') && cursorStyleSelect)
            $d('mobileCursorStyleSelect').value = cursorStyleSelect.value;
        if ($d('mobileFontSizeSelect') && fontSizeSelect)
            $d('mobileFontSizeSelect').value = fontSizeSelect.value;

        if ($d('mobileQualitySelect') && qualitySelect)
            $d('mobileQualitySelect').value = qualitySelect.value;
        if ($d('mobileAspectSelect') && aspectSelect)
            $d('mobileAspectSelect').value = aspectSelect.value;
        if ($d('mobileFormatSelect') && formatSelect)
            $d('mobileFormatSelect').value = formatSelect.value;

        const buf = bufSlider ? bufSlider.value : '2';
        if (mobileEndBufSlider) mobileEndBufSlider.value      = buf;
        if (mobileEndBufValue)  mobileEndBufValue.textContent = buf;

        if ($d('mobileWatermarkInput') && watermarkInput)
            $d('mobileWatermarkInput').value = watermarkInput.value;
        if ($d('mobileWatermarkPos') && watermarkPos)
            $d('mobileWatermarkPos').value = watermarkPos.value;

        const op = watermarkOpacity ? watermarkOpacity.value : '60';
        if (mobileWatermarkOpacity) mobileWatermarkOpacity.value      = op;
        if (mobileWatermarkOpVal)   mobileWatermarkOpVal.textContent  = op;

        updateCodeMeta();
    }

    // ============================================================
    // KEYBOARD SHORTCUTS
    // ============================================================
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const tag = document.activeElement
                ? document.activeElement.tagName : '';

            if (e.key === 'Escape') {
                if (drawerOpen)              { closeDrawer(); return; }
                if (EditorUI.isFullscreen()) { EditorUI.exitFullscreen(); return; }
                onReset();
                return;
            }

            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'enter': e.preventDefault(); onPlay(); break;
                    case 's':
                        e.preventDefault();
                        if (recBlob) downloadVideo();
                        else Toast.info('No recording yet');
                        break;
                    case 'o':
                        e.preventDefault();
                        fileImportInput.click();
                        break;
                }
                return;
            }

            switch (e.key) {
                case ' ':           e.preventDefault(); onPlay();   break;
                case 'r': case 'R': e.preventDefault(); onRecord(); break;
                case 'f': case 'F':
                    e.preventDefault();
                    EditorUI.isFullscreen()
                        ? EditorUI.exitFullscreen()
                        : EditorUI.enterFullscreen();
                    break;
                case 'ArrowUp':    e.preventDefault(); adjustSpeed(+5);  break;
                case 'ArrowDown':  e.preventDefault(); adjustSpeed(-5);  break;
                case 'ArrowRight': e.preventDefault(); adjustSpeed(+20); break;
                case 'ArrowLeft':  e.preventDefault(); adjustSpeed(-20); break;
            }
        });
    }

    function adjustSpeed(delta) {
        const cur    = parseInt(speedSlider ? speedSlider.value : '40', 10);
        const newVal = Math.max(1, Math.min(200, cur + delta));

        if (speedSlider)       speedSlider.value             = newVal;
        if (speedValue)        speedValue.textContent         = newVal;
        if (speedHint)         speedHint.textContent          = getSpeedHint(newVal);
        if (mobileSpeedSlider) mobileSpeedSlider.value        = newVal;
        if (mobileSpeedValue)  mobileSpeedValue.textContent   = newVal;
        if (mobileSpeedHint)   mobileSpeedHint.textContent    = getSpeedHint(newVal);

        TypingEngine.configure({ speed: newVal });
        Toast.info(`Speed: ${newVal} chars/sec`, '', 1000);
    }

    function getSpeedHint(v) {
        for (const [min, max, label] of SPEED_HINTS) {
            if (v >= min && v <= max) return label;
        }
        return '';
    }

    // ============================================================
    // FILE IMPORT — no size limit, no char limit
    // ============================================================
    function onFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const ext  = file.name.split('.').pop().toLowerCase();
        const lang = EXT_TO_LANG[ext] || 'plaintext';

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;

            if (codeInput)       codeInput.value       = text;
            if (mobileCodeInput) mobileCodeInput.value = text;

            if (languageSelect)             languageSelect.value             = lang;
            if ($d('mobileLanguageSelect')) $d('mobileLanguageSelect').value = lang;
            if (fileNameInput)              fileNameInput.value               = file.name;
            if ($d('mobileFileNameInput'))  $d('mobileFileNameInput').value   = file.name;

            EditorUI.setLanguage(lang);
            EditorUI.setFileName(file.name);

            updateCodeMeta();
            Toast.success(`Imported: ${file.name}`, '', 2500);
        };

        reader.onerror = () => Toast.error('Failed to read file.');
        reader.readAsText(file);
        fileImportInput.value = '';
    }

    async function onClearCode() {
        const code = codeInput ? codeInput.value : '';
        if (!code.trim()) return;

        const ok = await Toast.confirm('Clear all code?', 'Clear Code');
        if (ok) {
            if (codeInput)       codeInput.value       = '';
            if (mobileCodeInput) mobileCodeInput.value = '';
            updateCodeMeta();
            Toast.success('Code cleared');
        }
    }

    // ============================================================
    // GET CURRENT SETTINGS
    // ============================================================
    function getCurrentSettings() {
        const isMobile = window.innerWidth <= 768;

        const code = isMobile
            ? (mobileCodeInput ? mobileCodeInput.value : (codeInput ? codeInput.value : ''))
            : (codeInput ? codeInput.value : '');

        const lang     = getVal('languageSelect',    'mobileLanguageSelect');
        const fn       = getVal('fileNameInput',     'mobileFileNameInput');
        const speed    = parseInt(getVal('speedSlider',    'mobileSpeedSlider'),    10) || 40;
        const nlDelay  = parseInt(getVal('newlineDelay',   'mobileNewlineDelay'),   10) || 300;
        const theme    = getVal('themeSelect',       'mobileThemeSelect');
        const bg       = getVal('backgroundSelect',  'mobileBackgroundSelect');
        const cursor   = getVal('cursorStyleSelect', 'mobileCursorStyleSelect');
        const fontSize = getVal('fontSizeSelect',    'mobileFontSizeSelect');
        const quality  = getVal('qualitySelect',     'mobileQualitySelect');
        const aspect   = getVal('aspectSelect',      'mobileAspectSelect');
        const format   = getVal('formatSelect',      'mobileFormatSelect');
        const buffer   = parseFloat(getVal('endBufferSlider', 'mobileEndBufferSlider')) || 2;

        const humanize = getChecked('humanizeToggle', 'mobileHumanizeToggle');
        const mistake  = getChecked('mistakeToggle',  'mobileMistakeToggle');
        const sound    = getChecked('soundToggle',    'mobileSoundToggle');
        const minimap  = getChecked('minimapToggle',  'mobileMinimapToggle');

        const wmText = getVal('watermarkInput', 'mobileWatermarkInput');
        const wmPos  = getVal('watermarkPos',   'mobileWatermarkPos');
        const wmOp   = parseFloat(getVal('watermarkOpacity', 'mobileWatermarkOpacity')) / 100;
        const customBg = customBgColor ? customBgColor.value : '#000000';

        return {
            code, lang, fn, speed, nlDelay,
            theme, bg, cursor, fontSize,
            quality, aspect, format, buffer,
            humanize, mistake, sound, minimap,
            wmText, wmPos, wmOp, customBg
        };
    }

    // ============================================================
    // PLAY
    // ============================================================
    function onPlay() {
        if (isRecordMode) return;

        const st = TypingEngine.getState();

        if (st.isRunning) {
            TypingEngine.pause();
            setPlayBtn('resume');
            EditorUI.setCursorBlink();
            Toast.info('Paused', '', 1200);
            return;
        }

        if (st.isPaused) {
            TypingEngine.play();
            setPlayBtn('pause');
            EditorUI.setCursorSolid();
            Toast.info('Resumed', '', 800);
            return;
        }

        const s = getCurrentSettings();
        if (!s.code.trim()) {
            shake(btnPlay);
            shake(mobileBtnPlay);
            Toast.warning('Please enter some code first');
            return;
        }

        closeDrawer();
        showEditor();
        runAnimation(false, s);
    }

    // ============================================================
    // RECORD
    // ============================================================
    function onRecord() {
        if (isRecordMode) {
            stopRecEarly();
            return;
        }

        if (!Recorder.isSupported()) {
            Toast.error('Recording not supported in this browser.');
            return;
        }

        const s = getCurrentSettings();
        if (!s.code.trim()) {
            shake(btnRecord);
            shake(mobileBtnRecord);
            Toast.warning('Please enter some code first');
            return;
        }

        if (isAnimating) {
            TypingEngine.stop();
            isAnimating = false;
            setPlayBtn('play');
        }

        closeDrawer();
        showCanvas();
        runAnimation(true, s);
    }

    async function startRec(s) {
        Recorder.init({
            quality:       s.quality,
            format:        s.format,
            aspect:        s.aspect,
            background:    s.bg,
            customBgColor: s.customBg,
            theme:         s.theme,
            cursorStyle:   s.cursor,
            showMinimap:   s.minimap,
            watermark: {
                text:     s.wmText,
                position: s.wmPos,
                opacity:  s.wmOp
            },
            fps: 30,
        });

        Recorder.setParsedData(parsedData);
        Recorder.setMeta(
            s.fn || 'untitled',
            LANG_NAMES[s.lang] || s.lang
        );

        canvasPreview.innerHTML = '';
        canvasPreview.appendChild(Recorder.getCanvas());

        if (s.quality === '4k') {
            const ok = await Toast.confirm(
                '4K uses a lot of memory and may fail on some devices. Continue?',
                '4K Recording'
            );
            if (!ok) {
                isRecordMode = false;
                showEditor();
                return false;
            }
        }

        try {
            await Recorder.startRecording();
        } catch (err) {
            Toast.error('Recording failed: ' + err.message, 'Error', 6000);
            isRecordMode = false;
            showEditor();
            setRecBtn('rec');
            return false;
        }

        isRecordMode = true;
        setRecBtn('stop');
        showRecUI();
        Toast.show('Recording started 🎬', 'rec', 2000);
        return true;
    }

    async function finishRec() {
        const buf = parseFloat(bufSlider ? bufSlider.value : '2') || 0;

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
            Toast.success('Recording complete! 🎉', '', 3000);
        } else {
            Toast.error('Recording produced no data. Try again.');
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
        btnPlay && (btnPlay.disabled = false);
        showEditor();

        if (blob && blob.size > 0) {
            recBlob = blob;
            showDlOverlay(blob);
            Toast.success('Recording saved!', '', 2500);
        } else {
            Toast.warning('Recording was too short or empty.');
        }
    }

    // ============================================================
    // ANIMATION ENGINE
    // ============================================================
    function runAnimation(withRec, s) {
        if (!s) s = getCurrentSettings();

        const { code, lang, fn, speed, nlDelay,
                humanize, mistake, sound, minimap,
                theme, cursor, fontSize } = s;

        if (!code.trim()) return;

        parsedData = HighlightParser.parse(code, lang);
        if (!parsedData || !parsedData.lines.length) {
            Toast.error('Failed to parse code.');
            return;
        }

        // Setup editor
        EditorUI.reset();
        EditorUI.setLanguage(lang);
        EditorUI.setFileName(fn);
        EditorUI.setTheme(theme);
        EditorUI.setCursorStyle(cursor);
        EditorUI.setFontSize(fontSize);
        EditorUI.setMinimapVisible(minimap);

        // Progress
        progressWrap && progressWrap.classList.add('active');
        if (mobileProgressWrap) {
            mobileProgressWrap.style.display = 'block';
            mobileProgressWrap.classList.add('active');
        }
        pct(0, parsedData.totalChars);

        TypingEngine.configure({
            speed:          speed,
            newlineDelay:   nlDelay,
            humanize:       humanize,
            mistakeEnabled: mistake,
            soundEnabled:   withRec ? false : sound,

            onStart: () => {
                isAnimating = true;
                setPlayBtn('pause');
                if (!withRec) EditorUI.setCursorSolid();
                if (btnPlay)  btnPlay.disabled = withRec;
            },

            onTick: (li, cc, rev, tot, meta, suggestion) => {
                if (meta && meta.isMistake) {
                    renderLineWithExtra(li, cc - 1, meta.wrongChar);
                } else {
                    renderLine(li, cc, suggestion || '');
                }

                pct(rev, tot);
                EditorUI.updateCursor(li + 1, cc + 1);

                if (!withRec) {
                    EditorUI.scrollIfNeeded();
                    if (cc === 0) EditorUI.updateEditorHeight();
                }

                if (minimap) EditorUI.updateMinimap(parsedData, li);

                if (isRecordMode) {
                    Recorder.updateState(li, cc, rev, tot);
                }
            },

            onLineComplete: (li) => {
                const line = parsedData.lines[li];
                EditorUI.setLineHTML(
                    li + 1,
                    HighlightParser.buildFullLine(line.tokens),
                    false
                );
            },

            onComplete: async () => {
                isAnimating = false;
                if (btnPlay) btnPlay.disabled = false;
                setPlayBtn('play');
                EditorUI.setCursorBlink();
                pct(parsedData.totalChars, parsedData.totalChars);

                const last = parsedData.lines.length;
                EditorUI.setLineHTML(
                    last,
                    HighlightParser.buildFullLine(parsedData.lines[last - 1].tokens),
                    true
                );
                EditorUI.addCursorToLine(last);
                EditorUI.updateLineCount(last);

                if (isRecordMode) {
                    const ll = parsedData.lines[last - 1];
                    Recorder.updateState(
                        last - 1, ll.charCount,
                        parsedData.totalChars, parsedData.totalChars
                    );
                    await finishRec();
                } else {
                    Toast.success('Animation complete! 🎉', '', 2000);
                }
            },

            onSuggestion: true,
        });

        TypingEngine.load(parsedData);
        renderLine(0, 0, '');

        if (withRec) {
            waitFonts().then(() =>
                startRec(s).then((started) => {
                    if (started) {
                        Recorder.updateState(0, 0, 0, parsedData.totalChars);
                        TypingEngine.play();
                    }
                })
            );
        } else {
            TypingEngine.play();
        }
    }

    function renderLine(li, cc, suggestion) {
        const num = li + 1;
        if (!EditorUI.getLineContent(num)) EditorUI.addLine(num);

        const baseHTML = HighlightParser.buildPartialLine(
            parsedData.lines[li].tokens,
            cc
        );

        let ghostHTML = '';
        if (suggestion && suggestion.length > 0 && !isRecordMode) {
            const escaped = suggestion
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            ghostHTML = `<span class="suggestion-ghost">${escaped}</span>`;
        }

        EditorUI.setLineHTMLWithGhost(num, baseHTML, ghostHTML, true);
    }

    function renderLineWithExtra(li, cc, extraChar) {
        const num = li + 1;
        if (!EditorUI.getLineContent(num)) EditorUI.addLine(num);
        const base = HighlightParser.buildPartialLine(parsedData.lines[li].tokens, cc);
        EditorUI.setLineHTML(
            num,
            base + `<span style="color:var(--accent-red);opacity:0.75">${extraChar}</span>`,
            true
        );
    }

    // ============================================================
    // RESET
    // ============================================================
    function onReset() {
        if (isRecordMode) { stopRecEarly(); return; }
        TypingEngine.stop();
        EditorUI.reset();
        setPlayBtn('play');
        setRecBtn('rec');
        progressWrap && progressWrap.classList.remove('active');
        if (mobileProgressWrap) {
            mobileProgressWrap.style.display = 'none';
            mobileProgressWrap.classList.remove('active');
        }
        isAnimating = false;
        if (btnPlay) btnPlay.disabled = false;
        showEditor();
    }

    // ============================================================
    // VIEW SWITCHING
    // ============================================================
    function showEditor() {
        if (editorWindow)  editorWindow.style.display = '';
        if (canvasPreview) canvasPreview.classList.remove('active');
    }

    function showCanvas() {
        if (editorWindow)  editorWindow.style.display = 'none';
        if (canvasPreview) canvasPreview.classList.add('active');
    }

    // ============================================================
    // RECORDING UI
    // ============================================================
    function showRecUI() {
        recStart = Date.now();
        if (recIndicator) recIndicator.classList.add('active');
        recInterval = setInterval(() => {
            const s = Math.floor((Date.now() - recStart) / 1000);
            if (recTimerEl) {
                recTimerEl.textContent =
                    String(Math.floor(s / 60)).padStart(2, '0') + ':' +
                    String(s % 60).padStart(2, '0');
            }
        }, 500);
    }

    function hideRecUI() {
        if (recIndicator) recIndicator.classList.remove('active');
        if (recInterval)  { clearInterval(recInterval); recInterval = null; }
    }

    // ============================================================
    // DOWNLOAD
    // ============================================================
    function showDlOverlay(blob) {
        if (recUrl) URL.revokeObjectURL(recUrl);
        recUrl = URL.createObjectURL(blob);

        const cfg = Recorder.getConfig();
        const dur = ((Date.now() - recStart) / 1000).toFixed(1);

        if (dlVideo) { dlVideo.src = recUrl; dlVideo.load(); }
        if (dlSize)  dlSize.textContent = (blob.size / 1_048_576).toFixed(2) + ' MB';
        if (dlDur)   dlDur.textContent  = dur + 's';
        if (dlRes)   dlRes.textContent  = `${cfg.width}×${cfg.height}`;
        if (dlFmt)   dlFmt.textContent  = cfg.format.toUpperCase();

        if (dlOverlay) dlOverlay.classList.add('active');
    }

    function closeDlOverlay() {
        if (dlOverlay) dlOverlay.classList.remove('active');
        if (dlVideo)   { dlVideo.pause(); dlVideo.src = ''; }
    }

    function downloadVideo() {
        if (!recBlob) return;
        const cfg  = Recorder.getConfig();
        const ext  = cfg.format === 'mp4' ? 'mp4' : 'webm';
        const name = (fileNameInput ? fileNameInput.value : 'codetype')
            .replace(/\.[^.]+$/, '');
        const url  = recUrl || URL.createObjectURL(recBlob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${name}_${cfg.quality}_${cfg.aspect}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        Toast.success('Download started! 📥', '', 2000);
    }

    function copyShareLink() {
        try {
            const code = codeInput ? codeInput.value : '';
            const state = {
                c: btoa(unescape(encodeURIComponent(code.substring(0, 2000)))),
                l: languageSelect ? languageSelect.value : 'javascript',
                f: fileNameInput  ? fileNameInput.value  : 'index.js',
                s: speedSlider    ? speedSlider.value    : '40',
                t: themeSelect    ? themeSelect.value    : 'tokyo-night',
            };
            const params = new URLSearchParams(state);
            const url    = `${location.origin}${location.pathname}?${params}`;
            navigator.clipboard.writeText(url).then(() => {
                Toast.show('Link copied! 🔗', 'copy', 2500);
            }).catch(() => Toast.info('URL: ' + url, '', 8000));
        } catch (e) {
            Toast.error('Could not generate link.');
        }
    }

    // ============================================================
    // SETTINGS PERSISTENCE
    // ============================================================
    function saveSettings() {
        try {
            const s = getCurrentSettings();
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                language:   s.lang,
                fileName:   s.fn,
                speed:      s.speed,
                nlDelay:    s.nlDelay,
                humanize:   s.humanize,
                mistake:    s.mistake,
                sound:      s.sound,
                minimap:    s.minimap,
                theme:      s.theme,
                background: s.bg,
                customBg:   s.customBg,
                cursor:     s.cursor,
                fontSize:   s.fontSize,
                quality:    s.quality,
                aspect:     s.aspect,
                format:     s.format,
                buffer:     s.buffer,
                wmText:     s.wmText,
                wmPos:      s.wmPos,
                wmOp:       s.wmOp,
            }));
        } catch (e) { /* storage full */ }
    }

    function loadSettings() {
        try {
            const params = new URLSearchParams(location.search);
            if (params.has('c')) {
                try {
                    const code = decodeURIComponent(escape(atob(params.get('c'))));
                    if (codeInput)       codeInput.value       = code;
                    if (mobileCodeInput) mobileCodeInput.value = code;
                    if (params.has('l') && languageSelect)
                        languageSelect.value = params.get('l');
                    if (params.has('f') && fileNameInput)
                        fileNameInput.value = params.get('f');
                    if (params.has('s') && speedSlider)
                        speedSlider.value = params.get('s');
                    if (params.has('t') && themeSelect)
                        themeSelect.value = params.get('t');
                    Toast.info('Loaded from shared link', '', 2500);
                } catch (e) { /* bad params */ }
            }

            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const s = JSON.parse(raw);

            if (s.language  && languageSelect)   languageSelect.value   = s.language;
            if (s.fileName  && fileNameInput)     fileNameInput.value    = s.fileName;
            if (s.speed     && speedSlider)       speedSlider.value      = s.speed;
            if (s.nlDelay   && nlSlider)          nlSlider.value         = s.nlDelay;
            if (s.humanize  !== undefined && humanizeToggle)
                humanizeToggle.checked = s.humanize;
            if (s.mistake   !== undefined && mistakeToggle)
                mistakeToggle.checked  = s.mistake;
            if (s.sound     !== undefined && soundToggle)
                soundToggle.checked    = s.sound;
            if (s.minimap   !== undefined && minimapToggle)
                minimapToggle.checked  = s.minimap;
            if (s.theme     && themeSelect)       themeSelect.value      = s.theme;
            if (s.background && backgroundSelect) backgroundSelect.value = s.background;
            if (s.customBg  && customBgColor) {
                customBgColor.value = s.customBg;
                if (customBgHex) customBgHex.value = s.customBg;
            }
            if (s.cursor    && cursorStyleSelect) cursorStyleSelect.value = s.cursor;
            if (s.fontSize  && fontSizeSelect)    fontSizeSelect.value    = s.fontSize;
            if (s.quality   && qualitySelect)     qualitySelect.value     = s.quality;
            if (s.aspect    && aspectSelect)      aspectSelect.value      = s.aspect;
            if (s.buffer    && bufSlider)         bufSlider.value         = s.buffer;
            if (s.wmText    && watermarkInput)    watermarkInput.value    = s.wmText;
            if (s.wmPos     && watermarkPos)      watermarkPos.value      = s.wmPos;
            if (s.wmOp      && watermarkOpacity) {
                const p = Math.round(s.wmOp * 100);
                watermarkOpacity.value = p;
                if (watermarkOpVal) watermarkOpVal.textContent = p;
            }

            if (s.background === 'custom-color' && customBgGroup)
                customBgGroup.style.display = 'flex';

        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    // ============================================================
    // UI HELPERS
    // ============================================================
    function setPlayBtn(state) {
        const map = {
            play:   ['▶', 'Play',   false],
            pause:  ['⏸', 'Pause',  false],
            resume: ['▶', 'Resume', true],
        };
        const [icon, text, paused] = map[state] || map.play;

        if (playIcon) playIcon.textContent = icon;
        if (playText) playText.textContent = text;
        if (btnPlay)  btnPlay.classList.toggle('paused', paused);

        if (mobilePlayIcon) mobilePlayIcon.textContent = icon;
        if (mobileBtnPlay)  mobileBtnPlay.classList.toggle('paused', paused);
    }

    function setRecBtn(s) {
        const isStop = s !== 'rec';
        if (recordIcon) recordIcon.textContent = isStop ? '⏹' : '⏺';
        if (recordText) recordText.textContent = isStop ? 'Stop' : 'Record';
        if (btnRecord)  btnRecord.classList.toggle('recording', isStop);

        if (mobileRecordIcon) mobileRecordIcon.textContent = isStop ? '⏹' : '⏺';
        if (mobileBtnRecord)  mobileBtnRecord.classList.toggle('recording', isStop);
    }

    function pct(cur, tot) {
        if (!tot) return;
        const p = Math.min(100, Math.round(cur / tot * 100));
        const w = p + '%';
        const t = p + '%';
        if (progressBar)    progressBar.style.width    = w;
        if (progressTxt)    progressTxt.textContent    = t;
        if (mobileProgressBar) mobileProgressBar.style.width = w;
        if (mobileProgressTxt) mobileProgressTxt.textContent = t;
    }

    function shake(el) {
        if (!el) return;
        el.style.animation = 'shake .4s ease';
        setTimeout(() => { el.style.animation = ''; }, 420);
    }

    function syncAllUI() {
        const spd = speedSlider ? speedSlider.value : '40';
        if (speedValue) speedValue.textContent = spd;
        if (speedHint)  speedHint.textContent  = getSpeedHint(+spd);
        const nl = nlSlider ? nlSlider.value : '300';
        if (nlValue)  nlValue.textContent  = nl;
        const buf = bufSlider ? bufSlider.value : '2';
        if (bufValue) bufValue.textContent = buf;
        if (watermarkOpVal && watermarkOpacity)
            watermarkOpVal.textContent = watermarkOpacity.value;

        EditorUI.setFileName(fileNameInput  ? fileNameInput.value  : 'index.js');
        EditorUI.setLanguage(languageSelect ? languageSelect.value : 'javascript');
    }

    function autoFileName() {
        const lang = languageSelect ? languageSelect.value : 'javascript';
        const name = AUTO_FILENAME[lang] || 'untitled';
        if (fileNameInput)              fileNameInput.value             = name;
        if ($d('mobileFileNameInput'))  $d('mobileFileNameInput').value = name;
        EditorUI.setFileName(name);
    }

    function updateCodeMeta() {
        const code    = codeInput ? codeInput.value : '';
        const chars   = code.length;
        const lines   = code ? code.split('\n').length : 0;
        const spd     = parseInt(speedSlider ? speedSlider.value : '40', 10) || 40;
        const est     = Math.round(chars / spd);
        const timeStr = est < 60
            ? `~${est}s`
            : `~${Math.floor(est / 60)}m ${est % 60}s`;

        const chStr = chars.toLocaleString() + ' chars';
        const liStr = lines + ' lines';

        if (charCountEl)     charCountEl.textContent     = chStr;
        if (lineCountEl)     lineCountEl.textContent     = liStr;
        if (estimatedTimeEl) estimatedTimeEl.textContent = timeStr;
        if (mobileCharCount) mobileCharCount.textContent = chStr;
        if (mobileLineCount) mobileLineCount.textContent = liStr;
        if (mobileEstTime)   mobileEstTime.textContent   = timeStr;
    }

    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

    function waitFonts() {
        return (document.fonts && document.fonts.ready)
            ? document.fonts.ready
            : wait(600);
    }

    let _debounceTimer = null;
    function debouncedSave() {
        clearTimeout(_debounceTimer);
        _debounceTimer = setTimeout(saveSettings, 900);
    }

    // ============================================================
    // BOOT
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();