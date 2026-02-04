/* ===== Constants ===== */
const STORAGE_KEY = 'microJournalEntries';
const USERS_KEY = 'microJournalUsers';
const SESSION_KEY = 'microJournalSession';
const MAX_CHAR_LIMIT = 140;
const WARNING_THRESHOLD = 120;

const DAILY_PROMPTS = [
    "What made you smile today?",
    "What are you grateful for?",
    "What's one thing you learned today?",
    "Describe a moment that stood out today.",
    "What challenge did you overcome?",
    "Who made your day better?",
    "What's on your mind right now?",
    "What are you looking forward to?",
    "What would you like to remember about today?",
    "How are you taking care of yourself today?",
    "What small win did you have today?",
    "What made today unique?"
];

/* ===== DOM Elements ===== */
const elements = {
    todayDate: document.getElementById('todayDate'),
    todayInput: document.getElementById('todayInput'),
    charCounter: document.getElementById('charCounter'),
    saveBtn: document.getElementById('saveBtn'),
    saveFeedback: document.getElementById('saveFeedback'),
    searchInput: document.getElementById('searchInput'),
    entriesContainer: document.getElementById('entriesContainer'),
    totalEntries: document.getElementById('totalEntries'),
    streakCount: document.getElementById('streakCount'),
    promptText: document.getElementById('promptText'),
    promptRefresh: document.getElementById('promptRefresh'),
    tagsInput: document.getElementById('tagsInput'),
    tagsDisplay: document.getElementById('tagsDisplay'),
    filterTags: document.getElementById('filterTags'),
    // Auth
    authContainer: document.getElementById('authContainer'),
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm'),
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    signupUsername: document.getElementById('signupUsername'),
    signupPassword: document.getElementById('signupPassword'),
    showSignup: document.getElementById('showSignup'),
    showLogin: document.getElementById('showLogin'),
    loginError: document.getElementById('loginError'),
    signupError: document.getElementById('signupError'),
    mainContainer: document.querySelector('.main'),
    header: document.querySelector('.header'),
    landingPage: document.getElementById('landingPage'),
    landingLoginBtn: document.getElementById('landingLoginBtn'),
    landingSignupBtn: document.getElementById('landingSignupBtn'),
    authHomeBtn: document.getElementById('authHomeBtn'),
};

/* ===== State ===== */
let entries = [];
let currentEditingDate = null;
let initialValue = '';
let selectedMood = null;
let currentTags = [];
let activeFilterTag = null;
let currentUser = null;

/* ===== Utility Functions ===== */

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
const getTodayISODate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

/**
 * Format date for display (e.g., "Mon, 12 Jan 2026")
 */
const formatDateDisplay = (isoDate) => {
    const date = new Date(isoDate + 'T00:00:00');
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
};

/**
 * Get relative date label (e.g., "Yesterday", "2 days ago")
 */
const getRelativeDateLabel = (isoDate) => {
    const today = new Date(getTodayISODate() + 'T00:00:00');
    const entryDate = new Date(isoDate + 'T00:00:00');
    const diffTime = today - entryDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDateDisplay(isoDate);
};

/**
 * Get a random daily prompt
 */
const getRandomPrompt = () => {
    return DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];
};

/**
 * Calculate current streak of consecutive days
 */
const calculateStreak = () => {
    console.log('=== CALCULATING STREAK ===');
    console.log('Total entries:', entries.length);
    console.log('All entry dates:', entries.map(e => e.date));

    if (entries.length === 0) return 0;

    const today = getTodayISODate();

    // Calculate yesterday properly without timezone issues
    const [year, month, day] = today.split('-').map(Number);
    const yesterdayDate = new Date(year, month - 1, day - 1);
    const yesterdayISO = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    console.log('Today:', today);
    console.log('Yesterday:', yesterdayISO);

    // Check if there's an entry for today or yesterday to start streak
    const hasToday = entries.some(e => e.date === today);
    const hasYesterday = entries.some(e => e.date === yesterdayISO);

    console.log('Has today entry:', hasToday);
    console.log('Has yesterday entry:', hasYesterday);

    if (!hasToday && !hasYesterday) {
        console.log('No recent entries - streak is 0');
        return 0; // No recent entries
    }

    // Start counting from the most recent entry (today or yesterday)
    let streak = 0;
    const startDate = hasToday ? today : yesterdayISO;
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    let checkDate = new Date(startYear, startMonth - 1, startDay);

    console.log('Starting from:', startDate);

    // Count backwards through consecutive days
    while (true) {
        const dateToCheck = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        const hasEntry = entries.some(e => e.date === dateToCheck);

        console.log(`Checking ${dateToCheck}: ${hasEntry ? 'FOUND' : 'NOT FOUND'}`);

        if (hasEntry) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break; // Hit a gap, streak ends
        }
    }

    console.log('Final streak:', streak);
    console.log('=========================');
    return streak;
};

