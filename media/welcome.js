// @ts-check

// Get VS Code API
const vscode = acquireVsCodeApi();

// State management
let state = {
    version: '0.3.0',
    recentMaps: [],
    stats: {
        mapsCreated: 0,
        timeSaved: 0,
        quickActions: 0,
        objectivesBuilt: 0
    },
    currentTutorialStep: 1,
    activeFeatureTab: 'editing'
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading overlay
    setTimeout(() => {
        const loader = document.getElementById('loadingOverlay');
        if (loader) {
            loader.classList.remove('active');
        }
    }, 300);

    // Initialize interactive elements
    initializeTabs();
    initializeTutorial();
    initializeAnimations();
    setupEventListeners();
});

// Send message to extension
function sendMessage(command, data = {}) {
    vscode.postMessage({
        command,
        ...data
    });
}

// Handle messages from extension
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
        case 'init':
            updateState(message);
            updateUI();
            break;
        case 'version':
            updateVersion(message.version);
            break;
        case 'recentMapsCleared':
            state.recentMaps = [];
            updateRecentMaps();
            break;
    }
});

// Update state from extension
function updateState(data) {
    if (data.version) state.version = data.version;
    if (data.recentMaps) state.recentMaps = data.recentMaps;
    if (data.stats) state.stats = data.stats;
}

// Update UI elements
function updateUI() {
    updateVersion(state.version);
    updateStats();
    updateRecentMaps();
}

// Update version display
function updateVersion(version) {
    const elements = ['versionNumber', 'footerVersion'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = version;
    });
}

// Update statistics
function updateStats() {
    const stats = state.stats;
    updateStatValue('mapsCreated', stats.mapsCreated);
    updateStatValue('timeSaved', formatTime(stats.timeSaved));
    updateStatValue('quickActions', stats.quickActions);
    updateStatValue('objectivesBuilt', stats.objectivesBuilt);
}

function updateStatValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value.toString();
        // Animate number change
        el.style.transform = 'scale(1.2)';
        setTimeout(() => {
            el.style.transform = 'scale(1)';
        }, 200);
    }
}

function formatTime(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Update recent maps
function updateRecentMaps() {
    const section = document.getElementById('recentSection');
    const grid = document.getElementById('recentGrid');
    
    if (!section || !grid) return;
    
    if (state.recentMaps.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    grid.innerHTML = state.recentMaps.map((path, index) => {
        const filename = path.split(/[/\\]/).pop();
        return `
            <div class="recent-item" onclick="openRecent('${path}')" style="animation-delay: ${index * 0.1}s">
                <span class="recent-icon">📄</span>
                <div class="recent-info">
                    <h4>${filename}</h4>
                    <p>${path}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Initialize feature tabs
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.textContent.toLowerCase();
            showFeatureTab(tabName);
        });
    });
}

// Show feature tab
function showFeatureTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === tabName);
    });
    
    // Update content
    document.querySelectorAll('.feature-tab').forEach(tab => {
        tab.classList.toggle('active', tab.id === `${tabName}-tab`);
    });
    
    state.activeFeatureTab = tabName;
}

// Initialize tutorial
function initializeTutorial() {
    const steps = document.querySelectorAll('.tutorial-step');
    steps.forEach((step, index) => {
        step.addEventListener('click', () => {
            setTutorialStep(index + 1);
        });
    });
}

// Set tutorial step
function setTutorialStep(step) {
    state.currentTutorialStep = step;
    
    // Update step states
    document.querySelectorAll('.tutorial-step').forEach((el, index) => {
        el.classList.toggle('active', index + 1 === step);
    });
    
    // Update progress bar
    const progress = (step / 4) * 100;
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
}

// Start tutorial
function startTutorial(type) {
    switch (type) {
        case 'create':
            runCommand('manicMiners.newFile');
            break;
        case 'tiles':
            runCommand('manicMiners.showMapPreview');
            break;
        case 'script':
            openDoc('game-reference/scripting/overview.md');
            break;
        case 'test':
            runCommand('manicMiners.validateMap');
            break;
    }
}

// Initialize animations
function initializeAnimations() {
    // Animate stats on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.stat-card').forEach(card => {
        observer.observe(card);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N for new file
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            runCommand('manicMiners.newFile');
        }
        
        // Ctrl/Cmd + O for open sample
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            openSample();
        }
        
        // Ctrl/Cmd + K for command palette
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            runCommand('workbench.action.showCommands');
        }
    });
    
    // Add hover effects
    addHoverEffects();
}

// Add hover effects to interactive elements
function addHoverEffects() {
    const cards = document.querySelectorAll('.feature-card, .resource-card, .community-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    });
}

// Command functions
function openDoc(url) {
    sendMessage('openDoc', { url });
}

function openSettings() {
    sendMessage('openSettings');
}

function openSample(sampleName) {
    sendMessage('openSample', { sampleName });
}

function runCommand(commandId) {
    sendMessage('runCommand', { commandId });
}

function openRecent(path) {
    sendMessage('openRecent', { path });
}

function clearRecent() {
    if (confirm('Clear all recent maps?')) {
        sendMessage('clearRecent');
    }
}

function openFolder() {
    sendMessage('openFolder');
}

function openExternal(url) {
    sendMessage('openExternal', { url });
}

function showNotification(text) {
    sendMessage('showNotification', { text });
}

// Theme detection and adjustment
function detectTheme() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark-theme', isDark);
}

// Watch for theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectTheme);
detectTheme();

// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add ripple effect to buttons
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        this.appendChild(ripple);
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add loading state to buttons
function setButtonLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<span class="spinner"></span> Loading...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
    }
}

// Initialize tooltips
function initTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(el => {
        el.addEventListener('mouseenter', showTooltip);
        el.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const text = e.target.getAttribute('data-tooltip');
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
}

function hideTooltip() {
    document.querySelectorAll('.tooltip').forEach(t => t.remove());
}

// Initialize on load
initTooltips();