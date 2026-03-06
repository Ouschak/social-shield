import { shouldHideByUserPrefs } from '../filters/userBlocklist';
import { BAD_WORDS } from '../data/bad_words';
import { isNoise } from '../utils/noise_filter';

const SELECTORS = {
    commentText: '[data-testid="post-comment-text-content"]',
    testing: 'ul ul span[dir="auto"]',
    commentReels: 'div.x1cy8zhl.x1oa3qoh.x1nhvcw1',
};

const EYE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 3c5.5 0 10 3.58 10 8s-4.5 8-10 8c-1.24 0-2.43-.18-3.53-.5C5.55 21 2 21 2 21c2.33-2.33 2.7-3.9 2.75-4.5C3.05 15.07 2 13.13 2 11c0-4.42 4.5-8 10-8zm0 2c-4.42 0-8 2.69-8 6 0 1.55.6 2.97 1.62 4.09l.33.37-.15.48c-.06.2-.18.73-.55 1.54 1.29-.27 2.19-.88 2.68-1.55l.24-.33.38.12c1.02.32 2.13.48 3.25.48 4.42 0 8-2.69 8-6s-3.58-6-8-6zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/></svg>`;
const FLAG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>`;
const INFO_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z"/></svg>`;

type HideReason = 'USER_FILTER' | 'PATTERN_MATCH' | 'AI_DECISION' | 'SOFT_HARASSMENT';

const REASON_TEXT: Record<HideReason, string> = {
    USER_FILTER: "Hidden by your preferences",
    PATTERN_MATCH: "Hidden due to harmful language",
    AI_DECISION: "Hidden due to potentially harmful content detected by AI",
    SOFT_HARASSMENT: "Hidden due to potentially negative comment detected by AI"
};

function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function checkPatterns(text: string): boolean {
    const lowerText = text.toLowerCase();
    for (const word of BAD_WORDS) {
        const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
        if (regex.test(lowerText)) {
            return true;
        }
    }
    return false;
}

let processedElements = new WeakSet<Element>();
let isEnabled = true;
let isSoftHarassmentEnabled = false;

function updateEnabledState() {
    console.log('[CreatorShield] updateEnabledState called');
    chrome.storage.local.get('creator-shield-detection-store', (result) => {
        console.log('[CreatorShield] Storage result:', result);
        if (result['creator-shield-detection-store']) {
            try {
                const raw = result['creator-shield-detection-store'];
                console.log('[CreatorShield] Raw state:', raw);
                const state = JSON.parse(raw).state;

                const newEnabled = state?.enabled ?? true;
                const newSoftHarassment = state?.softHarassmentEnabled ?? false;

                // State verification logs
                console.log(`[CreatorShield] STATE UPDATE: Enabled=${newEnabled}, SoftHarassment=${newSoftHarassment}`);

                let shouldRescan = false;

                if (isEnabled !== newEnabled) {
                    console.log(`[CreatorShield] 🚨 GLOBAL ENABLE TOGGLED: ${isEnabled} -> ${newEnabled}`);
                    isEnabled = newEnabled;
                    if (isEnabled) {
                        shouldRescan = true;
                    } else {
                        disableProtection();
                    }
                }

                if (isSoftHarassmentEnabled !== newSoftHarassment) {
                    console.log(`[CreatorShield] 🚨 SOFT HARASSMENT TOGGLED: ${isSoftHarassmentEnabled} -> ${newSoftHarassment}`);
                    isSoftHarassmentEnabled = newSoftHarassment;
                    // Only rescan if global protection is on
                    if (isEnabled) {
                        shouldRescan = true;
                    }
                }

                if (shouldRescan) {
                    console.log('[CreatorShield] 🔄 State changed, triggering FORCE RESCAN...');
                    // Use forceRescan to clear previous state (unblur/blur) before re-scanning
                    forceRescan();
                } else {
                    console.log('[CreatorShield] No rescan needed.');
                }

            } catch (e) { console.error('[CreatorShield] Error parsing state:', e); }
        }
    });
}

function enableProtection() {
    console.log('[CreatorShield] Enabling protection - Re-scanning');
    document.body.classList.remove('cs-protection-disabled');
    // Reset processed set to allow re-scanning
    processedElements = new WeakSet<Element>();

    // Scan all existing comments
    const comments = document.querySelectorAll(Object.values(SELECTORS).join(', '));
    comments.forEach(el => analyzeComment(el as HTMLElement));
}

function disableProtection() {
    console.log('[CreatorShield] Disabling protection - Cleaning up');
    document.body.classList.add('cs-protection-disabled');

    // Remove all overlays
    document.querySelectorAll('.cs-toxic-overlay').forEach(el => el.remove());

    // Reset blurred elements
    document.querySelectorAll('[data-toxic="true"]').forEach(el => {
        const element = el as HTMLElement;
        element.style.filter = '';
        element.style.transition = '';
        delete element.dataset.toxic;
    });

    // Remove reporting buttons
    document.querySelectorAll('.cs-flag-btn').forEach(el => el.remove());
}

