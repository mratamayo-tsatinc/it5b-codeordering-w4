const EXERCISES = [
    'BasicStructure.java',
    'BasicStructureAndPrinting.java',
    'DeclaringConstant.java',
    'EscapeCharacters.java',
    'UserWelcomeBanner.java',
    'PrintTriangle.java',
    'StarryAscension.java',
    'RainbowArch.java',
    'PersonalInformationDisplay.java',
    'PersonalInformation.java',
    'InvoiceGeneration.java',
    'BookReservation.java',
    'UsingScanner.java',
    'WageCalculator.java',
    'CtoF.java',
    'CircleAreaCalculator.java',
    'CubeVolumeFinder.java',
    'NameInput.java',
    'ProductDiscountCalculator.java',
    'RectanglePerimeter.java',
    'StudentGradeAverager.java',
];
let studentDatabase = [];
let exerciseData = {}; 
let currentFile = "";
let currentUser = "";

// Settings and Mode Management
let appSettings = {
    mode: 'practice', // 'practice' or 'exam'
    timerMinutes: 15,
    autoShowSample: true // whether the console panel auto-opens when an exercise has sample output; device-based default set below
};

let timerIntervalId = null;
let timeRemaining = 0; // in seconds

window.onload = async function() {
    // Native HTML5 drag-and-drop (used for line ordering) does not fire on
    // touchscreens. Flag touch devices so CSS can hide the drag handle and
    // reveal the Up/Down buttons and Jump-to dropdown instead.
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouchDevice) {
        document.body.classList.add('touch-device');
    }

    // The sidebar defaults to open on desktop and closed on mobile, so the
    // hamburger button's label needs to match whichever is current.
    initSidebarToggleLabel();

    // The global "auto-show sample output" setting defaults to ON on
    // desktop (room to show it automatically) and OFF on mobile (screen
    // space is tight). It's a one-time default only — from here on it's a
    // normal setting the student can flip in the Settings modal, and the
    // drawer tab is always available to pull the console into view by hand
    // regardless of this setting.
    initSampleAutoShowDefault();

    try {
        const res = await fetch('students.csv');
        const text = await res.text();
        const rows = text.split('\n').slice(1);
        studentDatabase = rows.map(row => {
            const [email, id] = row.split(',');
            return { email: email?.trim(), id: id?.trim() };
        });
    } catch (err) { console.error("Database failed to load."); }
};

// --- HAMBURGER MENU / OFF-CANVAS SIDEBAR (mobile: overlay) ---
function openSidebar() {
    document.getElementById('sidebarNav').classList.add('sidebar-open');
    document.getElementById('sidebarBackdrop').classList.add('show');
    document.getElementById('sidebarToggleBtn').setAttribute('aria-expanded', 'true');
    document.getElementById('sidebarToggleBtn').setAttribute('aria-label', 'Hide exercise list');
    // Prevent the page behind the panel from scrolling while it's open
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    document.getElementById('sidebarNav').classList.remove('sidebar-open');
    document.getElementById('sidebarBackdrop').classList.remove('show');
    document.getElementById('sidebarToggleBtn').setAttribute('aria-expanded', 'false');
    document.getElementById('sidebarToggleBtn').setAttribute('aria-label', 'Show exercise list');
    document.body.style.overflow = '';
}

// --- LIVE TIMESTAMP (day, date, time — seconds re-animate on every tick) ---
function startUserClock() {
    updateUserTimestamp();
    setInterval(updateUserTimestamp, 1000);
}

function updateUserTimestamp() {
    const el = document.getElementById('userTimestamp');
    if (!el) return;

    const now = new Date();
    const dayName = now.toLocaleDateString(undefined, { weekday: 'long' });
    const dateStr = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

    let hours = now.getHours();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    el.innerHTML = `<div class="timestamp-date">${dayName}, ${dateStr}</div><div class="timestamp-time">${hours}:${minutes}<span class="timestamp-seconds" id="timestampSeconds">:${seconds}</span> ${period}</div>`;

    // Restart the pulse animation each tick so the seconds visibly "beat"
    // in sync with the clock, rather than animating once and going static.
    const secondsEl = document.getElementById('timestampSeconds');
    if (secondsEl) {
        secondsEl.classList.remove('tick');
        void secondsEl.offsetWidth; // force reflow to restart the CSS animation
        secondsEl.classList.add('tick');
    }
}

// --- SIDEBAR WATERMARK (screenshot deterrent) ---
// Renders a faint, randomly-generated QR-code-like pattern behind the
// sidebar. It isn't a real scannable code — it's just visual noise meant
// to make it obvious/awkward if a student tries to pass off an edited
// screenshot of their scores as the genuine app, since a fresh random
// pattern is drawn every login and a doctored screenshot would need to
// fake it convincingly too.
function classifyQrModule(x, y, moduleCount) {
    // Three finder-pattern corners (top-left, top-right, bottom-left),
    // each with a 1-module quiet border, like a real QR code.
    const finderZones = [
        { x0: 0, y0: 0 },
        { x0: moduleCount - 7, y0: 0 },
        { x0: 0, y0: moduleCount - 7 }
    ];

    for (const zone of finderZones) {
        const lx = x - zone.x0;
        const ly = y - zone.y0;
        if (lx >= -1 && lx <= 7 && ly >= -1 && ly <= 7) {
            if (lx < 0 || lx > 6 || ly < 0 || ly > 6) return 'blank'; // quiet zone
            const onBorder = (lx === 0 || lx === 6 || ly === 0 || ly === 6);
            const inCenter = (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4);
            return (onBorder || inCenter) ? 'filled' : 'blank';
        }
    }

    // Timing strips: alternating modules along row/column 6, outside the finders
    if (y === 6 || x === 6) {
        return ((x + y) % 2 === 0) ? 'filled' : 'blank';
    }

    return 'data';
}

