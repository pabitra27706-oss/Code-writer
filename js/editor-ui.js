/* =============================================
   EDITOR-UI.JS
   Manages the visual editor DOM: lines, cursor,
   scrolling, height, themes, minimap, etc.
   ============================================= */

const EditorUI = (function () {

    // ---- DOM references ----
    let editorBody     = null;
    let codeArea       = null;
    let statusPosition = null;
    let statusLanguage = null;
    let statusLines    = null;
    let tabName        = null;
    let tabIcon        = null;
    let editorWindow   = null;
    let minimapEl      = null;
    let minimapCanvas  = null;
    let minimapCtx     = null;

    // ---- State ----
    let currentLineCount   = 0;
    let currentTheme       = 'tokyo-night';
    let currentCursorStyle = 'line';
    let showMinimap        = false;

    // ---- Language display names ----
    const LANGUAGE_NAMES = {
        'javascript': 'JavaScript',
        'typescript': 'TypeScript',
        'python':     'Python',
        'java':       'Java',
        'cpp':        'C++',
        'c':          'C',
        'csharp':     'C#',
        'html':       'HTML',
        'css':        'CSS',
        'php':        'PHP',
        'ruby':       'Ruby',
        'go':         'Go',
        'rust':       'Rust',
        'swift':      'Swift',
        'kotlin':     'Kotlin',
        'dart':       'Dart',
        'sql':        'SQL',
        'bash':       'Bash/Shell',
        'json':       'JSON',
        'xml':        'XML',
        'yaml':       'YAML',
        'markdown':   'Markdown',
        'scss':       'SCSS',
        'sass':       'Sass',
        'less':       'Less',
        'graphql':    'GraphQL',
        'lua':        'Lua',
        'perl':       'Perl',
        'r':          'R',
        'toml':       'TOML',
        'ini':        'INI',
        'powershell': 'PowerShell',
        'vue':        'Vue',
        'svelte':     'Svelte',
        'plaintext':  'Plain Text',
    };

    // ---- File icons by extension (SVG) ----
    const FILE_ICONS = {
        'js': `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="16" fill="#F7DF1E"/><path d="M67.312 213.932l19.59-11.856c3.78 6.701 7.218 12.371 15.465 12.371 7.905 0 12.89-3.092 12.89-15.12v-81.798h24.057v82.138c0 24.917-14.606 36.259-35.916 36.259-19.245 0-30.416-9.967-36.087-21.996m85.07-2.576l19.588-11.341c5.157 8.421 11.859 14.607 23.715 14.607 9.969 0 16.325-4.984 16.325-11.858 0-8.248-6.53-11.17-17.528-15.98l-6.013-2.58c-17.357-7.387-28.87-16.667-28.87-36.257 0-18.044 13.747-31.792 35.228-31.792 15.294 0 26.292 5.328 34.196 19.247L210.7 147.2c-4.468-8.076-9.28-11.17-16.669-11.17-7.588 0-12.4 4.812-12.4 11.17 0 7.903 4.812 11.085 15.98 15.98l6.012 2.58c20.45 8.765 31.963 17.7 31.963 37.804 0 21.654-17.012 33.51-39.867 33.51-22.339 0-36.774-10.654-43.819-24.588" fill="#000"/></svg>`,
        'ts': `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="16" fill="#3178C6"/><path d="M150.518 200.475v27.62c4.492 2.302 9.805 4.028 15.938 5.179 6.133 1.151 12.597 1.726 19.393 1.726 6.622 0 12.914-.633 18.874-1.899 5.96-1.266 11.187-3.352 15.678-6.259 4.492-2.906 8.048-6.796 10.669-11.672 2.621-4.875 3.932-10.94 3.932-18.194 0-5.179-.864-9.708-2.592-13.588-1.728-3.88-4.088-7.33-7.078-10.348-2.991-3.019-6.508-5.725-10.553-8.118-4.044-2.393-8.393-4.671-13.049-6.834-3.396-1.554-6.508-3.077-9.336-4.57-2.828-1.494-5.252-3.019-7.27-4.57-2.019-1.553-3.601-3.223-4.746-5.006-1.146-1.783-1.718-3.822-1.718-6.117 0-2.122.515-4.02 1.545-5.695 1.03-1.676 2.477-3.107 4.34-4.293 1.863-1.185 4.081-2.093 6.652-2.724 2.571-.63 5.397-.946 8.476-.946 2.224 0 4.564.173 7.02.518 2.456.345 4.912.892 7.368 1.64 2.456.749 4.825 1.698 7.106 2.85 2.282 1.15 4.333 2.501 6.153 4.05v-25.542c-4.03-1.611-8.393-2.793-13.09-3.543-4.696-.749-10.03-1.124-16.003-1.124-6.564 0-12.798.69-18.702 2.072-5.904 1.38-11.1 3.567-15.59 6.558-4.49 2.992-8.047 6.882-10.669 11.672-2.621 4.79-3.932 10.597-3.932 17.424 0 8.536 2.484 15.852 7.454 21.948 4.969 6.096 12.424 11.187 22.363 15.275 3.974 1.611 7.685 3.195 11.131 4.75 3.446 1.553 6.421 3.195 8.928 4.921 2.506 1.726 4.492 3.624 5.957 5.695 1.464 2.072 2.197 4.46 2.197 7.165 0 1.954-.457 3.764-1.372 5.437-.915 1.668-2.282 3.108-4.102 4.32-1.82 1.211-4.073 2.152-6.766 2.822-2.692.663-5.81.996-9.354.996-6.102 0-12.088-1.124-17.959-3.37-5.87-2.246-11.158-5.608-15.862-10.087zM100.592 141.328H141.1v-24.056H53v24.056h40.1V235h24.058v-93.672h-16.566z" fill="#fff"/></svg>`,
        'jsx': `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="16" fill="#20232A"/><circle cx="128" cy="128" r="32" fill="#61DAFB"/><ellipse cx="128" cy="128" rx="100" ry="38" fill="none" stroke="#61DAFB" stroke-width="10"/><ellipse cx="128" cy="128" rx="100" ry="38" fill="none" stroke="#61DAFB" stroke-width="10" transform="rotate(60 128 128)"/><ellipse cx="128" cy="128" rx="100" ry="38" fill="none" stroke="#61DAFB" stroke-width="10" transform="rotate(120 128 128)"/></svg>`,
        'tsx': `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="16" fill="#3178C6"/><circle cx="128" cy="128" r="28" fill="#fff"/><ellipse cx="128" cy="128" rx="90" ry="34" fill="none" stroke="#fff" stroke-width="8"/><ellipse cx="128" cy="128" rx="90" ry="34" fill="none" stroke="#fff" stroke-width="8" transform="rotate(60 128 128)"/><ellipse cx="128" cy="128" rx="90" ry="34" fill="none" stroke="#fff" stroke-width="8" transform="rotate(120 128 128)"/></svg>`,
        'py': `<svg width="14" height="14" viewBox="0 0 256 255"><defs><linearGradient id="a" x1="12.96%" y1="12.04%" x2="79.68%" y2="78.01%"><stop offset="0%" stop-color="#387EB8"/><stop offset="100%" stop-color="#366994"/></linearGradient><linearGradient id="b" x1="19.13%" y1="20.58%" x2="90.58%" y2="88.29%"><stop offset="0%" stop-color="#FFE052"/><stop offset="100%" stop-color="#FFC331"/></linearGradient></defs><path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 110 22.24 11.12 11.12 0 010-22.24z" fill="url(#a)"/><path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.519 33.897zm34.114-19.586a11.12 11.12 0 110-22.24 11.12 11.12 0 010 22.24z" fill="url(#b)"/></svg>`,
        'java': `<svg width="14" height="14" viewBox="0 0 256 346"><path d="M82.554 267.473s-13.198 7.675 9.393 10.272c27.369 3.122 41.356 2.675 71.517-3.034 0 0 7.93 4.972 19.003 9.279-67.611 28.977-153.019-1.679-99.913-16.517m-8.262-37.814s-14.803 10.958 7.805 13.296c29.236 3.016 52.324 3.263 92.276-4.43 0 0 5.526 5.602 14.215 8.666-81.747 23.904-172.842 1.885-114.296-17.532" fill="#5382A1"/><path d="M143.942 165.515c16.66 19.18-4.377 36.44-4.377 36.44s42.301-21.837 22.874-49.183c-18.144-25.5-32.059-38.172 43.268-81.858 0 0-118.238 29.53-61.765 94.6" fill="#E76F00"/><path d="M233.364 295.442s9.767 8.047-10.757 14.273c-39.026 11.823-162.432 15.393-196.714.471-12.323-5.36 10.787-12.8 18.056-14.362 7.581-1.644 11.914-1.337 11.914-1.337-13.705-9.655-88.583 18.957-38.034 27.15 137.853 22.356 251.292-10.066 215.535-26.195M88.9 190.48s-62.771 14.908-22.228 20.323c17.118 2.292 51.243 1.774 83.03-.89 25.978-2.19 52.063-6.85 52.063-6.85s-9.16 3.923-15.787 8.448c-63.744 16.765-186.886 8.966-151.435-8.183 29.981-14.492 54.358-12.848 54.358-12.848m112.605 62.942c64.8-33.672 34.839-66.03 13.927-61.67-5.126 1.066-7.411 1.99-7.411 1.99s1.903-2.98 5.537-4.27c41.37-14.545 73.187 42.897-13.355 65.647 0 0 1.003-.895 1.302-1.697" fill="#5382A1"/><path d="M162.439.371s35.887 35.9-34.037 91.101c-56.071 44.282-12.786 69.53-.023 98.377-32.73-29.53-56.75-55.526-40.635-79.72C111.395 74.612 176.918 57.393 162.439.37" fill="#E76F00"/><path d="M95.268 344.665c62.199 3.982 157.712-2.209 159.974-31.64 0 0-4.348 11.158-51.404 20.018-53.088 9.99-118.564 8.824-157.399 2.421 0 0 7.95 6.58 48.83 9.201" fill="#5382A1"/></svg>`,
        'c':  `<svg width="14" height="14" viewBox="0 0 256 288"><path d="M255.569 84.452c-.002-4.83-1.035-9.098-3.124-12.76l-.07-.126c-2.06-3.607-5.16-6.69-9.261-9.06L135.987 3.378c-8.344-4.817-18.555-4.82-26.886-.005L1.975 62.505c-8.341 4.817-13.49 13.71-13.494 23.283L.001 201.14c0 4.832 1.035 9.1 3.124 12.763l.088.152c2.052 3.59 5.143 6.665 9.235 9.03l107.126 59.127c8.346 4.818 18.556 4.822 26.887.005l107.126-59.128c4.093-2.364 7.183-5.44 9.235-9.031l.088-.152c2.089-3.662 3.124-7.931 3.124-12.763l.535-116.568z" fill="#A8B9CC"/><path d="M128.182 143.241L2.988 215.197c2.052 3.59 5.143 6.665 9.235 9.031l107.126 59.127c8.346 4.818 18.556 4.822 26.887.005l107.126-59.128c4.093-2.364 7.183-5.44 9.235-9.031L128.182 143.24z" fill="#7D8B99"/><path d="M165.26 186.331c-14.856 25.697-42.527 42.941-74.323 42.941-31.797 0-59.467-17.244-74.323-42.941 14.856-25.697 42.526-42.941 74.323-42.941 31.796 0 59.467 17.244 74.323 42.941z" fill="#fff"/></svg>`,
        'cpp':`<svg width="14" height="14" viewBox="0 0 256 288"><path d="M255.569 84.452c-.002-4.83-1.035-9.098-3.124-12.76l-.07-.126c-2.06-3.607-5.16-6.69-9.261-9.06L135.987 3.378c-8.344-4.817-18.555-4.82-26.886-.005L1.975 62.505c-8.341 4.817-13.49 13.71-13.494 23.283L.001 201.14c0 4.832 1.035 9.1 3.124 12.763l.088.152c2.052 3.59 5.143 6.665 9.235 9.03l107.126 59.127c8.346 4.818 18.556 4.822 26.887.005l107.126-59.128c4.093-2.364 7.183-5.44 9.235-9.031l.088-.152c2.089-3.662 3.124-7.931 3.124-12.763l.535-116.568z" fill="#00599C"/><path d="M128.182 143.241L2.988 215.197c2.052 3.59 5.143 6.665 9.235 9.031l107.126 59.127c8.346 4.818 18.556 4.822 26.887.005l107.126-59.128c4.093-2.364 7.183-5.44 9.235-9.031L128.182 143.24z" fill="#004482"/><path d="M165.26 186.331c-14.856 25.697-42.527 42.941-74.323 42.941-31.797 0-59.467-17.244-74.323-42.941 14.856-25.697 42.526-42.941 74.323-42.941 31.796 0 59.467 17.244 74.323 42.941z" fill="#fff"/><path d="M183 176h10v-10h8v10h10v8h-10v10h-8v-10h-10zm34 0h10v-10h8v10h10v8h-10v10h-8v-10h-10z" fill="#fff"/></svg>`,
        'cs': `<svg width="14" height="14" viewBox="0 0 256 288"><path d="M255.569 84.452c-.002-4.83-1.035-9.098-3.124-12.76l-.07-.126c-2.06-3.607-5.16-6.69-9.261-9.06L135.987 3.378c-8.344-4.817-18.555-4.82-26.886-.005L1.975 62.505c-8.341 4.817-13.49 13.71-13.494 23.283L.001 201.14c0 4.832 1.035 9.1 3.124 12.763l.088.152c2.052 3.59 5.143 6.665 9.235 9.03l107.126 59.127c8.346 4.818 18.556 4.822 26.887.005l107.126-59.128c4.093-2.364 7.183-5.44 9.235-9.031l.088-.152c2.089-3.662 3.124-7.931 3.124-12.763l.535-116.568z" fill="#68217A"/><path d="M128.182 143.241L2.988 215.197c2.052 3.59 5.143 6.665 9.235 9.031l107.126 59.127c8.346 4.818 18.556 4.822 26.887.005l107.126-59.128c4.093-2.364 7.183-5.44 9.235-9.031L128.182 143.24z" fill="#521C6E"/><path d="M165.26 186.331c-14.856 25.697-42.527 42.941-74.323 42.941-31.797 0-59.467-17.244-74.323-42.941 14.856-25.697 42.526-42.941 74.323-42.941 31.796 0 59.467 17.244 74.323 42.941z" fill="#fff"/><path d="M183 176h10v-10h8v10h10v8h-10v10h-8v-10h-10z" fill="#fff"/></svg>`,
        'html': `<svg width="14" height="14" viewBox="0 0 256 361"><path d="M255.555 70.766l-23.241 260.36-104.47 28.962-104.182-28.922L.445 70.766h255.11z" fill="#E44D26"/><path d="M128 337.95l84.417-23.403 19.86-222.49H128V337.95z" fill="#F16529"/><path d="M82.82 155.932H128v-31.937H47.917l7.85 87.995H128v-31.937H86.396l-3.576-32.121zM90.018 236.542l-4.432-49.66H56.626l7.7 86.258L127.553 292.5v-33.257l-37.535-9.701z" fill="#EBEBEB"/><path d="M128 187.869v42.065h35.716l-3.708 41.42L128 277.534v33.226l65.38-18.139 7.834-87.655.813-9.397H128zm0-63.874v31.937h79.682l.649-7.27 1.473-16.437.764-8.23H128z" fill="#fff"/></svg>`,
        'htm': `<svg width="14" height="14" viewBox="0 0 256 361"><path d="M255.555 70.766l-23.241 260.36-104.47 28.962-104.182-28.922L.445 70.766h255.11z" fill="#E44D26"/><path d="M128 337.95l84.417-23.403 19.86-222.49H128V337.95z" fill="#F16529"/><path d="M82.82 155.932H128v-31.937H47.917l7.85 87.995H128v-31.937H86.396l-3.576-32.121zM90.018 236.542l-4.432-49.66H56.626l7.7 86.258L127.553 292.5v-33.257l-37.535-9.701z" fill="#EBEBEB"/><path d="M128 187.869v42.065h35.716l-3.708 41.42L128 277.534v33.226l65.38-18.139 7.834-87.655.813-9.397H128zm0-63.874v31.937h79.682l.649-7.27 1.473-16.437.764-8.23H128z" fill="#fff"/></svg>`,
        'css': `<svg width="14" height="14" viewBox="0 0 256 361"><path d="M255.555 70.766l-23.241 260.36-104.47 28.962-104.182-28.922L.445 70.766h255.11z" fill="#264DE4"/><path d="M128 337.95l84.417-23.403 19.86-222.49H128V337.95z" fill="#2965F1"/><path d="M56.047 187.869l3.765 42.065 68.2 18.906v-33.97l-.164.043-37.152-10.038-2.38-26.63H56.047zm-8.003-89.427l3.828 42.065H128v-42.065H48.044zm79.956 98.79v42.648l.132-.037 68.645-19.065 5.064-56.713H128v33.167z" fill="#EBEBEB"/><path d="M128 187.869v42.065h35.716l-3.37 37.641L128 277.534v33.97l68.38-18.953 7.834-87.655.813-9.397H128zm0-89.427v42.065h79.682l.659-7.359 1.501-16.76.777-8.349.652-9.597H128z" fill="#fff"/></svg>`,
        'scss':`<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#CC6699"/><path d="M128 80c-28 0-44 14-44 34 0 38 52 46 52 70 0 12-10 18-24 18-18 0-30-10-30-10l-6 18s14 12 36 12c30 0 50-16 50-40 0-40-52-48-52-70 0-10 8-16 20-16 14 0 24 8 24 8l6-16s-12-8-32-8z" fill="#fff"/></svg>`,
        'sass':`<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#CC6699"/><path d="M128 80c-28 0-44 14-44 34 0 38 52 46 52 70 0 12-10 18-24 18-18 0-30-10-30-10l-6 18s14 12 36 12c30 0 50-16 50-40 0-40-52-48-52-70 0-10 8-16 20-16 14 0 24 8 24 8l6-16s-12-8-32-8z" fill="#fff"/></svg>`,
        'less':`<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#1D365D"/><path d="M40 128c0-48 34-80 80-80 26 0 46 10 60 26l-22 22c-8-10-22-16-38-16-28 0-48 20-48 48s20 48 48 48c16 0 30-6 38-16l22 22c-14 16-34 26-60 26-46 0-80-32-80-80z" fill="#3578B7"/><path d="M175 90h22v76h40v22h-62z" fill="#3578B7"/></svg>`,
        'vue': `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#41B883"/><path d="M128 220L16 48h48l64 112 64-112h48z" fill="#fff"/><path d="M128 220L64 112h32l32 56 32-56h32z" fill="#35495E"/></svg>`,
        'svelte':`<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#FF3E00"/><path d="M190 74c-14-20-40-26-60-14l-68 42c-18 12-24 34-14 52 6 12 18 20 30 22-4 6-6 14-4 22 6 22 30 34 52 28l68-42c18-12 24-34 14-52-6-12-18-20-30-22 4-6 6-14 4-22z" fill="#fff"/></svg>`,
        'php': `<svg width="14" height="14" viewBox="0 0 256 134"><ellipse cx="128" cy="66.63" rx="128" ry="66.63" fill="#777BB4"/><path d="M35.945 106.082l14.028-71.014h29.077c14.467 0 24.457 5.85 21.253 21.815-3.87 19.31-18.8 24.326-33.186 24.072l-5.476 25.127H35.945zm24.891-39.263l-3.477 17.219h8.563c8.14 0 14.98-2.466 16.423-10.098 1.467-7.746-4.261-7.121-10.977-7.121h-10.532zM94.088 67.202L108.117 0h25.697l-3.322 16.829h11.357c13.413 0 21.426 5.127 18.818 18.472l-7.456 31.901h-26.004l6.786-28.874c1.025-4.373.617-6.31-4.507-6.31h-7.473l-8.544 35.184H94.088zM153.315 106.082l14.028-71.014h29.077c14.467 0 24.457 5.85 21.253 21.815-3.87 19.31-18.8 24.326-33.186 24.072l-5.476 25.127h-25.696zm24.891-39.263l-3.477 17.219h8.563c8.14 0 14.98-2.466 16.423-10.098 1.467-7.746-4.261-7.121-10.977-7.121h-10.532z" fill="#fff"/></svg>`,
        'go': `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#00ACD7"/><path d="M40 148h18v-40H40zm14-50a10 10 0 110-20 10 10 0 010 20zm50 50h18v-40H104zm14-50a10 10 0 110-20 10 10 0 010 20zm30 8c0-28 22-50 50-50s50 22 50 50-22 50-50 50-50-22-50-50zm18 0c0 18 14 32 32 32s32-14 32-32-14-32-32-32-32 14-32 32z" fill="#fff"/></svg>`,
        'rs': `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#CE422B"/><path d="M128 32a96 96 0 100 192A96 96 0 00128 32zm0 16a80 80 0 110 160A80 80 0 01128 48zm-8 24v32l-28 16 8 14 24-14v28h16v-28l24 14 8-14-28-16V72h-24z" fill="#fff"/></svg>`,
        'swift': `<svg width="14" height="14" viewBox="0 0 256 256"><defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F88A36"/><stop offset="100%" stop-color="#FD2020"/></linearGradient></defs><rect width="256" height="256" rx="56" fill="url(#sg)"/><path d="M196 174c-2 6-8 16-22 25-16 10-34 11-42 11-40-2-77-25-104-54 0 0 56 37 104 15-30-18-56-43-77-72 0 0 40 30 68 40-2-1-4-3-6-4C82 109 50 69 44 46c20 25 70 71 70 71-18-22-28-51-28-51 25 27 56 49 91 61 3 1 6 2 10 3-3-11-4-22-1-35 7-30 30-52 30-52-5 18-4 38 7 54 15 21 41 29 41 29-10 6-24 6-36 3-.3-.1-.6-.1-.9-.2 1 2 2 3 2 5 3 9 2 17-3 27z" fill="#fff"/></svg>`,
        'kt': `<svg width="14" height="14" viewBox="0 0 256 256"><defs><linearGradient id="kg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="9%" stop-color="#E44857"/><stop offset="30%" stop-color="#C711E1"/><stop offset="100%" stop-color="#7F52FF"/></linearGradient></defs><rect width="256" height="256" rx="24" fill="url(#kg)"/><path d="M16 16h112L16 128zm112 0L16 240h224zm0 0l112 224H128z" fill="#fff"/></svg>`,
        'kts': `<svg width="14" height="14" viewBox="0 0 256 256"><defs><linearGradient id="kg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="9%" stop-color="#E44857"/><stop offset="30%" stop-color="#C711E1"/><stop offset="100%" stop-color="#7F52FF"/></linearGradient></defs><rect width="256" height="256" rx="24" fill="url(#kg2)"/><path d="M16 16h112L16 128zm112 0L16 240h224zm0 0l112 224H128z" fill="#fff"/></svg>`,
        'dart': `<svg width="14" height="14" viewBox="0 0 256 256"><path d="M67 0H197L256 58v130L197 256H67L0 197V58z" fill="#01579B"/><path d="M197 0L67 0 0 58h130L197 0z" fill="#40C4FF"/><path d="M0 58v130L67 256V67z" fill="#40C4FF"/><path d="M67 256h130l58-58H67z" fill="#29B6F6"/><path d="M256 188V58L197 0v188z" fill="#01579B"/><path d="M67 67v121h130V67z" fill="#fff" fill-opacity=".2"/></svg>`,
        'rb': `<svg width="14" height="14" viewBox="0 0 256 256"><defs><linearGradient id="rg" x1="16%" y1="74%" x2="98%" y2="8%"><stop offset="0%" stop-color="#FB7655"/><stop offset="41%" stop-color="#E42B1E"/><stop offset="100%" stop-color="#900"/></linearGradient></defs><rect width="256" height="256" rx="24" fill="url(#rg)"/><path d="M197 167L51 253l189-13L254 51zm-145 86l30-83L16 191zm151-149l-57 57-56-113zm57 57l-13 87-44-44zm-189-56l39 70-83 38z" fill="rgba(255,255,255,0.3)"/></svg>`,
        'sql': `<svg width="14" height="14" viewBox="0 0 256 256"><ellipse cx="128" cy="60" rx="96" ry="36" fill="#00758F"/><rect x="32" y="60" width="192" height="136" fill="#00758F"/><ellipse cx="128" cy="60" rx="96" ry="36" fill="#00A4C7"/><ellipse cx="128" cy="120" rx="96" ry="36" fill="none" stroke="#006880" stroke-width="3" opacity=".6"/><ellipse cx="128" cy="180" rx="96" ry="36" fill="#00758F"/><ellipse cx="128" cy="196" rx="96" ry="36" fill="#00A4C7"/></svg>`,
        'sh':   `<svg width="14" height="14" viewBox="0 0 256 256"><rect x="4" y="20" width="248" height="216" rx="16" fill="#1E1E1E"/><rect x="4" y="20" width="248" height="40" rx="16" fill="#3A3A3A"/><rect x="4" y="44" width="248" height="16" fill="#3A3A3A"/><circle cx="32" cy="40" r="8" fill="#FF5F56"/><circle cx="56" cy="40" r="8" fill="#FFBD2E"/><circle cx="80" cy="40" r="8" fill="#27CA40"/><path d="M44 108l36 24-36 24" stroke="#27CA40" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M100 164h56" stroke="#ccc" stroke-width="8" stroke-linecap="round"/></svg>`,
        'bash': `<svg width="14" height="14" viewBox="0 0 256 256"><rect x="4" y="20" width="248" height="216" rx="16" fill="#1E1E1E"/><rect x="4" y="20" width="248" height="40" rx="16" fill="#3A3A3A"/><rect x="4" y="44" width="248" height="16" fill="#3A3A3A"/><circle cx="32" cy="40" r="8" fill="#FF5F56"/><circle cx="56" cy="40" r="8" fill="#FFBD2E"/><circle cx="80" cy="40" r="8" fill="#27CA40"/><path d="M44 108l36 24-36 24" stroke="#27CA40" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M100 164h56" stroke="#ccc" stroke-width="8" stroke-linecap="round"/></svg>`,
        'zsh':  `<svg width="14" height="14" viewBox="0 0 256 256"><rect x="4" y="20" width="248" height="216" rx="16" fill="#1E1E1E"/><rect x="4" y="20" width="248" height="40" rx="16" fill="#3A3A3A"/><rect x="4" y="44" width="248" height="16" fill="#3A3A3A"/><circle cx="32" cy="40" r="8" fill="#FF5F56"/><circle cx="56" cy="40" r="8" fill="#FFBD2E"/><circle cx="80" cy="40" r="8" fill="#27CA40"/><path d="M44 108l36 24-36 24" stroke="#27CA40" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M100 164h56" stroke="#ccc" stroke-width="8" stroke-linecap="round"/></svg>`,
        'ps1':  `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="16" fill="#012456"/><path d="M40 180l80-100h-60l80-60h60l-80 100h60l-80 60z" fill="#00BFFF" opacity=".9"/></svg>`,
        'json': `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#292929"/><path d="M142.887 218.776c-20.099 0-32.57-11.164-32.57-28.858v-21.38c0-10.496-4.672-15.743-14.16-15.743v-17.59c9.488 0 14.16-5.247 14.16-15.743v-21.38c0-17.694 12.471-28.858 32.57-28.858v17.59c-9.537 0-14.741 4.72-14.741 13.352v22.94c0 11.164-4.432 18.598-13.824 22.076 9.392 3.478 13.824 10.912 13.824 22.076v22.94c0 8.632 5.204 13.352 14.741 13.352v17.221z" fill="#fff"/><path d="M113.113 218.776v-17.221c9.537 0 14.741-4.72 14.741-13.352v-22.94c0-11.164 4.432-18.598 13.824-22.076-9.392-3.478-13.824-10.912-13.824-22.076v-22.94c0-8.632-5.204-13.352-14.741-13.352V67.224c20.099 0 32.57 11.164 32.57 28.858v21.38c0 10.496 4.672 15.743 14.16 15.743v17.59c-9.488 0-14.16 5.247-14.16 15.743v21.38c0 17.694-12.471 28.858-32.57 28.858z" fill="#fff"/></svg>`,
        'xml':  `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#FF6600"/><path d="M80 72L32 128l48 56" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M176 72l48 56-48 56" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M152 48l-48 160" stroke="#fff" stroke-width="12" stroke-linecap="round"/></svg>`,
        'yml':  `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#CB171E"/><path d="M60 80l40 48v48M140 80l-40 48M152 80v96M172 80v96h40" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
        'yaml': `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#CB171E"/><path d="M60 80l40 48v48M140 80l-40 48M152 80v96M172 80v96h40" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
        'toml': `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#9C4221"/><path d="M64 80h128M128 80v96" stroke="#fff" stroke-width="16" stroke-linecap="round"/><path d="M56 144h64M120 144v32" stroke="#fff" stroke-width="12" stroke-linecap="round"/></svg>`,
        'ini':  `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#555"/><path d="M80 80h96M80 128h96M80 176h60" stroke="#fff" stroke-width="14" stroke-linecap="round"/><circle cx="196" cy="176" r="8" fill="#aaa"/></svg>`,
        'env':  `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#2D7D46"/><path d="M64 80h128v24H64zM64 136h80v24H64zM64 192h104v24H64z" fill="#fff" opacity=".9"/></svg>`,
        'csv':  `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#217346"/><path d="M40 80h176M40 128h176M40 176h176M128 56v144M80 56v144M176 56v144" stroke="#fff" stroke-width="10" opacity=".7"/></svg>`,
        'md':       `<svg width="14" height="14" viewBox="0 0 256 158"><rect x="4" y="4" width="248" height="150" rx="16" stroke="#185ABD" stroke-width="8" fill="none"/><path d="M40 118V40l36 48 36-48v78M168 80h40m-20-20v62" stroke="#185ABD" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        'markdown': `<svg width="14" height="14" viewBox="0 0 256 158"><rect x="4" y="4" width="248" height="150" rx="16" stroke="#185ABD" stroke-width="8" fill="none"/><path d="M40 118V40l36 48 36-48v78M168 80h40m-20-20v62" stroke="#185ABD" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        'svg': `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#FFB13B"/><circle cx="128" cy="128" r="60" fill="none" stroke="#fff" stroke-width="16"/><path d="M128 68v120M68 128h120" stroke="#fff" stroke-width="12" stroke-linecap="round"/><circle cx="128" cy="128" r="16" fill="#fff"/></svg>`,
        'graphql': `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#E535AB"/><path d="M128 32l88 50v92l-88 50-88-50V82z" fill="none" stroke="#fff" stroke-width="16"/><circle cx="128" cy="32" r="14" fill="#fff"/><circle cx="216" cy="82" r="14" fill="#fff"/><circle cx="216" cy="174" r="14" fill="#fff"/><circle cx="128" cy="224" r="14" fill="#fff"/><circle cx="40" cy="174" r="14" fill="#fff"/><circle cx="40" cy="82" r="14" fill="#fff"/><circle cx="128" cy="128" r="22" fill="#fff"/></svg>`,
        'tf':   `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#7B42BC"/><rect x="80" y="60" width="40" height="136" fill="#fff"/><rect x="136" y="60" width="40" height="80" fill="rgba(255,255,255,0.7)"/></svg>`,
        'lua':  `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#000080"/><circle cx="110" cy="128" r="60" fill="none" stroke="#fff" stroke-width="16"/><circle cx="180" cy="70" r="28" fill="#fff"/></svg>`,
        'r':    `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#276DC3"/><path d="M60 196V60h80c36 0 56 18 56 46 0 22-14 38-36 44l40 46h-36l-36-44H92v44zm32-68h44c16 0 26-8 26-20s-10-20-26-20H92z" fill="#fff"/></svg>`,
        'pl':   `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#39457E"/><path d="M80 60l48 136 48-136M60 160h136" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
        'm':    `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#E17726"/><path d="M40 196V60l44 100 44-100 44 136" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
        'proto':`<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#4285F4"/><path d="M80 80h96v96H80z" fill="none" stroke="#fff" stroke-width="14"/><path d="M80 128h96M128 80v96" stroke="#fff" stroke-width="10"/></svg>`,
        'txt':  `<svg width="14" height="14" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="#607D8B"/><path d="M60 80h136M60 120h136M60 160h96" stroke="#fff" stroke-width="14" stroke-linecap="round"/></svg>`,
        'default': `<svg width="14" height="14" viewBox="0 0 256 256"><path d="M48 16C48 7.163 55.163 0 64 0h96l80 80v160c0 8.837-7.163 16-16 16H64c-8.837 0-16-7.163-16-16V16z" fill="#90A4AE"/><path d="M160 0v64c0 8.837 7.163 16 16 16h64L160 0z" fill="#B0BEC5"/><path d="M80 120h96M80 152h96M80 184h64" stroke="#fff" stroke-width="12" stroke-linecap="round"/></svg>`
    };

    // ---- Init ----
    function init() {
        editorBody     = document.getElementById('editorBody');
        codeArea       = document.getElementById('codeArea');
        statusPosition = document.getElementById('statusPosition');
        statusLanguage = document.getElementById('statusLanguage');
        statusLines    = document.getElementById('statusLines');
        tabName        = document.getElementById('tabName');
        tabIcon        = document.getElementById('tabIcon');
        editorWindow   = document.getElementById('editorWindow');
        minimapEl      = document.getElementById('editorMinimap');
        minimapCanvas  = document.getElementById('minimapCanvas');

        if (minimapCanvas) {
            minimapCtx = minimapCanvas.getContext('2d');
        }
    }

    // ---- Reset ----
    function reset() {
        if (!codeArea) return;
        codeArea.innerHTML = '';
        currentLineCount = 0;
        _addLineDOM(1);
        updateCursor(1, 1);
        updateEditorHeight();
        if (editorBody) editorBody.scrollTop = 0;
        if (statusLines) statusLines.textContent = '0 lines';
    }

    // ---- Add line to DOM ----
    function addLine(lineNumber) {
        return _addLineDOM(lineNumber);
    }

    function _addLineDOM(lineNumber) {
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

    // ---- Get line content element ----
    function getLineContent(lineNumber) {
        const lineDivs = codeArea.querySelectorAll('.code-line');
        if (lineNumber >= 1 && lineNumber <= lineDivs.length) {
            return lineDivs[lineNumber - 1].querySelector('.line-content');
        }
        return null;
    }

    // ---- Set line HTML — standard ----
    function setLineHTML(lineNumber, html, showCursor) {
        let contentEl = getLineContent(lineNumber);
        if (!contentEl) {
            contentEl = addLine(lineNumber);
        }

        const lineDivs = codeArea.querySelectorAll('.code-line');
        lineDivs.forEach(d => d.classList.remove('active-line'));
        if (lineDivs[lineNumber - 1]) {
            lineDivs[lineNumber - 1].classList.add('active-line');
        }

        if (showCursor) {
            const cursorChar = _getCursorChar();
            contentEl.innerHTML = html + `<span class="cursor blink">${cursorChar}</span>`;
        } else {
            contentEl.innerHTML = html;
        }
    }

    // ---- Set line HTML — with ghost suggestion text ---- NEW
    function setLineHTMLWithGhost(lineNumber, html, ghostHTML, showCursor) {
        let contentEl = getLineContent(lineNumber);
        if (!contentEl) {
            contentEl = addLine(lineNumber);
        }

        const lineDivs = codeArea.querySelectorAll('.code-line');
        lineDivs.forEach(d => d.classList.remove('active-line'));
        if (lineDivs[lineNumber - 1]) {
            lineDivs[lineNumber - 1].classList.add('active-line');
        }

        const cursorChar = _getCursorChar();
        const cursorHTML = showCursor
            ? `<span class="cursor blink">${cursorChar}</span>`
            : '';

        // Order: typed content → cursor → ghost suggestion
        contentEl.innerHTML = html + cursorHTML + (ghostHTML || '');
    }

    function _getCursorChar() {
        switch (currentCursorStyle) {
            case 'block':     return '█';
            case 'underline': return '_';
            case 'line':
            default:          return '|';
        }
    }

    // ---- Cursor management ----
    function clearAllCursors() {
        if (!codeArea) return;
        codeArea.querySelectorAll('.cursor').forEach(c => c.remove());
    }

    function addCursorToLine(lineNumber) {
        clearAllCursors();
        const contentEl = getLineContent(lineNumber);
        if (contentEl) {
            // Remove any ghost text when animation completes
            const ghost = contentEl.querySelector('.suggestion-ghost');
            if (ghost) ghost.remove();

            const cursorSpan = document.createElement('span');
            cursorSpan.className = 'cursor blink';
            cursorSpan.textContent = _getCursorChar();
            contentEl.appendChild(cursorSpan);
        }
    }

    function setCursorSolid() {
        const cursor = codeArea ? codeArea.querySelector('.cursor') : null;
        if (cursor) cursor.classList.remove('blink');
    }

    function setCursorBlink() {
        const cursor = codeArea ? codeArea.querySelector('.cursor') : null;
        if (cursor) cursor.classList.add('blink');
    }

    // ---- Cursor style ----
    function setCursorStyle(style) {
        currentCursorStyle = style || 'line';
        if (editorWindow) {
            editorWindow.classList.remove(
                'cursor-style-line',
                'cursor-style-block',
                'cursor-style-underline'
            );
            editorWindow.classList.add('cursor-style-' + currentCursorStyle);
        }
        const cursor = codeArea ? codeArea.querySelector('.cursor') : null;
        if (cursor) cursor.textContent = _getCursorChar();
    }

    // ---- Font size ----
    function setFontSize(size) {
        if (!editorWindow) return;
        editorWindow.classList.remove(
            'font-size-small',
            'font-size-medium',
            'font-size-large',
            'font-size-xlarge'
        );
        editorWindow.classList.add('font-size-' + size);
    }

    // ---- Status bar ----
    function updateCursor(line, col) {
        if (statusPosition) {
            statusPosition.textContent = `Ln ${line}, Col ${col}`;
        }
    }

    function setLanguage(langId) {
        if (statusLanguage) {
            statusLanguage.textContent = LANGUAGE_NAMES[langId] || langId;
        }
    }

    function updateLineCount(count) {
        if (statusLines) {
            statusLines.textContent = count + ' line' + (count !== 1 ? 's' : '');
        }
    }

    // ---- File name & icon ----
    function setFileName(name) {
        if (tabName) tabName.textContent = name;
        if (tabIcon) {
            const ext = name.includes('.')
                ? name.split('.').pop().toLowerCase()
                : 'default';
            tabIcon.innerHTML = FILE_ICONS[ext] || FILE_ICONS['default'];
        }

        const windowTitle = document.getElementById('windowTitle');
        if (windowTitle) {
            windowTitle.textContent = name + ' — CodeType Studio';
        }
    }

    // ---- Theme ----
    function setTheme(themeId) {
        currentTheme = themeId;
        if (editorWindow) {
            editorWindow.setAttribute('data-theme', themeId);
        }
        ThemeEngine.apply(themeId, editorWindow);
    }

    // ---- Minimap ----
    function setMinimapVisible(visible) {
        showMinimap = visible;
        if (minimapEl) {
            minimapEl.style.display = visible ? 'block' : 'none';
        }
    }

    function updateMinimap(parsedData, currentLineIdx) {
        if (!showMinimap || !minimapCtx || !minimapCanvas || !parsedData) return;

        const W = minimapEl.offsetWidth || 80;
        const H = editorBody ? editorBody.offsetHeight : 400;

        minimapCanvas.width  = W;
        minimapCanvas.height = H;

        minimapCtx.clearRect(0, 0, W, H);
        minimapCtx.fillStyle = 'rgba(0,0,0,0.2)';
        minimapCtx.fillRect(0, 0, W, H);

        const lines = parsedData.lines;
        const lineH = Math.max(1, H / Math.max(lines.length, 1));
        const maxW  = W - 8;

        lines.forEach((line, i) => {
            const y = i * lineH;
            const w = Math.min(maxW, (line.charCount / 60) * maxW);

            if (i === currentLineIdx) {
                minimapCtx.fillStyle = 'rgba(88,166,255,0.5)';
                minimapCtx.fillRect(0, y - 1, W, lineH + 2);
            }

            minimapCtx.fillStyle = i <= currentLineIdx
                ? 'rgba(169,177,214,0.5)'
                : 'rgba(169,177,214,0.15)';

            minimapCtx.fillRect(4, y + lineH * 0.25, w, Math.max(1, lineH * 0.5));
        });
    }

    // ---- Scroll ----
    function scrollIfNeeded() {
        if (!editorBody) return;
        const threshold = 80;
        const distFromBottom = editorBody.scrollHeight - editorBody.scrollTop - editorBody.clientHeight;
        if (distFromBottom < threshold) {
            editorBody.scrollTop = editorBody.scrollHeight;
        }
    }

    function scrollToBottom() {
        if (editorBody) editorBody.scrollTop = editorBody.scrollHeight;
    }

    // ---- Editor height growth ----
    function updateEditorHeight() {
        if (!editorBody) return;

        const appContainer = document.getElementById('appContainer');
        if (appContainer && appContainer.classList.contains('fullscreen')) return;

        const contentH = codeArea ? codeArea.scrollHeight + 20 : 200;
        const minH     = window.innerHeight * 0.30;
        const maxH     = window.innerHeight * 0.88;
        const target   = Math.max(minH, Math.min(contentH, maxH));

        editorBody.style.maxHeight = target + 'px';
    }

    // ---- Fullscreen ----
    function enterFullscreen() {
        const container = document.getElementById('appContainer');
        if (container) container.classList.add('fullscreen');

        const exitBtn = document.getElementById('btnExitFullscreen');
        if (exitBtn) {
            exitBtn.style.display = 'block';
            exitBtn.style.opacity = '0.5';

            clearTimeout(EditorUI._exitBtnTimeout);
            EditorUI._exitBtnTimeout = setTimeout(() => {
                exitBtn.style.opacity = '0.15';
            }, 3000);

            exitBtn.onmouseenter = () => { exitBtn.style.opacity = '1'; };
            exitBtn.onmouseleave = () => { exitBtn.style.opacity = '0.15'; };
        }
    }

    function exitFullscreen() {
        const container = document.getElementById('appContainer');
        if (container) container.classList.remove('fullscreen');

        const exitBtn = document.getElementById('btnExitFullscreen');
        if (exitBtn) exitBtn.style.display = 'none';

        updateEditorHeight();
    }

    function isFullscreen() {
        const container = document.getElementById('appContainer');
        return container ? container.classList.contains('fullscreen') : false;
    }

    // ---- Utility ----
    function getLineCount() { return currentLineCount; }

    function getLanguageName(langId) {
        return LANGUAGE_NAMES[langId] || langId;
    }

    function getIconForExtension(ext) {
        return FILE_ICONS[ext ? ext.toLowerCase() : 'default'] || FILE_ICONS['default'];
    }

    function getSupportedExtensions() {
        return Object.keys(FILE_ICONS).filter(k => k !== 'default');
    }

    // ---- Public API ----
    return {
        init,
        reset,
        addLine,
        getLineContent,
        setLineHTML,
        setLineHTMLWithGhost,        // ← NEW
        clearAllCursors,
        addCursorToLine,
        setCursorSolid,
        setCursorBlink,
        setCursorStyle,
        setFontSize,
        updateCursor,
        setLanguage,
        updateLineCount,
        setFileName,
        setTheme,
        setMinimapVisible,
        updateMinimap,
        scrollIfNeeded,
        scrollToBottom,
        updateEditorHeight,
        enterFullscreen,
        exitFullscreen,
        isFullscreen,
        getLineCount,
        getLanguageName,
        getIconForExtension,
        getSupportedExtensions,
        _exitBtnTimeout: null
    };

})();