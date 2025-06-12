import { IsString, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for creating a question.
 */
export class CreateQuestionDto {
  /** Student's name */
  @IsString()
  student_name: string;

  /** Question text */
  @IsString()
  frage: string;

  /** Optional timestamp string */
  @IsOptional()
  @IsString()
  erstellt_am?: string;

  /** Optional archive flag */
  @IsOptional()
  @IsBoolean()
  ist_archiviert?: boolean;

  /** Optional pinned flag */
  @IsOptional()
  @IsBoolean()
  ist_angepinnt?: boolean;

  /** Optional delete flag */
  @IsOptional()
  @IsBoolean()
  ist_geloescht?: boolean;

  /** Optional answered flag */
  @IsOptional()
  @IsBoolean()
  ist_beantwortet?: boolean;
}