function generateQrWatermarkDataUrl() {
    const moduleCount = 21;
    const moduleSize = 6;
    const size = moduleCount * moduleSize;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(98, 0, 238, 0.05)'; // subtle — matches the theme's primary color

    for (let y = 0; y < moduleCount; y++) {
        for (let x = 0; x < moduleCount; x++) {
            const type = classifyQrModule(x, y, moduleCount);
            let filled;
            if (type === 'filled') filled = true;
            else if (type === 'blank') filled = false;
            else filled = Math.random() < 0.42; // random "data" noise

            if (filled) {
                ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
            }
        }
    }

    return canvas.toDataURL('image/png');
}

function applySidebarWatermark() {
    const sidebar = document.getElementById('sidebarNav');
    if (!sidebar) return;
    sidebar.style.backgroundImage = `url(${generateQrWatermarkDataUrl()})`;
    sidebar.style.backgroundRepeat = 'repeat';
}

// --- SIDEBAR COLLAPSE (desktop: in-layout panel, no backdrop/scroll-lock) ---
function collapseDesktopSidebar() {
    document.getElementById('sidebarNav').classList.add('sidebar-collapsed');
    document.getElementById('sidebarToggleBtn').setAttribute('aria-expanded', 'false');
    document.getElementById('sidebarToggleBtn').setAttribute('aria-label', 'Show exercise list');
}

function expandDesktopSidebar() {
    document.getElementById('sidebarNav').classList.remove('sidebar-collapsed');
    document.getElementById('sidebarToggleBtn').setAttribute('aria-expanded', 'true');
    document.getElementById('sidebarToggleBtn').setAttribute('aria-label', 'Hide exercise list');
}

// Single entry point for the hamburger button. Behavior depends on viewport:
// on mobile the sidebar is an off-canvas overlay (hidden by default), on
// desktop it's a normal layout panel (visible by default) that can now be
// collapsed to reclaim horizontal space.
function toggleSidebar() {
    const sidebar = document.getElementById('sidebarNav');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
        if (sidebar.classList.contains('sidebar-open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    } else {
        if (sidebar.classList.contains('sidebar-collapsed')) {
            expandDesktopSidebar();
        } else {
            collapseDesktopSidebar();
        }
    }
}

// Set the hamburger button's initial label to match each breakpoint's
// default sidebar state (open on desktop, closed on mobile) — otherwise
// the aria-label baked into the HTML would only be correct for mobile.
function initSidebarToggleLabel() {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const btn = document.getElementById('sidebarToggleBtn');
    if (!btn) return;
    if (isMobile) {
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Show exercise list');
    } else {
        btn.setAttribute('aria-expanded', 'true');
        btn.setAttribute('aria-label', 'Hide exercise list');
    }
}

// --- SAMPLE OUTPUT: GLOBAL AUTO-SHOW SETTING ---
// This is a global preference (configured in the Settings modal) rather
// than a per-exercise control: it decides whether the console panel opens
// automatically whenever the student switches to an activity that has
// sample output. Manually pulling the panel into view for any individual
// activity is handled separately by the drawer tab.
function initSampleAutoShowDefault() {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    appSettings.autoShowSample = !isMobile;
}

function applyAutoShowForCurrentExercise() {
    if (!currentFile) return;
    const ex = exerciseData[currentFile];
    const hasSampleOutput = !!(ex && ex.sampleOutput && ex.sampleOutput.trim().length > 0);
    if (hasSampleOutput && appSettings.autoShowSample) {
        showSampleOutput(currentFile);
    } else {
        closeSampleOutputModal();
    }
}

// Close the off-canvas panel automatically after picking an exercise, but
// only on screens narrow enough that the sidebar is an overlay in the
// first place — on desktop the sidebar stays put (collapsing is a manual,
// explicit choice there, not something exercise selection should trigger).
function closeSidebarIfMobile() {
    if (window.matchMedia('(max-width: 768px)').matches) {
        closeSidebar();
    }
}

// Close on Escape for keyboard users (mobile overlay only — desktop's
// collapsed sidebar isn't a modal, so Escape shouldn't touch it)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const sidebar = document.getElementById('sidebarNav');
        if (sidebar && sidebar.classList.contains('sidebar-open')) {
            closeSidebar();
        }
        const consolePanel = document.getElementById('sampleOutputPanel');
        if (consolePanel && consolePanel.classList.contains('open')) {
            closeSampleOutputModal();
        }
    }
});

function handleLogin() {
    const email = document.getElementById('emailInput').value.trim();
    const id = document.getElementById('studentNumInput').value.trim();
    const user = studentDatabase.find(s => s.email === email && s.id === id);
    
    if (user) {
        currentUser = email;
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        document.getElementById('userDisplay').textContent = email;
        startUserClock();
        applySidebarWatermark();
        loadAllExercises();
        
        // Start timer if in exam mode
        if (appSettings.mode === 'exam') {
            startTimer();
        }
    } else {
        const errorEl = document.getElementById('loginError');
        errorEl.textContent = "❌ Invalid email or student number. Please try again.";
        errorEl.className = "error-text show";
    }
}

async function loadAllExercises() {
    const list = document.getElementById('fileList');
    list.innerHTML = ""; 
    document.getElementById('loader').style.display = 'block';

    for (const fileName of EXERCISES) {
        try {
            const res = await fetch('./exercises/' + fileName);
            const code = await res.text();
            exerciseData[fileName] = parseJavaCode(code);

            const li = document.createElement('li');
            const safeId = fileName.replace(/\./g, '-');
            li.id = `nav-${safeId}`;
            
            li.innerHTML = `
                <span>${fileName.replace('.java', '')}</span>
                <span class="nav-score" id="score-${safeId}">0/${exerciseData[fileName].answers.length}</span>
            `;
            
            li.onclick = () => {
                switchExercise(fileName, li);
                closeSidebarIfMobile();
            };
            list.appendChild(li);

            // Initialize sidebar score and summary
            updateSidebarScore(fileName);
            updateSummaryPanel();
        } catch (e) { console.warn("Missing: " + fileName); }
    }
    document.getElementById('loader').style.display = 'none';
    if (list.firstChild) list.firstChild.click();

    // Attach action button handler (delegates to verify or reset depending on locked state)
    document.getElementById('actionButton').addEventListener('click', () => {
        const actionBtn = document.getElementById('actionButton');
        const ex = exerciseData[currentFile];
        if (!currentFile) return;
        if (ex && ex.locked) {
            resetCurrentExercise();
        } else {
            checkAnswers();
        }
    });
}

