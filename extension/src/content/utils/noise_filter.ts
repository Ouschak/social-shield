export const NOISE_EXACT_MATCHES = new Set([
    "Sponsorisé",
    "Sponsored",
    "Audio d’origine",
    "Report a problem",
    "Switch accounts",
    "Log out",
    "Switch appearance",
    "VerifiedPopular",
    "Aimé",
    "Déconnexion",
    "Changer de compte",
    "Signaler un problème",
    "Changer l’apparence",
    "Populaire"
]);

export const NOISE_PARTIAL_MATCHES = [
    "Suggested for you",
    "Suggestions pour vous",
    "Suggestions",
    "Followed by",
    "Suivi(e) par",
    "hours ago",
    "minutes ago",
    "Meta Verified",
    "Liked by ",
    "profile picture",
    "photo de profil",
    "suivi"
];

export const NOISE_PREFIXES = [
    "AboutHelpPressAPI",
    "Liked by "
];

export const NOISE_REGEX = [
    /^[\d,.]+[km]?\s*likes?$/i, // "1 like", "7,085 likes", etc.
    /^[a-zA-Z0-9._]+$/ // Likely a username if it's a single word with these chars
];

// Specific known noise words reported by users
export const KNOWN_NOISE_STRINGS = [
    "chakouss",
    "azrorganizationandsportsazr",
    "lina"
];

/**
 * Checks if a given text should be ignored as noise (UI elements, meta info, etc.)
 */
export function isNoise(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 1) return true;

    // 1. Exact matches (Fastest)
    if (NOISE_EXACT_MATCHES.has(trimmed)) return true;

    // 2. Regex matches
    for (const regex of NOISE_REGEX) {
        if (regex.test(trimmed)) return true;
    }

    const lower = trimmed.toLowerCase();

    // 3. Partial matches
    for (const pattern of NOISE_PARTIAL_MATCHES) {
        if (lower.includes(pattern.toLowerCase())) return true;
    }

    // 4. Prefix matches
    for (const prefix of NOISE_PREFIXES) {
        if (trimmed.startsWith(prefix)) return true;
    }

    // 5. Known noise strings
    for (const noise of KNOWN_NOISE_STRINGS) {
        if (lower.includes(noise.toLowerCase())) return true;
    }

    return false;
}
