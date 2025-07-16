import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { SettingsService } from '../../settings/services/settings.service';
import { DatabasesService } from '../../databases/services/databases.service';
import { ExerciseType, Difficulty } from '@prisma/client';

@Injectable()
export class ExerciseGenerationService {
    private readonly logger = new Logger(ExerciseGenerationService.name);
    private openai: OpenAI | null = null;
    private currentApiKey: string | null = null;

    constructor(
        private readonly settingsService: SettingsService,
        private readonly databasesService: DatabasesService,
    ) {}

    private async getOpenAIInstance(): Promise<OpenAI | null> {
        let apiKey = await this.settingsService.getSetting('OPENAI_API_KEY');
        if (!apiKey) {
            apiKey = process.env.OPENAI_API_KEY || null;
        }
        if (!apiKey) {
            this.logger.warn('No OpenAI API key found.');
            return null;
        }
        if (this.currentApiKey !== apiKey) {
            this.openai = new OpenAI({ apiKey });
            this.currentApiKey = apiKey;
        }
        return this.openai;
    }

    async generateExercise(params: {
        type: ExerciseType;
        difficulty: Difficulty;
        databaseId?: number;
        syntaxElements?: string[];
        sqlConcepts?: string[];
    }): Promise<{ title: string; description: string; solution: string }> {
        const openai = await this.getOpenAIInstance();
        if (!openai) {
            throw new Error('OpenAI API key not configured.');
        }

        let dbSchema = '';
        if (params.type === 'QUERY' && params.databaseId) {
            // Hole das echte SQL-Schema der Datenbank
            const schemaResult = await this.databasesService.getDatabaseSchema(params.databaseId);
            dbSchema = schemaResult?.schema || '';
        }

        const prompt = this.buildPrompt(params, dbSchema);
        const completion = await openai.chat.completions.create({
            model: 'gpt-4.1',
            messages: [
                {
                    role: 'system',
                    content:
                        'Du bist ein SQL-Tutor. Generiere eine vollständige Übungsaufgabe (Titel, Beschreibung, Lösung) für Studierende. Die Aufgabe muss zum gewählten Typ, Schwierigkeitsgrad und ggf. Datenbankschema passen. Antworte im JSON-Format: {"title":..., "description":..., "solution":...}.',
                },
                { role: 'user', content: prompt },
            ],
            max_tokens: 600,
            temperature: 0.7,
        });
        const text = completion.choices[0]?.message?.content?.trim() || '{}';
        try {
            const json = JSON.parse(text);
            return {
                title: json.title || '',
                description: json.description || '',
                solution: json.solution || '',
            };
        } catch (e) {
            this.logger.error('OpenAI response is not valid JSON:', text);
            throw new Error('KI-Antwort konnte nicht verarbeitet werden.');
        }
    }

    private buildPrompt(params: any, dbSchema: string): string {
        let prompt = `Erstelle eine SQL-Übungsaufgabe für Studierende. Die Aufgabe soll das Schreiben einer SQL-Query erfordern.\n`;
        prompt += `Schwierigkeit: ${params.difficulty}\n`;
        if (dbSchema) {
            prompt += `Datenbankschema: ${dbSchema}\n`;
        }
        if (params.syntaxElements?.length) {
            prompt += `Verwende folgende SQL-Syntaxelemente: ${params.syntaxElements.join(', ')}\n`;
        }
        if (params.sqlConcepts?.length) {
            prompt += `Beziehe folgende SQL-Konzepte ein: ${params.sqlConcepts.join(', ')}\n`;
        }
        return prompt.trim();
    }
}
