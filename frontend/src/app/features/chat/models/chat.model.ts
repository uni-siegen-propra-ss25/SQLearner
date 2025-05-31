export interface Message {
    id: number;
    content: string;
    sender: 'user' | 'assistant';
    context?: string;
    replyToId?: number;
    createdAt: Date;
    updatedAt: Date;
    replyTo?: Message | null;
}

export interface ChatState {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
}