// Fisher-Yates shuffle that guarantees a derangement (no item in original position)
function createDerangement(length) {
    if (length <= 1) return [...Array(length).keys()];
    
    let attempt = 0;
    let derangement;
    let isValid;
    
    do {
        // Fisher-Yates shuffle
        derangement = [...Array(length).keys()];
        for (let i = length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [derangement[i], derangement[j]] = [derangement[j], derangement[i]];
        }
        
        // Check if it's a valid derangement (no item in original position)
        isValid = true;
        for (let i = 0; i < length; i++) {
            if (derangement[i] === i) {
                isValid = false;
                break;
            }
        }
        
        attempt++;
    } while (!isValid && attempt < 100); // Max 100 attempts to prevent infinite loop
    
    // Fallback: if derangement fails, manually create one
    if (!isValid) {
        derangement = [...Array(length).keys()];
        const rotations = Math.max(1, Math.floor(length / 2));
        for (let i = 0; i < rotations; i++) {
            derangement.push(derangement.shift());
        }
    }
    
    return derangement;
}

function parseJavaCode(raw) {
    // Extract sample output from a leading block comment (/* ... */) if present
    let sampleOutput = '';
    const commentMatch = raw.match(/\/\*[\s\S]*?\*\//);
    if (commentMatch) {
        const comment = commentMatch[0];
        // Find 'Sample Output:' marker (case-insensitive)
        const markerIndex = comment.search(/Sample Output:/i);
        if (markerIndex >= 0) {
            // Extract everything after the marker up to end of comment
            let after = comment.slice(markerIndex + 'Sample Output:'.length);

            // Strip the block comment's closing "*/" (and any whitespace
            // right before it) from the very end BEFORE splitting into
            // lines. Doing this first means a genuine blank line the
            // author intentionally included in the sample output (e.g. a
            // trailing blank row) can't get confused with — and dropped
            // along with — the leftover artifact the closer would
            // otherwise leave behind on its own line.
            after = after.replace(/\s*\*\/\s*$/, '');

            // Strip only the JavaDoc-style comment prefix from each line: an
            // optional single leading space, the '*', and at most one space
            // right after it. Anything beyond that single space is real
            // indentation belonging to the program's actual output (e.g. an
            // ASCII-art shape) and must be preserved exactly as-is.
            let sampleLines = after.split('\n').map(l => l.replace(/^ ?\*\s?/, ''));

            // Drop only the leading blank line produced by the newline
            // right after "Sample Output:" itself. Any blank line(s)
            // further in — including a trailing one — are part of the
            // real output and are left untouched.
            while (sampleLines.length && sampleLines[0].trim() === '') {
                sampleLines.shift();
            }

            // Trailing whitespace on a line doesn't affect how it renders,
            // so it's safe to trim per line without touching leading spaces.
            sampleOutput = sampleLines.map(l => l.replace(/\s+$/, '')).join('\n');
        }

        // Remove the entire leading comment block from the raw source before parsing lines
        raw = raw.replace(commentMatch[0], '');
    }

    // Split code into lines and filter out empty lines
    const lines = raw.split('\n').filter(line => line.trim().length > 0);
    
    // Escape HTML
    const escapedLines = lines.map(line => 
        line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    );
    
    // Create shuffled version using derangement (no item in original position)
    const shuffledIndices = createDerangement(escapedLines.length);
    const shuffledLines = shuffledIndices.map(idx => escapedLines[idx]);
    
    // Generate fixed line numbers column and draggable code area
    let lineNumbersHtml = '<div class="line-numbers-column">';
    for (let i = 0; i < escapedLines.length; i++) {
        lineNumbersHtml += `<div class="line-number">${i + 1}</div>`;
    }
    lineNumbersHtml += '</div>';
    
    // Build draggable items (no line numbers attached)
    let codeAreaHtml = '<div class="code-ordering-area" id="orderingArea">';
    shuffledLines.forEach((line, idx) => {
        const originalIdx = shuffledIndices[idx];
        
        codeAreaHtml += `<div class="draggable-line" draggable="true" data-original-idx="${originalIdx}">
                            <span class="drag-handle">⋮⋮</span>
                            <div class="updown-buttons">
                                <button type="button" class="move-up-btn" aria-label="Move line up">▲</button>
                                <button type="button" class="move-down-btn" aria-label="Move line down">▼</button>
                            </div>
                            <code>${line}</code>
                        </div>`;
    });
    codeAreaHtml += '</div>';
    
    // Wrap both in a container
    const html = `<div class="code-ordering-container">${lineNumbersHtml}${codeAreaHtml}</div>`;
    
    // For compatibility, 'answers' stores the correct order
    const answers = escapedLines.map((_, idx) => [idx.toString()]);
    
    // Identify duplicate lines and map which positions are valid for each line's content
    const lineGroups = {}; // content -> array of original indices
    escapedLines.forEach((line, idx) => {
        if (!lineGroups[line]) {
            lineGroups[line] = [];
        }
        lineGroups[line].push(idx);
    });
    
    // Create a map: originalIdx -> valid positions for that line's content
    const validPositionsMap = {};
    escapedLines.forEach((line, idx) => {
        validPositionsMap[idx] = lineGroups[line].sort((a, b) => a - b);
    });
    
    return { 
        html, 
        answers, 
        sampleOutput,
        originalLines: escapedLines,
        originalIndices: [...escapedLines.keys()],
        shuffledIndices: shuffledIndices,
        validPositionsMap: validPositionsMap,
        lineGroups: lineGroups,
        userOrder: [],
        score: 0, 
        locked: false, 
        isPartial: false,
        isLineOrdering: true
    };
}

function saveProgress(index, value) {
    if (exerciseData[currentFile]) {
        if (exerciseData[currentFile].isLineOrdering) {
            // For line ordering, progress tracking happens via drag/drop
            return;
        } else {
            // Legacy: for fill-in-the-blank
            exerciseData[currentFile].userProgress[index] = value;
        }
    }
}

function setInputsDisabled(disabled) {
    const ex = exerciseData[currentFile];
    
    // Handle line ordering exercises
    if (ex && ex.isLineOrdering) {
        const draggableLines = document.querySelectorAll('.draggable-line');
        draggableLines.forEach(line => {
            line.draggable = !disabled;
            const jumpSelect = line.querySelector('.jump-to-select');
            if (jumpSelect) jumpSelect.disabled = disabled;
            if (disabled) {
                line.classList.add('locked');
                line.setAttribute('title', 'Locked');
            } else {
                line.classList.remove('locked');
                line.removeAttribute('title');
            }
        });
        refreshUpDownButtonStates(disabled);
    }
    
    // Legacy: handle fill-in-the-blank exercises
    const inputs = document.querySelectorAll('.code-input');
    inputs.forEach(input => {
        input.disabled = disabled;
        if (disabled) {
            input.classList.add('locked');
            input.setAttribute('title', 'Locked');
        } else {
            input.classList.remove('locked');
            input.removeAttribute('title');
        }
    });
    
    const editor = document.querySelector('.code-editor');
    if (editor) {
        if (disabled) editor.classList.add('locked'); 
        else editor.classList.remove('locked');
    }
}

function updateSidebarScore(file) {
    const safeId = file.replace(/\./g, '-');
    const scoreSpan = document.getElementById(`score-${safeId}`);
    const ex = exerciseData[file];
    if (!scoreSpan || !ex) return;
    scoreSpan.textContent = `${ex.score}/${ex.answers.length}`;
    
    // Remove all score classes first
    scoreSpan.classList.remove('completed-score', 'partial-score');
    
    // Add appropriate class based on score
    if (ex.score === ex.answers.length) {
        scoreSpan.classList.add('completed-score');  // 100% correct
    } else if (ex.score > 0) {
        scoreSpan.classList.add('partial-score');     // Partial correct
    }
    // If score is 0, keep default styling (unanswered)
}

function updateSummaryPanel() {
    let totalGot = 0;
    let totalPossible = 0;
    for (const file in exerciseData) {
        const ex = exerciseData[file];
        totalGot += Number(ex.score || 0);
        totalPossible += ex.answers.length;
    }
    document.getElementById('summaryValue').textContent = `${totalGot} / ${totalPossible}`;
}

function switchExercise(name, el) {
    currentFile = name;
    document.querySelectorAll('.sidebar li').forEach(l => l.classList.remove('active'));
    el.classList.add('active');
    
    document.getElementById('currentFileName').textContent = name;
    const display = document.getElementById('codeDisplay');
    display.innerHTML = exerciseData[name].html;

    // Handle line ordering exercises
    if (exerciseData[name].isLineOrdering) {
        setupDragAndDrop();
        setupJumpToUI(name);
        restoreUserOrder(name);
        setupUpDownButtons();
    } else {
        // Legacy: fill-in-the-blank handling
        const inputs = display.querySelectorAll('.code-input');
        inputs.forEach((input, index) => {
            input.value = exerciseData[name].userProgress[index];
        });
    }

    // Restore disabled state and styles if previously verified (locked)
    const ex = exerciseData[name];
    if (ex.locked) {
        if (ex.isLineOrdering) {
            document.querySelectorAll('.draggable-line').forEach(draggableEl => {
                draggableEl.draggable = false;
                draggableEl.classList.add('locked');
                const jumpSelect = draggableEl.querySelector('.jump-to-select');
                if (jumpSelect) jumpSelect.disabled = true;
            });
        } else {
            const inputs = display.querySelectorAll('.code-input');
            inputs.forEach((input, idx) => {
                const val = input.value.trim();
                if (ex.answers[idx].includes(val)) {
                    input.style.borderBottomColor = "var(--secondary)";
                } else {
                    input.style.borderBottomColor = "var(--error)";
                }
            });
        }
        setInputsDisabled(true);
        
        // Only allow reset in practice mode
        if (appSettings.mode === 'practice') {
            document.getElementById('actionButton').textContent = 'Reset';
        } else {
            document.getElementById('actionButton').textContent = 'Locked';
            document.getElementById('actionButton').disabled = true;
        }
    } else {
        // Editable
        setInputsDisabled(false);
        if (!ex.isLineOrdering) {
            display.querySelectorAll('.code-input').forEach(i => i.style.borderBottomColor = 'var(--secondary)');
        }
        document.getElementById('actionButton').textContent = 'Verify Code';
        document.getElementById('actionButton').disabled = false;
    }

    updateSidebarScore(name);
    updateSummaryPanel();
    document.getElementById('feedback').textContent = "";

    // Auto-show/hide the console panel per the global "Sample Output"
    // setting (Settings modal), which now applies uniformly across every
    // activity rather than being toggled per exercise. The drawer tab
    // (updated inside showSampleOutput/closeSampleOutputModal) remains
    // available for the student to manually pull the panel into view for
    // this activity regardless of the setting.
    applyAutoShowForCurrentExercise();
}

function checkAnswers() {
    if (!currentFile) return;
    const ex = exerciseData[currentFile];
    let score = 0;

    if (ex.isLineOrdering) {
        // Save user's ordering before verification
        const orderingArea = document.getElementById('orderingArea');
        const orderedLines = Array.from(orderingArea.querySelectorAll('.draggable-line'));
        ex.userOrder = orderedLines.map(el => parseInt(el.getAttribute('data-original-idx')));
        
        // Clear previous feedback styling
        orderedLines.forEach(el => {
            el.classList.remove('correct', 'incorrect');
        });
        
        // Verify line ordering with semantic equivalence for identical lines
        // Track which valid positions have been used to avoid double-counting duplicates
        const usedValidPositions = new Set();
        
        orderedLines.forEach((lineEl, idx) => {
            const originalIdx = parseInt(lineEl.getAttribute('data-original-idx'));
            const validPositions = ex.validPositionsMap[originalIdx];
            
            let isCorrect = false;
            
            if (validPositions && validPositions.length === 1) {
                // Unique line - requires exact position match
                isCorrect = (originalIdx === idx);
            } else if (validPositions && validPositions.length > 1) {
                // Duplicate content - check if placed in any valid position for this content
                // and that position hasn't been claimed yet
                isCorrect = validPositions.includes(idx) && !usedValidPositions.has(idx);
                if (isCorrect) {
                    usedValidPositions.add(idx);
                }
            }
            
            if (isCorrect) {
                score++;
                lineEl.classList.add('correct');
            } else {
                lineEl.classList.add('incorrect');
            }
        });
    } else {
        // Legacy: fill-in-the-blank verification
        const inputs = document.querySelectorAll('.code-input');
        const correctArr = ex.answers;

        inputs.forEach((input, index) => {
            const val = input.value.trim();
            if (correctArr[index].includes(val)) {
                input.style.borderBottomColor = "var(--secondary)";
                score++;
            } else {
                input.style.borderBottomColor = "var(--error)";
            }
        });
    }

    // Lock inputs and mark exercise locked
    setInputsDisabled(true);
    ex.score = score;
    ex.locked = true;
    
    const totalLines = ex.answers.length;
    ex.isPartial = score > 0 && score < totalLines;

    // Update Sidebar Score
    updateSidebarScore(currentFile);
    updateSummaryPanel();

    const msg = document.getElementById('feedback');
    if (score === totalLines) {
        msg.textContent = "✨ Perfect! All lines in correct order! ✨";
        msg.className = "success show";
        // Bigger & longer confetti
        triggerBigConfetti();
    } else {
        msg.textContent = `Progress: ${score}/${totalLines} correct.`;
        msg.className = "warning show";
    }

    // Change action button based on mode
    const actionBtn = document.getElementById('actionButton');
    if (appSettings.mode === 'exam') {
        actionBtn.textContent = 'Locked';
        actionBtn.disabled = true;
        
        // Check if all exercises have been answered in exam mode
        if (checkIfAllAnswered()) {
            // Stop timer early and show score summary
            stopTimer();
            setTimeout(() => {
                showScoreSummaryModal('Congratulations! All exercises completed before time ran out!', 'success');
            }, 500);
        }
    } else {
        actionBtn.textContent = 'Reset';
    }
}

function resetCurrentExercise() {
    if (!currentFile) return;
    
    // Prevent reset in exam mode
    if (appSettings.mode === 'exam') {
        showAlertModal('Reset Not Allowed', 'Reset is not allowed in Exam Mode.');
        return;
    }
    
    const ex = exerciseData[currentFile];
    
    if (ex.isLineOrdering) {
        ex.userOrder = [];
        const orderingArea = document.getElementById('orderingArea');
        
        // Reshuffle the lines back to their original shuffled positions
        const shuffledLines = ex.shuffledIndices.map(origIdx => {
            const draggableEl = orderingArea.querySelector(`[data-original-idx="${origIdx}"]`);
            return draggableEl;
        });
        
        // Sort by current position in shuffled order and re-render
        shuffledLines.forEach((el, idx) => {
            if (el) {
                orderingArea.appendChild(el);
                el.classList.remove('correct', 'incorrect');
            }
        });
        setupDragAndDrop();
        setupJumpToUI(currentFile);
        setupUpDownButtons();
    } else {
        // Legacy: fill-in-the-blank reset
        ex.userProgress = ex.userProgress.map(() => "");
        const display = document.getElementById('codeDisplay');
        const inputs = display.querySelectorAll('.code-input');
        inputs.forEach((input) => {
            input.value = '';
            input.style.borderBottomColor = 'var(--secondary)';
        });
    }
    
    ex.score = 0;
    ex.locked = false;
    setInputsDisabled(false);

    // Update sidebar and summary
    updateSidebarScore(currentFile);
    updateSummaryPanel();

    // Reset feedback and action button
    const feedbackEl = document.getElementById('feedback');
    feedbackEl.textContent = '';
    feedbackEl.className = '';
    document.getElementById('actionButton').textContent = 'Verify Code';
}

function triggerConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6200ee', '#03dac6', '#ffca28']
    });
}

