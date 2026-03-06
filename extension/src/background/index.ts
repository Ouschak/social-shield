import { apiService } from './services/api.service';
// import { useDetectionStore } from '@/shared/store/detectionStore';

// Initialize services
console.log('[CreatorShield] Background service worker started');

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'ANALYZE_TEXT') {
        // RESTORED LOGIC: Respect the client's payload
        let softHarassmentEnabled = false;
        if (message.payload.checkSoftHarassment !== undefined) {
            softHarassmentEnabled = message.payload.checkSoftHarassment;
            console.log(`[Background] 🟢 DECISION: Using Payload Flag -> ${softHarassmentEnabled}`);
        } else {
            console.log('[Background] � PAYLOAD FLAG UNDEFINED. Defaulting to False.');
        }

        apiService.analyzeText(message.payload.text, softHarassmentEnabled)
            .then((response) => {
                sendResponse(response);
            })
            .catch(error => {
                console.error('Analysis error:', error);
                sendResponse({ error: error.message });
            });
        return true; // async response
    }

    if (message.type === 'SEND_FEEDBACK') {
        const { content, platform, correction } = message.payload;
        apiService.sendFeedback(content, platform, correction)
            .then(() => sendResponse({ success: true }))
            .catch(() => sendResponse({ success: false }));
        return true;
    }


});