/**
 * Get all unique tags from all entries
 */
const getAllTags = () => {
    const tagsSet = new Set();
    entries.forEach(entry => {
        if (entry.tags) {
            entry.tags.forEach(tag => tagsSet.add(tag));
        }
    });
    return Array.from(tagsSet).sort();
};

/**
 * Parse tags from input string
 */
const parseTags = (input) => {
    if (!input) return [];
    return input
        .split(/[\s,]+/)
        .filter(tag => tag.startsWith('#'))
        .map(tag => tag.toLowerCase())
        .filter((tag, index, self) => self.indexOf(tag) === index); // unique
};

/* ===== Storage Functions ===== */

/**
 * Load entries from localStorage
 */

// --- Auth Helpers ---
function hash(str) {
    // Simple hash for demo (not secure for real apps)
    let h = 0, i, chr;
    if (str.length === 0) return h;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        h = ((h << 5) - h) + chr;
        h |= 0;
    }
    return h.toString();
}

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(username) {
    localStorage.setItem(SESSION_KEY, username);
}

function getSession() {
    return localStorage.getItem(SESSION_KEY);
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

function getUserEntriesKey(username) {
    return STORAGE_KEY + '_' + username;
}

const loadEntriesFromStorage = () => {
    if (!currentUser) return [];
    try {
        const stored = localStorage.getItem(getUserEntriesKey(currentUser));
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading entries from storage:', error);
        return [];
    }
};

/**
 * Save entries to localStorage
 */
const saveEntriesToStorage = (entriesToSave) => {
    if (!currentUser) return;
    try {
        localStorage.setItem(getUserEntriesKey(currentUser), JSON.stringify(entriesToSave));
    } catch (error) {
        console.error('Error saving entries to storage:', error);
    }
};

/**
 * Find entry by date
 */
const findEntryByDate = (date) => {
    return entries.find(entry => entry.date === date);
};

/**
 * Find entry index by date
 */
const findEntryIndexByDate = (date) => {
    return entries.findIndex(entry => entry.date === date);
};

/* ===== Rendering Functions ===== */

/**
 * Render stats bar (total entries and streak)
 */
const renderStats = () => {
    elements.totalEntries.textContent = entries.length;
    const streak = calculateStreak();
    elements.streakCount.textContent = streak;
};

/**
 * Render daily prompt
 */
const renderPrompt = () => {
    elements.promptText.textContent = getRandomPrompt();
};

/**
 * Render mood selector
 */
const renderMoodSelector = (mood = null) => {
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.mood === mood) {
            btn.classList.add('selected');
        }
    });
    selectedMood = mood;
};

/**
 * Render tags display
 */
const renderTagsDisplay = (tags = []) => {
    if (tags.length === 0) {
        elements.tagsDisplay.innerHTML = '';
        return;
    }

    elements.tagsDisplay.innerHTML = tags
        .map(tag => `
            <span class="tag-chip">
                ${tag}
                <button class="tag-remove" data-tag="${tag}" aria-label="Remove tag">×</button>
            </span>
        `)
        .join('');

    // Add remove listeners
    elements.tagsDisplay.querySelectorAll('.tag-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tagToRemove = btn.dataset.tag;
            currentTags = currentTags.filter(t => t !== tagToRemove);
            renderTagsDisplay(currentTags);
            updateSaveButton();
        });
    });
};