// Store observer reference
let observer: MutationObserver | null = null;

export function initCommentObserver(): void {
    updateEnabledState();

    // Listen for changes
    chrome.storage.onChanged.addListener((changes, area) => {
        console.log('[CreatorShield] Storage changed in area:', area, changes);
        if (changes['creator-shield-detection-store']) {
            updateEnabledState();
        }
    });

    observer = new MutationObserver(handleMutations);
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('[CreatorShield] Observer active');
}

export function forceRescan(): void {
    if (isEnabled) {
        // clean up all previous effects first
        disableProtection();
        // then re-scan
        enableProtection();
    }
}

async function handleMutations(mutations: MutationRecord[]): Promise<void> {
    if (!isEnabled) return;
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node instanceof HTMLElement) {
                const comments = node.querySelectorAll(Object.values(SELECTORS).join(', '));
                comments.forEach(el => analyzeComment(el as HTMLElement));
                if (node.matches(Object.values(SELECTORS).join(', '))) {
                    analyzeComment(node);
                }
            }
        }
    }
}

async function analyzeComment(element: HTMLElement): Promise<void> {
    // console.log('[CreatorShield] analyzing element', element);
    if (processedElements.has(element)) return;
    processedElements.add(element);

    const text = element.textContent?.trim();
    // Debug info
    // console.log('[CreatorShield] Element text:', text);

    // Lower threshold to 1 to allow short blocked words
    if (!text || text.length < 1) return;

    // Exclude location links and their containers
    if (element.closest('a')) return;

    // Check if element contains a location link directly
    if (element.querySelector('a[href*="/explore/locations/"]')) return;

    if (isNoise(text)) return;


    const container = element.parentElement;
    if (!container) {
        // console.log('[CreatorShield] No container found for', element);
        return;
    }

    try {
        container.style.position = 'relative';

        // TIER 0: User Blocklist (Local Preference)
        // MUST run before any backend check or regex pattern match
        if (shouldHideByUserPrefs(text)) {
            console.log(`[TIER 0] Blocked by user preference: "${text}"`);
            handleToxicComment(element, container, 'USER_FILTER');
            return;
        }

        // TIER 1: Check patterns first (instant)
        const patternMatch = checkPatterns(text);

        if (patternMatch) {
            console.log(`[TIER 1] Pattern matched: "${text}"`);
        }

        // Check for soft harassment if enabled
        const analysisPayload = {
            text,
            checkSoftHarassment: isSoftHarassmentEnabled
        };

        if (patternMatch) {
            // Instant block
            console.log(`🔴 [PATTERN BLOCKED] "${text}"`);
            handleToxicComment(element, container, 'PATTERN_MATCH');

            // Still verify with backend in background (for un-hide logic)
            chrome.runtime.sendMessage({
                type: 'ANALYZE_TEXT',
                payload: analysisPayload
            }, (response) => {
                if (response && !response.is_toxic) {
                    // Backend says safe - un-hide
                    console.log('[UN-HIDE] Backend cleared pattern match');
                    element.style.filter = 'none';
                    const overlay = container.querySelector('.cs-toxic-overlay');
                    if (overlay) overlay.remove();
                }
            });
        } else {
            // No pattern match - send to backend (TIER 3)
            chrome.runtime.sendMessage({
                type: 'ANALYZE_TEXT',
                payload: analysisPayload
            }, (response) => {
                if (chrome.runtime.lastError) {
                    if (chrome.runtime.lastError.message?.includes('invalidated')) {
                        observer?.disconnect();
                    }
                    return;
                }
                if (!response) return;

                if (response.is_toxic) {
                    const reason = response.label === 'harassment' ? 'SOFT_HARASSMENT' : 'AI_DECISION';
                    handleToxicComment(element, container, reason);
                } else {
                    handleSafeComment(element, container, text);
                }
            });
        }
    } catch (e) {
        console.error(e);
    }
}