function triggerBigConfetti() {
    // Burst multiple waves for a bigger, longer celebration
    const colors = ['#6200ee', '#03dac6', '#ffca28', '#ff4081', '#00bcd4'];
    const bursts = [
        { particleCount: 300, spread: 120, startVelocity: 40 },
        { particleCount: 200, spread: 140, startVelocity: 30 },
        { particleCount: 150, spread: 160, startVelocity: 20 }
    ];

    let delay = 0;
    bursts.forEach(b => {
        setTimeout(() => {
            confetti(Object.assign({}, b, { origin: { y: 0.6 }, colors }));
        }, delay);
        delay += 500; // space the bursts
    });
}
function exportProgress() {
    let csv = "Student,Exercise,Score\n";
    for (const file in exerciseData) {
        let correct = 0;
        exerciseData[file].userProgress.forEach((val, idx) => {
            if (exerciseData[file].answers[idx].includes(val.trim())) correct++;
        });
        csv += `${currentUser},${file},${correct}/${exerciseData[file].answers.length}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentUser}_results.csv`;
    a.click();
}

// --- SETTINGS AND MODE MANAGEMENT ---
function openSettingsModal() {
    document.getElementById('settingsModal').style.display = 'block';
    document.getElementById('settingsOverlay').style.display = 'block';
    
    // Set current settings in the modal
    document.querySelector(`input[name="mode"][value="${appSettings.mode}"]`).checked = true;
    document.getElementById('timerInput').value = appSettings.timerMinutes;

    const autoShowToggle = document.getElementById('autoShowSampleToggle');
    if (autoShowToggle) {
        autoShowToggle.checked = appSettings.autoShowSample;
    }
    
    // Show/hide timer section based on mode
    const timerSection = document.getElementById('timerSection');
    if (appSettings.mode === 'exam') {
        timerSection.style.display = 'block';
    } else {
        timerSection.style.display = 'none';
    }
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
    document.getElementById('settingsOverlay').style.display = 'none';
}

function handleModeChange() {
    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    const timerSection = document.getElementById('timerSection');
    
    if (selectedMode === 'exam') {
        timerSection.style.display = 'block';
    } else {
        timerSection.style.display = 'none';
    }
}

function validateTimerInput(input) {
    let value = parseInt(input.value, 10);
    
    if (isNaN(value)) {
        input.classList.add('invalid');
        return false;
    }
    
    if (value < 1) {
        input.value = '1';
        input.classList.remove('invalid');
    } else if (value > 999) {
        input.value = '999';
        input.classList.remove('invalid');
    } else {
        input.classList.remove('invalid');
    }
    
    return true;
}

function saveSettings() {
    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    const timerInput = document.getElementById('timerInput');
    const timerValue = parseInt(timerInput.value, 10);
    
    // Validate timer input
    if (selectedMode === 'exam') {
        if (isNaN(timerValue) || timerValue < 1 || timerValue > 999) {
            alert('Please enter a valid timer value between 1 and 999 minutes.');
            return;
        }
        appSettings.timerMinutes = timerValue;
    }
    
    appSettings.mode = selectedMode;

    const autoShowToggle = document.getElementById('autoShowSampleToggle');
    if (autoShowToggle) {
        appSettings.autoShowSample = autoShowToggle.checked;
    }

    closeSettingsModal();

    // Re-apply the (possibly just-changed) auto-show preference to
    // whatever exercise is currently open, so the console panel reacts
    // immediately rather than waiting for the next exercise switch.
    applyAutoShowForCurrentExercise();
    
    // Show toast notification
    showNotification(`Settings saved! Mode: ${selectedMode === 'exam' ? 'Exam (' + timerValue + ' min)' : 'Practice'}`);
}

function showNotification(message) {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary);
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 2001;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Timer Management
function startTimer() {
    if (appSettings.mode !== 'exam') {
        return;
    }
    
    timeRemaining = appSettings.timerMinutes * 60; // Convert to seconds
    const timerContainer = document.getElementById('timerContainer');
    timerContainer.style.display = 'flex';
    
    updateTimerDisplay();
    
    timerIntervalId = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerIntervalId);
            handleTimerExpired();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timerDisplay').textContent = display;
    
    const timerDisplay = document.getElementById('timerDisplay');
    timerDisplay.classList.remove('warning', 'critical');
    
    if (timeRemaining <= 60) {
        timerDisplay.classList.add('critical');
    } else if (timeRemaining <= 300) {
        timerDisplay.classList.add('warning');
    }
}

