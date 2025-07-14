import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * DTO for creating a new comment in a discussion thread
 */
export class CreateCommentDto {
    /**
     * Content of the comment
     */
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    content: string;
}