/**
 * Render filter tags
 */
const renderFilterTags = () => {
    const allTags = getAllTags();

    if (allTags.length === 0) {
        elements.filterTags.innerHTML = '';
        return;
    }

    elements.filterTags.innerHTML = allTags
        .map(tag => `
            <button class="filter-tag ${activeFilterTag === tag ? 'active' : ''}" data-tag="${tag}">
                ${tag}
            </button>
        `)
        .join('');

    // Add click listeners
    elements.filterTags.querySelectorAll('.filter-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.tag;
            if (activeFilterTag === tag) {
                activeFilterTag = null;
            } else {
                activeFilterTag = tag;
            }
            renderFilterTags();
            handleSearch(elements.searchInput.value);
        });
    });
};

/**
 * Render today's entry area
 */
const renderTodayEntry = () => {
    const todayDate = getTodayISODate();
    const todayEntry = findEntryByDate(todayDate);

    elements.todayDate.textContent = formatDateDisplay(todayDate);
    elements.todayInput.value = todayEntry ? todayEntry.text : '';

    // Load mood and tags if entry exists
    if (todayEntry) {
        renderMoodSelector(todayEntry.mood);
        currentTags = todayEntry.tags || [];
        elements.tagsInput.value = currentTags.join(' ');
        renderTagsDisplay(currentTags);
    } else {
        renderMoodSelector(null);
        currentTags = [];
        elements.tagsInput.value = '';
        renderTagsDisplay([]);
    }

    currentEditingDate = todayDate;
    initialValue = elements.todayInput.value;

    updateCharCounter();
    updateSaveButton();
};

/**
 * Render all entries in the timeline
 */
const renderEntries = (entriesToRender = entries) => {
    if (entriesToRender.length === 0) {
        elements.entriesContainer.innerHTML = '<p class="entries-container__empty">No entries yet. Start writing today!</p>';
        return;
    }

    // Sort entries by date (newest first)
    const sortedEntries = [...entriesToRender].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    elements.entriesContainer.innerHTML = sortedEntries
        .map(entry => {
            const tagsHtml = entry.tags && entry.tags.length > 0
                ? `<div class="entry-item__tags">${entry.tags.map(tag => `<span class="entry-tag">${tag}</span>`).join('')}</div>`
                : '';

            return `
                <article class="entry-item" data-date="${entry.date}">
                    <div class="entry-item__header">
                        <time class="entry-item__date" datetime="${entry.date}">
                            ${getRelativeDateLabel(entry.date)}
                        </time>
                        ${entry.mood ? `<span class="entry-item__mood">${entry.mood}</span>` : ''}
                    </div>
                    <p class="entry-item__text">${escapeHtml(entry.text)}</p>
                    ${tagsHtml}
                </article>
            `;
        })
        .join('');

    // Add click listeners to entries
    document.querySelectorAll('.entry-item').forEach(item => {
        item.addEventListener('click', handleEntryClick);
    });
};

/**
 * Escape HTML to prevent XSS
 */
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

/* ===== Event Handlers ===== */

/**
 * Handle input in today's entry field
 */
const handleInputChange = () => {
    updateCharCounter();
    updateSaveButton();
};

/**
 * Update character counter display
 */
const updateCharCounter = () => {
    const length = elements.todayInput.value.length;
    elements.charCounter.textContent = `${length} / ${MAX_CHAR_LIMIT}`;

    // Update counter color based on character count
    elements.charCounter.classList.remove('warning', 'danger');
    if (length >= MAX_CHAR_LIMIT) {
        elements.charCounter.classList.add('danger');
    } else if (length >= WARNING_THRESHOLD) {
        elements.charCounter.classList.add('warning');
    }
};

/**
 * Update save button state
 */
const updateSaveButton = () => {
    const currentValue = elements.todayInput.value.trim();
    const currentEntry = findEntryByDate(currentEditingDate);

    const initialMood = currentEntry?.mood || null;
    const initialTags = currentEntry?.tags || [];

    const textChanged = currentValue !== initialValue.trim();
    const moodChanged = selectedMood !== initialMood;
    const tagsChanged = JSON.stringify(currentTags.sort()) !== JSON.stringify(initialTags.sort());

    const hasChanged = textChanged || moodChanged || tagsChanged;
    const hasContent = currentValue.length > 0;

    elements.saveBtn.disabled = !hasChanged || !hasContent;
};