function stopTimer() {
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
    const timerContainer = document.getElementById('timerContainer');
    timerContainer.style.display = 'none';
}

function handleTimerExpired() {
    stopTimer();
    
    // Lock all exercises
    for (const file in exerciseData) {
        if (!exerciseData[file].locked) {
            exerciseData[file].locked = true;
        }
    }
    setInputsDisabled(true);
    document.getElementById('actionButton').disabled = true;
    
    // Show score summary modal
    showScoreSummaryModal('Time is up! Your exam session has ended.', 'warning');
}

// --- DRAG AND DROP LINE ORDERING ---
function setupDragAndDrop() {
    const orderingArea = document.getElementById('orderingArea');
    
    if (!orderingArea) return;
    
    // Attach listeners to all draggable lines
    const draggableLines = orderingArea.querySelectorAll('.draggable-line');
    draggableLines.forEach(line => attachDragListeners(line));
    
    // Setup drop zone for the single ordering area
    setupDropZone(orderingArea);
}

function attachDragListeners(element) {
    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragend', handleDragEnd);
}

function handleDragStart(e) {
    if (exerciseData[currentFile]?.locked) {
        e.preventDefault();
        return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
    draggedElement = this;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    // Remove any drop placeholder when dragging ends
    document.querySelectorAll('.drop-placeholder').forEach(p => p.remove());
}

function setupDropZone(zone) {
    if (!zone) return;

    // Create a single placeholder element used during drag to indicate insertion point
    const placeholder = document.createElement('div');
    placeholder.className = 'drop-placeholder';

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('drag-over');

        // Determine nearest element to insert before based on mouse Y
        const afterElement = getDragAfterElement(zone, e.clientY);

        if (!afterElement) {
            // Append to end
            if (zone.lastElementChild !== placeholder) zone.appendChild(placeholder);
        } else {
            if (afterElement !== placeholder) zone.insertBefore(placeholder, afterElement);
        }
    });

    zone.addEventListener('dragleave', (e) => {
        // If leaving the zone entirely, remove visual hints
        const related = e.relatedTarget;
        if (!related || !zone.contains(related)) {
            zone.classList.remove('drag-over');
            placeholder.remove();
        }
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');

        if (exerciseData[currentFile]?.locked || !draggedElement) return;

        // Insert dragged element at placeholder position if present
        const ph = zone.querySelector('.drop-placeholder');
        if (ph) {
            zone.insertBefore(draggedElement, ph);
            ph.remove();
        } else {
            zone.appendChild(draggedElement);
        }
    });
}

