/* =============================================
   HIGHLIGHT-PARSER.JS
   Takes raw code + language → produces tokenized
   lines with balanced HTML tags for progressive
   character-by-character reveal.
   ============================================= */

const HighlightParser = (function () {

    /**
     * Highlight entire code with highlight.js, then parse
     * the resulting HTML into structured tokens per line.
     *
     * @param {string} rawCode - The original code string
     * @param {string} language - Language identifier (e.g., 'javascript')
     * @returns {object} { lines: [], totalChars: number }
     *   Each line = { tokens: [], charCount: number }
     *   Each token = { type: 'text'|'open'|'close', value: string, char?: string }
     */
    function parse(rawCode, language) {
        // Step 1: Highlight the code
        let highlightedHTML;
        try {
            const result = hljs.highlight(rawCode, { language: language });
            highlightedHTML = result.value;
        } catch (e) {
            // Fallback: just escape HTML
            highlightedHTML = escapeHtml(rawCode);
        }

        // Step 2: Tokenize the HTML string
        const tokens = tokenizeHTML(highlightedHTML);

        // Step 3: Split tokens into lines, balancing open/close tags
        const lines = splitIntoLines(tokens);

        // Step 4: Count total visible characters
        let totalChars = 0;
        lines.forEach(line => {
            totalChars += line.charCount;
        });
        // Add newline chars (one per line break, except last)
        totalChars += Math.max(0, lines.length - 1);

        return { lines, totalChars };
    }

    /**
     * Tokenize an HTML string into a flat array of tokens:
     *  - { type: 'open', value: '<span class="hljs-keyword">' }
     *  - { type: 'close', value: '</span>' }
     *  - { type: 'text', char: 'a' }  (one per visible character)
     *  - { type: 'newline' }
     */
    function tokenizeHTML(html) {
        const tokens = [];
        let i = 0;

        while (i < html.length) {
            if (html[i] === '<') {
                // Find closing >
                const closeIdx = html.indexOf('>', i);
                if (closeIdx === -1) {
                    // Malformed, treat rest as text
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
                // HTML entity (e.g., &amp; &lt; &gt; &quot;)
                const semiIdx = html.indexOf(';', i);
                if (semiIdx !== -1 && semiIdx - i < 10) {
                    const entity = html.substring(i, semiIdx + 1);
                    const decoded = decodeEntity(entity);
                    if (decoded === '\n') {
                        tokens.push({ type: 'newline' });
                    } else {
                        tokens.push({ type: 'text', char: decoded, raw: entity });
                    }
                    i = semiIdx + 1;
                } else {
                    tokens.push({ type: 'text', char: '&', raw: '&' });
                    i++;
                }
            } else if (html[i] === '\n') {
                tokens.push({ type: 'newline' });
                i++;
            } else {
                tokens.push({ type: 'text', char: html[i], raw: html[i] });
                i++;
            }
        }

        return tokens;
    }

    /**
     * Push individual text characters as tokens
     */
    function pushTextChars(tokens, text) {
        for (let c of text) {
            if (c === '\n') {
                tokens.push({ type: 'newline' });
            } else {
                tokens.push({ type: 'text', char: c, raw: escapeChar(c) });
            }
        }
    }

    /**
     * Split flat token array into lines, ensuring each line
     * has balanced tags (re-open unclosed spans on new lines).
     */
    function splitIntoLines(tokens) {
        const lines = [];
        let currentLineTokens = [];
        let currentCharCount = 0;
        let openTagStack = []; // Stack of currently open tags

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.type === 'newline') {
                // Close all open tags for this line
                const closeTags = [];
                for (let j = openTagStack.length - 1; j >= 0; j--) {
                    closeTags.push({ type: 'close', value: '</span>' });
                }
                const lineTokensComplete = [...currentLineTokens, ...closeTags];

                lines.push({
                    tokens: lineTokensComplete,
                    charCount: currentCharCount
                });

                // Start new line — re-open all tags from stack
                currentLineTokens = [];
                currentCharCount = 0;
                for (let j = 0; j < openTagStack.length; j++) {
                    currentLineTokens.push({ type: 'open', value: openTagStack[j] });
                }

            } else if (token.type === 'open') {
                openTagStack.push(token.value);
                currentLineTokens.push(token);

            } else if (token.type === 'close') {
                openTagStack.pop();
                currentLineTokens.push(token);

            } else if (token.type === 'text') {
                currentLineTokens.push(token);
                currentCharCount++;
            }
        }

        // Don't forget last line
        if (currentLineTokens.length > 0 || lines.length === 0) {
            // Close remaining open tags
            const closeTags = [];
            for (let j = openTagStack.length - 1; j >= 0; j--) {
                closeTags.push({ type: 'close', value: '</span>' });
            }
            lines.push({
                tokens: [...currentLineTokens, ...closeTags],
                charCount: currentCharCount
            });
        }

        return lines;
    }

    /**
     * Build HTML string showing only the first N visible characters
     * of a line's tokens.
     */
    function buildPartialLine(lineTokens, visibleCount) {
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
                }
            }
        }

        // Close any remaining open tags
        for (let j = 0; j < openTags; j++) {
            html += '</span>';
        }

        return html;
    }

    /**
     * Build complete line HTML (all characters visible)
     */
    function buildFullLine(lineTokens) {
        let html = '';
        for (const token of lineTokens) {
            if (token.type === 'text') {
                html += token.raw || escapeChar(token.char);
            } else {
                html += token.value;
            }
        }
        return html;
    }

    // --- Utilities ---

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function escapeChar(c) {
        switch (c) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            default: return c;
        }
    }

    function decodeEntity(entity) {
        const map = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&apos;': "'",
            '&#x27;': "'",
            '&nbsp;': ' '
        };
        return map[entity] || entity;
    }

    // --- Public API ---
    return {
        parse,
        buildPartialLine,
        buildFullLine
    };

})();