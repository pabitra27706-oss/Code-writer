/* =============================================
   RECORDER.JS
   Records the typing animation to a canvas
   and exports as WebM/MP4 video file.
   ============================================= */

const Recorder = (function () {

  // ---- Tokyo Night Color Scheme ----
  const C = {
    bg:         '#1a1b26',
    titleBar:   '#16161e',
    titleBorder:'#101014',
    tabBg:      '#16161e',
    tabActive:  '#1a1b26',
    tabAccent:  '#58a6ff',
    statusBg:   '#16161e',
    statusBorder:'#101014',
    lineNum:    '#363b54',
    lineNumHover:'#565f89',
    text:       '#a9b1d6',
    cursor:     '#c0caf5',
    dotRed:     '#f85149',
    dotYellow:  '#d29922',
    dotGreen:   '#3fb950',
    muted:      '#484f58',
    codeBg:     '#1a1b26',
    // Syntax
    keyword:    '#bb9af7',
    string:     '#9ece6a',
    number:     '#ff9e64',
    comment:    '#565f89',
    func:       '#7aa2f7',
    title:      '#7aa2f7',
    built_in:   '#e0af68',
    literal:    '#ff9e64',
    type:       '#2ac3de',
    params:     '#e0af68',
    meta:       '#89ddff',
    attr:       '#7aa2f7',
    attribute:  '#bb9af7',
    selectorTag:'#f7768e',
    selectorClass:'#9ece6a',
    selectorId: '#7aa2f7',
    variable:   '#c0caf5',
    templateVar:'#7dcfff',
    tag:        '#f7768e',
    name:       '#f7768e',
    operator:   '#89ddff',
    property:   '#73daca',
    punctuation:'#89ddff',
    regexp:     '#b4f9f8',
    symbol:     '#bb9af7',
    subst:      '#c0caf5',
  };

  // Maps hljs class suffix → color
  const syntaxColorMap = {
    'keyword': C.keyword, 'string': C.string, 'number': C.number,
    'comment': C.comment, 'function': C.func, 'title': C.title,
    'built_in': C.built_in, 'literal': C.literal, 'type': C.type,
    'params': C.params, 'meta': C.meta, 'attr': C.attr,
    'attribute': C.attribute, 'selector-tag': C.selectorTag,
    'selector-class': C.selectorClass, 'selector-id': C.selectorId,
    'variable': C.variable, 'template-variable': C.templateVar,
    'tag': C.tag, 'name': C.name, 'operator': C.operator,
    'property': C.property, 'punctuation': C.punctuation,
    'regexp': C.regexp, 'symbol': C.symbol, 'subst': C.subst,
  };

  // ---- State ----
  let canvas = null;
  let ctx = null;
  let mediaRecorder = null;
  let chunks = [];
  let rafId = null;
  let recording = false;
  let typingDone = false;
  let lastFrameTime = 0;

  // Config
  let config = {
    width: 1280,
    height: 720,
    fps: 30,
    bitrate: 4000000,
    fontFamily: 'JetBrains Mono, Consolas, monospace',
    uiFont: 'Inter, sans-serif',
  };

  // Layout (computed on init)
  let L = {};
  let charW = 0;
  let maxCharsPerRow = 0;
  let visibleRows = 0;

  // Animation state
  let state = {
    parsedData: null,
    currentLine: 0,
    currentChar: 0,
    totalRevealed: 0,
    totalChars: 0,
    fileName: 'index.js',
    language: 'JavaScript',
    scrollOffset: 0, // first visible logical line
  };

  // ======================================
  //  INITIALIZATION
  // ======================================

  function init(opts) {
    if (opts) {
      if (opts.width) config.width = opts.width;
      if (opts.height) config.height = opts.height;
      if (opts.fps) config.fps = opts.fps;
      if (opts.bitrate) config.bitrate = opts.bitrate;
    }

    // Create offscreen canvas
    canvas = document.createElement('canvas');
    canvas.width = config.width;
    canvas.height = config.height;
    ctx = canvas.getContext('2d');

    computeLayout();
    measureCharWidth();
  }

  function computeLayout() {
    const W = config.width;
    const H = config.height;
    const s = H / 720; // scale factor relative to 720p

    L = {
      // Title bar
      titleBarH: Math.round(38 * s),
      titleBarPadX: Math.round(14 * s),
      dotR: Math.round(6 * s),
      dotGap: Math.round(8 * s),
      dotOffsetY: 0, // computed below
      titleFontSize: Math.round(12 * s),

      // Tab bar
      tabBarH: Math.round(36 * s),
      tabPadX: Math.round(16 * s),
      tabFontSize: Math.round(13 * s),
      tabAccentH: Math.round(2 * s),

      // Code area
      codeFontSize: Math.round(13.5 * s),
      lineHeight: Math.round(24 * s),
      lineNumW: Math.round(50 * s),
      lineNumPadR: Math.round(16 * s),
      codePadTop: Math.round(12 * s),
      codePadRight: Math.round(16 * s),

      // Status bar
      statusBarH: Math.round(24 * s),
      statusFontSize: Math.round(11 * s),
      statusPadX: Math.round(12 * s),

      // Computed
      codeAreaY: 0,
      codeAreaH: 0,
      codeContentX: 0,
      codeContentW: 0,
    };

    L.dotOffsetY = L.titleBarH / 2;
    L.codeAreaY = L.titleBarH + L.tabBarH;
    L.codeAreaH = H - L.titleBarH - L.tabBarH - L.statusBarH;
    L.codeContentX = L.lineNumW;
    L.codeContentW = W - L.lineNumW - L.codePadRight;
  }

  function measureCharWidth() {
    ctx.font = `${L.codeFontSize}px ${config.fontFamily}`;
    charW = ctx.measureText('M').width;
    maxCharsPerRow = Math.floor(L.codeContentW / charW);
    visibleRows = Math.floor((L.codeAreaH - L.codePadTop * 2) / L.lineHeight);
  }

  // ======================================
  //  STATE MANAGEMENT
  // ======================================

  function setParsedData(data) {
    state.parsedData = data;
    state.totalChars = data.totalChars;
    state.currentLine = 0;
    state.currentChar = 0;
    state.totalRevealed = 0;
    state.scrollOffset = 0;
    typingDone = false;
  }

  function setMeta(fileName, language) {
    state.fileName = fileName || 'untitled';
    state.language = language || '';
  }

  function updateState(lineIndex, charCount, totalRevealed, totalChars) {
    state.currentLine = lineIndex;
    state.currentChar = charCount;
    state.totalRevealed = totalRevealed;
    state.totalChars = totalChars;
    calculateScroll();
  }

  function setComplete(done) {
    typingDone = done;
  }

  function calculateScroll() {
    if (!state.parsedData) return;

    // Count visual rows up to current line
    let totalVisualRows = 0;
    for (let i = 0; i <= state.currentLine && i < state.parsedData.lines.length; i++) {
      const lc = state.parsedData.lines[i].charCount;
      totalVisualRows += Math.max(1, Math.ceil(lc / maxCharsPerRow));
    }

    // If cursor row exceeds visible area, scroll
    const maxVisible = visibleRows - 2; // keep 2 rows margin
    if (totalVisualRows > maxVisible + state.scrollOffset) {
      state.scrollOffset = totalVisualRows - maxVisible;
    }
  }

  // ======================================
  //  RECORDING CONTROL
  // ======================================

  function startRecording() {
    return new Promise((resolve, reject) => {
      if (!canvas) {
        reject(new Error('Recorder not initialized'));
        return;
      }

      // Recalculate after fonts may have loaded
      measureCharWidth();

      chunks = [];
      recording = true;
      typingDone = false;

      // Get canvas stream
      let stream;
      try {
        stream = canvas.captureStream(config.fps);
      } catch (e) {
        reject(new Error('captureStream not supported'));
        return;
      }

      // Determine MIME type
      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        reject(new Error('No supported video codec found'));
        return;
      }

      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeType,
          videoBitsPerSecond: config.bitrate,
        });
      } catch (e) {
        reject(new Error('MediaRecorder creation failed: ' + e.message));
        return;
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
      };

      mediaRecorder.start(100); // collect data every 100ms

      // Start render loop
      lastFrameTime = performance.now();
      renderLoop(performance.now());

      resolve();
    });
  }

  function stopRecording() {
    return new Promise((resolve) => {
      recording = false;

      // Stop render loop
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        const blob = chunks.length > 0
          ? new Blob(chunks, { type: chunks[0].type || 'video/webm' })
          : null;
        resolve(blob);
        return;
      }

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'video/webm';
        const blob = new Blob(chunks, { type: mimeType });
        mediaRecorder = null;
        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }

  function isRecording() {
    return recording;
  }

  // ======================================
  //  RENDER LOOP
  // ======================================

  function renderLoop(timestamp) {
    if (!recording) return;

    const elapsed = timestamp - lastFrameTime;
    const frameInterval = 1000 / config.fps;

    if (elapsed >= frameInterval) {
      lastFrameTime = timestamp - (elapsed % frameInterval);
      renderFrame();
    }

    rafId = requestAnimationFrame(renderLoop);
  }

  function renderFrame() {
    const W = config.width;
    const H = config.height;

    // Clear
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    drawTitleBar(W);
    drawTabBar(W);
    drawCodeArea(W, H);
    drawStatusBar(W, H);
  }

  // ======================================
  //  DRAWING FUNCTIONS
  // ======================================

  function drawTitleBar(W) {
    const h = L.titleBarH;

    // Background
    ctx.fillStyle = C.titleBar;
    ctx.fillRect(0, 0, W, h);

    // Bottom border
    ctx.fillStyle = C.titleBorder;
    ctx.fillRect(0, h - 1, W, 1);

    // Traffic light dots
    const dotY = h / 2;
    const startX = L.titleBarPadX + L.dotR;

    [C.dotRed, C.dotYellow, C.dotGreen].forEach((color, i) => {
      ctx.beginPath();
      ctx.arc(startX + i * (L.dotR * 2 + L.dotGap), dotY, L.dotR, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    // Title text
    ctx.font = `500 ${L.titleFontSize}px ${config.uiFont}`;
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CodeType Studio', W / 2, dotY);

    // Window actions (decorative)
    ctx.textAlign = 'right';
    ctx.fillStyle = C.muted;
    ctx.globalAlpha = 0.5;
    ctx.fillText('─   □   ×', W - L.titleBarPadX, dotY);
    ctx.globalAlpha = 1;

    ctx.textAlign = 'left';
  }

  function drawTabBar(W) {
    const y = L.titleBarH;
    const h = L.tabBarH;

    // Background
    ctx.fillStyle = C.tabBg;
    ctx.fillRect(0, y, W, h);

    // Bottom border
    ctx.fillStyle = C.titleBorder;
    ctx.fillRect(0, y + h - 1, W, 1);

    // Active tab
    const tabW = Math.min(200, Math.max(120, state.fileName.length * 10 + 60));

    // Tab background
    ctx.fillStyle = C.tabActive;
    ctx.fillRect(0, y, tabW, h);

    // Tab accent line
    ctx.fillStyle = C.tabAccent;
    ctx.fillRect(0, y + h - L.tabAccentH, tabW, L.tabAccentH);

    // Tab right border
    ctx.fillStyle = C.titleBorder;
    ctx.fillRect(tabW, y, 1, h);

    // Tab text
    ctx.font = `${L.tabFontSize}px ${config.uiFont}`;
    ctx.fillStyle = C.text;
    ctx.textBaseline = 'middle';
    ctx.fillText(state.fileName, L.tabPadX + 4, y + h / 2);

    // Tab close "×"
    ctx.fillStyle = C.muted;
    ctx.fillText('×', tabW - L.tabPadX, y + h / 2);
  }

  function drawCodeArea(W, H) {
    if (!state.parsedData) return;

    const lines = state.parsedData.lines;
    const areaY = L.codeAreaY;
    const areaH = L.codeAreaH;

    // Background
    ctx.fillStyle = C.codeBg;
    ctx.fillRect(0, areaY, W, areaH);

    // Clip to code area
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, areaY, W, areaH);
    ctx.clip();

    // Set font
    ctx.font = `${L.codeFontSize}px ${config.fontFamily}`;
    ctx.textBaseline = 'middle';

    let visualRow = 0;
    let drawnRows = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const lineRows = Math.max(1, Math.ceil(Math.max(1, line.charCount) / maxCharsPerRow));

      // Skip lines above scroll
      if (visualRow + lineRows <= state.scrollOffset) {
        visualRow += lineRows;
        continue;
      }

      // Stop if below visible area
      if (drawnRows >= visibleRows + 2) break;

      // Determine how many chars to show on this line
      let charsToShow;
      if (lineIdx < state.currentLine) {
        charsToShow = line.charCount; // fully revealed
      } else if (lineIdx === state.currentLine) {
        charsToShow = state.currentChar; // partially revealed
      } else {
        break; // haven't reached this line yet
      }

      // Draw line number (on first visual row of this line)
      const firstRowY = areaY + L.codePadTop +
        (visualRow - state.scrollOffset) * L.lineHeight;

      if (visualRow >= state.scrollOffset) {
        ctx.fillStyle = C.lineNum;
        ctx.textAlign = 'right';
        ctx.font = `${L.codeFontSize}px ${config.fontFamily}`;
        ctx.fillText(
          String(lineIdx + 1),
          L.lineNumW - L.lineNumPadR,
          firstRowY + L.lineHeight / 2
        );
        ctx.textAlign = 'left';
      }

      // Draw tokens for this line
      drawLineTokens(line.tokens, charsToShow, lineIdx, visualRow);

      // Draw cursor on current line
      if (lineIdx === state.currentLine) {
        drawCursor(charsToShow, visualRow);
      }

      visualRow += lineRows;
      drawnRows += lineRows;
    }

    ctx.restore();
  }

  function drawLineTokens(tokens, maxChars, lineIdx, startVisualRow) {
    let charsDrawn = 0;
    let x = L.lineNumW;
    let row = 0;
    const colorStack = [C.text]; // default color
    const areaY = L.codeAreaY;

    ctx.font = `${L.codeFontSize}px ${config.fontFamily}`;
    ctx.textBaseline = 'middle';

    for (let i = 0; i < tokens.length && charsDrawn < maxChars; i++) {
      const token = tokens[i];

      if (token.type === 'open') {
        const cls = extractHljsClass(token.value);
        const color = cls ? (syntaxColorMap[cls] || C.text) : C.text;
        colorStack.push(color);
      } else if (token.type === 'close') {
        if (colorStack.length > 1) colorStack.pop();
      } else if (token.type === 'text') {
        if (charsDrawn >= maxChars) break;

        const rowOffset = startVisualRow + row - state.scrollOffset;
        if (rowOffset >= 0 && rowOffset < visibleRows + 2) {
          const y = areaY + L.codePadTop + rowOffset * L.lineHeight + L.lineHeight / 2;
          ctx.fillStyle = colorStack[colorStack.length - 1];

          // Check for comment italic
          const isComment = colorStack.some(c => c === C.comment);
          if (isComment) {
            ctx.font = `italic ${L.codeFontSize}px ${config.fontFamily}`;
          }

          ctx.fillText(token.char, x, y);

          if (isComment) {
            ctx.font = `${L.codeFontSize}px ${config.fontFamily}`;
          }
        }

        x += charW;
        charsDrawn++;

        // Wrap
        if (x + charW > config.width - L.codePadRight) {
          x = L.lineNumW;
          row++;
        }
      }
    }
  }

  function drawCursor(charsOnLine, startVisualRow) {
    // Calculate cursor position
    const row = Math.floor(charsOnLine / maxCharsPerRow);
    const col = charsOnLine % maxCharsPerRow;
    const visualRowOffset = startVisualRow + row - state.scrollOffset;

    if (visualRowOffset < 0 || visualRowOffset > visibleRows) return;

    const x = L.lineNumW + col * charW;
    const y = L.codeAreaY + L.codePadTop + visualRowOffset * L.lineHeight;

    // Blink effect: use time-based toggle
    const blinkOn = typingDone
      ? (Math.floor(performance.now() / 530) % 2 === 0)
      : true; // solid during typing

    if (blinkOn) {
      ctx.fillStyle = C.cursor;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(x, y + 2, charW, L.lineHeight - 4);
      ctx.globalAlpha = 1;
    }
  }

  function drawStatusBar(W, H) {
    const y = H - L.statusBarH;

    // Background
    ctx.fillStyle = C.statusBg;
    ctx.fillRect(0, y, W, L.statusBarH);

    // Top border
    ctx.fillStyle = C.statusBorder;
    ctx.fillRect(0, y, W, 1);

    // Font
    ctx.font = `${L.statusFontSize}px ${config.uiFont}`;
    ctx.textBaseline = 'middle';
    const midY = y + L.statusBarH / 2;

    // Left: Language, UTF-8
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'left';
    ctx.fillText(state.language + '     UTF-8', L.statusPadX, midY);

    // Right: Position, Spaces
    ctx.textAlign = 'right';
    const posText = `Ln ${state.currentLine + 1}, Col ${state.currentChar + 1}     Spaces: 4`;
    ctx.fillText(posText, W - L.statusPadX, midY);

    ctx.textAlign = 'left';
  }

  // ======================================
  //  HELPERS
  // ======================================

  function extractHljsClass(openTag) {
    // Extract class from: <span class="hljs-keyword">
    const match = openTag.match(/class="([^"]+)"/);
    if (!match) return null;

    const classes = match[1].split(/\s+/);
    for (const cls of classes) {
      if (cls.startsWith('hljs-')) {
        return cls.substring(5); // remove 'hljs-' prefix
      }
    }
    return classes[0] || null;
  }

  function getSupportedMimeType() {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return null;
  }

  function isSupported() {
    return !!(
      window.MediaRecorder &&
      HTMLCanvasElement.prototype.captureStream
    );
  }

  function getCanvas() {
    return canvas;
  }

  // ======================================
  //  PUBLIC API
  // ======================================

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
  };

})();