// Helper: returns the first element that the dragged item should be placed before
function getDragAfterElement(container, y) {
    const draggableLines = [...container.querySelectorAll('.draggable-line:not(.dragging)')];

    return draggableLines.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > (closest.offset || Number.NEGATIVE_INFINITY)) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element || null;
}

function restoreUserOrder(fileName) {
    const ex = exerciseData[fileName];
    if (!ex.isLineOrdering || ex.userOrder.length === 0) return;
    
    const orderingArea = document.getElementById('orderingArea');
    if (!orderingArea) return;
    
    // Reorder lines based on saved userOrder
    ex.userOrder.forEach(origIdx => {
        const draggableEl = orderingArea.querySelector(`[data-original-idx="${origIdx}"]`);
        if (draggableEl) {
            orderingArea.appendChild(draggableEl);
        }
    });
}

let draggedElement = null;

// --- UP/DOWN BUTTONS (touch-friendly alternative to drag-and-drop) ---
function setupUpDownButtons() {
    const orderingArea = document.getElementById('orderingArea');
    if (!orderingArea) return;

    const draggableLines = orderingArea.querySelectorAll('.draggable-line');

    draggableLines.forEach(lineEl => {
        const upBtn = lineEl.querySelector('.move-up-btn');
        const downBtn = lineEl.querySelector('.move-down-btn');
        if (!upBtn || !downBtn) return;

        // Avoid stacking duplicate listeners if this is called more than once
        upBtn.replaceWith(upBtn.cloneNode(true));
        downBtn.replaceWith(downBtn.cloneNode(true));
    });

    // Re-query after cloning, then attach fresh listeners
    orderingArea.querySelectorAll('.move-up-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            moveLineByOffset(btn.closest('.draggable-line'), -1);
        });
    });
    orderingArea.querySelectorAll('.move-down-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            moveLineByOffset(btn.closest('.draggable-line'), 1);
        });
    });

    refreshUpDownButtonStates();
}

