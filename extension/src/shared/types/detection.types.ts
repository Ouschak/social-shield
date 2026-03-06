export interface Detection {
    id: string;
    content: string;
    confidence: number;
    prediction: 'hate' | 'safe';
    platform: 'instagram' | 'youtube' | 'twitter';
    sourceUrl: string;
    detectedAt: Date;
    isValidated: boolean;
}

export interface DetectionResult {
    isHate: boolean;
    confidence: number;
    label?: string;
}

export interface AnalyzeRequest {
    text: string;
    platform?: string;
    url?: string;
    check_soft_harassment?: boolean;
}

export interface AnalyzeResponse {
    text: string;
    is_toxic: boolean;
    score: number;
    label: string;
    confidence: number;
}

