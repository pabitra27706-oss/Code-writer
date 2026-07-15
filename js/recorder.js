/* =============================================
   RECORDER.JS
   Canvas-based video recorder with:
   - 8 themes
   - 10 backgrounds
   - 5 aspect ratios / orientations
   - Watermark / branding
   - Minimap
   - Cursor styles
   - Smooth scroll
   ============================================= */

const Recorder = (function () {

    // ============================================================
    // BROWSER SUPPORT
    // ============================================================
    const BrowserSupport = {
        isSafari:  /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
        isIOS:     /iPad|iPhone|iPod/.test(navigator.userAgent),
        isMobile:  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        supportsMP4:  false,
        supportsWebM: false,
        preferredFormat: 'webm',
        availableFormats: [],

        init() {
            const mp4Types = [
                'video/mp4;codecs=avc1.42E01E',
                'video/mp4;codecs=h264',
                'video/mp4'
            ];
            for (const t of mp4Types) {
                if (window.MediaRecorder && MediaRecorder.isTypeSupported(t)) {
                    this.supportsMP4 = true;
                    this.availableFormats.push({ type: 'mp4', mime: t });
                    break;
                }
            }

            const webmTypes = [
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm'
            ];
            for (const t of webmTypes) {
                if (window.MediaRecorder && MediaRecorder.isTypeSupported(t)) {
                    this.supportsWebM = true;
                    this.availableFormats.push({ type: 'webm', mime: t });
                    break;
                }
            }

            if (this.isSafari && this.supportsMP4) {
                this.preferredFormat = 'mp4';
            } else if (this.supportsWebM) {
                this.preferredFormat = 'webm';
            } else if (this.supportsMP4) {
                this.preferredFormat = 'mp4';
            }
        },

        getMimeType(requestedFormat) {
            const found = this.availableFormats.find(f => f.type === requestedFormat);
            return found
                ? found.mime
                : (this.availableFormats[0] ? this.availableFormats[0].mime : null);
        },

        getRecommendedQuality() {
            if (this.isIOS)    return '1080p';
            if (this.isMobile) return '1080p';
            return '2k';
        }
    };

    BrowserSupport.init();

    // ============================================================
    // ASPECT RATIO PRESETS
    // ============================================================
    const AspectPresets = {
        'portrait-9-16':   { w: 1080, h: 1920, label: '9:16 Portrait'   },
        'landscape-16-9':  { w: 1920, h: 1080, label: '16:9 Landscape'  },
        'square-1-1':      { w: 1080, h: 1080, label: '1:1 Square'       },
        'portrait-4-5':    { w: 1080, h: 1350, label: '4:5 Portrait'     },
        'landscape-4-3':   { w: 1440, h: 1080, label: '4:3 Landscape'    },
    };

    // ============================================================
    // QUALITY PRESETS
    // ============================================================
    const QualityPresets = {
        '1080p': {
            label:       'Full HD',
            bitrate:     5_000_000,
            fileSize:    '~50 MB/min',
            recommended: 'All devices',
            warning:     ''
        },
        '2k': {
            label:       '2K',
            bitrate:     10_000_000,
            fileSize:    '~100 MB/min',
            recommended: 'Desktop & tablets',
            warning:     'May be slower on older phones.'
        },
        '4k': {
            label:       '4K Ultra HD',
            bitrate:     18_000_000,
            fileSize:    '~180 MB/min',
            recommended: 'High-end devices',
            warning:     '4K uses high memory and may lag or fail on mobile.'
        }
    };

    // ============================================================
    // BACKGROUNDS
    // ============================================================
    const BACKGROUNDS = {
        'solid-black':      { type: 'solid',    color: '#000000' },
        'solid-dark':       { type: 'solid',    color: '#0d1117' },
        'gradient-blue':    { type: 'gradient', stops: ['#0f0c29','#302b63','#24243e'], angle: 135 },
        'gradient-purple':  { type: 'gradient', stops: ['#1a0533','#7b2ff7','#f107a3'], angle: 135 },
        'gradient-green':   { type: 'gradient', stops: ['#0f3443','#34e89e','#0f3443'], angle: 160 },
        'gradient-sunset':  { type: 'gradient', stops: ['#1a1a2e','#e94560','#f5a623'], angle: 145 },
        'gradient-midnight':{ type: 'gradient', stops: ['#000000','#0f2027','#203a43','#2c5364'], angle: 180 },
        'mesh-dark':        { type: 'mesh',     colors: ['#0d1117','#1c2333','#161b22','#21262d'] },
        'mesh-purple':      { type: 'mesh',     colors: ['#1a0533','#2d1b69','#11001c','#4a0080'] },
        'dots-dark':        { type: 'dots',     bg: '#0d1117', dot: 'rgba(255,255,255,0.06)' },
        'custom-color':     { type: 'solid',    color: '#000000' },
    };

    // ============================================================
    // INTERNAL STATE
    // ============================================================
    let canvas       = null;
    let ctx          = null;
    let mediaRecorder = null;
    let chunks       = [];
    let rafId        = null;
    let recording    = false;
    let typingDone   = false;
    let lastFrameTime = 0;
    let smoothScroll = 0;
    let meshOffset   = 0; // for animated mesh

    // Current theme colors (set from ThemeEngine)
    let C = {};

    let config = {
        width:      1080,
        height:     1920,
        fps:        30,
        bitrate:    5_000_000,
        format:     'webm',
        quality:    '1080p',
        aspect:     'portrait-9-16',
        background: 'solid-black',
        customBgColor: '#000000',
        theme:      'tokyo-night',
        cursorStyle:'line',
        showMinimap: false,
        watermark: {
            text:     '',
            position: 'bottom-right',
            opacity:  0.6
        },
        fontFamily: '"JetBrains Mono", Consolas, monospace',
        uiFont:     '"Inter", -apple-system, sans-serif',
    };

    // Layout metrics (computed)
    let L = {};
    let charW       = 0;
    let maxCharsPerRow = 0;
    let visibleRows = 0;

    // Animation state (synced from app.js)
    let state = {
        parsedData:   null,
        currentLine:  0,
        currentChar:  0,
        totalRevealed:0,
        totalChars:   0,
        fileName:     'index.js',
        language:     'JavaScript',
        scrollOffset: 0,
    };

    // ============================================================
    // SYNTAX COLOR MAP (built from theme)
    // ============================================================
    function buildSyntaxColorMap() {
        return {
            'keyword':         C.keyword    || C.text,
            'string':          C.string     || C.text,
            'number':          C.number     || C.text,
            'comment':         C.comment    || C.lineNum,
            'function':        C.func       || C.text,
            'title':           C.title      || C.text,
            'built_in':        C.built_in   || C.text,
            'literal':         C.literal    || C.text,
            'type':            C.type       || C.text,
            'params':          C.params     || C.text,
            'meta':            C.meta       || C.text,
            'attr':            C.attr       || C.text,
            'attribute':       C.attribute  || C.text,
            'selector-tag':    C.tag        || C.text,
            'selector-class':  C.string     || C.text,
            'selector-id':     C.func       || C.text,
            'variable':        C.variable   || C.text,
            'template-variable':C.variable  || C.text,
            'tag':             C.tag        || C.text,
            'name':            C.tag        || C.text,
            'operator':        C.operator   || C.text,
            'property':        C.property   || C.text,
            'punctuation':     C.punctuation|| C.text,
            'regexp':          C.regexp     || C.text,
            'symbol':          C.symbol     || C.text,
            'subst':           C.subst      || C.text,
        };
    }

    let syntaxColorMap = {};

    // ============================================================
    // INIT
    // ============================================================
    function init(opts) {
        if (opts) {
            // Quality
            if (opts.quality && QualityPresets[opts.quality]) {
                config.quality = opts.quality;
                config.bitrate = QualityPresets[opts.quality].bitrate;
            }

            // Aspect ratio
            if (opts.aspect && AspectPresets[opts.aspect]) {
                config.aspect = opts.aspect;
            }

            // Compute dimensions from aspect + quality scale
            _computeDimensions();

            if (opts.format)      config.format      = opts.format;
            if (opts.fps)         config.fps         = opts.fps;
            if (opts.background)  config.background  = opts.background;
            if (opts.customBgColor) config.customBgColor = opts.customBgColor;
            if (opts.theme)       config.theme       = opts.theme;
            if (opts.cursorStyle) config.cursorStyle = opts.cursorStyle;
            if (opts.showMinimap !== undefined) config.showMinimap = opts.showMinimap;
            if (opts.watermark)   config.watermark   = { ...config.watermark, ...opts.watermark };
        }

        // Load theme colors
        C = ThemeEngine.getCanvasColors(config.theme);
        syntaxColorMap = buildSyntaxColorMap();

        // Create canvas
        canvas = document.createElement('canvas');
        canvas.width  = config.width;
        canvas.height = config.height;
        ctx = canvas.getContext('2d');

        computeLayout();
        measureChar();
    }

    function _computeDimensions() {
        const aspect  = AspectPresets[config.aspect];
        const quality = config.quality;

        // Scale factor based on quality
        const scaleMap = { '1080p': 1.0, '2k': 1.333, '4k': 2.0 };
        const scale    = scaleMap[quality] || 1.0;

        config.width  = Math.round(aspect.w * scale);
        config.height = Math.round(aspect.h * scale);
    }

    // ============================================================
    // LAYOUT
    // ============================================================
    function computeLayout() {
        const W = config.width;
        const H = config.height;

        // Scale factor relative to 1920 height baseline
        const s = H / 1920;

        // For landscape, use width as baseline instead
        const isLandscape = W > H;
        const sBase = isLandscape ? W / 1920 : s;

        L = {
            W, H, s: sBase,

            titleH:      r(Math.max(32, 44 * sBase)),
            titlePadX:   r(14 * sBase),
            dotR:        r(Math.max(4, 6.5 * sBase)),
            dotGap:      r(Math.max(5, 8 * sBase)),
            titleFont:   r(Math.max(10, 13 * sBase)),

            tabH:        r(Math.max(28, 38 * sBase)),
            tabPadX:     r(Math.max(10, 16 * sBase)),
            tabFont:     r(Math.max(11, 14 * sBase)),
            tabAccent:   Math.max(2, r(2.5 * sBase)),

            fontSize:    r(Math.max(14, 24 * sBase)),
            lineH:       r(Math.max(24, 40 * sBase)),
            lineNumPadR: r(Math.max(16, 28 * sBase)),
            codePadTop:  r(Math.max(10, 18 * sBase)),
            codePadR:    r(Math.max(8, 14 * sBase)),

            sbW:         r(Math.max(6, 10 * sBase)),
            sbPad:       r(Math.max(2, 3 * sBase)),
            sbMinThumb:  r(Math.max(20, 32 * sBase)),

            mmW:         config.showMinimap ? r(Math.max(48, 72 * sBase)) : 0,

            statusH:     r(Math.max(20, 26 * sBase)),
            statusFont:  r(Math.max(9, 12 * sBase)),
            statusPadX:  r(Math.max(10, 14 * sBase)),

            watermarkFont: r(Math.max(14, 22 * sBase)),
            watermarkPad:  r(Math.max(16, 28 * sBase)),

            // Computed later
            lineNumW:  0,
            codeAreaY: 0,
            codeAreaH: 0,
            codeX:     0,
            codeW:     0,
            statusY:   0,
        };

        L.codeAreaY = L.titleH + L.tabH;
        L.codeAreaH = H - L.codeAreaY - L.statusH;
        L.statusY   = H - L.statusH;
    }

    function measureChar() {
        ctx.font = `${L.fontSize}px ${config.fontFamily}`;
        const sample = 'MMMMMMMMMM';
        charW = ctx.measureText(sample).width / sample.length;
        if (charW <= 0) charW = L.fontSize * 0.601;
        recalcCodeMetrics();
    }

    function recalcCodeMetrics() {
        const digits = state.parsedData
            ? Math.max(2, String(state.parsedData.lines.length).length)
            : 2;

        L.lineNumW = r(digits * charW + L.lineNumPadR + 10 * L.s);
        L.codeX    = L.lineNumW;
        L.codeW    = L.W - L.lineNumW - L.codePadR - L.sbW - L.mmW;
        maxCharsPerRow = Math.max(1, Math.floor(L.codeW / charW));
        visibleRows    = Math.max(1, Math.floor((L.codeAreaH - L.codePadTop * 2) / L.lineH));
    }

    function r(v) { return Math.round(v); }

    // ============================================================
    // STATE MANAGEMENT
    // ============================================================
    function setParsedData(data) {
        state.parsedData   = data;
        state.totalChars   = data.totalChars;
        state.currentLine  = 0;
        state.currentChar  = 0;
        state.totalRevealed = 0;
        state.scrollOffset  = 0;
        smoothScroll        = 0;
        typingDone          = false;
        recalcCodeMetrics();
    }

    function setMeta(fn, lang) {
        state.fileName = fn   || 'untitled';
        state.language = lang || '';
    }

    function updateState(lineIdx, charCount, revealed, total) {
        state.currentLine   = lineIdx;
        state.currentChar   = charCount;
        state.totalRevealed = revealed;
        state.totalChars    = total;
        calcScroll();
    }

    function setComplete(v) { typingDone = v; }

    function calcScroll() {
        if (!state.parsedData) return;

        const lines = state.parsedData.lines;
        let rows    = 0;

        for (let i = 0; i <= state.currentLine && i < lines.length; i++) {
            if (i < state.currentLine) {
                rows += Math.max(1, Math.ceil(
                    Math.max(1, lines[i].charCount) / maxCharsPerRow
                ));
            } else {
                rows += Math.floor(state.currentChar / maxCharsPerRow) + 1;
            }
        }

        const margin = Math.max(3, Math.floor(visibleRows * 0.18));
        const needed = rows - (visibleRows - margin);
        if (needed > state.scrollOffset) state.scrollOffset = needed;
        if (state.scrollOffset < 0)      state.scrollOffset = 0;
    }

    // ============================================================
    // RECORDING CONTROL
    // ============================================================
    function startRecording() {
        return new Promise(async (resolve, reject) => {
            if (!canvas) {
                reject(new Error('Recorder not initialized'));
                return;
            }

            // Wait for fonts
            try {
                await document.fonts.load(`${L.fontSize}px "JetBrains Mono"`);
            } catch (e) { /* non-critical */ }

            measureChar();
            chunks       = [];
            recording    = true;
            typingDone   = false;
            smoothScroll = 0;
            meshOffset   = 0;

            let stream;
            try {
                stream = canvas.captureStream(config.fps);
            } catch (e) {
                reject(new Error('captureStream unsupported: ' + e.message));
                return;
            }

            const mime = BrowserSupport.getMimeType(config.format);
            if (!mime) {
                reject(new Error('No supported recording format found'));
                return;
            }

            try {
                mediaRecorder = new MediaRecorder(stream, {
                    mimeType:            mime,
                    videoBitsPerSecond:  config.bitrate,
                });
            } catch (e) {
                reject(new Error('MediaRecorder failed: ' + e.message));
                return;
            }

            mediaRecorder.ondataavailable = e => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.start(100);
            lastFrameTime = performance.now();
            tick(performance.now());
            resolve();
        });
    }

    function stopRecording() {
        return new Promise(resolve => {
            recording = false;

            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }

            if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                const type = _blobType();
                resolve(chunks.length ? new Blob(chunks, { type }) : null);
                return;
            }

            mediaRecorder.onstop = () => {
                const type = mediaRecorder.mimeType || _blobType();
                const blob = new Blob(chunks, { type });
                mediaRecorder = null;
                resolve(blob);
            };

            mediaRecorder.stop();
        });
    }

    function _blobType() {
        return config.format === 'mp4' ? 'video/mp4' : 'video/webm';
    }

    function isRecording() { return recording; }

    // ============================================================
    // RENDER LOOP
    // ============================================================
    function tick(ts) {
        if (!recording) return;

        const interval = 1000 / config.fps;
        if (ts - lastFrameTime >= interval) {
            lastFrameTime = ts - ((ts - lastFrameTime) % interval);
            render();
        }

        rafId = requestAnimationFrame(tick);
    }

    function render() {
        // Smooth scroll interpolation
        smoothScroll += (state.scrollOffset - smoothScroll) * 0.16;
        if (Math.abs(smoothScroll - state.scrollOffset) < 0.04) {
            smoothScroll = state.scrollOffset;
        }

        // Animate mesh offset
        meshOffset += 0.3;

        drawBackground();
        drawEditorShadow();
        drawTitleBar();
        drawTabBar();
        drawCode();
        drawScrollbar();
        if (config.showMinimap) drawMinimap();
        drawStatusBar();
        if (config.watermark && config.watermark.text) drawWatermark();
    }

    // ============================================================
    // BACKGROUND
    // ============================================================
    function drawBackground() {
        const bg = BACKGROUNDS[config.background] || BACKGROUNDS['solid-black'];
        const W  = L.W;
        const H  = L.H;

        // Handle custom color
        if (config.background === 'custom-color') {
            ctx.fillStyle = config.customBgColor || '#000000';
            ctx.fillRect(0, 0, W, H);
            return;
        }

        if (bg.type === 'solid') {
            ctx.fillStyle = bg.color;
            ctx.fillRect(0, 0, W, H);

        } else if (bg.type === 'gradient') {
            const angle = (bg.angle || 135) * Math.PI / 180;
            const x1    = W / 2 - Math.cos(angle) * W / 2;
            const y1    = H / 2 - Math.sin(angle) * H / 2;
            const x2    = W / 2 + Math.cos(angle) * W / 2;
            const y2    = H / 2 + Math.sin(angle) * H / 2;

            const grad = ctx.createLinearGradient(x1, y1, x2, y2);
            const stops = bg.stops;
            stops.forEach((color, i) => {
                grad.addColorStop(i / (stops.length - 1), color);
            });
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

        } else if (bg.type === 'mesh') {
            // Base color
            ctx.fillStyle = bg.colors[0] || '#0d1117';
            ctx.fillRect(0, 0, W, H);

            // Draw animated radial blobs
            const blobs = [
                { x: W * 0.2, y: H * 0.2, r: W * 0.6, c: bg.colors[1] || '#1c2333' },
                { x: W * 0.8, y: H * 0.5, r: W * 0.5, c: bg.colors[2] || '#161b22' },
                { x: W * 0.4, y: H * 0.8, r: W * 0.55,c: bg.colors[3] || '#21262d' },
            ];

            blobs.forEach((blob, i) => {
                const offsetX = Math.sin((meshOffset + i * 40) * 0.008) * W * 0.04;
                const offsetY = Math.cos((meshOffset + i * 60) * 0.006) * H * 0.04;

                const grad = ctx.createRadialGradient(
                    blob.x + offsetX, blob.y + offsetY, 0,
                    blob.x + offsetX, blob.y + offsetY, blob.r
                );
                grad.addColorStop(0, blob.c + 'aa');
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, W, H);
            });

        } else if (bg.type === 'dots') {
            ctx.fillStyle = bg.bg || '#0d1117';
            ctx.fillRect(0, 0, W, H);

            const spacing = r(28 * L.s);
            const dotR    = r(1.5 * L.s);

            ctx.fillStyle = bg.dot || 'rgba(255,255,255,0.06)';
            for (let x = spacing; x < W; x += spacing) {
                for (let y = spacing; y < H; y += spacing) {
                    ctx.beginPath();
                    ctx.arc(x, y, dotR, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    // ============================================================
    // EDITOR SHADOW (glow behind editor window)
    // ============================================================
    function drawEditorShadow() {
        const pad   = r(24 * L.s);
        const x     = pad;
        const y     = L.codeAreaY - L.titleH - L.tabH - pad;
        const w     = L.W - pad * 2;
        const h     = L.codeAreaH + L.titleH + L.tabH + L.statusH + pad * 2;
        const glow  = r(40 * L.s);

        ctx.shadowColor   = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur    = glow;
        ctx.shadowOffsetY = r(8 * L.s);

        ctx.fillStyle = C.editorBg || '#1a1b26';
        rrect(x, 0, w, h, r(12 * L.s));
        ctx.fill();

        ctx.shadowColor   = 'transparent';
        ctx.shadowBlur    = 0;
        ctx.shadowOffsetY = 0;
    }

    // ============================================================
    // TITLE BAR
    // ============================================================
    function drawTitleBar() {
        const h = L.titleH;

        ctx.fillStyle = C.titleBar || C.editorBg;
        ctx.fillRect(0, 0, L.W, h);

        ctx.fillStyle = C.titleBorder || C.editorBg;
        ctx.fillRect(0, h - 1, L.W, 1);

        const cy = h / 2;
        const sx = L.titlePadX + L.dotR;
        const dotColors = [C.dotRed, C.dotYellow, C.dotGreen];

        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(sx + i * (L.dotR * 2 + L.dotGap), cy, L.dotR, 0, Math.PI * 2);
            ctx.fillStyle = dotColors[i];
            ctx.fill();
        }

        ctx.font         = `500 ${L.titleFont}px ${config.uiFont}`;
        ctx.fillStyle    = C.muted || '#484f58';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.fileName + ' — CodeType Studio', L.W / 2, cy);
        ctx.textAlign = 'left';
    }

    // ============================================================
    // TAB BAR
    // ============================================================
    function drawTabBar() {
        const y  = L.titleH;
        const h  = L.tabH;

        ctx.fillStyle = C.tabBg || C.editorBg;
        ctx.fillRect(0, y, L.W, h);
        ctx.fillStyle = C.titleBorder || C.editorBg;
        ctx.fillRect(0, y + h - 1, L.W, 1);

        ctx.font = `${L.tabFont}px ${config.uiFont}`;
        const tw  = ctx.measureText(state.fileName).width;
        const tabW = Math.min(L.W * 0.55, tw + L.tabPadX * 2 + r(28 * L.s));

        // Active tab background
        ctx.fillStyle = C.tabActive || C.editorBg;
        ctx.fillRect(0, y, tabW, h);

        // Tab accent line
        ctx.fillStyle = C.tabAccent || '#58a6ff';
        ctx.fillRect(0, y + h - L.tabAccent - 1, tabW, L.tabAccent);

        // Tab right border
        ctx.fillStyle = C.titleBorder || '#101014';
        ctx.fillRect(tabW, y, 1, h);

        // File name text
        ctx.font         = `${L.tabFont}px ${config.uiFont}`;
        ctx.fillStyle    = C.white || '#e6edf3';
        ctx.textBaseline = 'middle';
        ctx.textAlign    = 'left';
        ctx.fillText(state.fileName, L.tabPadX, y + h / 2);

        // Close × symbol
        ctx.fillStyle = C.muted || '#484f58';
        ctx.fillText('×', tabW - L.tabPadX * 0.8, y + h / 2);
    }

    // ============================================================
    // CODE AREA
    // ============================================================
    function drawCode() {
        if (!state.parsedData) return;

        const lines = state.parsedData.lines;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, L.codeAreaY, L.W - L.sbW - L.mmW, L.codeAreaH);
        ctx.clip();

        let visRow = 0;

        for (let li = 0; li < lines.length; li++) {
            const line = lines[li];
            const rows = Math.max(1, Math.ceil(
                Math.max(1, line.charCount) / maxCharsPerRow
            ));

            // Skip rows above viewport
            if (visRow + rows <= smoothScroll - 1) {
                visRow += rows;
                continue;
            }

            const firstOff = visRow - smoothScroll;
            if (firstOff >= visibleRows + 2) break;

            // How many chars to show on this line
            let show;
            if      (li < state.currentLine) show = line.charCount;
            else if (li === state.currentLine) show = state.currentChar;
            else break;

            // Current line highlight
            if (li === state.currentLine) {
                const curRow = Math.floor(state.currentChar / maxCharsPerRow);
                const hlOff  = firstOff + curRow;
                if (hlOff >= -1 && hlOff < visibleRows + 1) {
                    const hlY = L.codeAreaY + L.codePadTop + hlOff * L.lineH;
                    ctx.fillStyle = C.currentLine || 'rgba(255,255,255,0.04)';
                    ctx.fillRect(0, hlY, L.W, L.lineH);
                }
            }

            // Line number
            if (firstOff >= -1 && firstOff < visibleRows + 1) {
                const lnY = L.codeAreaY + L.codePadTop + firstOff * L.lineH + L.lineH / 2;
                ctx.fillStyle    = (li === state.currentLine)
                    ? (C.lineNumActive || '#c0caf5')
                    : (C.lineNum      || '#363b54');
                ctx.textAlign    = 'right';
                ctx.font         = `${L.fontSize}px ${config.fontFamily}`;
                ctx.textBaseline = 'middle';
                ctx.fillText(String(li + 1), L.lineNumW - L.lineNumPadR, lnY);
                ctx.textAlign = 'left';
            }

            // Render tokens
            renderTokens(line.tokens, show, visRow);

            // Cursor on current line
            if (li === state.currentLine) {
                drawCursor(show, visRow);
            }

            visRow += rows;
        }

        ctx.restore();
    }

    function renderTokens(tokens, maxChars, startRow) {
        if (maxChars <= 0 || !tokens) return;

        let drawn = 0;
        let x     = L.codeX;
        let row   = 0;
        const colorStack = [C.text || '#a9b1d6'];
        let isItalic = false;

        ctx.font         = `${L.fontSize}px ${config.fontFamily}`;
        ctx.textBaseline = 'middle';

        for (let i = 0; i < tokens.length && drawn < maxChars; i++) {
            const tk = tokens[i];

            if (tk.type === 'open') {
                const cls   = _hljsClass(tk.value);
                const color = cls ? (syntaxColorMap[cls] || C.text) : C.text;
                colorStack.push(color);
                if (cls === 'comment') isItalic = true;

            } else if (tk.type === 'close') {
                if (colorStack.length > 1) colorStack.pop();
                isItalic = colorStack.some((_, idx) => {
                    // check if any open comment tag remains
                    return false; // simplified — italic handled per token
                });

            } else if (tk.type === 'text') {
                const off = startRow + row - smoothScroll;

                if (off >= -1 && off < visibleRows + 2) {
                    const y = L.codeAreaY + L.codePadTop + off * L.lineH + L.lineH / 2;

                    // Check if in comment (italic)
                    const inComment = colorStack[colorStack.length - 1] === (C.comment || '#565f89');
                    const fontStyle = inComment ? 'italic ' : '';

                    ctx.font      = `${fontStyle}${L.fontSize}px ${config.fontFamily}`;
                    ctx.fillStyle = colorStack[colorStack.length - 1] || C.text;
                    ctx.fillText(tk.char, x, y);
                }

                x += charW;
                drawn++;

                // Word wrap
                if (x + charW > L.W - L.codePadR - L.sbW - L.mmW) {
                    x = L.codeX;
                    row++;
                }
            }
        }
    }

    // ============================================================
    // CURSOR
    // ============================================================
    function drawCursor(chars, startRow) {
        const row  = Math.floor(chars / maxCharsPerRow);
        const col  = chars % maxCharsPerRow;
        const off  = startRow + row - smoothScroll;

        if (off < -1 || off >= visibleRows + 1) return;

        // Blink when done
        const blink = typingDone
            ? (Math.floor(performance.now() / 530) % 2 === 0)
            : true;
        if (!blink) return;

        const x  = L.codeX + col * charW;
        const y  = L.codeAreaY + L.codePadTop + off * L.lineH;
        const cColor = C.cursor || '#c0caf5';

        switch (config.cursorStyle) {
            case 'block': {
                ctx.fillStyle = _hexAlpha(cColor, 0.35);
                ctx.fillRect(x, y + r(2 * L.s), charW, L.lineH - r(4 * L.s));
                // Draw char under cursor in editor color
                ctx.fillStyle = cColor;
                ctx.font         = `${L.fontSize}px ${config.fontFamily}`;
                ctx.textBaseline = 'middle';
                ctx.fillText('█', x, y + L.lineH / 2);
                break;
            }
            case 'underline': {
                const uh = Math.max(2, r(2.5 * L.s));
                ctx.fillStyle = cColor;
                ctx.fillRect(x, y + L.lineH - uh - r(2 * L.s), charW, uh);
                break;
            }
            case 'line':
            default: {
                const cw = Math.max(2, r(2.2 * L.s));
                ctx.fillStyle = cColor;
                ctx.fillRect(x, y + r(2 * L.s), cw, L.lineH - r(4 * L.s));
                break;
            }
        }
    }

    // ============================================================
    // SCROLLBAR
    // ============================================================
    function drawScrollbar() {
        if (!state.parsedData) return;

        let revRows = 0;
        const lines = state.parsedData.lines;
        for (let i = 0; i <= state.currentLine && i < lines.length; i++) {
            revRows += Math.max(1, Math.ceil(
                Math.max(1, lines[i].charCount) / maxCharsPerRow
            ));
        }

        if (revRows <= visibleRows) return;

        const tX = L.W - L.sbW - L.mmW;
        const tY = L.codeAreaY;
        const tH = L.codeAreaH;

        ctx.fillStyle = C.scrollTrack || 'rgba(255,255,255,0.02)';
        ctx.fillRect(tX, tY, L.sbW, tH);

        const ratio  = visibleRows / revRows;
        const thumbH = Math.max(L.sbMinThumb, tH * ratio);
        const maxSc  = revRows - visibleRows;
        const pos    = maxSc > 0 ? smoothScroll / maxSc : 0;
        const thumbY = tY + pos * (tH - thumbH);

        ctx.fillStyle = C.scrollThumb || 'rgba(255,255,255,0.10)';
        rrect(
            tX + L.sbPad,
            thumbY,
            L.sbW - L.sbPad * 2,
            thumbH,
            (L.sbW - L.sbPad * 2) / 2
        );
        ctx.fill();
    }

    // ============================================================
    // MINIMAP
    // ============================================================
    function drawMinimap() {
        if (!state.parsedData || L.mmW <= 0) return;

        const lines = state.parsedData.lines;
        const x     = L.W - L.mmW;
        const y     = L.codeAreaY;
        const w     = L.mmW;
        const h     = L.codeAreaH;

        // Background
        ctx.fillStyle = _hexAlpha(C.editorBar || '#16161e', 0.8);
        ctx.fillRect(x, y, w, h);

        // Left border
        ctx.fillStyle = C.titleBorder || '#101014';
        ctx.fillRect(x, y, 1, h);

        const lineH    = Math.max(1, h / Math.max(lines.length, 1));
        const maxWidth = w - 8;

        // Viewport indicator
        const viewH  = (visibleRows / lines.length) * h;
        const viewY  = y + (smoothScroll / Math.max(lines.length, 1)) * h;
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(x, viewY, w, viewH);

        // Mini lines
        lines.forEach((line, i) => {
            if (i > state.currentLine) return;

            const ly = y + i * lineH;
            const lw = Math.min(maxWidth, (line.charCount / 60) * maxWidth);

            ctx.fillStyle = i === state.currentLine
                ? _hexAlpha(C.tabAccent || '#58a6ff', 0.6)
                : _hexAlpha(C.text || '#a9b1d6', 0.3);

            ctx.fillRect(
                x + 4,
                ly + lineH * 0.2,
                Math.max(2, lw),
                Math.max(1, lineH * 0.6)
            );
        });
    }

    // ============================================================
    // STATUS BAR
    // ============================================================
    function drawStatusBar() {
        const y = L.statusY;
        const h = L.statusH;

        ctx.fillStyle = C.statusBg || C.editorBar;
        ctx.fillRect(0, y, L.W, h);

        ctx.fillStyle = C.statusBorder || C.editorBg;
        ctx.fillRect(0, y, L.W, 1);

        const mid = y + h / 2;
        ctx.font         = `${L.statusFont}px ${config.uiFont}`;
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = C.muted || '#484f58';

        // Left items
        ctx.textAlign = 'left';
        ctx.fillText(state.language, L.statusPadX, mid);

        const langW = ctx.measureText(state.language).width;
        ctx.fillText('UTF-8', L.statusPadX + langW + r(20 * L.s), mid);

        // Right items
        ctx.textAlign = 'right';
        const pos   = `Ln ${state.currentLine + 1}, Col ${state.currentChar + 1}`;
        ctx.fillText(pos, L.W - L.statusPadX, mid);

        const posW = ctx.measureText(pos).width;
        ctx.fillText('Spaces: 4', L.W - L.statusPadX - posW - r(24 * L.s), mid);

        ctx.textAlign = 'left';
    }

    // ============================================================
    // WATERMARK
    // ============================================================
    function drawWatermark() {
        const wm = config.watermark;
        if (!wm || !wm.text) return;

        ctx.font         = `600 ${L.watermarkFont}px ${config.uiFont}`;
        ctx.textBaseline = 'middle';
        ctx.globalAlpha  = wm.opacity || 0.6;

        const tw  = ctx.measureText(wm.text).width;
        const pad = L.watermarkPad;
        const mid = L.watermarkFont / 2 + 4;

        let x, y;
        switch (wm.position) {
            case 'top-left':
                x = pad;
                y = pad + mid;
                break;
            case 'top-right':
                x = L.W - pad - tw;
                y = pad + mid;
                break;
            case 'bottom-left':
                x = pad;
                y = L.statusY - pad - mid;
                break;
            case 'bottom-right':
            default:
                x = L.W - pad - tw;
                y = L.statusY - pad - mid;
                break;
        }

        // Background pill
        const pillPad = r(8 * L.s);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        rrect(x - pillPad, y - mid, tw + pillPad * 2, L.watermarkFont + 8, r(6 * L.s));
        ctx.fill();

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(wm.text, x, y);

        ctx.globalAlpha = 1;
        ctx.textAlign   = 'left';
    }

    // ============================================================
    // HELPERS
    // ============================================================
    function rrect(x, y, w, h, rad) {
        rad = Math.min(rad, Math.abs(w) / 2, Math.abs(h) / 2);
        if (rad < 0) rad = 0;
        if (w <= 0 || h <= 0) return;

        ctx.beginPath();
        ctx.moveTo(x + rad, y);
        ctx.lineTo(x + w - rad, y);
        ctx.arcTo(x + w, y,     x + w, y + rad,     rad);
        ctx.lineTo(x + w, y + h - rad);
        ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
        ctx.lineTo(x + rad, y + h);
        ctx.arcTo(x,     y + h, x,     y + h - rad, rad);
        ctx.lineTo(x,     y + rad);
        ctx.arcTo(x,     y,     x + rad, y,          rad);
        ctx.closePath();
    }

    function _hljsClass(tag) {
        const m = tag.match(/class="([^"]+)"/);
        if (!m) return null;
        for (const c of m[1].split(/\s+/)) {
            if (c.startsWith('hljs-')) return c.substring(5);
        }
        return null;
    }

    function _hexAlpha(hex, alpha) {
        // Add alpha to a hex color by returning rgba
        try {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r},${g},${b},${alpha})`;
        } catch (e) {
            return hex;
        }
    }

    function isSupported() {
        return !!(
            window.MediaRecorder &&
            HTMLCanvasElement.prototype.captureStream
        );
    }

    function getCanvas()  { return canvas; }
    function getConfig()  { return config; }

    // ============================================================
    // PUBLIC API
    // ============================================================
    return {
        init,
        setParsedData,
        setMeta,
        updateState,
        setComplete,
        startRecording,
        stopRecording,
        isRecording,
        isSupported,
        getCanvas,
        getConfig,
        getBrowserSupport:  () => BrowserSupport,
        getQualityPresets:  () => QualityPresets,
        getAspectPresets:   () => AspectPresets,
        getBackgrounds:     () => BACKGROUNDS,
    };

})();