function moveLineByOffset(lineEl, offset) {
    if (!lineEl || exerciseData[currentFile]?.locked) return;

    const orderingArea = document.getElementById('orderingArea');
    const allLines = Array.from(orderingArea.querySelectorAll('.draggable-line'));
    const currentIdx = allLines.indexOf(lineEl);
    const targetIdx = currentIdx + offset;

    if (targetIdx < 0 || targetIdx >= allLines.length) return; // out of bounds

    const targetEl = allLines[targetIdx];

    // Capture each affected row's position before the DOM move (FLIP: First)
    const movedFirstRect = lineEl.getBoundingClientRect();
    const targetFirstRect = targetEl.getBoundingClientRect();

    if (offset < 0) {
        orderingArea.insertBefore(lineEl, allLines[targetIdx]);
    } else {
        orderingArea.insertBefore(lineEl, targetEl.nextSibling);
    }

    // Animate both the moved row and the row it displaced sliding into place
    animateRowSwap(lineEl, movedFirstRect);
    animateRowSwap(targetEl, targetFirstRect);

    refreshUpDownButtonStates();
}

// Slides an element from its previous position (firstRect) to wherever it
// now sits in the DOM (Last), using the FLIP technique: Invert the visual
// position with a transform, then Play by transitioning that transform away.
function animateRowSwap(el, firstRect) {
    const lastRect = el.getBoundingClientRect();
    const deltaY = firstRect.top - lastRect.top;

    if (!deltaY) return; // already in place, nothing to animate

    el.style.transition = 'none';
    el.style.transform = `translateY(${deltaY}px)`;
    el.style.zIndex = '5';
    el.classList.add('swapping');

    // Wait a frame so the browser paints the inverted position before we
    // transition it away, otherwise the transform jump itself would animate.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            el.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
            el.style.transform = '';
        });
    });

    const cleanup = () => {
        el.style.transition = '';
        el.style.zIndex = '';
        el.classList.remove('swapping');
        el.removeEventListener('transitionend', cleanup);
    };
    el.addEventListener('transitionend', cleanup);
}

// Disable Up on the first line and Down on the last line.
// forceLocked lets callers (like setInputsDisabled) specify the lock state
// directly, since ex.locked isn't always updated yet at call time.
function refreshUpDownButtonStates(forceLocked) {
    const orderingArea = document.getElementById('orderingArea');
    if (!orderingArea) return;

    const allLines = Array.from(orderingArea.querySelectorAll('.draggable-line'));
    const locked = forceLocked !== undefined ? forceLocked : exerciseData[currentFile]?.locked;

    allLines.forEach((lineEl, idx) => {
        const upBtn = lineEl.querySelector('.move-up-btn');
        const downBtn = lineEl.querySelector('.move-down-btn');
        if (upBtn) upBtn.disabled = locked || idx === 0;
        if (downBtn) downBtn.disabled = locked || idx === allLines.length - 1;
    });
}

// --- JUMP-TO POSITIONING UI ---
function setupJumpToUI(fileName) {
    const orderingArea = document.getElementById('orderingArea');
    if (!orderingArea) return;

    const draggableLines = orderingArea.querySelectorAll('.draggable-line');
    const totalLines = draggableLines.length;

    draggableLines.forEach(draggableEl => {
        // Remove old dropdown if exists
        const oldDropdown = draggableEl.querySelector('.jump-to-container');
        if (oldDropdown) oldDropdown.remove();

        // Create jump-to dropdown container
        const jumpToDiv = document.createElement('div');
        jumpToDiv.className = 'jump-to-container';
        
        // Build options for all available line positions
        let optionsHtml = '<option value="">Jump to →</option>';
        for (let i = 1; i <= totalLines; i++) {
            optionsHtml += `<option value="${i - 1}">Line ${i}</option>`;
        }
        
        jumpToDiv.innerHTML = `<select class="jump-to-select">${optionsHtml}</select>`;
        
        // Add change handler
        jumpToDiv.querySelector('.jump-to-select').addEventListener('change', (e) => {
            if (e.target.value === '') return;
            const targetIdx = parseInt(e.target.value);
            moveLineToPosition(orderingArea, draggableEl, targetIdx);
            e.target.value = ''; // Reset dropdown
        });

        draggableEl.appendChild(jumpToDiv);
    });
}