/**
 * Handle save button click
 */
const handleSave = () => {
    const text = elements.todayInput.value.trim();

    if (!text || text.length === 0) {
        return;
    }

    if (text.length > MAX_CHAR_LIMIT) {
        return;
    }

    const existingIndex = findEntryIndexByDate(currentEditingDate);

    const entryData = {
        date: currentEditingDate,
        text: text,
        mood: selectedMood,
        tags: currentTags.length > 0 ? currentTags : undefined,
    };

    if (existingIndex !== -1) {
        // Update existing entry
        entries[existingIndex] = entryData;
    } else {
        // Create new entry
        entries.push(entryData);
    }

    // Save to storage
    saveEntriesToStorage(entries);

    // Update initial value
    initialValue = text;

    // Show saved feedback
    showSaveFeedback();

    // Re-render
    updateSaveButton();
    renderEntries();
    renderStats();
    renderFilterTags();

    // If we're editing a past entry, switch back to today
    if (currentEditingDate !== getTodayISODate()) {
        renderTodayEntry();
    }
};

/**
 * Show save feedback message
 */
const showSaveFeedback = () => {
    elements.saveFeedback.classList.add('show');
    setTimeout(() => {
        elements.saveFeedback.classList.remove('show');
    }, 2000);
};

/**
 * Handle click on a past entry
 */
const handleEntryClick = (event) => {
    const entryItem = event.currentTarget;
    const date = entryItem.dataset.date;
    const entry = findEntryByDate(date);

    if (entry) {
        currentEditingDate = date;
        elements.todayInput.value = entry.text;
        initialValue = entry.text;

        elements.todayDate.textContent = formatDateDisplay(date);

        // Load mood and tags
        renderMoodSelector(entry.mood);
        currentTags = entry.tags || [];
        elements.tagsInput.value = currentTags.join(' ');
        renderTagsDisplay(currentTags);

        // Update badge
        const badge = document.querySelector('.today-entry__badge');
        if (badge) {
            badge.textContent = 'Editing';
            badge.style.backgroundColor = 'var(--color-warning)';
        }

        updateCharCounter();
        updateSaveButton();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Focus input
        elements.todayInput.focus();
    }
};

/**
 * Handle search input
 */
const handleSearch = (searchTerm) => {
    const term = searchTerm.trim().toLowerCase();

    let filteredEntries = entries;

    // Filter by tag if active
    if (activeFilterTag) {
        filteredEntries = filteredEntries.filter(entry =>
            entry.tags && entry.tags.includes(activeFilterTag)
        );
    }

    // Filter by search term
    if (term) {
        filteredEntries = filteredEntries.filter(entry =>
            entry.text.toLowerCase().includes(term) ||
            (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(term)))
        );
    }

    renderEntries(filteredEntries);
};

/**
 * Handle keyboard shortcuts
 */
const handleKeyboardShortcut = (event) => {
    // Ctrl/Cmd + Enter to save
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (!elements.saveBtn.disabled) {
            handleSave();
        }
    }
};

/* ===== Initialization ===== */

/**
 * Initialize the app
 */

function showJournalUI(show) {
    if (elements.mainContainer) elements.mainContainer.style.display = show ? '' : 'none';
    if (elements.header) elements.header.style.display = show ? '' : 'none';
}

function showAuthUI(show) {
    if (elements.authContainer) elements.authContainer.style.display = show ? '' : 'none';
}

function showLanding(show) {
    if (elements.landingPage) elements.landingPage.style.display = show ? '' : 'none';
}

function handleLogout() {
    clearSession();
    currentUser = null;
    showJournalUI(false);
    showAuthUI(false);
    showLanding(true);
}

