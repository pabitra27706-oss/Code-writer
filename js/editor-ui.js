/* =============================================
   EDITOR-UI.JS
   Manages the visual editor DOM: lines, cursor,
   scrolling, height growth, fullscreen, etc.
   ============================================= */

const EditorUI = (function () {

    // DOM references
    let editorBody = null;
    let codeArea = null;
    let statusPosition = null;
    let statusLanguage = null;
    let tabName = null;
    let tabIcon = null;
    let editorWindow = null;

    // State
    let currentLineCount = 0;
    let initialMaxHeight = '50vh';
    let growthStep = 24; // px per line

    // File icons by extension
    const fileIcons = {
        'js': '📜', 'ts': '💠', 'py': '🐍', 'java': '☕',
        'cpp': '⚙️', 'c': '⚙️', 'cs': '🟪', 'html': '🌐',
        'css': '🎨', 'php': '🐘', 'rb': '💎', 'go': '🔷',
        'rs': '🦀', 'swift': '🧡', 'kt': '🟣', 'dart': '🎯',
        'sql': '🗄️', 'sh': '🖥️', 'json': '📋', 'xml': '📰',
        'yml': '📄', 'yaml': '📄', 'md': '📝'
    };

    // Language display names
    const languageNames = {
        'javascript': 'JavaScript', 'python': 'Python', 'java': 'Java',
        'cpp': 'C++', 'c': 'C', 'csharp': 'C#', 'typescript': 'TypeScript',
        'html': 'HTML', 'css': 'CSS', 'php': 'PHP', 'ruby': 'Ruby',
        'go': 'Go', 'rust': 'Rust', 'swift': 'Swift', 'kotlin': 'Kotlin',
        'dart': 'Dart', 'sql': 'SQL', 'bash': 'Bash', 'json': 'JSON',
        'xml': 'XML', 'yaml': 'YAML', 'markdown': 'Markdown'
    };

    /**
     * Initialize - cache DOM elements
     */
    function init() {
        editorBody = document.getElementById('editorBody');
        codeArea = document.getElementById('codeArea');
        statusPosition = document.getElementById('statusPosition');
        statusLanguage = document.getElementById('statusLanguage');
        tabName = document.getElementById('tabName');
        tabIcon = document.getElementById('tabIcon');
        editorWindow = document.getElementById('editorWindow');
    }

    /**
     * Reset editor to blank state with cursor on line 1
     */
    function reset() {
        codeArea.innerHTML = '';
        currentLineCount = 0;
        addLine(1);
        updateCursor(1, 1);
        updateEditorHeight();
        editorBody.scrollTop = 0;
    }

    /**
     * Add a new line to the editor
     */
    function addLine(lineNumber) {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'code-line';
        lineDiv.setAttribute('data-line', lineNumber);

        const numSpan = document.createElement('span');
        numSpan.className = 'line-number';
        numSpan.textContent = lineNumber;

        const contentSpan = document.createElement('span');
        contentSpan.className = 'line-content';

        lineDiv.appendChild(numSpan);
        lineDiv.appendChild(contentSpan);
        codeArea.appendChild(lineDiv);

        currentLineCount = lineNumber;
        return contentSpan;
    }

    /**
     * Get the line-content element for a given line number
     */
    function getLineContent(lineNumber) {
        const lineDivs = codeArea.querySelectorAll('.code-line');
        if (lineNumber <= lineDivs.length) {
            return lineDivs[lineNumber - 1].querySelector('.line-content');
        }
        return null;
    }

    /**
     * Set HTML content of a specific line (with cursor appended)
     */
    function setLineHTML(lineNumber, html, showCursor) {
        let contentEl = getLineContent(lineNumber);
        if (!contentEl) {
            contentEl = addLine(lineNumber);
        }
        if (showCursor) {
            contentEl.innerHTML = html + '<span class="cursor blink">█</span>';
        } else {
            contentEl.innerHTML = html;
        }
    }

    /**
     * Remove cursor from all lines
     */
    function clearAllCursors() {
        const cursors = codeArea.querySelectorAll('.cursor');
        cursors.forEach(c => c.remove());
    }

    /**
     * Add blinking cursor to a specific line
     */
    function addCursorToLine(lineNumber) {
        clearAllCursors();
        const contentEl = getLineContent(lineNumber);
        if (contentEl) {
            const cursorSpan = document.createElement('span');
            cursorSpan.className = 'cursor blink';
            cursorSpan.textContent = '█';
            contentEl.appendChild(cursorSpan);
        }
    }

    /**
     * Temporarily stop cursor blinking (during fast typing)
     */
    function setCursorSolid() {
        const cursor = codeArea.querySelector('.cursor');
        if (cursor) {
            cursor.classList.remove('blink');
        }
    }

    /**
     * Resume cursor blinking
     */
    function setCursorBlink() {
        const cursor = codeArea.querySelector('.cursor');
        if (cursor) {
            cursor.classList.add('blink');
        }
    }

    /**
     * Update status bar position
     */
    function updateCursor(line, col) {
        if (statusPosition) {
            statusPosition.textContent = `Ln ${line}, Col ${col}`;
        }
    }

    /**
     * Set the language in status bar
     */
    function setLanguage(langId) {
        if (statusLanguage) {
            statusLanguage.textContent = languageNames[langId] || langId;
        }
    }

    /**
     * Set the file tab name and icon
     */
    function setFileName(name) {
        if (tabName) tabName.textContent = name;
        if (tabIcon) {
            const ext = name.split('.').pop().toLowerCase();
            tabIcon.textContent = fileIcons[ext] || '📄';
        }
    }

    /**
     * Auto-scroll editor body to keep cursor visible
     */
    function scrollToBottom() {
        if (editorBody) {
            editorBody.scrollTop = editorBody.scrollHeight;
        }
    }

    /**
     * Smart scroll - only scroll if cursor is near bottom
     */
    function scrollIfNeeded() {
        if (!editorBody) return;
        const threshold = 60;
        const distFromBottom = editorBody.scrollHeight - editorBody.scrollTop - editorBody.clientHeight;
        if (distFromBottom < threshold) {
            editorBody.scrollTop = editorBody.scrollHeight;
        }
    }

    /**
     * Dynamically grow editor height based on content
     * Starts at 50vh, grows up to 90vh, then scrolls
     */
    function updateEditorHeight() {
        if (!editorBody) return;

        const appContainer = document.getElementById('appContainer');
        if (appContainer && appContainer.classList.contains('fullscreen')) {
            return; // Don't adjust in fullscreen
        }

        const contentHeight = codeArea.scrollHeight + 20;
        const minHeight = window.innerHeight * 0.35;
        const maxHeight = window.innerHeight * 0.85;

        const targetHeight = Math.max(minHeight, Math.min(contentHeight, maxHeight));
        editorBody.style.maxHeight = targetHeight + 'px';
    }

    /**
     * Enter fullscreen mode
     */
    function enterFullscreen() {
        const container = document.getElementById('appContainer');
        container.classList.add('fullscreen');

        const exitBtn = document.getElementById('btnExitFullscreen');
        exitBtn.style.display = 'block';

        // Auto-hide exit button after 3 seconds
        clearTimeout(EditorUI._exitBtnTimeout);
        EditorUI._exitBtnTimeout = setTimeout(() => {
            exitBtn.style.opacity = '0.2';
        }, 3000);

        exitBtn.addEventListener('mouseenter', () => {
            exitBtn.style.opacity = '1';
        });
        exitBtn.addEventListener('mouseleave', () => {
            exitBtn.style.opacity = '0.2';
        });
    }

    /**
     * Exit fullscreen mode
     */
    function exitFullscreen() {
        const container = document.getElementById('appContainer');
        container.classList.remove('fullscreen');

        const exitBtn = document.getElementById('btnExitFullscreen');
        exitBtn.style.display = 'none';

        updateEditorHeight();
    }

    /**
     * Check if in fullscreen
     */
    function isFullscreen() {
        const container = document.getElementById('appContainer');
        return container.classList.contains('fullscreen');
    }

    // --- Public API ---
    return {
        init,
        reset,
        addLine,
        getLineContent,
        setLineHTML,
        clearAllCursors,
        addCursorToLine,
        setCursorSolid,
        setCursorBlink,
        updateCursor,
        setLanguage,
        setFileName,
        scrollToBottom,
        scrollIfNeeded,
        updateEditorHeight,
        enterFullscreen,
        exitFullscreen,
        isFullscreen,
        _exitBtnTimeout: null
    };

})();