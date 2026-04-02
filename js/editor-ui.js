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

    // File icons by extension (SVG) - More accurate versions
    const fileIcons = {
        'js': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none">
            <rect width="256" height="256" rx="16" fill="#F7DF1E"/>
            <path d="M67.312 213.932l19.59-11.856c3.78 6.701 7.218 12.371 15.465 12.371 7.905 0 12.89-3.092 12.89-15.12v-81.798h24.057v82.138c0 24.917-14.606 36.259-35.916 36.259-19.245 0-30.416-9.967-36.087-21.996m85.07-2.576l19.588-11.341c5.157 8.421 11.859 14.607 23.715 14.607 9.969 0 16.325-4.984 16.325-11.858 0-8.248-6.53-11.17-17.528-15.98l-6.013-2.58c-17.357-7.387-28.87-16.667-28.87-36.257 0-18.044 13.747-31.792 35.228-31.792 15.294 0 26.292 5.328 34.196 19.247L210.7 147.2c-4.468-8.076-9.28-11.17-16.669-11.17-7.588 0-12.4 4.812-12.4 11.17 0 7.903 4.812 11.085 15.98 15.98l6.012 2.58c20.45 8.765 31.963 17.7 31.963 37.804 0 21.654-17.012 33.51-39.867 33.51-22.339 0-36.774-10.654-43.819-24.588" fill="#000"/>
        </svg>`,

        'ts': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none">
            <rect width="256" height="256" rx="16" fill="#3178C6"/>
            <path d="M150.518 200.475v27.62c4.492 2.302 9.805 4.028 15.938 5.179 6.133 1.151 12.597 1.726 19.393 1.726 6.622 0 12.914-.633 18.874-1.899 5.96-1.266 11.187-3.352 15.678-6.259 4.492-2.906 8.048-6.796 10.669-11.672 2.621-4.875 3.932-10.94 3.932-18.194 0-5.179-.864-9.708-2.592-13.588-1.728-3.88-4.088-7.33-7.078-10.348-2.991-3.019-6.508-5.725-10.553-8.118-4.044-2.393-8.393-4.671-13.049-6.834-3.396-1.554-6.508-3.077-9.336-4.57-2.828-1.494-5.252-3.019-7.27-4.57-2.019-1.553-3.601-3.223-4.746-5.006-1.146-1.783-1.718-3.822-1.718-6.117 0-2.122.515-4.02 1.545-5.695 1.03-1.676 2.477-3.107 4.34-4.293 1.863-1.185 4.081-2.093 6.652-2.724 2.571-.63 5.397-.946 8.476-.946 2.224 0 4.564.173 7.02.518 2.456.345 4.912.892 7.368 1.64 2.456.749 4.825 1.698 7.106 2.85 2.282 1.15 4.333 2.501 6.153 4.05v-25.542c-4.03-1.611-8.393-2.793-13.09-3.543-4.696-.749-10.03-1.124-16.003-1.124-6.564 0-12.798.69-18.702 2.072-5.904 1.38-11.1 3.567-15.59 6.558-4.49 2.992-8.047 6.882-10.669 11.672-2.621 4.79-3.932 10.597-3.932 17.424 0 8.536 2.484 15.852 7.454 21.948 4.969 6.096 12.424 11.187 22.363 15.275 3.974 1.611 7.685 3.195 11.131 4.75 3.446 1.553 6.421 3.195 8.928 4.921 2.506 1.726 4.492 3.624 5.957 5.695 1.464 2.072 2.197 4.46 2.197 7.165 0 1.954-.457 3.764-1.372 5.437-.915 1.668-2.282 3.108-4.102 4.32-1.82 1.211-4.073 2.152-6.766 2.822-2.692.663-5.81.996-9.354.996-6.102 0-12.088-1.124-17.959-3.37-5.87-2.246-11.158-5.608-15.862-10.087zM100.592 141.328H141.1v-24.056H53v24.056h40.1V235h24.058v-93.672h-16.566z" fill="#fff"/>
        </svg>`,

        'py': `<svg width="16" height="16" viewBox="0 0 256 255" fill="none">
            <defs>
                <linearGradient id="pyBlue" x1="12.96%" y1="12.04%" x2="79.68%" y2="78.01%">
                    <stop offset="0%" stop-color="#387EB8"/>
                    <stop offset="100%" stop-color="#366994"/>
                </linearGradient>
                <linearGradient id="pyYellow" x1="19.13%" y1="20.58%" x2="90.58%" y2="88.29%">
                    <stop offset="0%" stop-color="#FFE052"/>
                    <stop offset="100%" stop-color="#FFC331"/>
                </linearGradient>
            </defs>
            <path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 110 22.24 11.12 11.12 0 010-22.24z" fill="url(#pyBlue)"/>
            <path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.519 33.897zm34.114-19.586a11.12 11.12 0 110-22.24 11.12 11.12 0 010 22.24z" fill="url(#pyYellow)"/>
        </svg>`,

        'java': `<svg width="16" height="16" viewBox="0 0 256 346" fill="none">
            <path d="M82.554 267.473s-13.198 7.675 9.393 10.272c27.369 3.122 41.356 2.675 71.517-3.034 0 0 7.93 4.972 19.003 9.279-67.611 28.977-153.019-1.679-99.913-16.517m-8.262-37.814s-14.803 10.958 7.805 13.296c29.236 3.016 52.324 3.263 92.276-4.43 0 0 5.526 5.602 14.215 8.666-81.747 23.904-172.842 1.885-114.296-17.532" fill="#5382A1"/>
            <path d="M143.942 165.515c16.66 19.18-4.377 36.44-4.377 36.44s42.301-21.837 22.874-49.183c-18.144-25.5-32.059-38.172 43.268-81.858 0 0-118.238 29.53-61.765 94.6" fill="#E76F00"/>
            <path d="M233.364 295.442s9.767 8.047-10.757 14.273c-39.026 11.823-162.432 15.393-196.714.471-12.323-5.36 10.787-12.8 18.056-14.362 7.581-1.644 11.914-1.337 11.914-1.337-13.705-9.655-88.583 18.957-38.034 27.15 137.853 22.356 251.292-10.066 215.535-26.195M88.9 190.48s-62.771 14.908-22.228 20.323c17.118 2.292 51.243 1.774 83.03-.89 25.978-2.19 52.063-6.85 52.063-6.85s-9.16 3.923-15.787 8.448c-63.744 16.765-186.886 8.966-151.435-8.183 29.981-14.492 54.358-12.848 54.358-12.848m112.605 62.942c64.8-33.672 34.839-66.03 13.927-61.67-5.126 1.066-7.411 1.99-7.411 1.99s1.903-2.98 5.537-4.27c41.37-14.545 73.187 42.897-13.355 65.647 0 0 1.003-.895 1.302-1.697" fill="#5382A1"/>
            <path d="M162.439.371s35.887 35.9-34.037 91.101c-56.071 44.282-12.786 69.53-.023 98.377-32.73-29.53-56.75-55.526-40.635-79.72C111.395 74.612 176.918 57.393 162.439.37" fill="#E76F00"/>
            <path d="M95.268 344.665c62.199 3.982 157.712-2.209 159.974-31.64 0 0-4.348 11.158-51.404 20.018-53.088 9.99-118.564 8.824-157.399 2.421 0 0 7.95 6.58 48.83 9.201" fill="#5382A1"/>
        </svg>`,

        'cpp': `<svg width="16" height="16" viewBox="0 0 256 288" fill="none">
            <path d="M255.569 84.452c-.002-4.83-1.035-9.098-3.124-12.76l-.07-.126c-2.06-3.607-5.16-6.69-9.261-9.06L135.987 3.378c-8.344-4.817-18.555-4.82-26.886-.005L1.975 62.505c-8.341 4.817-13.49 13.71-13.494 23.283L.001 201.14c0 4.832 1.035 9.1 3.124 12.763l.088.152c2.052 3.59 5.143 6.665 9.235 9.03l107.126 59.127c8.346 4.818 18.556 4.822 26.887.005l107.126-59.128c4.093-2.364 7.183-5.44 9.235-9.031l.088-.152c2.089-3.662 3.124-7.931 3.124-12.763l.535-116.568z" fill="#00599C"/>
            <path d="M128.182 143.241L2.988 215.197c2.052 3.59 5.143 6.665 9.235 9.031l107.126 59.127c8.346 4.818 18.556 4.822 26.887.005l107.126-59.128c4.093-2.364 7.183-5.44 9.235-9.031L128.182 143.24z" fill="#004482"/>
            <path d="M91.101 164.861c7.428 12.862 21.281 21.471 37.081 21.471 15.8 0 29.653-8.61 37.08-21.471l54.442 31.419c-14.856 25.697-42.527 42.941-74.323 42.941-31.797 0-59.467-17.244-74.323-42.941l20.043-31.419z" fill="#fff"/>
            <path d="M128.182 75.509c23.63 0 42.79 19.162 42.79 42.79 0 23.628-19.16 42.79-42.79 42.79-23.629 0-42.79-19.162-42.79-42.79 0-23.628 19.161-42.79 42.79-42.79zm0 21.395c11.815 0 21.396 9.58 21.396 21.395 0 11.815-9.58 21.396-21.396 21.396-11.815 0-21.395-9.581-21.395-21.396 0-11.815 9.58-21.395 21.395-21.395z" fill="#fff"/>
            <path d="M198.43 109.887h8.555v8.556h8.556v-8.556h8.555v-8.555h-8.555v-8.556h-8.556v8.556h-8.556v8.555zm-34.222 0h8.556v8.556h8.555v-8.556h8.556v-8.555h-8.556v-8.556h-8.555v8.556h-8.556v8.555z" fill="#fff"/>
        </svg>`,

        'c': `<svg width="16" height="16" viewBox="0 0 256 288" fill="none">
            <path d="M255.569 84.452c-.002-4.83-1.035-9.098-3.124-12.76l-.07-.126c-2.06-3.607-5.16-6.69-9.261-9.06L135.987 3.378c-8.344-4.817-18.555-4.82-26.886-.005L1.975 62.505c-8.341 4.817-13.49 13.71-13.494 23.283L.001 201.14c0 4.832 1.035 9.1 3.124 12.763l.088.152c2.052 3.59 5.143 6.665 9.235 9.03l107.126 59.127c8.346 4.818 18.556 4.822 26.887.005l107.126-59.128c4.093-2.364 7.183-5.44 9.235-9.031l.088-.152c2.089-3.662 3.124-7.931 3.124-12.763l.535-116.568z" fill="#A8B9CC"/>
            <path d="M128.182 143.241L2.988 215.197c2.052 3.59 5.143 6.665 9.235 9.031l107.126 59.127c8.346 4.818 18.556 4.822 26.887.005l107.126-59.128c4.093-2.364 7.183-5.44 9.235-9.031L128.182 143.24z" fill="#7D8B99"/>
            <path d="M91.101 164.861c7.428 12.862 21.281 21.471 37.081 21.471 15.8 0 29.653-8.61 37.08-21.471l54.442 31.419c-14.856 25.697-42.527 42.941-74.323 42.941-31.797 0-59.467-17.244-74.323-42.941l20.043-31.419z" fill="#fff"/>
            <path d="M128.182 75.509c23.63 0 42.79 19.162 42.79 42.79 0 23.628-19.16 42.79-42.79 42.79-23.629 0-42.79-19.162-42.79-42.79 0-23.628 19.161-42.79 42.79-42.79zm0 21.395c11.815 0 21.396 9.58 21.396 21.395 0 11.815-9.58 21.396-21.396 21.396-11.815 0-21.395-9.581-21.395-21.396 0-11.815 9.58-21.395 21.395-21.395z" fill="#fff"/>
        </svg>`,

        'cs': `<svg width="16" height="16" viewBox="0 0 256 288" fill="none">
            <path d="M255.569 84.452c-.002-4.83-1.035-9.098-3.124-12.76l-.07-.126c-2.06-3.607-5.16-6.69-9.261-9.06L135.987 3.378c-8.344-4.817-18.555-4.82-26.886-.005L1.975 62.505c-8.341 4.817-13.49 13.71-13.494 23.283L.001 201.14c0 4.832 1.035 9.1 3.124 12.763l.088.152c2.052 3.59 5.143 6.665 9.235 9.03l107.126 59.127c8.346 4.818 18.556 4.822 26.887.005l107.126-59.128c4.093-2.364 7.183-5.44 9.235-9.031l.088-.152c2.089-3.662 3.124-7.931 3.124-12.763l.535-116.568z" fill="#68217A"/>
            <path d="M128.182 143.241L2.988 215.197c2.052 3.59 5.143 6.665 9.235 9.031l107.126 59.127c8.346 4.818 18.556 4.822 26.887.005l107.126-59.128c4.093-2.364 7.183-5.44 9.235-9.031L128.182 143.24z" fill="#521C6E"/>
            <path d="M91.101 164.861c7.428 12.862 21.281 21.471 37.081 21.471 15.8 0 29.653-8.61 37.08-21.471l54.442 31.419c-14.856 25.697-42.527 42.941-74.323 42.941-31.797 0-59.467-17.244-74.323-42.941l20.043-31.419z" fill="#fff"/>
            <path d="M128.182 75.509c23.63 0 42.79 19.162 42.79 42.79 0 23.628-19.16 42.79-42.79 42.79-23.629 0-42.79-19.162-42.79-42.79 0-23.628 19.161-42.79 42.79-42.79zm0 21.395c11.815 0 21.396 9.58 21.396 21.395 0 11.815-9.58 21.396-21.396 21.396-11.815 0-21.395-9.581-21.395-21.396 0-11.815 9.58-21.395 21.395-21.395z" fill="#fff"/>
            <path d="M198.43 109.887h8.555v8.556h8.556v-8.556h8.555v-8.555h-8.555v-8.556h-8.556v8.556h-8.556v8.555z" fill="#fff"/>
        </svg>`,

        'html': `<svg width="16" height="16" viewBox="0 0 256 361" fill="none">
            <path d="M255.555 70.766l-23.241 260.36-104.47 28.962-104.182-28.922L.445 70.766h255.11z" fill="#E44D26"/>
            <path d="M128 337.95l84.417-23.403 19.86-222.49H128V337.95z" fill="#F16529"/>
            <path d="M82.82 155.932H128v-31.937H47.917l.764 8.568 7.85 87.995H128v-31.937H86.396l-3.576-32.689zM90.018 236.542l-4.432-49.66h-31.96l7.7 86.258L127.553 292.5v-33.257l-.199.053-37.336-9.892z" fill="#EBEBEB"/>
            <path d="M24.18 0h45.385v22.458H46.56v22.458h22.946v22.457H24.18V0zm57.502 0h45.326v19.588h-22.87v5.063h22.87v44.915h-45.326v-20.529h22.87v-5.064h-22.87V0zm57.444 0h45.385v19.588h-22.87v5.063h22.87v44.915h-45.385V49.651h22.928v-5.064h-22.928V0z" fill="#000"/>
            <path d="M128 220.573h39.327l-3.708 41.42-35.62 9.614v33.226l65.473-18.145.48-5.396 7.506-84.08.779-8.576H128v31.937zm0-64.641v31.937h78.808l.649-7.27 1.473-16.437.764-8.23H128z" fill="#fff"/>
        </svg>`,

        'css': `<svg width="16" height="16" viewBox="0 0 256 361" fill="none">
            <path d="M255.555 70.766l-23.241 260.36-104.47 28.962-104.182-28.922L.445 70.766h255.11z" fill="#264DE4"/>
            <path d="M128 337.95l84.417-23.403 19.86-222.49H128V337.95z" fill="#2965F1"/>
            <path d="M56.047 187.869l3.765 42.065 68.2 18.906v-33.97l-.164.043-37.152-10.038-2.38-26.63H56.047zm-8.003-89.427l3.828 42.065H128v-42.065H48.044zm79.956 98.79v42.648l.132-.037 68.645-19.065 5.064-56.713H128v33.167z" fill="#EBEBEB"/>
            <path d="M24.163 0H68.95v22.458H46.604v22.458h22.345v22.457H24.163V0zm56.807 0h44.787v19.572H103.41v5.08h22.346v44.914H80.97V49.652h22.346v-5.12H80.97V0zm56.866 0h44.727v19.572h-22.345v5.08h22.345v44.914h-44.727V49.652h22.345v-5.12h-22.345V0z" fill="#000"/>
            <path d="M128 187.869v42.065h35.716l-3.37 37.641L128 277.534v33.97l68.38-18.953.504-5.63 7.834-87.655.813-9.397H128zm0-89.427v42.065h79.682l.659-7.359 1.501-16.76.777-8.349.652-9.597H128z" fill="#fff"/>
        </svg>`,

        'php': `<svg width="16" height="16" viewBox="0 0 256 134" fill="none">
            <ellipse cx="128" cy="66.63" rx="128" ry="66.63" fill="#777BB4"/>
            <path d="M35.945 106.082l14.028-71.014h29.077c14.467 0 24.457 5.85 21.253 21.815-3.87 19.31-18.8 24.326-33.186 24.072l-5.476 25.127H35.945zm24.891-39.263l-3.477 17.219h8.563c8.14 0 14.98-2.466 16.423-10.098 1.467-7.746-4.261-7.121-10.977-7.121h-10.532z" fill="#fff"/>
            <path d="M94.088 67.202L108.117 0h25.697l-3.322 16.829h11.357c13.413 0 21.426 5.127 18.818 18.472l-7.456 31.901h-26.004l6.786-28.874c1.025-4.373.617-6.31-4.507-6.31h-7.473l-8.544 35.184H94.088z" fill="#fff"/>
            <path d="M153.315 106.082l14.028-71.014h29.077c14.467 0 24.457 5.85 21.253 21.815-3.87 19.31-18.8 24.326-33.186 24.072l-5.476 25.127h-25.696zm24.891-39.263l-3.477 17.219h8.563c8.14 0 14.98-2.466 16.423-10.098 1.467-7.746-4.261-7.121-10.977-7.121h-10.532z" fill="#fff"/>
        </svg>`,

        'rb': `<svg width="16" height="16" viewBox="0 0 256 255" fill="none">
            <defs>
                <linearGradient id="rbGrad1" x1="16.04%" y1="73.89%" x2="98.28%" y2="8.25%">
                    <stop offset="0%" stop-color="#FB7655"/>
                    <stop offset="0%" stop-color="#FB7655"/>
                    <stop offset="41%" stop-color="#E42B1E"/>
                    <stop offset="99%" stop-color="#900"/>
                    <stop offset="100%" stop-color="#900"/>
                </linearGradient>
                <linearGradient id="rbGrad2" x1="17.57%" y1="1.58%" x2="58.78%" y2="92.99%">
                    <stop offset="0%" stop-color="#871101"/>
                    <stop offset="99%" stop-color="#911209"/>
                    <stop offset="100%" stop-color="#911209"/>
                </linearGradient>
            </defs>
            <path d="M197.467 167.764l-145.52 86.41 188.422-12.787L254.88 51.393l-57.413 116.37z" fill="url(#rbGrad2)"/>
            <path d="M240.677 241.257L224.482 129.48l-44.113 58.25 60.308 53.527z" fill="#900"/>
            <path d="M240.896 241.257l-118.646-9.313-69.674 21.986 188.32-12.673z" fill="#AB5C16"/>
            <path d="M52.744 253.955l29.64-82.636L16.26 191.19l36.484 62.765z" fill="#9E1209"/>
            <path d="M180.358 188.05L153.085 81.226l-78.076 73.874 105.349 32.95z" fill="url(#rbGrad1)"/>
            <path d="M248.693 82.292l-73.834-60.3-20.183 65.236 94.017-4.936z" fill="#9E1209"/>
            <path d="M214.191.99L170.8 26.315l4.076-4.343L214.191.99z" fill="#9E1209"/>
            <path d="M0 203.372l16.26-12.182-4.926-33.76L0 203.373z" fill="#871101"/>
        </svg>`,

        'go': `<svg width="16" height="16" viewBox="0 0 256 348" fill="none">
            <path d="M3.2 188.4c-.5 0-.5-.3-.2-.6l2.3-3c.3-.3.9-.6 1.4-.6h39.6c.5 0 .7.4.5.7l-1.9 2.8c-.3.4-.9.7-1.3.7L3.2 188.4z" fill="#00ACD7"/>
            <path d="M.6 200.2c-.5 0-.5-.3-.2-.6l2.3-3c.3-.3.9-.6 1.4-.6h50.7c.5 0 .7.4.6.7l-.9 2.6c-.1.5-.6.8-1.1.8L.6 200.2z" fill="#00ACD7"/>
            <path d="M18 212c-.5 0-.5-.4-.2-.7l1.5-2.8c.3-.4.8-.7 1.4-.7h22.2c.5 0 .7.4.7.8l-.3 2.7c0 .5-.5.8-.9.8L18 212z" fill="#00ACD7"/>
            <path d="M126.5 185.1c-19.3 5.1-32.4 8.5-51.7 13.7-4.8 1.3-5.1 1.4-9.1-3.3-4.8-5.6-8.4-9.3-15.2-12.8-20.6-10.6-40.5-7.5-58.8 4.1-21.9 13.8-33.1 34.2-32.7 59 .4 24.4 17.2 44.5 41.2 47.9 20.5 2.9 37.5-4.5 51-19.9 2.8-3.2 5.3-6.7 8.2-10.5H40.7c-6.7 0-8.3-4.2-6.1-9.7 4.1-10.1 11.8-27 16.3-35.5 1-1.9 3.3-5.1 8.5-5.1h82.8c-.5 5.6-1.1 11.1-2.2 16.6-3.3 16.8-10.5 32.1-20.8 45.7-16.8 22.1-38.4 37-64.8 43.1-21.8 5-42.8 3.1-61.6-10.2C-23 296.8-29.4 278-28.7 256c.9-28.8 13-52.7 33.2-72.3 22.2-21.5 49.2-33.7 80.3-34.9 23.1-.9 43.9 5.2 61.5 20.9 3.1 2.8 6 5.9 9.2 9.2V185.1z" fill="#00ACD7"/>
            <path d="M160.2 281.7c-17.4-.4-33.1-5-47-15.8-12-9.3-19.5-21.5-21.5-36.7-2.7-20.4 4.5-37.3 18.6-51.3 15.1-15.1 33.6-22.6 54.9-23.5 18.7-.8 35.6 3.9 49.7 17 15.6 14.5 22.1 33 19.3 54.2-3.3 25-16.5 43.4-37.8 55.8-12.4 7.2-25.8 10.6-36.2 10.3zm37.8-73c-.3-3.5-.4-6.2-1-8.8-5.4-22.6-28.8-33.7-49.6-23.5-13.7 6.7-21.2 18.3-22 33.7-.7 12.9 5.6 25.4 16.9 31.7 9.8 5.4 19.9 5.6 30 .8 15.3-7.3 24.3-19.3 25.7-33.9z" fill="#00ACD7"/>
        </svg>`,

        'rs': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none">
            <path d="M128.088 0C57.328 0 0 57.328 0 128.088s57.328 128.088 128.088 128.088 128.088-57.328 128.088-128.088S198.848 0 128.088 0z" fill="#000"/>
            <path d="M128.088 13.394c63.29 0 114.694 51.404 114.694 114.694s-51.404 114.694-114.694 114.694S13.394 191.378 13.394 128.088 64.798 13.394 128.088 13.394z" fill="#000"/>
            <g fill="#fff">
                <path d="M226.744 140.566l-10.588-3.022c-.338-1.352-.731-2.687-1.168-4.006l6.267-9.154c1.048-1.531.82-3.588-.534-4.83l-8.416-7.72c-1.352-1.242-3.426-1.311-4.875-.152l-8.691 6.957c-1.127-.837-2.289-1.637-3.482-2.397l1.53-10.84c.259-1.832-.843-3.582-2.578-4.098l-10.782-3.207c-1.734-.516-3.579.286-4.312 1.906l-4.41 9.744c-1.338-.215-2.69-.376-4.053-.486l-4.656-9.831a3.393 3.393 0 00-4.167-1.79l-10.654 3.399c-1.687.538-2.72 2.234-2.426 3.963l1.78 10.464c-1.14.595-2.255 1.23-3.339 1.907l-8.274-6.616c-1.39-1.112-3.401-1.001-4.666.263l-7.854 7.854c-1.264 1.265-1.375 3.276-.263 4.666l6.616 8.274c-.677 1.084-1.312 2.199-1.907 3.339l-10.464-1.78c-1.729-.294-3.425.739-3.963 2.426l-3.399 10.654a3.393 3.393 0 001.79 4.167l9.831 4.656c.11 1.363.271 2.715.486 4.053l-9.744 4.41c-1.62.733-2.422 2.578-1.906 4.312l3.207 10.782c.516 1.735 2.266 2.837 4.098 2.578l10.84-1.53c.76 1.193 1.56 2.355 2.397 3.482l-6.957 8.691c-1.159 1.449-1.09 3.523.152 4.875l7.72 8.416c1.242 1.354 3.299 1.582 4.83.534l9.154-6.267c1.319.437 2.654.83 4.006 1.168l3.022 10.588c.508 1.78 2.238 2.938 4.082 2.742l11.27-1.209c1.844-.198 3.267-1.662 3.353-3.458l.513-10.78c1.353-.364 2.688-.782 4.001-1.249l7.562 7.89c1.267 1.321 3.342 1.556 4.854.534l9.135-6.17c1.512-1.022 2.095-2.94 1.351-4.562l-4.462-9.716c.965-.893 1.895-1.822 2.788-2.788l9.716 4.462c1.622.744 3.54.161 4.562-1.35l6.17-9.136c1.022-1.512.787-3.587-.534-4.854l-7.89-7.562c.467-1.313.885-2.648 1.249-4.001l10.78-.513c1.796-.086 3.26-1.51 3.458-3.353l1.209-11.27c.198-1.844-1.062-3.574-2.842-4.082z"/>
                <circle cx="128.088" cy="128.088" r="20.677" fill="#000" stroke="#fff" stroke-width="12"/>
            </g>
        </svg>`,

        'swift': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none">
            <defs>
                <linearGradient id="swiftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#F88A36"/>
                    <stop offset="100%" stop-color="#FD2020"/>
                </linearGradient>
            </defs>
            <rect width="256" height="256" rx="56" fill="url(#swiftGrad)"/>
            <path d="M169.186 187.007c-1.094 3.555-4.32 9.91-14.267 16.465-10.663 7.028-22.534 7.635-28.002 7.4-26.577-1.14-51.28-16.563-68.96-35.89 0 0 37.153 24.72 69.088 9.72-20.063-12.152-37.47-28.595-51.36-47.86 0 0 26.28 20.06 45.53 26.48-1.33-.87-2.65-1.81-3.93-2.83C90.635 138.87 68.29 99.485 63.78 78.06c13.155 16.47 46.362 47.16 46.362 47.16-11.92-14.78-18.59-33.97-18.59-33.97 16.89 18.14 37.3 32.78 60.71 40.73 2.08.7 4.17 1.32 6.3 1.82-1.97-7.15-2.44-14.95-.55-23.03 4.72-20.21 19.75-34.6 19.75-34.6-3.65 12.06-2.47 25.45 4.97 36.01 10.1 14.35 27.3 19.12 27.3 19.12-6.92 3.71-15.7 4.23-24.18 2.29-.2-.05-.4-.1-.61-.16.62 1.08 1.13 2.1 1.49 3.04 2.19 5.71 1.61 11.37-1.79 17.62-3.36 6.17-9.4 11.23-15.76 12.91z" fill="#fff"/>
        </svg>`,

        'kt': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none">
            <defs>
                <linearGradient id="ktGrad1" x1="50.003%" y1="1.019%" x2="50.003%" y2="100.03%">
                    <stop offset="9.677%" stop-color="#E44857"/>
                    <stop offset="30.07%" stop-color="#C711E1"/>
                    <stop offset="100%" stop-color="#7F52FF"/>
                </linearGradient>
            </defs>
            <path d="M256 256H0V0h256L128 127.949 256 256z" fill="url(#ktGrad1)"/>
        </svg>`,

        'dart': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none">
            <defs>
                <radialGradient id="dartGrad" cx="27.59%" cy="34.34%" r="72.41%">
                    <stop offset="0%" stop-color="#FFF" stop-opacity=".1"/>
                    <stop offset="100%" stop-color="#FFF" stop-opacity="0"/>
                </radialGradient>
            </defs>
            <path d="M67.262 0H196.85l58.386 58.386v130.474L196.85 256H67.262L0 188.86V58.386L67.262 0z" fill="#01579B"/>
            <path d="M196.85 0L67.262 0 0 58.386h128.494L196.85 0z" fill="#40C4FF"/>
            <path d="M0 58.386v130.474L67.262 256V67.262L0 58.386z" fill="#40C4FF"/>
            <path d="M67.262 256h129.588l58.386-67.14H67.262V256z" fill="#29B6F6"/>
            <path d="M255.236 188.86V58.386L196.85 0v188.86h58.386z" fill="#01579B"/>
            <path d="M67.262 67.262v121.598h129.588V67.262H67.262z" fill="#fff" fill-opacity=".2"/>
        </svg>`,

        'sql': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none">
            <ellipse cx="128" cy="48" rx="112" ry="40" fill="#00758F"/>
            <path d="M16 48v160c0 22.091 50.144 40 112 40s112-17.909 112-40V48c0 22.091-50.144 40-112 40S16 70.091 16 48z" fill="#00758F"/>
            <ellipse cx="128" cy="48" rx="112" ry="40" fill="#00A4C7"/>
            <path d="M16 108c0 22.091 50.144 40 112 40s112-17.909 112-40" stroke="#006880" stroke-width="2" fill="none" opacity=".5"/>
            <path d="M16 158c0 22.091 50.144 40 112 40s112-17.909 112-40" stroke="#006880" stroke-width="2" fill="none" opacity=".5"/>
        </svg>`,

        'sh': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none">
            <rect x="4" y="20" width="248" height="216" rx="16" fill="#2B2B2B"/>
            <rect x="4" y="20" width="248" height="40" rx="16" fill="#4A4A4A"/>
            <rect x="4" y="44" width="248" height="16" fill="#4A4A4A"/>
            <circle cx="32" cy="40" r="8" fill="#FF5F56"/>
            <circle cx="56" cy="40" r="8" fill="#FFBD2E"/>
            <circle cx="80" cy="40" r="8" fill="#27CA40"/>
            <path d="M44 108l36 24-36 24" stroke="#27CA40" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M100 164h56" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
        </svg>`,

        'json': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none">
            <rect width="256" height="256" rx="24" fill="#292929"/>
            <path d="M142.887 218.776c-20.099 0-32.57-11.164-32.57-28.858v-21.38c0-10.496-4.672-15.743-14.16-15.743v-17.59c9.488 0 14.16-5.247 14.16-15.743v-21.38c0-17.694 12.471-28.858 32.57-28.858v17.59c-9.537 0-14.741 4.72-14.741 13.352v22.94c0 11.164-4.432 18.598-13.824 22.076 9.392 3.478 13.824 10.912 13.824 22.076v22.94c0 8.632 5.204 13.352 14.741 13.352v17.221z" fill="#fff"/>
            <path d="M113.113 218.776v-17.221c9.537 0 14.741-4.72 14.741-13.352v-22.94c0-11.164 4.432-18.598 13.824-22.076-9.392-3.478-13.824-10.912-13.824-22.076v-22.94c0-8.632-5.204-13.352-14.741-13.352V67.224c20.099 0 32.57 11.164 32.57 28.858v21.38c0 10.496 4.672 15.743 14.16 15.743v17.59c-9.488 0-14.16 5.247-14.16 15.743v21.38c0 17.694-12.471 28.858-32.57 28.858z" fill="#fff"/>
        </svg>`,

        'xml': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none">
            <rect width="256" height="256" rx="24" fill="#FF6600"/>
            <path d="M80 72l-48 56 48 56" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M176 72l48 56-48 56" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M152 48l-48 160" stroke="#fff" stroke-width="12" stroke-linecap="round"/>
        </svg>`,

        'yml': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none">
            <rect width="256" height="256" rx="24" fill="#CB171E"/>
            <path d="M60 80l40 48v48" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M140 80l-40 48" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M152 80v96" stroke="#fff" stroke-width="14" stroke-linecap="round" fill="none"/>
            <path d="M172 80v96h40" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`,

        'yaml': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none">
            <rect width="256" height="256" rx="24" fill="#CB171E"/>
            <path d="M60 80l40 48v48" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M140 80l-40 48" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M152 80v96" stroke="#fff" stroke-width="14" stroke-linecap="round" fill="none"/>
            <path d="M172 80v96h40" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`,

        'md': `<svg width="16" height="16" viewBox="0 0 256 158" fill="none">
            <rect x="4" y="4" width="248" height="150" rx="16" stroke="#185ABD" stroke-width="8" fill="none"/>
            <path d="M40 118V40l36 48 36-48v78" stroke="#185ABD" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M168 80h40m-20-20v62" stroke="#185ABD" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,

        'default': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none">
            <path d="M48 16C48 7.163 55.163 0 64 0h96l80 80v160c0 8.837-7.163 16-16 16H64c-8.837 0-16-7.163-16-16V16z" fill="#90A4AE"/>
            <path d="M160 0v64c0 8.837 7.163 16 16 16h64L160 0z" fill="#B0BEC5"/>
        </svg>`
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
            // Use innerHTML for SVG icons
            tabIcon.innerHTML = fileIcons[ext] || fileIcons['default'];
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

    /**
     * Get available file extensions for icon lookup
     */
    function getSupportedExtensions() {
        return Object.keys(fileIcons).filter(ext => ext !== 'default');
    }

    /**
     * Get icon SVG string for a given extension
     */
    function getIconForExtension(ext) {
        return fileIcons[ext.toLowerCase()] || fileIcons['default'];
    }

    /**
     * Get display name for a language ID
     */
    function getLanguageName(langId) {
        return languageNames[langId] || langId;
    }

    /**
     * Get current line count in the editor
     */
    function getLineCount() {
        return currentLineCount;
    }

    /**
     * Remove a specific line from the editor
     */
    function removeLine(lineNumber) {
        const lineDivs = codeArea.querySelectorAll('.code-line');
        if (lineNumber > 0 && lineNumber <= lineDivs.length) {
            lineDivs[lineNumber - 1].remove();
            // Renumber remaining lines
            const remaining = codeArea.querySelectorAll('.code-line');
            remaining.forEach((div, idx) => {
                const num = idx + 1;
                div.setAttribute('data-line', num);
                div.querySelector('.line-number').textContent = num;
            });
            currentLineCount = remaining.length;
        }
    }

    /**
     * Clear all lines from the editor
     */
    function clearAllLines() {
        codeArea.innerHTML = '';
        currentLineCount = 0;
    }

    /**
     * Insert a line at a specific position
     */
    function insertLineAt(lineNumber, html, showCursor) {
        const lineDivs = codeArea.querySelectorAll('.code-line');

        const lineDiv = document.createElement('div');
        lineDiv.className = 'code-line';
        lineDiv.setAttribute('data-line', lineNumber);

        const numSpan = document.createElement('span');
        numSpan.className = 'line-number';
        numSpan.textContent = lineNumber;

        const contentSpan = document.createElement('span');
        contentSpan.className = 'line-content';

        if (showCursor) {
            contentSpan.innerHTML = (html || '') + '<span class="cursor blink">█</span>';
        } else {
            contentSpan.innerHTML = html || '';
        }

        lineDiv.appendChild(numSpan);
        lineDiv.appendChild(contentSpan);

        if (lineNumber - 1 < lineDivs.length) {
            codeArea.insertBefore(lineDiv, lineDivs[lineNumber - 1]);
        } else {
            codeArea.appendChild(lineDiv);
        }

        // Renumber all lines
        const allLines = codeArea.querySelectorAll('.code-line');
        allLines.forEach((div, idx) => {
            const num = idx + 1;
            div.setAttribute('data-line', num);
            div.querySelector('.line-number').textContent = num;
        });
        currentLineCount = allLines.length;

        return contentSpan;
    }

    /**
     * Scroll to a specific line number
     */
    function scrollToLine(lineNumber) {
        if (!editorBody) return;
        const lineDivs = codeArea.querySelectorAll('.code-line');
        if (lineNumber > 0 && lineNumber <= lineDivs.length) {
            const targetLine = lineDivs[lineNumber - 1];
            const lineTop = targetLine.offsetTop;
            const lineHeight = targetLine.offsetHeight;
            const containerHeight = editorBody.clientHeight;

            // Center the line in the viewport
            editorBody.scrollTop = lineTop - (containerHeight / 2) + (lineHeight / 2);
        }
    }

    /**
     * Highlight a specific line (add a highlight class)
     */
    function highlightLine(lineNumber, className) {
        const highlightClass = className || 'line-highlight';
        const lineDivs = codeArea.querySelectorAll('.code-line');
        if (lineNumber > 0 && lineNumber <= lineDivs.length) {
            lineDivs[lineNumber - 1].classList.add(highlightClass);
        }
    }

    /**
     * Remove highlight from a specific line
     */
    function unhighlightLine(lineNumber, className) {
        const highlightClass = className || 'line-highlight';
        const lineDivs = codeArea.querySelectorAll('.code-line');
        if (lineNumber > 0 && lineNumber <= lineDivs.length) {
            lineDivs[lineNumber - 1].classList.remove(highlightClass);
        }
    }

    /**
     * Remove all highlights from all lines
     */
    function clearAllHighlights(className) {
        const highlightClass = className || 'line-highlight';
        const highlighted = codeArea.querySelectorAll('.' + highlightClass);
        highlighted.forEach(el => el.classList.remove(highlightClass));
    }

    /**
     * Get the plain text content of all lines
     */
    function getAllText() {
        const lineDivs = codeArea.querySelectorAll('.code-line');
        const lines = [];
        lineDivs.forEach(div => {
            const content = div.querySelector('.line-content');
            if (content) {
                // Clone and remove cursor before getting text
                const clone = content.cloneNode(true);
                const cursors = clone.querySelectorAll('.cursor');
                cursors.forEach(c => c.remove());
                lines.push(clone.textContent);
            }
        });
        return lines.join('\n');
    }

    /**
     * Get text content of a specific line
     */
    function getLineText(lineNumber) {
        const contentEl = getLineContent(lineNumber);
        if (contentEl) {
            const clone = contentEl.cloneNode(true);
            const cursors = clone.querySelectorAll('.cursor');
            cursors.forEach(c => c.remove());
            return clone.textContent;
        }
        return '';
    }

    /**
     * Set the editor body scroll position
     */
    function setScrollPosition(top) {
        if (editorBody) {
            editorBody.scrollTop = top;
        }
    }

    /**
     * Get the editor body scroll position
     */
    function getScrollPosition() {
        return editorBody ? editorBody.scrollTop : 0;
    }

    /**
     * Animate a smooth scroll to bottom
     */
    function smoothScrollToBottom() {
        if (!editorBody) return;
        editorBody.scrollTo({
            top: editorBody.scrollHeight,
            behavior: 'smooth'
        });
    }

    /**
     * Apply a theme class to the editor window
     */
    function setTheme(themeName) {
        if (editorWindow) {
            // Remove existing theme classes
            editorWindow.className = editorWindow.className
                .replace(/theme-\S+/g, '')
                .trim();
            if (themeName) {
                editorWindow.classList.add('theme-' + themeName);
            }
        }
    }

    /**
     * Toggle minimap visibility (if implemented in CSS)
     */
    function toggleMinimap(show) {
        if (editorWindow) {
            if (show) {
                editorWindow.classList.add('show-minimap');
            } else {
                editorWindow.classList.remove('show-minimap');
            }
        }
    }

    /**
     * Set editor font size
     */
    function setFontSize(size) {
        if (codeArea) {
            codeArea.style.fontSize = size + 'px';
        }
    }

    /**
     * Get editor font size
     */
    function getFontSize() {
        if (codeArea) {
            return parseFloat(window.getComputedStyle(codeArea).fontSize);
        }
        return 14; // default
    }

    /**
     * Set line height
     */
    function setLineHeight(height) {
        if (codeArea) {
            codeArea.style.lineHeight = height;
        }
    }

    /**
     * Toggle word wrap
     */
    function setWordWrap(enabled) {
        if (codeArea) {
            codeArea.style.whiteSpace = enabled ? 'pre-wrap' : 'pre';
            codeArea.style.wordBreak = enabled ? 'break-all' : 'normal';
        }
    }

    /**
     * Show or hide line numbers
     */
    function setLineNumbersVisible(visible) {
        const lineNumbers = codeArea.querySelectorAll('.line-number');
        lineNumbers.forEach(ln => {
            ln.style.display = visible ? '' : 'none';
        });
    }

    /**
     * Add a decoration/widget after a specific line
     */
    function addLineDecoration(lineNumber, decorationHTML) {
        const lineDivs = codeArea.querySelectorAll('.code-line');
        if (lineNumber > 0 && lineNumber <= lineDivs.length) {
            const decoration = document.createElement('div');
            decoration.className = 'line-decoration';
            decoration.innerHTML = decorationHTML;
            lineDivs[lineNumber - 1].appendChild(decoration);
        }
    }

    /**
     * Remove all decorations from a specific line
     */
    function removeLineDecorations(lineNumber) {
        const lineDivs = codeArea.querySelectorAll('.code-line');
        if (lineNumber > 0 && lineNumber <= lineDivs.length) {
            const decorations = lineDivs[lineNumber - 1].querySelectorAll('.line-decoration');
            decorations.forEach(d => d.remove());
        }
    }

    /**
     * Clear all decorations from all lines
     */
    function clearAllDecorations() {
        const decorations = codeArea.querySelectorAll('.line-decoration');
        decorations.forEach(d => d.remove());
    }

    /**
     * Set status bar custom text (e.g., for additional info)
     */
    function setStatusText(elementId, text) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = text;
        }
    }

    /**
     * Batch update lines for performance (reduces reflows)
     */
    function batchUpdate(callback) {
        if (codeArea) {
            // Temporarily hide to prevent layout thrashing
            const display = codeArea.style.display;
            codeArea.style.display = 'none';
            try {
                callback();
            } finally {
                codeArea.style.display = display;
            }
        }
    }

    /**
     * Dispose / cleanup
     */
    function dispose() {
        editorBody = null;
        codeArea = null;
        statusPosition = null;
        statusLanguage = null;
        tabName = null;
        tabIcon = null;
        editorWindow = null;
        currentLineCount = 0;
        clearTimeout(EditorUI._exitBtnTimeout);
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
        getSupportedExtensions,
        getIconForExtension,
        getLanguageName,
        getLineCount,
        removeLine,
        clearAllLines,
        insertLineAt,
        scrollToLine,
        highlightLine,
        unhighlightLine,
        clearAllHighlights,
        getAllText,
        getLineText,
        setScrollPosition,
        getScrollPosition,
        smoothScrollToBottom,
        setTheme,
        toggleMinimap,
        setFontSize,
        getFontSize,
        setLineHeight,
        setWordWrap,
        setLineNumbersVisible,
        addLineDecoration,
        removeLineDecorations,
        clearAllDecorations,
        setStatusText,
        batchUpdate,
        dispose,
        _exitBtnTimeout: null
    };

})();