import { MessageSender } from '@prisma/client';

export interface Message {
    id: number;
    content: string;
    sender: MessageSender;
    userId: number;
    context: string | null;
    replyToId: number | null;
    createdAt: Date;
    updatedAt: Date;
    replyTo?: Message | null;
}

export class MessageDto {
    content: string;
    context?: string | null;
}
