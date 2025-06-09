import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  student_name: string;

  @IsString()
  frage: string;

  @IsOptional()
  @IsString()
  erstellt_am?: string;

  @IsOptional()
  @IsBoolean()
  ist_archiviert?: boolean;

  @IsOptional()
  @IsBoolean()
  ist_angepinnt?: boolean;

  @IsOptional()
  @IsBoolean()
  ist_geloescht?: boolean;

  @IsOptional()
  @IsBoolean()
  ist_beantwortet?: boolean;
}

