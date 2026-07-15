/* =============================================
   THEMES.JS — Theme engine for UI + Canvas
   ============================================= */

const ThemeEngine = (function () {

    const THEMES = {
        'tokyo-night': {
            label: 'Tokyo Night 🌙',
            editorBg:     '#1a1b26',
            editorBar:    '#16161e',
            editorBorder: '#101014',
            text:         '#a9b1d6',
            cursor:       '#c0caf5',
            lineNum:      '#363b54',
            lineNumActive:'#c0caf5',
            currentLine:  'rgba(255,255,255,0.04)',
            scrollThumb:  'rgba(255,255,255,0.10)',
            tabAccent:    '#58a6ff',
            muted:        '#484f58',
            white:        '#e6edf3',
            dotRed:       '#f85149',
            dotYellow:    '#d29922',
            dotGreen:     '#3fb950',
            scrollTrack:  'rgba(255,255,255,0.02)',
            syntax: {
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
                tag:        '#f7768e',
                operator:   '#89ddff',
                property:   '#73daca',
                punctuation:'#89ddff',
                variable:   '#c0caf5',
                regexp:     '#b4f9f8',
                symbol:     '#bb9af7',
                subst:      '#c0caf5',
            }
        },

        'dracula': {
            label: 'Dracula 🧛',
            editorBg:     '#282a36',
            editorBar:    '#21222c',
            editorBorder: '#191a21',
            text:         '#f8f8f2',
            cursor:       '#f8f8f0',
            lineNum:      '#6272a4',
            lineNumActive:'#f8f8f2',
            currentLine:  'rgba(255,255,255,0.05)',
            scrollThumb:  'rgba(255,255,255,0.12)',
            tabAccent:    '#bd93f9',
            muted:        '#6272a4',
            white:        '#f8f8f2',
            dotRed:       '#ff5555',
            dotYellow:    '#f1fa8c',
            dotGreen:     '#50fa7b',
            scrollTrack:  'rgba(255,255,255,0.02)',
            syntax: {
                keyword:    '#ff79c6',
                string:     '#f1fa8c',
                number:     '#bd93f9',
                comment:    '#6272a4',
                func:       '#50fa7b',
                title:      '#50fa7b',
                built_in:   '#8be9fd',
                literal:    '#bd93f9',
                type:       '#8be9fd',
                params:     '#ffb86c',
                meta:       '#ff79c6',
                attr:       '#50fa7b',
                attribute:  '#ff79c6',
                tag:        '#ff79c6',
                operator:   '#ff79c6',
                property:   '#66d9e8',
                punctuation:'#f8f8f2',
                variable:   '#f8f8f2',
                regexp:     '#f1fa8c',
                symbol:     '#bd93f9',
                subst:      '#f8f8f2',
            }
        },

        'github-dark': {
            label: 'GitHub Dark 🐙',
            editorBg:     '#0d1117',
            editorBar:    '#010409',
            editorBorder: '#21262d',
            text:         '#e6edf3',
            cursor:       '#e6edf3',
            lineNum:      '#484f58',
            lineNumActive:'#e6edf3',
            currentLine:  'rgba(255,255,255,0.03)',
            scrollThumb:  'rgba(255,255,255,0.08)',
            tabAccent:    '#58a6ff',
            muted:        '#484f58',
            white:        '#e6edf3',
            dotRed:       '#f85149',
            dotYellow:    '#d29922',
            dotGreen:     '#3fb950',
            scrollTrack:  'rgba(255,255,255,0.02)',
            syntax: {
                keyword:    '#ff7b72',
                string:     '#a5d6ff',
                number:     '#79c0ff',
                comment:    '#8b949e',
                func:       '#d2a8ff',
                title:      '#d2a8ff',
                built_in:   '#ffa657',
                literal:    '#79c0ff',
                type:       '#79c0ff',
                params:     '#e6edf3',
                meta:       '#79c0ff',
                attr:       '#79c0ff',
                attribute:  '#ff7b72',
                tag:        '#7ee787',
                operator:   '#ff7b72',
                property:   '#79c0ff',
                punctuation:'#e6edf3',
                variable:   '#ffa657',
                regexp:     '#a5d6ff',
                symbol:     '#79c0ff',
                subst:      '#e6edf3',
            }
        },

        'monokai': {
            label: 'Monokai 🎨',
            editorBg:     '#272822',
            editorBar:    '#1e1f1c',
            editorBorder: '#141411',
            text:         '#f8f8f2',
            cursor:       '#f8f8f0',
            lineNum:      '#75715e',
            lineNumActive:'#f8f8f2',
            currentLine:  'rgba(255,255,255,0.04)',
            scrollThumb:  'rgba(255,255,255,0.10)',
            tabAccent:    '#a6e22e',
            muted:        '#75715e',
            white:        '#f8f8f2',
            dotRed:       '#f92672',
            dotYellow:    '#e6db74',
            dotGreen:     '#a6e22e',
            scrollTrack:  'rgba(255,255,255,0.02)',
            syntax: {
                keyword:    '#f92672',
                string:     '#e6db74',
                number:     '#ae81ff',
                comment:    '#75715e',
                func:       '#a6e22e',
                title:      '#a6e22e',
                built_in:   '#66d9e8',
                literal:    '#ae81ff',
                type:       '#66d9e8',
                params:     '#fd971f',
                meta:       '#f92672',
                attr:       '#a6e22e',
                attribute:  '#f92672',
                tag:        '#f92672',
                operator:   '#f92672',
                property:   '#66d9e8',
                punctuation:'#f8f8f2',
                variable:   '#f8f8f2',
                regexp:     '#e6db74',
                symbol:     '#ae81ff',
                subst:      '#f8f8f2',
            }
        },

        'nord': {
            label: 'Nord ❄️',
            editorBg:     '#2e3440',
            editorBar:    '#242933',
            editorBorder: '#1a1e27',
            text:         '#d8dee9',
            cursor:       '#eceff4',
            lineNum:      '#4c566a',
            lineNumActive:'#d8dee9',
            currentLine:  'rgba(255,255,255,0.04)',
            scrollThumb:  'rgba(255,255,255,0.10)',
            tabAccent:    '#88c0d0',
            muted:        '#4c566a',
            white:        '#eceff4',
            dotRed:       '#bf616a',
            dotYellow:    '#ebcb8b',
            dotGreen:     '#a3be8c',
            scrollTrack:  'rgba(255,255,255,0.02)',
            syntax: {
                keyword:    '#81a1c1',
                string:     '#a3be8c',
                number:     '#b48ead',
                comment:    '#4c566a',
                func:       '#88c0d0',
                title:      '#8fbcbb',
                built_in:   '#81a1c1',
                literal:    '#b48ead',
                type:       '#8fbcbb',
                params:     '#d8dee9',
                meta:       '#5e81ac',
                attr:       '#8fbcbb',
                attribute:  '#81a1c1',
                tag:        '#81a1c1',
                operator:   '#81a1c1',
                property:   '#88c0d0',
                punctuation:'#d8dee9',
                variable:   '#d8dee9',
                regexp:     '#ebcb8b',
                symbol:     '#b48ead',
                subst:      '#d8dee9',
            }
        },

        'solarized-dark': {
            label: 'Solarized Dark ☀️',
            editorBg:     '#002b36',
            editorBar:    '#00212b',
            editorBorder: '#001a22',
            text:         '#839496',
            cursor:       '#93a1a1',
            lineNum:      '#586e75',
            lineNumActive:'#93a1a1',
            currentLine:  'rgba(255,255,255,0.04)',
            scrollThumb:  'rgba(255,255,255,0.10)',
            tabAccent:    '#268bd2',
            muted:        '#586e75',
            white:        '#93a1a1',
            dotRed:       '#dc322f',
            dotYellow:    '#b58900',
            dotGreen:     '#859900',
            scrollTrack:  'rgba(255,255,255,0.02)',
            syntax: {
                keyword:    '#859900',
                string:     '#2aa198',
                number:     '#d33682',
                comment:    '#586e75',
                func:       '#268bd2',
                title:      '#268bd2',
                built_in:   '#b58900',
                literal:    '#d33682',
                type:       '#2aa198',
                params:     '#cb4b16',
                meta:       '#cb4b16',
                attr:       '#268bd2',
                attribute:  '#859900',
                tag:        '#268bd2',
                operator:   '#859900',
                property:   '#2aa198',
                punctuation:'#839496',
                variable:   '#839496',
                regexp:     '#2aa198',
                symbol:     '#cb4b16',
                subst:      '#839496',
            }
        },

        'one-dark': {
            label: 'One Dark Pro 🌑',
            editorBg:     '#282c34',
            editorBar:    '#21252b',
            editorBorder: '#181a1f',
            text:         '#abb2bf',
            cursor:       '#528bff',
            lineNum:      '#495162',
            lineNumActive:'#abb2bf',
            currentLine:  'rgba(255,255,255,0.04)',
            scrollThumb:  'rgba(255,255,255,0.10)',
            tabAccent:    '#61afef',
            muted:        '#5c6370',
            white:        '#e6edf3',
            dotRed:       '#e06c75',
            dotYellow:    '#e5c07b',
            dotGreen:     '#98c379',
            scrollTrack:  'rgba(255,255,255,0.02)',
            syntax: {
                keyword:    '#c678dd',
                string:     '#98c379',
                number:     '#d19a66',
                comment:    '#5c6370',
                func:       '#61afef',
                title:      '#61afef',
                built_in:   '#e5c07b',
                literal:    '#d19a66',
                type:       '#e5c07b',
                params:     '#e06c75',
                meta:       '#c678dd',
                attr:       '#61afef',
                attribute:  '#c678dd',
                tag:        '#e06c75',
                operator:   '#abb2bf',
                property:   '#e06c75',
                punctuation:'#abb2bf',
                variable:   '#e06c75',
                regexp:     '#98c379',
                symbol:     '#d19a66',
                subst:      '#abb2bf',
            }
        },

        'catppuccin': {
            label: 'Catppuccin Mocha 🐱',
            editorBg:     '#1e1e2e',
            editorBar:    '#181825',
            editorBorder: '#11111b',
            text:         '#cdd6f4',
            cursor:       '#f5e0dc',
            lineNum:      '#45475a',
            lineNumActive:'#cdd6f4',
            currentLine:  'rgba(255,255,255,0.04)',
            scrollThumb:  'rgba(255,255,255,0.10)',
            tabAccent:    '#89b4fa',
            muted:        '#6c7086',
            white:        '#cdd6f4',
            dotRed:       '#f38ba8',
            dotYellow:    '#f9e2af',
            dotGreen:     '#a6e3a1',
            scrollTrack:  'rgba(255,255,255,0.02)',
            syntax: {
                keyword:    '#cba6f7',
                string:     '#a6e3a1',
                number:     '#fab387',
                comment:    '#6c7086',
                func:       '#89b4fa',
                title:      '#89dceb',
                built_in:   '#f9e2af',
                literal:    '#fab387',
                type:       '#89dceb',
                params:     '#cdd6f4',
                meta:       '#89dceb',
                attr:       '#89b4fa',
                attribute:  '#cba6f7',
                tag:        '#f38ba8',
                operator:   '#89dceb',
                property:   '#94e2d5',
                punctuation:'#cdd6f4',
                variable:   '#cdd6f4',
                regexp:     '#a6e3a1',
                symbol:     '#cba6f7',
                subst:      '#cdd6f4',
            }
        }
    };

    let currentTheme = 'tokyo-night';

    /**
     * Apply theme to DOM (via data-theme attribute on editorWindow)
     */
    function apply(themeId, editorWindow) {
        if (!THEMES[themeId]) {
            console.warn(`Theme "${themeId}" not found`);
            return;
        }
        currentTheme = themeId;

        if (editorWindow) {
            // Remove all existing theme attrs
            editorWindow.removeAttribute('data-theme');
            editorWindow.setAttribute('data-theme', themeId);
        }

        // Apply to document root for any global overrides
        document.documentElement.setAttribute('data-theme', themeId);
    }

    /**
     * Get canvas color object for recorder
     */
    function getCanvasColors(themeId) {
        const t = THEMES[themeId || currentTheme];
        if (!t) return getCanvasColors('tokyo-night');

        return {
            editorBg:      t.editorBg,
            titleBar:      t.editorBar,
            titleBorder:   t.editorBorder,
            tabBg:         t.editorBar,
            tabActive:     t.editorBg,
            tabAccent:     t.tabAccent,
            statusBg:      t.editorBar,
            statusBorder:  t.editorBorder,
            lineNum:       t.lineNum,
            lineNumActive: t.lineNumActive,
            text:          t.text,
            cursor:        t.cursor,
            currentLine:   t.currentLine,
            dotRed:        t.dotRed,
            dotYellow:     t.dotYellow,
            dotGreen:      t.dotGreen,
            muted:         t.muted,
            white:         t.white,
            scrollTrack:   t.scrollTrack,
            scrollThumb:   t.scrollThumb,
            ...t.syntax,
        };
    }

    function getAll() {
        return THEMES;
    }

    function getCurrent() {
        return currentTheme;
    }

    function getTheme(id) {
        return THEMES[id] || null;
    }

    /**
     * Populate a <select> element with all themes
     */
    function populateSelect(selectEl) {
        selectEl.innerHTML = '';
        Object.entries(THEMES).forEach(([id, theme]) => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = theme.label;
            selectEl.appendChild(opt);
        });
        selectEl.value = currentTheme;
    }

    return {
        apply,
        getCanvasColors,
        getAll,
        getCurrent,
        getTheme,
        populateSelect
    };

})();