import { IsString, IsOptional, IsBoolean } from 'class-validator';

// DTO-Klasse zur Validierung eingehender Daten beim Erstellen einer Frage
export class CreateQuestionDto {
  @IsString() // Muss ein Text sein
  student_name: string;

  @IsString() // Muss ein Text sein
  frage: string;

  @IsOptional() // Optionales Feld
  @IsString() // Muss ein gültiger Datums-String sein (z. B. ISO-Zeitstempel)
  erstellt_am?: string;

  @IsOptional() // Optional und boolesch
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
