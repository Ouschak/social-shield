
let blocklistRegexes: RegExp[] = [];

// Storage key
const STORAGE_KEY = 'user_blocklist';

/**
 * Initialize the blocklist.
 * Loads from storage and sets up the change listener.
 */
/**
 * Initialize the blocklist.
 * Loads from storage and sets up the change listener.
 * @param onUpdate Optional callback to run when blocklist changes (e.g., to trigger re-scan)
 */
export async function initUserBlocklist(onUpdate?: () => void): Promise<void> {
    await loadBlocklist();

    chrome.storage.onChanged.addListener((changes) => {
        if (changes[STORAGE_KEY]) {
            updateCache(changes[STORAGE_KEY].newValue);
            if (onUpdate) onUpdate();
        }
    });
}

/**
 * Check if text should be hidden based on user blocklist.
 * Returns TRUE if blocked, FALSE if allowed.
 */
export function shouldHideByUserPrefs(text: string): boolean {
    if (blocklistRegexes.length === 0) return false;

    // Normalize check text: lowercase, trim, collapse spaces
    const normalized = text.toLowerCase().trim().replace(/\s+/g, ' ');

    // Debug log (can be removed later)
    console.log(`[CreatorShield] Checking text: "${normalized}" against ${blocklistRegexes.length} patterns`);

    const match = blocklistRegexes.some(regex => {
        const isMatch = regex.test(normalized);
        if (isMatch) {
            console.log(`[CreatorShield] Matched user blocklist: "${normalized}" with pattern ${regex}`);
        }
        return isMatch;
    });

    return match;
}

function loadBlocklist(): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.get(STORAGE_KEY, (result) => {
            if (result[STORAGE_KEY]) {
                console.log('[CreatorShield] Loaded blocklist from storage:', result[STORAGE_KEY]);
                updateCache(result[STORAGE_KEY]);
            } else {
                console.log('[CreatorShield] No blocklist found in storage');
            }
            resolve();
        });
    });
}

function updateCache(items: string[] | undefined) {
    if (!items || !Array.isArray(items)) {
        blocklistRegexes = [];
        return;
    }

    blocklistRegexes = items
        .filter(item => typeof item === 'string' && item.trim().length > 0)
        .map(createSafeRegex);

    console.log(`[CreatorShield] Updated user blocklist: ${blocklistRegexes.length} patterns`);
}

function createSafeRegex(phrase: string): RegExp {
    // Normalize phrase: lowercase, trim, collapse spaces
    const normalized = phrase.toLowerCase().trim().replace(/\s+/g, ' ');

    // Escape special regex characters
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create Unicode-aware whole word/phrase match
    // (^|[^\p{L}\p{N}]) matches start of string or non-letter/number
    // ($|[^\p{L}\p{N}]) matches end of string or non-letter/number
    const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'u');
    console.log(`[CreatorShield] Created regex for "${phrase}":`, regex);
    return regex;
}
