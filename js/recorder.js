/* =============================================
   RECORDER.JS
   Renders a pixel-perfect VS Code editor on
   canvas (vertical) and records as video.
   Looks identical to a real screen recording.
   ============================================= */

const Recorder = (function () {

  // ---- Tokyo Night Dark — Exact VS Code Colors ----
  const C = {
    editorBg:      '#1a1b26',
    titleBar:      '#16161e',
    titleBorder:   '#101014',
    tabBg:         '#16161e',
    tabActive:     '#1a1b26',
    tabAccent:     '#58a6ff',
    statusBg:      '#16161e',
    statusBorder:  '#101014',
    lineNum:       '#363b54',
    lineNumActive: '#c0caf5',
    text:          '#a9b1d6',
    cursor:        '#c0caf5',
    currentLine:   'rgba(255, 255, 255, 0.04)',
    dotRed:        '#f85149',
    dotYellow:     '#d29922',
    dotGreen:      '#3fb950',
    muted:         '#484f58',
    white:         '#e6edf3',
    scrollTrack:   'rgba(255, 255, 255, 0.02)',
    scrollThumb:   'rgba(255, 255, 255, 0.10)',
    // Syntax highlighting
    keyword:       '#bb9af7',
    string:        '#9ece6a',
    number:        '#ff9e64',
    comment:       '#565f89',
    func:          '#7aa2f7',
    title:         '#7aa2f7',
    built_in:      '#e0af68',
    literal:       '#ff9e64',
    type:          '#2ac3de',
    params:        '#e0af68',
    meta:          '#89ddff',
    attr:          '#7aa2f7',
    attribute:     '#bb9af7',
    selectorTag:   '#f7768e',
    selectorClass: '#9ece6a',
    selectorId:    '#7aa2f7',
    variable:      '#c0caf5',
    templateVar:   '#7dcfff',
    tag:           '#f7768e',
    name:          '#f7768e',
    operator:      '#89ddff',
    property:      '#73daca',
    punctuation:   '#89ddff',
    regexp:        '#b4f9f8',
    symbol:        '#bb9af7',
    subst:         '#c0caf5',
  };

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

  // ---- Internal State ----
  let canvas = null;
  let ctx = null;
  let mediaRecorder = null;
  let chunks = [];
  let rafId = null;
  let recording = false;
  let typingDone = false;
  let lastFrameTime = 0;
  let smoothScroll = 0;

  let config = {
    width: 1080, height: 1920, fps: 30, bitrate: 6000000,
    fontFamily: 'JetBrains Mono, Consolas, monospace',
    uiFont: 'Inter, -apple-system, sans-serif',
  };

  let L = {};
  let charW = 0;
  let maxCharsPerRow = 0;
  let visibleRows = 0;

  let state = {
    parsedData: null,
    currentLine: 0,  currentChar: 0,
    totalRevealed: 0, totalChars: 0,
    fileName: 'index.js', language: 'JavaScript',
    scrollOffset: 0,
  };

  // ============================================================
  //  INIT + LAYOUT
  // ============================================================

  function init(opts) {
    if (opts) {
      if (opts.width)   config.width  = opts.width;
      if (opts.height)  config.height = opts.height;
      if (opts.fps)     config.fps    = opts.fps;
      if (opts.bitrate) config.bitrate = opts.bitrate;
    }
    canvas = document.createElement('canvas');
    canvas.width  = config.width;
    canvas.height = config.height;
    ctx = canvas.getContext('2d');
    computeLayout();
    measureChar();
  }

  function computeLayout() {
    const W = config.width, H = config.height;
    const s = H / 1920;

    L = {
      W, H, s,
      // Title bar
      titleH:     r(Math.max(34, 44 * s)),
      titlePadX:  r(16 * s),
      dotR:       r(Math.max(4.5, 6.5 * s)),
      dotGap:     r(Math.max(6, 8 * s)),
      titleFont:  r(Math.max(11, 13 * s)),
      // Tab bar
      tabH:       r(Math.max(32, 40 * s)),
      tabPadX:    r(Math.max(12, 16 * s)),
      tabFont:    r(Math.max(12, 14 * s)),
      tabAccent:  Math.max(2, r(2.5 * s)),
      // Code
      fontSize:   r(Math.max(13, 16 * s)),
      lineH:      r(Math.max(22, 28 * s)),
      lineNumPadR:r(Math.max(14, 20 * s)),
      codePadTop: r(Math.max(8, 12 * s)),
      codePadR:   r(Math.max(8, 12 * s)),
      // Scrollbar
      sbW:        r(Math.max(8, 12 * s)),
      sbPad:      r(Math.max(2, 3 * s)),
      sbMinThumb: r(Math.max(24, 36 * s)),
      // Status bar
      statusH:    r(Math.max(24, 28 * s)),
      statusFont: r(Math.max(10, 12 * s)),
      statusPadX: r(Math.max(12, 16 * s)),
      // Will be computed
      lineNumW: 0, codeAreaY: 0, codeAreaH: 0,
      codeX: 0, codeW: 0, statusY: 0,
    };

    L.codeAreaY = L.titleH + L.tabH;
    L.codeAreaH = H - L.codeAreaY - L.statusH;
    L.statusY   = H - L.statusH;
  }

  function measureChar() {
    ctx.font = `${L.fontSize}px ${config.fontFamily}`;
    const sample = 'MMMMMMMMMM';
    charW = ctx.measureText(sample).width / sample.length;
    if (charW <= 0) charW = L.fontSize * 0.6;
    recalcCodeMetrics();
  }

  function recalcCodeMetrics() {
    // Dynamic line number width based on total lines
    const digits = state.parsedData
      ? Math.max(2, String(state.parsedData.lines.length).length) : 2;
    L.lineNumW = r(digits * charW + L.lineNumPadR + 12 * L.s);
    L.codeX = L.lineNumW;
    L.codeW = L.W - L.lineNumW - L.codePadR;
    maxCharsPerRow = Math.max(1, Math.floor(L.codeW / charW));
    visibleRows = Math.max(1, Math.floor((L.codeAreaH - L.codePadTop * 2) / L.lineH));
  }

  function r(v) { return Math.round(v); }

  // ============================================================
  //  STATE MANAGEMENT
  // ============================================================

  function setParsedData(data) {
    state.parsedData = data;
    state.totalChars = data.totalChars;
    state.currentLine = 0;
    state.currentChar = 0;
    state.totalRevealed = 0;
    state.scrollOffset = 0;
    smoothScroll = 0;
    typingDone = false;
    recalcCodeMetrics();
  }

  function setMeta(fn, lang) {
    state.fileName = fn || 'untitled';
    state.language = lang || '';
  }

  function updateState(lineIdx, charCount, revealed, total) {
    state.currentLine = lineIdx;
    state.currentChar = charCount;
    state.totalRevealed = revealed;
    state.totalChars = total;
    calcScroll();
  }

  function setComplete(v) { typingDone = v; }

  function calcScroll() {
    if (!state.parsedData) return;
    let rows = 0;
    const lines = state.parsedData.lines;
    for (let i = 0; i <= state.currentLine && i < lines.length; i++) {
      if (i < state.currentLine) {
        rows += Math.max(1, Math.ceil(Math.max(1, lines[i].charCount) / maxCharsPerRow));
      } else {
        rows += Math.floor(state.currentChar / maxCharsPerRow) + 1;
      }
    }
    const margin = Math.max(3, Math.floor(visibleRows * 0.15));
    const needed = rows - (visibleRows - margin);
    if (needed > state.scrollOffset) state.scrollOffset = needed;
    if (state.scrollOffset < 0) state.scrollOffset = 0;
  }

  // ============================================================
  //  RECORDING CONTROL
  // ============================================================

  function startRecording() {
    return new Promise((resolve, reject) => {
      if (!canvas) { reject(new Error('Not initialized')); return; }
      measureChar();
      chunks = [];
      recording = true;
      typingDone = false;
      smoothScroll = 0;

      let stream;
      try { stream = canvas.captureStream(config.fps); }
      catch (e) { reject(new Error('captureStream unsupported')); return; }

      const mime = getBestMime();
      if (!mime) { reject(new Error('No supported video codec')); return; }

      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: mime,
          videoBitsPerSecond: config.bitrate,
        });
      } catch (e) { reject(new Error('MediaRecorder failed')); return; }

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
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(chunks.length ? new Blob(chunks, { type: 'video/webm' }) : null);
        return;
      }
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'video/webm' });
        mediaRecorder = null;
        resolve(blob);
      };
      mediaRecorder.stop();
    });
  }

  function isRecording() { return recording; }

  // ============================================================
  //  RENDER LOOP
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
    smoothScroll += (state.scrollOffset - smoothScroll) * 0.18;
    if (Math.abs(smoothScroll - state.scrollOffset) < 0.05) {
      smoothScroll = state.scrollOffset;
    }

    ctx.fillStyle = C.editorBg;
    ctx.fillRect(0, 0, L.W, L.H);

    drawTitleBar();
    drawTabBar();
    drawCode();
    drawScrollbar();
    drawStatusBar();
  }

  // ============================================================
  //  DRAW — TITLE BAR
  // ============================================================

  function drawTitleBar() {
    const h = L.titleH;

    ctx.fillStyle = C.titleBar;
    ctx.fillRect(0, 0, L.W, h);
    ctx.fillStyle = C.titleBorder;
    ctx.fillRect(0, h - 1, L.W, 1);

    // Traffic lights
    const cy = h / 2;
    const sx = L.titlePadX + L.dotR;
    const colors = [C.dotRed, C.dotYellow, C.dotGreen];
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(sx + i * (L.dotR * 2 + L.dotGap), cy, L.dotR, 0, Math.PI * 2);
      ctx.fillStyle = colors[i];
      ctx.fill();
    }

    // Centered title
    ctx.font = `500 ${L.titleFont}px ${config.uiFont}`;
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.fileName + ' — CodeType Studio', L.W / 2, cy);
    ctx.textAlign = 'left';
  }

  // ============================================================
  //  DRAW — TAB BAR
  // ============================================================

  function drawTabBar() {
    const y = L.titleH, h = L.tabH;

    ctx.fillStyle = C.tabBg;
    ctx.fillRect(0, y, L.W, h);
    ctx.fillStyle = C.titleBorder;
    ctx.fillRect(0, y + h - 1, L.W, 1);

    // Measure tab width
    ctx.font = `${L.tabFont}px ${config.uiFont}`;
    const tw = ctx.measureText(state.fileName).width;
    const tabW = Math.min(L.W * 0.55, tw + L.tabPadX * 2 + 30 * L.s);

    // Active tab
    ctx.fillStyle = C.tabActive;
    ctx.fillRect(0, y, tabW, h);

    // Accent
    ctx.fillStyle = C.tabAccent;
    ctx.fillRect(0, y + h - L.tabAccent - 1, tabW, L.tabAccent);

    // Right border
    ctx.fillStyle = C.titleBorder;
    ctx.fillRect(tabW, y, 1, h);

    // Filename
    ctx.font = `${L.tabFont}px ${config.uiFont}`;
    ctx.fillStyle = C.white;
    ctx.textBaseline = 'middle';
    ctx.fillText(state.fileName, L.tabPadX, y + h / 2);

    // Close ×
    ctx.fillStyle = C.muted;
    ctx.fillText('×', tabW - L.tabPadX, y + h / 2);
  }

  // ============================================================
  //  DRAW — CODE AREA
  // ============================================================

  function drawCode() {
    if (!state.parsedData) return;
    const lines = state.parsedData.lines;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, L.codeAreaY, L.W, L.codeAreaH);
    ctx.clip();

    let visRow = 0;

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      const rows = Math.max(1, Math.ceil(Math.max(1, line.charCount) / maxCharsPerRow));

      // Skip above viewport
      if (visRow + rows <= smoothScroll - 1) { visRow += rows; continue; }

      // Below viewport
      const firstOff = visRow - smoothScroll;
      if (firstOff >= visibleRows + 2) break;

      // Chars to show
      let show;
      if (li < state.currentLine)      show = line.charCount;
      else if (li === state.currentLine) show = state.currentChar;
      else break;

      // Current line highlight
      if (li === state.currentLine) {
        const curRow = Math.floor(state.currentChar / maxCharsPerRow);
        const hlOff = firstOff + curRow;
        if (hlOff >= -1 && hlOff < visibleRows + 1) {
          const hlY = L.codeAreaY + L.codePadTop + hlOff * L.lineH;
          ctx.fillStyle = C.currentLine;
          ctx.fillRect(0, hlY, L.W, L.lineH);
        }
      }

      // Line number
      if (firstOff >= -1 && firstOff < visibleRows + 1) {
        const lnY = L.codeAreaY + L.codePadTop + firstOff * L.lineH + L.lineH / 2;
        ctx.fillStyle = (li === state.currentLine) ? C.lineNumActive : C.lineNum;
        ctx.textAlign = 'right';
        ctx.font = `${L.fontSize}px ${config.fontFamily}`;
        ctx.textBaseline = 'middle';
        ctx.fillText(String(li + 1), L.lineNumW - L.lineNumPadR, lnY);
        ctx.textAlign = 'left';
      }

      // Tokens
      renderTokens(line.tokens, show, visRow);

      // Cursor
      if (li === state.currentLine) drawCursor(show, visRow);

      visRow += rows;
    }

    ctx.restore();
  }

  function renderTokens(tokens, maxChars, startRow) {
    if (maxChars <= 0) return;

    let drawn = 0, x = L.codeX, row = 0;
    const stack = [C.text];

    ctx.font = `${L.fontSize}px ${config.fontFamily}`;
    ctx.textBaseline = 'middle';

    for (let i = 0; i < tokens.length && drawn < maxChars; i++) {
      const tk = tokens[i];

      if (tk.type === 'open') {
        const cls = hljsClass(tk.value);
        stack.push(cls ? (syntaxColorMap[cls] || C.text) : C.text);
      } else if (tk.type === 'close') {
        if (stack.length > 1) stack.pop();
      } else if (tk.type === 'text') {
        if (drawn >= maxChars) break;
        const off = startRow + row - smoothScroll;

        if (off >= -1 && off < visibleRows + 2) {
          const y = L.codeAreaY + L.codePadTop + off * L.lineH + L.lineH / 2;
          const isComm = stack.includes(C.comment);

          if (isComm) ctx.font = `italic ${L.fontSize}px ${config.fontFamily}`;
          ctx.fillStyle = stack[stack.length - 1];
          ctx.fillText(tk.char, x, y);
          if (isComm) ctx.font = `${L.fontSize}px ${config.fontFamily}`;
        }

        x += charW;
        drawn++;

        if (x + charW > L.W - L.codePadR) { x = L.codeX; row++; }
      }
    }
  }

  function drawCursor(chars, startRow) {
    const row = Math.floor(chars / maxCharsPerRow);
    const col = chars % maxCharsPerRow;
    const off = startRow + row - smoothScroll;

    if (off < -1 || off >= visibleRows + 1) return;

    const blink = typingDone ? (Math.floor(performance.now() / 530) % 2 === 0) : true;
    if (!blink) return;

    const x = L.codeX + col * charW;
    const y = L.codeAreaY + L.codePadTop + off * L.lineH;
    const cw = Math.max(2, r(2.2 * L.s));
    const ch = L.lineH - r(4 * L.s);

    ctx.fillStyle = C.cursor;
    ctx.fillRect(x, y + r(2 * L.s), cw, ch);
  }

  // ============================================================
  //  DRAW — SCROLLBAR
  // ============================================================

  function drawScrollbar() {
    if (!state.parsedData) return;

    // Count revealed visual rows
    let revRows = 0;
    const lines = state.parsedData.lines;
    for (let i = 0; i <= state.currentLine && i < lines.length; i++) {
      revRows += Math.max(1, Math.ceil(Math.max(1, lines[i].charCount) / maxCharsPerRow));
    }

    if (revRows <= visibleRows) return;

    const tX = L.W - L.sbW;
    const tY = L.codeAreaY;
    const tH = L.codeAreaH;

    // Track
    ctx.fillStyle = C.scrollTrack;
    ctx.fillRect(tX, tY, L.sbW, tH);

    // Thumb
    const ratio = visibleRows / revRows;
    const thumbH = Math.max(L.sbMinThumb, tH * ratio);
    const maxSc = revRows - visibleRows;
    const pos = maxSc > 0 ? smoothScroll / maxSc : 0;
    const thumbY = tY + pos * (tH - thumbH);

    ctx.fillStyle = C.scrollThumb;
    rrect(tX + L.sbPad, thumbY, L.sbW - L.sbPad * 2, thumbH,
      (L.sbW - L.sbPad * 2) / 2);
    ctx.fill();
  }

  // ============================================================
  //  DRAW — STATUS BAR
  // ============================================================

  function drawStatusBar() {
    const y = L.statusY, h = L.statusH;

    ctx.fillStyle = C.statusBg;
    ctx.fillRect(0, y, L.W, h);
    ctx.fillStyle = C.statusBorder;
    ctx.fillRect(0, y, L.W, 1);

    const mid = y + h / 2;
    ctx.font = `${L.statusFont}px ${config.uiFont}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C.muted;

    // Left
    ctx.textAlign = 'left';
    ctx.fillText(state.language, L.statusPadX, mid);

    const utf8X = L.statusPadX + ctx.measureText(state.language).width + 20 * L.s;
    ctx.fillText('UTF-8', utf8X, mid);

    // Right
    ctx.textAlign = 'right';
    const pos = `Ln ${state.currentLine + 1}, Col ${state.currentChar + 1}`;
    ctx.fillText(pos, L.W - L.statusPadX, mid);

    const spX = L.W - L.statusPadX - ctx.measureText(pos).width - 24 * L.s;
    ctx.fillText('Spaces: 4', spX, mid);

    ctx.textAlign = 'left';
  }

  // ============================================================
  //  HELPERS
  // ============================================================

  function rrect(x, y, w, h, rad) {
    rad = Math.min(rad, w / 2, h / 2);
    if (rad < 0) rad = 0;
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.arcTo(x + w, y, x + w, y + rad, rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
    ctx.lineTo(x + rad, y + h);
    ctx.arcTo(x, y + h, x, y + h - rad, rad);
    ctx.lineTo(x, y + rad);
    ctx.arcTo(x, y, x + rad, y, rad);
    ctx.closePath();
  }

  function hljsClass(tag) {
    const m = tag.match(/class="([^"]+)"/);
    if (!m) return null;
    for (const c of m[1].split(/\s+/)) {
      if (c.startsWith('hljs-')) return c.substring(5);
    }
    return null;
  }

  function getBestMime() {
    const types = [
      'video/webm;codecs=vp9', 'video/webm;codecs=vp8',
      'video/webm', 'video/mp4',
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return null;
  }

  function isSupported() {
    return !!(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream);
  }

  function getCanvas() { return canvas; }

  // ============================================================
  //  PUBLIC API
  // ============================================================

  return {
    init, setParsedData, setMeta, updateState, setComplete,
    startRecording, stopRecording, isRecording, isSupported, getCanvas,
  };

})();