function handleToxicComment(element: HTMLElement, container: HTMLElement, reason: HideReason) {
    element.style.filter = 'blur(6px)';
    element.style.transition = 'filter 0.3s';
    element.dataset.toxic = "true";
    element.dataset.hideReason = reason;

    // create overlay
    const overlay = document.createElement('div');
    overlay.className = 'cs-toxic-overlay';
    overlay.style.cssText = `
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        background: transparent; z-index: 10000;
        border-radius: 4px;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
    `;

    // Show overlay on hover
    container.addEventListener('mouseenter', () => overlay.style.opacity = '1');
    container.addEventListener('mouseleave', () => overlay.style.opacity = '0');

    // View Button
    const viewBtn = document.createElement('button');
    viewBtn.innerHTML = `${EYE_ICON} Show`;
    viewBtn.style.cssText = `
        display: flex; align-items: center; gap: 4px; border: 1px solid rgba(255,255,255,0.2); 
        background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.2); padding: 4px 10px; border-radius: 12px;
        font-size: 11px; font-weight: 500; cursor: pointer; color: white;
        transition: background 0.2s;
    `;
    viewBtn.onmouseover = () => viewBtn.style.background = 'rgba(0, 0, 0, 0.8)';
    viewBtn.onmouseout = () => viewBtn.style.background = 'rgba(0, 0, 0, 0.6)';

    viewBtn.onclick = () => {
        element.style.filter = 'none';
        overlay.style.display = 'none';

        // Add compact feedback prompt below the comment
        const feedbackPrompt = document.createElement('div');
        feedbackPrompt.style.cssText = `
            display: flex; align-items: center; justify-content: center; gap: 6px;
            background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px);
            border-radius: 6px; padding: 4px 8px; margin-top: 4px;
        `;

        const safeBtn = document.createElement('button');
        safeBtn.textContent = 'Safe';
        safeBtn.style.cssText = `
            background: rgba(34, 197, 94, 0.9); color: white; border: none;
            padding: 2px 8px; border-radius: 4px; font-size: 9px;
            font-weight: 500; cursor: pointer; transition: background 0.2s;
        `;
        safeBtn.onmouseover = () => safeBtn.style.background = 'rgba(34, 197, 94, 1)';
        safeBtn.onmouseout = () => safeBtn.style.background = 'rgba(34, 197, 94, 0.9)';
        safeBtn.onclick = () => {
            const commentText = element.textContent?.trim() || '';
            sendFeedback(commentText, 'safe');
            feedbackPrompt.remove();
            console.log('[CreatorShield] User reported false positive:', commentText);
        };

        const dismissBtn = document.createElement('button');
        dismissBtn.textContent = 'Dismiss';
        dismissBtn.style.cssText = `
            background: rgba(107, 114, 128, 0.9); color: white; border: none;
            padding: 2px 8px; border-radius: 4px; font-size: 9px;
            font-weight: 500; cursor: pointer; transition: background 0.2s;
        `;
        dismissBtn.onmouseover = () => dismissBtn.style.background = 'rgba(107, 114, 128, 1)';
        dismissBtn.onmouseout = () => dismissBtn.style.background = 'rgba(107, 114, 128, 0.9)';
        dismissBtn.onclick = () => {
            feedbackPrompt.remove();
        };

        feedbackPrompt.appendChild(safeBtn);
        feedbackPrompt.appendChild(dismissBtn);

        // Insert after the container instead of inside it
        container.parentElement?.insertBefore(feedbackPrompt, container.nextSibling);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (feedbackPrompt.parentElement) {
                feedbackPrompt.remove();
            }
        }, 5000);
    };



    // Why Button
    const whyBtn = document.createElement('button');
    whyBtn.innerHTML = `${INFO_ICON}`;
    whyBtn.style.cssText = viewBtn.style.cssText;
    whyBtn.style.color = '#9ca3af'; // Gray text

    // Explanation Text
    const explanation = document.createElement('div');
    explanation.style.cssText = `
        display: none; width: 100%; text-align: center;
        color: #ffffff; font-size: 11px; margin-top: 6px; font-weight: 600;
        text-shadow: 0 1px 4px rgba(0,0,0,0.9);
        background: rgba(0,0,0,0.8); padding: 4px 8px; border-radius: 4px;
        backdrop-filter: blur(4px);
        pointer-events: none;
        position: relative; z-index: 10001;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    `;
    explanation.innerText = REASON_TEXT[reason];

    whyBtn.onclick = () => {
        if (explanation.style.display === 'none') {
            explanation.style.display = 'block';
            whyBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        } else {
            explanation.style.display = 'none';
            whyBtn.style.background = 'rgba(0, 0, 0, 0.6)';
        }
    };

    // Button container to keep buttons in one row
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: flex; gap: 8px; align-items: center; justify-content: center;';
    btnContainer.appendChild(viewBtn);
    btnContainer.appendChild(whyBtn);

    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center;';

    contentContainer.appendChild(btnContainer);
    contentContainer.appendChild(explanation);

    overlay.appendChild(contentContainer);
    container.appendChild(overlay);
}

function handleSafeComment(element: HTMLElement, container: HTMLElement, text: string) {
    const flagBtn = document.createElement('button');
    flagBtn.className = 'cs-flag-btn';
    flagBtn.innerHTML = FLAG_ICON;
    flagBtn.title = "Report as Toxic";
    flagBtn.style.cssText = `
        opacity: 0; transition: opacity 0.2s; border: none; background: none; 
        cursor: pointer; color: #9ca3af; margin-left: 8px; vertical-align: middle;
    `;

    container.addEventListener('mouseenter', () => flagBtn.style.opacity = '1');
    container.addEventListener('mouseleave', () => flagBtn.style.opacity = '0');

    flagBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm("Report this comment as toxic?")) {
            sendFeedback(text, 'toxic');
            flagBtn.style.color = '#ef4444';
            element.style.filter = 'blur(2px)';
        }
    };
    container.appendChild(flagBtn);
}

function sendFeedback(content: string, correction: 'toxic' | 'safe') {
    chrome.runtime.sendMessage({
        type: 'SEND_FEEDBACK',
        payload: { content, platform: 'instagram', correction }
    });
}