function moveLineToPosition(container, draggableElement, targetIdx) {
    if (exerciseData[currentFile]?.locked) return;

    const allDraggableLines = Array.from(container.querySelectorAll('.draggable-line'));
    const currentIdx = allDraggableLines.indexOf(draggableElement);

    if (currentIdx === targetIdx) return; // Already at target

    // Remove from current position
    container.removeChild(draggableElement);

    // Insert at target position
    if (targetIdx >= allDraggableLines.length - 1) {
        container.appendChild(draggableElement);
    } else {
        const targetElement = allDraggableLines[targetIdx];
        container.insertBefore(draggableElement, targetElement);
    }

    refreshUpDownButtonStates();
}

// --- ALERT AND SCORE SUMMARY MODALS ---
function showAlertModal(title, message) {
    document.getElementById('alertTitle').textContent = title;
    document.getElementById('alertMessage').textContent = message;
    document.getElementById('alertModal').style.display = 'block';
    document.getElementById('alertOverlay').style.display = 'block';
}

function closeAlertModal() {
    document.getElementById('alertModal').style.display = 'none';
    document.getElementById('alertOverlay').style.display = 'none';
}

// --- SAMPLE OUTPUT CONSOLE PANEL (slides in from the right) ---
function showSampleOutput(fileName) {
    const ex = exerciseData[fileName];
    const panel = document.getElementById('sampleOutputPanel');
    const overlay = document.getElementById('sampleOutputOverlay');
    const content = document.getElementById('sampleOutputContent');
    if (!ex || !panel || !overlay || !content) return;

    content.textContent = ex.sampleOutput && ex.sampleOutput.length ? ex.sampleOutput : 'No sample output available.';

    overlay.style.display = 'block';
    panel.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    updateConsoleDrawerTab(true);
    // Force the transform to its initial state before adding .open so the
    // slide-in transition actually plays (rather than snapping into place)
    // even if the panel was just re-shown right after being closed.
    requestAnimationFrame(() => {
        panel.classList.add('open');
    });
}

function closeSampleOutputModal() {
    const panel = document.getElementById('sampleOutputPanel');
    const overlay = document.getElementById('sampleOutputOverlay');
    if (!panel) return;

    const wasOpen = panel.classList.contains('open');
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    updateConsoleDrawerTab(false);

    if (overlay) {
        overlay.setAttribute('aria-hidden', 'true');
        if (wasOpen) {
            // Wait for the slide-out transition to finish before hiding the
            // overlay, otherwise it disappears abruptly mid-animation.
            const onTransitionEnd = () => {
                overlay.style.display = 'none';
                panel.removeEventListener('transitionend', onTransitionEnd);
            };
            panel.addEventListener('transitionend', onTransitionEnd);
        } else {
            // Nothing was actually open, so there's no transition to wait
            // for — hide the overlay immediately instead of leaving a
            // transitionend listener that would never fire.
            overlay.style.display = 'none';
        }
    }
}

// --- CONSOLE DRAWER TAB ---
// A per-activity handle, always available (when the current exercise has
// sample output) for pulling the console into view by hand, independent of
// the global auto-show setting.
function toggleConsolePanel() {
    const panel = document.getElementById('sampleOutputPanel');
    if (!panel || !currentFile) return;
    if (panel.classList.contains('open')) {
        closeSampleOutputModal();
    } else {
        showSampleOutput(currentFile);
    }
}

function updateConsoleDrawerTab(forceOpen) {
    const tab = document.getElementById('consoleDrawerTab');
    const panel = document.getElementById('sampleOutputPanel');
    if (!tab || !panel) return;

    const ex = exerciseData[currentFile];
    const hasSampleOutput = !!(ex && ex.sampleOutput && ex.sampleOutput.trim().length > 0);
    const isOpen = forceOpen !== undefined ? forceOpen : panel.classList.contains('open');

    tab.style.display = (hasSampleOutput && !isOpen) ? 'flex' : 'none';
    tab.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function calculateTotalScore() {
    let totalGot = 0;
    let totalPossible = 0;
    for (const file in exerciseData) {
        const ex = exerciseData[file];
        totalGot += Number(ex.score || 0);
        totalPossible += ex.answers.length;
    }
    return { got: totalGot, possible: totalPossible };
}

function showScoreSummaryModal(completionMessage, messageType = 'success') {
    const { got, possible } = calculateTotalScore();
    
    document.getElementById('finalScore').textContent = got;
    document.getElementById('maxScore').textContent = possible;
    document.getElementById('summaryEmail').textContent = currentUser;
    
    const messageElement = document.getElementById('completionMessage');
    messageElement.textContent = completionMessage;
    messageElement.className = `completion-message ${messageType}`;
    
    document.getElementById('scoreSummaryModal').style.display = 'block';
    document.getElementById('scoreSummaryOverlay').style.display = 'block';
}

function closeSummaryModal() {
    document.getElementById('scoreSummaryModal').style.display = 'none';
    document.getElementById('scoreSummaryOverlay').style.display = 'none';
}

// Check if all exercises have been answered
function checkIfAllAnswered() {
    for (const file in exerciseData) {
        const ex = exerciseData[file];
        if (!ex.locked || ex.score === 0) {
            return false;
        }
    }
    return true;
}
