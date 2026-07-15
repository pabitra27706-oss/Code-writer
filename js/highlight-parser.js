/* =============================================
   HIGHLIGHT-PARSER.JS
   Takes raw code + language → produces tokenized
   lines with balanced HTML tags for progressive
   character-by-character reveal.
   ============================================= */

const HighlightParser = (function () {

    // Language aliases — map our select values to hljs language ids
    const LANG_ALIASES = {
        'javascript': 'javascript',
        'typescript': 'typescript',
        'python':     'python',
        'java':       'java',
        'cpp':        'cpp',
        'c':          'c',
        'csharp':     'csharp',
        'html':       'xml',
        'css':        'css',
        'php':        'php',
        'ruby':       'ruby',
        'go':         'go',
        'rust':       'rust',
        'swift':      'swift',
        'kotlin':     'kotlin',
        'dart':       'dart',
        'sql':        'sql',
        'bash':       'bash',
        'json':       'json',
        'xml':        'xml',
        'yaml':       'yaml',
        'markdown':   'markdown',
        'scss':       'scss',
        'sass':       'scss',
        'less':       'less',
        'graphql':    'graphql',
        'lua':        'lua',
        'perl':       'perl',
        'r':          'r',
        'toml':       'ini',
        'ini':        'ini',
        'powershell': 'powershell',
        'vue':        'xml',
        'svelte':     'xml',
        'plaintext':  'plaintext',
    };

    /**
     * Highlight entire code with highlight.js, then parse
     * the resulting HTML into structured tokens per line.
     *
     * @param {string} rawCode
     * @param {string} language
     * @returns {{ lines: Array, totalChars: number }}
     */
    function parse(rawCode, language) {
        if (!rawCode || typeof rawCode !== 'string') {
            return { lines: [{ tokens: [], charCount: 0 }], totalChars: 0 };
        }

        // Resolve language alias
        const hljsLang = LANG_ALIASES[language] || language;

        // Step 1: Highlight
        let highlightedHTML;
        try {
            // Validate language exists in hljs
            if (hljs.getLanguage(hljsLang)) {
                const result = hljs.highlight(rawCode, { language: hljsLang });
                highlightedHTML = result.value;
            } else {
                // Auto-detect
                const result = hljs.highlightAuto(rawCode);
                highlightedHTML = result.value;
            }
        } catch (e) {
            highlightedHTML = escapeHtml(rawCode);
        }

        // Step 2: Tokenize HTML
        const tokens = tokenizeHTML(highlightedHTML);

        // Step 3: Split into lines (balanced tags)
        const lines = splitIntoLines(tokens);

        // Step 4: Count total visible chars + newlines
        let totalChars = 0;
        lines.forEach(line => { totalChars += line.charCount; });
        totalChars += Math.max(0, lines.length - 1); // newlines between lines

        return { lines, totalChars };
    }

    /**
     * Tokenize HTML string into flat token array
     */
    function tokenizeHTML(html) {
        const tokens = [];
        let i = 0;

        while (i < html.length) {
            if (html[i] === '<') {
                const closeIdx = html.indexOf('>', i);
                if (closeIdx === -1) {
                    pushTextChars(tokens, html.substring(i));
                    break;
                }
                const tag = html.substring(i, closeIdx + 1);
                if (tag.startsWith('</')) {
                    tokens.push({ type: 'close', value: tag });
                } else {
                    tokens.push({ type: 'open', value: tag });
                }
                i = closeIdx + 1;

            } else if (html[i] === '&') {
                // HTML entity
                const semiIdx = html.indexOf(';', i);
                if (semiIdx !== -1 && semiIdx - i <= 12) {
                    const entity = html.substring(i, semiIdx + 1);
                    const decoded = decodeEntity(entity);
                    if (decoded === '\n') {
                        tokens.push({ type: 'newline' });
                    } else {
                        // Store decoded char but raw entity for HTML rebuild
                        tokens.push({ type: 'text', char: decoded, raw: entity });
                    }
                    i = semiIdx + 1;
                } else {
                    tokens.push({ type: 'text', char: '&', raw: '&amp;' });
                    i++;
                }

            } else if (html[i] === '\n') {
                tokens.push({ type: 'newline' });
                i++;

            } else if (html[i] === '\r') {
                // Handle \r\n or bare \r
                if (html[i + 1] === '\n') i++;
                tokens.push({ type: 'newline' });
                i++;

            } else {
                const ch = html[i];
                tokens.push({ type: 'text', char: ch, raw: escapeChar(ch) });
                i++;
            }
        }

        return tokens;
    }

    /**
     * Push individual characters as text tokens
     */
    function pushTextChars(tokens, text) {
        for (const c of text) {
            if (c === '\n') {
                tokens.push({ type: 'newline' });
            } else {
                tokens.push({ type: 'text', char: c, raw: escapeChar(c) });
            }
        }
    }

    /**
     * Split flat token array into per-line arrays
     * Re-opens unclosed spans on each new line
     */
    function splitIntoLines(tokens) {
        const lines = [];
        let currentLineTokens = [];
        let currentCharCount = 0;
        let openTagStack = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.type === 'newline') {
                // Close all open tags for this line
                const closeTags = openTagStack
                    .slice()
                    .reverse()
                    .map(() => ({ type: 'close', value: '</span>' }));

                lines.push({
                    tokens: [...currentLineTokens, ...closeTags],
                    charCount: currentCharCount
                });

                // Start next line — re-open all stacked tags
                currentLineTokens = openTagStack.map(t => ({ type: 'open', value: t }));
                currentCharCount = 0;

            } else if (token.type === 'open') {
                openTagStack.push(token.value);
                currentLineTokens.push(token);

            } else if (token.type === 'close') {
                if (openTagStack.length > 0) openTagStack.pop();
                currentLineTokens.push(token);

            } else if (token.type === 'text') {
                currentLineTokens.push(token);
                currentCharCount++;
            }
        }

        // Last line (no trailing newline)
        if (currentLineTokens.length > 0 || lines.length === 0) {
            const closeTags = openTagStack
                .slice()
                .reverse()
                .map(() => ({ type: 'close', value: '</span>' }));

            lines.push({
                tokens: [...currentLineTokens, ...closeTags],
                charCount: currentCharCount
            });
        }

        return lines;
    }

    /**
     * Build HTML string showing only first N visible characters
     */
    function buildPartialLine(lineTokens, visibleCount) {
        if (visibleCount <= 0) return '';

        let html = '';
        let charsRevealed = 0;
        let openTags = 0;

        for (let i = 0; i < lineTokens.length; i++) {
            const token = lineTokens[i];

            if (token.type === 'open') {
                if (charsRevealed < visibleCount) {
                    html += token.value;
                    openTags++;
                }
            } else if (token.type === 'close') {
                if (openTags > 0 && charsRevealed <= visibleCount) {
                    html += token.value;
                    openTags--;
                }
            } else if (token.type === 'text') {
                if (charsRevealed < visibleCount) {
                    html += token.raw || escapeChar(token.char);
                    charsRevealed++;
                } else {
                    break;
                }
            }
        }

        // Close any unclosed tags
        for (let j = 0; j < openTags; j++) {
            html += '</span>';
        }

        return html;
    }

    /**
     * Build complete line HTML (all chars visible)
     */
    function buildFullLine(lineTokens) {
        let html = '';
        for (const token of lineTokens) {
            if (token.type === 'text') {
                html += token.raw || escapeChar(token.char);
            } else if (token.type === 'open' || token.type === 'close') {
                html += token.value;
            }
        }
        return html;
    }

    /**
     * Get the visible text of a line (no HTML)
     */
    function getLineText(lineTokens) {
        return lineTokens
            .filter(t => t.type === 'text')
            .map(t => t.char)
            .join('');
    }

    /**
     * Get character at position N in a line's tokens
     */
    function getCharAt(lineTokens, index) {
        let count = 0;
        for (const token of lineTokens) {
            if (token.type === 'text') {
                if (count === index) return token.char;
                count++;
            }
        }
        return '';
    }

    // ---- Utilities ----

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function escapeChar(c) {
        switch (c) {
            case '&':  return '&amp;';
            case '<':  return '&lt;';
            case '>':  return '&gt;';
            case '"':  return '&quot;';
            case "'":  return '&#39;';
            default:   return c;
        }
    }

    function decodeEntity(entity) {
        // Named entities
        const named = {
            '&amp;':   '&',
            '&lt;':    '<',
            '&gt;':    '>',
            '&quot;':  '"',
            '&#39;':   "'",
            '&apos;':  "'",
            '&#x27;':  "'",
            '&nbsp;':  ' ',
            '&tab;':   '\t',
            '&newline;':'\n',
            '&lpar;':  '(',
            '&rpar;':  ')',
            '&plus;':  '+',
            '&equals;':'=',
            '&lbrace;':'{',
            '&rbrace;':'}',
            '&lbrack;':'[',
            '&rbrack;':']',
            '&semi;':  ';',
            '&colon;': ':',
            '&comma;': ',',
            '&period;':'.',
            '&excl;':  '!',
            '&quest;': '?',
            '&sol;':   '/',
            '&bsol;':  '\\',
            '&vert;':  '|',
            '&hat;':   '^',
            '&grave;': '`',
            '&tilde;': '~',
            '&num;':   '#',
            '&dollar;':'$',
            '&percnt;':'%',
            '&ast;':   '*',
            '&minus;': '-',
            '&lowbar;':'_',
        };

        if (named[entity]) return named[entity];

        // Decimal numeric: &#65;
        const dec = entity.match(/^&#(\d+);$/);
        if (dec) {
            const code = parseInt(dec[1], 10);
            if (code >= 0 && code <= 0x10FFFF) {
                return String.fromCodePoint(code);
            }
        }

        // Hex numeric: &#x41; or &#X41;
        const hex = entity.match(/^&#[xX]([0-9a-fA-F]+);$/);
        if (hex) {
            const code = parseInt(hex[1], 16);
            if (code >= 0 && code <= 0x10FFFF) {
                return String.fromCodePoint(code);
            }
        }

        // Unknown — return the entity as-is (will show in output)
        return entity;
    }

    // ---- Public API ----
    return {
        parse,
        buildPartialLine,
        buildFullLine,
        getLineText,
        getCharAt,
        // Expose for external use
        escapeHtml,
        decodeEntity,
        LANG_ALIASES
    };

})();