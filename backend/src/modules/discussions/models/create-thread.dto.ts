import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * DTO for creating a new discussion thread
 */
export class CreateThreadDto {
    /**
     * Title of the discussion thread
     */
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string;

    /**
     * Detailed description of the discussion topic
     */
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    description: string;
}
