/* =============================================
   TYPING-ENGINE.JS
   Fixed: accurate speed 1-200 chars/sec
   Fixed: humanize doesn't slow down high speeds
   Added: word suggestion callback
   ============================================= */

const TypingEngine = (function () {

    // ---- State ----
    let parsedData     = null;
    let currentLine    = 0;
    let currentChar    = 0;
    let totalRevealed  = 0;
    let isRunning      = false;
    let isPaused       = false;
    let animationTimer = null;

    // ---- Settings ----
    let speed           = 40;
    let newlineDelay    = 300;
    let humanize        = true;
    let soundEnabled    = false;
    let mistakeEnabled  = false;

    // ---- Callbacks ----
    let onTick          = null;
    let onLineComplete  = null;
    let onComplete      = null;
    let onStart         = null;
    let onMistake       = null;
    let onSuggestion    = null; // NEW: called with next word suggestion

    // ---- Audio ----
    let audioCtx = null;

    // ---- QWERTY adjacent keys ----
    const NEARBY_KEYS = {
        'a':['s','q','z','w'],   'b':['v','g','h','n'],
        'c':['x','d','f','v'],   'd':['s','e','r','f','c','x'],
        'e':['w','r','d','s'],   'f':['d','r','t','g','v','c'],
        'g':['f','t','y','h','b','v'], 'h':['g','y','u','j','n','b'],
        'i':['u','o','k','j'],   'j':['h','u','i','k','m','n'],
        'k':['j','i','o','l','m'], 'l':['k','o','p',';'],
        'm':['n','j','k',','],   'n':['b','h','j','m'],
        'o':['i','p','l','k'],   'p':['o','l',';','['],
        'q':['w','a'],           'r':['e','t','f','d'],
        's':['a','w','e','d','z','x'], 't':['r','y','g','f'],
        'u':['y','i','j','h'],   'v':['c','f','g','b'],
        'w':['q','e','s','a'],   'x':['z','s','d','c'],
        'y':['t','u','h','g'],   'z':['a','s','x'],
    };

    const SKIP_MISTAKE = new Set(['\n','\t',' ','(',')','.',',',';',':','{','}','[',']']);

    // ============================================================
    // PUBLIC API
    // ============================================================

    function configure(options) {
        if (options.speed          !== undefined) speed          = Math.max(1, Math.min(200, +options.speed));
        if (options.newlineDelay   !== undefined) newlineDelay   = Math.max(0, +options.newlineDelay);
        if (options.humanize       !== undefined) humanize       = !!options.humanize;
        if (options.soundEnabled   !== undefined) soundEnabled   = !!options.soundEnabled;
        if (options.mistakeEnabled !== undefined) mistakeEnabled = !!options.mistakeEnabled;
        if (options.onTick)         onTick         = options.onTick;
        if (options.onLineComplete) onLineComplete = options.onLineComplete;
        if (options.onComplete)     onComplete     = options.onComplete;
        if (options.onStart)        onStart        = options.onStart;
        if (options.onMistake)      onMistake      = options.onMistake;
        if (options.onSuggestion)   onSuggestion   = options.onSuggestion;
    }

    function load(data) {
        parsedData    = data;
        currentLine   = 0;
        currentChar   = 0;
        totalRevealed = 0;
        isRunning     = false;
        isPaused      = false;
        _clearTimer();
    }

    function play() {
        if (!parsedData || !parsedData.lines.length) return;

        if (isPaused) {
            isPaused  = false;
            isRunning = true;
            _scheduleNext();
            return;
        }

        if (isRunning) return;

        isRunning = true;
        isPaused  = false;
        if (onStart) onStart();
        _scheduleNext();
    }

    function pause() {
        if (!isRunning) return;
        isPaused  = true;
        isRunning = false;
        _clearTimer();
    }

    function stop() {
        isRunning     = false;
        isPaused      = false;
        currentLine   = 0;
        currentChar   = 0;
        totalRevealed = 0;
        _clearTimer();
    }

    function getState() {
        return {
            isRunning,
            isPaused,
            currentLine,
            currentChar,
            totalRevealed,
            totalChars: parsedData ? parsedData.totalChars : 0
        };
    }

    // ============================================================
    // CORE DELAY CALCULATION — FIXED
    // ============================================================

    function _calculateDelay() {
        // Base delay in ms for the target speed
        const baseDelay = 1000 / speed;

        // At high speeds (> 80 chars/sec), reduce or eliminate humanize
        // so we don't break the speed target
        if (!humanize || speed >= 80) {
            // At very high speed just add tiny jitter so it doesn't look robotic
            // but never slow it down significantly
            if (speed >= 80) {
                const jitter = baseDelay * 0.1 * (Math.random() - 0.5);
                return Math.max(1, baseDelay + jitter);
            }
            return Math.max(1, baseDelay);
        }

        // Low-medium speed: add humanization
        // Variation scales DOWN as speed goes up
        // At speed 1:   ±40% variation (very human)
        // At speed 40:  ±25% variation
        // At speed 79:  ±10% variation
        const variationPct = 0.40 - (speed / 79) * 0.30;
        const variation    = baseDelay * Math.max(0, variationPct);
        let delay          = baseDelay + (Math.random() * variation * 2) - variation;

        // Occasional "thinking" pause — only at low speeds
        if (speed < 40 && Math.random() < 0.025) {
            delay += 100 + Math.random() * 200;
        }

        // Burst typing — only at low-medium speeds
        if (speed < 60 && Math.random() < 0.06) {
            delay *= 0.6;
        }

        return Math.max(1, delay);
    }

    // ============================================================
    // SCHEDULING
    // ============================================================

    function _scheduleNext() {
        if (!isRunning || isPaused) return;
        const delay = _calculateDelay();
        animationTimer = setTimeout(_revealNext, delay);
    }

    // ============================================================
    // WORD SUGGESTION HELPER
    // ============================================================

    function _getNextWord() {
        if (!parsedData) return '';

        const lines = parsedData.lines;
        let   li    = currentLine;
        let   ci    = currentChar;

        // Collect upcoming chars
        let upcoming = '';
        let collected = 0;
        const MAX_LOOK = 30;

        while (collected < MAX_LOOK && li < lines.length) {
            const line = lines[li];
            const text = HighlightParser.getLineText(line.tokens);

            if (li === currentLine) {
                // From current char position forward
                upcoming += text.substring(ci);
            } else {
                upcoming += '\n' + text;
            }

            collected = upcoming.length;
            li++;
            ci = 0;
        }

        if (!upcoming) return '';

        // Find the next "word" — chars until whitespace/delimiter
        // Skip leading spaces first
        let start = 0;
        while (start < upcoming.length && upcoming[start] === ' ') start++;

        // Now collect until next space/newline
        let end = start;
        while (
            end < upcoming.length &&
            upcoming[end] !== ' ' &&
            upcoming[end] !== '\n' &&
            end - start < 20
        ) {
            end++;
        }

        return upcoming.substring(start, end);
    }

    // ============================================================
    // REVEAL LOGIC
    // ============================================================

    function _revealNext() {
        if (!isRunning || isPaused || !parsedData) return;

        const lines = parsedData.lines;
        if (currentLine >= lines.length) {
            _finish();
            return;
        }

        const line = lines[currentLine];

        if (currentChar < line.charCount) {
            // Check for typo
            if (mistakeEnabled && humanize && _shouldMakeMistake(currentChar, line)) {
                _makeMistake(line);
                return;
            }

            currentChar++;
            totalRevealed++;

            if (soundEnabled) _playKeySound();

            // Get suggestion for next word
            const suggestion = onSuggestion ? _getNextWord() : '';

            if (onTick) {
                onTick(currentLine, currentChar, totalRevealed, parsedData.totalChars, null, suggestion);
            }

            _scheduleNext();

        } else {
            // Line complete
            if (onLineComplete) onLineComplete(currentLine);

            currentLine++;
            currentChar   = 0;
            totalRevealed++;

            if (currentLine >= lines.length) {
                _finish();
                return;
            }

            // Newline delay — also scaled by speed
            let nlDelay = newlineDelay;

            // At high speeds, cap the newline delay too
            if (speed >= 80) {
                nlDelay = Math.min(nlDelay, 150);
            } else if (speed >= 40) {
                nlDelay = Math.min(nlDelay, newlineDelay * 0.7);
            }

            if (humanize && nlDelay > 0 && speed < 80) {
                nlDelay += (Math.random() * nlDelay * 0.4) - (nlDelay * 0.2);
                nlDelay  = Math.max(0, nlDelay);
            }

            if (nlDelay > 0) {
                animationTimer = setTimeout(() => {
                    if (!isRunning || isPaused) return;
                    const suggestion = onSuggestion ? _getNextWord() : '';
                    if (onTick) {
                        onTick(currentLine, 0, totalRevealed, parsedData.totalChars, null, suggestion);
                    }
                    _scheduleNext();
                }, nlDelay);
            } else {
                const suggestion = onSuggestion ? _getNextWord() : '';
                if (onTick) {
                    onTick(currentLine, 0, totalRevealed, parsedData.totalChars, null, suggestion);
                }
                _scheduleNext();
            }
        }
    }

    // ============================================================
    // TYPO SYSTEM
    // ============================================================

    function _shouldMakeMistake(charIdx, line) {
        if (charIdx === 0 || charIdx >= line.charCount - 1) return false;
        // Only at low-medium speeds
        if (speed > 100) return false;

        const ch = HighlightParser.getCharAt(line.tokens, charIdx);
        if (!ch || SKIP_MISTAKE.has(ch)) return false;
        return Math.random() < 0.032;
    }

    function _makeMistake(line) {
        const correctChar = HighlightParser.getCharAt(line.tokens, currentChar);
        const wrongChar   = _getNearbyKey(correctChar) || correctChar;
        const fakeChar    = currentChar + 1;

        if (onMistake) onMistake(currentLine, wrongChar, correctChar);
        if (soundEnabled) _playKeySound();

        if (onTick) {
            onTick(currentLine, fakeChar, totalRevealed, parsedData.totalChars, {
                isMistake: true,
                wrongChar
            }, '');
        }

        const noticePause = 180 + Math.random() * 250;

        animationTimer = setTimeout(() => {
            if (!isRunning || isPaused) return;

            if (soundEnabled) _playBackspaceSound();

            if (onTick) {
                onTick(currentLine, currentChar, totalRevealed, parsedData.totalChars, {
                    isBackspace: true
                }, '');
            }

            const correctPause = 70 + Math.random() * 100;

            animationTimer = setTimeout(() => {
                if (!isRunning || isPaused) return;
                currentChar++;
                totalRevealed++;
                if (soundEnabled) _playKeySound();

                const suggestion = onSuggestion ? _getNextWord() : '';
                if (onTick) {
                    onTick(currentLine, currentChar, totalRevealed, parsedData.totalChars, null, suggestion);
                }
                _scheduleNext();
            }, correctPause);
        }, noticePause);
    }

    function _getNearbyKey(char) {
        if (!char) return char;
        const lower  = char.toLowerCase();
        const nearby = NEARBY_KEYS[lower];
        if (!nearby || !nearby.length) return char;
        const pick = nearby[Math.floor(Math.random() * nearby.length)];
        return char === char.toUpperCase() ? pick.toUpperCase() : pick;
    }

    // ============================================================
    // FINISH
    // ============================================================

    function _finish() {
        isRunning = false;
        isPaused  = false;
        _clearTimer();
        if (onComplete) onComplete();
    }

    // ============================================================
    // AUDIO
    // ============================================================

    function _playKeySound() {
        _sound(800 + Math.random() * 600, 'square', 0.028, 0.05);
    }

    function _playBackspaceSound() {
        _sound(300 + Math.random() * 100, 'sine', 0.022, 0.04);
    }

    function _sound(freq, type, gain, dur) {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') audioCtx.resume();

            const osc = audioCtx.createOscillator();
            const gn  = audioCtx.createGain();
            const now = audioCtx.currentTime;

            osc.connect(gn);
            gn.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(freq, now);
            osc.type = type;
            gn.gain.setValueAtTime(gain, now);
            gn.gain.exponentialRampToValueAtTime(0.0001, now + dur);
            osc.start(now);
            osc.stop(now + dur);
        } catch (e) { /* silent fail */ }
    }

    function _clearTimer() {
        if (animationTimer) {
            clearTimeout(animationTimer);
            animationTimer = null;
        }
    }

    // ---- Public API ----
    return { configure, load, play, pause, stop, getState };

})();