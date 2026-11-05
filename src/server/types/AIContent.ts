export interface AIContentRequest {
    service: string;
    platform: string;
    tone: string;
    extra?: string;
}

export interface AIContentResponse {
    content: string;
}