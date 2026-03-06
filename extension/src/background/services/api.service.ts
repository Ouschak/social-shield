import type { AnalyzeResponse } from '@/shared/types/detection.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiService {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async analyzeText(text: string, check_soft_harassment: boolean = false): Promise<AnalyzeResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, check_soft_harassment }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[CreatorShield] API analyze error:', error);
            throw error;
        }
    }


    async sendFeedback(content: string, platform: string, correction: 'toxic' | 'safe'): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, platform, correction })
            });
            if (!response.ok) throw new Error('Failed to send feedback');
        } catch (error) {
            console.error('[CreatorShield] Feedback error:', error);
        }
    }
}

export const apiService = new ApiService();
