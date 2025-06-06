export interface BookmarkData {
    id: number;
    userId: number;
    exerciseId: number;
    exercise: {
        id: number;
        title: string;
        type: string;
        difficulty: string;
        order: number;
        topic: {
            id: number;
            title: string;
            chapter: {
                id: number;
                title: string;
            };
        };
    };
    createdAt: Date;
}

export interface CreateBookmarkDto {
    exerciseId: number;
}
