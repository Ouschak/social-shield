import { initCommentObserver, forceRescan } from './observers/comment.observer';
import { initUserBlocklist } from './filters/userBlocklist';
import '../styles/blur.css';

// Initialize content script when DOM is ready
async function init(): Promise<void> {
    console.log('[CreatorShield] v2.1.0 - Clean Boot');

    // Nuke any old overlays immediately
    document.querySelectorAll('.cs-toxic-overlay').forEach(el => el.remove());

    // Initialize blocklist with re-scan callback
    await initUserBlocklist(() => {
        console.log('[CreatorShield] Blocklist updated, triggering re-scan');
        forceRescan();
    });

    initCommentObserver();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
