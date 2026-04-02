/* =============================================
   TYPING-ENGINE.JS
   The core animation loop — reveals code
   character by character with humanized timing.
   ============================================= */

const TypingEngine = (function() {
  
  // State
  let parsedData = null; // { lines: [], totalChars }
  let currentLine = 0; // 0-indexed
  let currentChar = 0; // chars revealed on current line
  let totalRevealed = 0; // total chars + newlines revealed
  let isRunning = false;
  let isPaused = false;
  let animationTimer = null;
  
  // Settings
  let speed = 40; // chars per second
  let newlineDelay = 300; // ms extra pause at newlines
  let humanize = true; // random delay variation
  let soundEnabled = false;
  
  // Callbacks
  let onTick = null; // called each char: (line, col, totalRevealed, totalChars)
  let onLineComplete = null; // called when a line is done: (lineIndex)
  let onComplete = null; // called when all done
  let onStart = null; // called on start
  
  // Audio
  let audioCtx = null;
  
  /**
   * Configure the engine
   */
  function configure(options) {
    if (options.speed !== undefined) speed = options.speed;
    if (options.newlineDelay !== undefined) newlineDelay = options.newlineDelay;
    if (options.humanize !== undefined) humanize = options.humanize;
    if (options.soundEnabled !== undefined) soundEnabled = options.soundEnabled;
    if (options.onTick) onTick = options.onTick;
    if (options.onLineComplete) onLineComplete = options.onLineComplete;
    if (options.onComplete) onComplete = options.onComplete;
    if (options.onStart) onStart = options.onStart;
  }
  
  /**
   * Load parsed data and reset state
   */
  function load(data) {
    parsedData = data;
    currentLine = 0;
    currentChar = 0;
    totalRevealed = 0;
    isRunning = false;
    isPaused = false;
  }
  
  /**
   * Start or resume the animation
   */
  function play() {
    if (!parsedData || parsedData.lines.length === 0) return;
    
    if (isPaused) {
      isPaused = false;
      isRunning = true;
      scheduleNext();
      return;
    }
    
    if (isRunning) return;
    
    isRunning = true;
    isPaused = false;
    
    if (onStart) onStart();
    
    scheduleNext();
  }
  
  /**
   * Pause the animation
   */
  function pause() {
    if (!isRunning) return;
    isPaused = true;
    isRunning = false;
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
  }
  
  /**
   * Stop and reset
   */
  function stop() {
    isRunning = false;
    isPaused = false;
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
    currentLine = 0;
    currentChar = 0;
    totalRevealed = 0;
  }
  
  /**
   * Check states
   */
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
  
  /**
   * Schedule the next character reveal
   */
  function scheduleNext() {
    if (!isRunning || isPaused) return;
    
    const delay = calculateDelay();
    
    animationTimer = setTimeout(() => {
      revealNext();
    }, delay);
  }
  
  /**
   * Calculate delay for next character
   */
  function calculateDelay() {
    let baseDelay = 1000 / speed;
    
    if (humanize) {
      // Add random variation: ±40%
      const variation = baseDelay * 0.4;
      baseDelay += (Math.random() * variation * 2) - variation;
      
      // Occasional micro-pause (simulates thinking)
      if (Math.random() < 0.03) {
        baseDelay += 150 + Math.random() * 200;
      }
    }
    
    return Math.max(5, baseDelay);
  }
  
  /**
   * Reveal the next character
   */
  function revealNext() {
    if (!isRunning || isPaused || !parsedData) return;
    
    const lines = parsedData.lines;
    
    // Safety check
    if (currentLine >= lines.length) {
      finish();
      return;
    }
    
    const line = lines[currentLine];
    
    if (currentChar < line.charCount) {
      // Reveal next char on current line
      currentChar++;
      totalRevealed++;
      
      // Play sound
      if (soundEnabled) playKeySound();
      
      // Callback
      if (onTick) {
        onTick(currentLine, currentChar, totalRevealed, parsedData.totalChars);
      }
      
      scheduleNext();
      
    } else {
      // Line complete
      if (onLineComplete) {
        onLineComplete(currentLine);
      }
      
      // Move to next line
      currentLine++;
      currentChar = 0;
      totalRevealed++; // count the newline
      
      if (currentLine >= lines.length) {
        finish();
        return;
      }
      
      // Add newline delay
      if (newlineDelay > 0) {
        let nlDelay = newlineDelay;
        if (humanize) {
          nlDelay += (Math.random() * newlineDelay * 0.5) - (newlineDelay * 0.25);
        }
        
        animationTimer = setTimeout(() => {
          // Callback for the new line start (0 chars)
          if (onTick) {
            onTick(currentLine, 0, totalRevealed, parsedData.totalChars);
          }
          scheduleNext();
        }, Math.max(0, nlDelay));
      } else {
        if (onTick) {
          onTick(currentLine, 0, totalRevealed, parsedData.totalChars);
        }
        scheduleNext();
      }
    }
  }
  
  /**
   * Animation complete
   */
  function finish() {
    isRunning = false;
    isPaused = false;
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
    if (onComplete) onComplete();
  }
  
  /**
   * Play a tiny keyboard click sound using Web Audio API
   */
  function playKeySound() {
    try {
      if (!audioCtx) {
        audioCtx = new(window.AudioContext || window.webkitAudioContext)();
      }
      
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      // Randomize slightly for realism
      const baseFreq = 800 + Math.random() * 600;
      oscillator.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
      // Silently fail — audio not critical
    }
  }
  
  // --- Public API ---
  return {
    configure,
    load,
    play,
    pause,
    stop,
    getState
  };
  
})();