function handleLoginSubmit(e) {
    e.preventDefault();
    const username = elements.loginUsername.value.trim();
    const password = elements.loginPassword.value;
    const users = getUsers();
    const user = users.find(u => u.username === username);
    if (!user || user.password !== hash(password)) {
        elements.loginError.textContent = 'Invalid username or password.';
        return;
    }
    setSession(username);
    currentUser = username;
    elements.loginError.textContent = '';
    elements.loginForm.reset();
    showAuthUI(false);
    showJournalUI(true);
    startJournal();
}

function handleSignupSubmit(e) {
    e.preventDefault();
    const username = elements.signupUsername.value.trim();
    const password = elements.signupPassword.value;
    if (!username || !password) {
        elements.signupError.textContent = 'Username and password required.';
        return;
    }
    const users = getUsers();
    if (users.some(u => u.username === username)) {
        elements.signupError.textContent = 'Username already exists.';
        return;
    }
    users.push({ username, password: hash(password) });
    saveUsers(users);
    setSession(username);
    currentUser = username;
    elements.signupError.textContent = '';
    elements.signupForm.reset();
    showAuthUI(false);
    showJournalUI(true);
    startJournal();
}

function setupAuthUI() {
    // Switch forms
    elements.showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        elements.loginForm.style.display = 'none';
        elements.signupForm.style.display = '';
        elements.loginError.textContent = '';
        elements.signupError.textContent = '';
    });
    elements.showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        elements.signupForm.style.display = 'none';
        elements.loginForm.style.display = '';
        elements.loginError.textContent = '';
        elements.signupError.textContent = '';
    });
    // Submit handlers
    elements.loginForm.addEventListener('submit', handleLoginSubmit);
    elements.signupForm.addEventListener('submit', handleSignupSubmit);
}

function startJournal() {
    entries = loadEntriesFromStorage();
    renderStats();
    renderPrompt();
    renderTodayEntry();
    renderEntries();
    renderFilterTags();

    // Add event listeners
    elements.todayInput.addEventListener('input', handleInputChange);
    elements.saveBtn.addEventListener('click', handleSave);
    elements.searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    elements.todayInput.addEventListener('keydown', handleKeyboardShortcut);

    // Mood selector
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mood = btn.dataset.mood;
            if (selectedMood === mood) {
                renderMoodSelector(null);
            } else {
                renderMoodSelector(mood);
            }
            updateSaveButton();
        });
    });

    // Prompt refresh
    elements.promptRefresh.addEventListener('click', renderPrompt);

    // Tags input
    elements.tagsInput.addEventListener('input', (e) => {
        const tags = parseTags(e.target.value);
        currentTags = tags;
        renderTagsDisplay(tags);
        updateSaveButton();
    });

    elements.tagsInput.addEventListener('blur', (e) => {
        // Clean up input on blur
        e.target.value = currentTags.join(' ');
    });

    // Auto-resize textarea
    elements.todayInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });

    // Add logout button to header if not present
    if (!document.getElementById('logoutBtn')) {
        const btn = document.createElement('button');
        btn.id = 'logoutBtn';
        btn.textContent = 'Logout';
        btn.className = 'btn btn--logout';
        btn.style.float = 'right';
        btn.style.margin = '0 0 0 1rem';
        btn.addEventListener('click', handleLogout);
        if (elements.header) elements.header.appendChild(btn);
    }
}

const init = () => {
    setupAuthUI();
    // Landing page logic
    if (elements.landingLoginBtn && elements.landingSignupBtn) {
        elements.landingLoginBtn.addEventListener('click', () => {
            showLanding(false);
            showAuthUI(true);
            elements.loginForm.style.display = '';
            elements.signupForm.style.display = 'none';
        });
        elements.landingSignupBtn.addEventListener('click', () => {
            showLanding(false);
            showAuthUI(true);
            elements.loginForm.style.display = 'none';
            elements.signupForm.style.display = '';
        });
    }
    // Home button logic
    if (elements.authHomeBtn) {
        elements.authHomeBtn.addEventListener('click', () => {
            showAuthUI(false);
            showLanding(true);
        });
    }
    currentUser = getSession();
    if (currentUser) {
        showLanding(false);
        showAuthUI(false);
        showJournalUI(true);
        startJournal();
    } else {
        showLanding(true);
        showAuthUI(false);
        showJournalUI(false);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
