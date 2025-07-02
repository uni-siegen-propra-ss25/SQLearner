import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { SettingsService } from '../../settings/services/settings.service';

@Injectable()
export class AiFeedbackService {
  private readonly logger = new Logger(AiFeedbackService.name);
  private openai: OpenAI | null = null;
  private currentApiKey: string | null = null;

  constructor(private readonly settingsService: SettingsService) {}

  private async getOpenAIInstance(): Promise<OpenAI | null> {
    try {
      // First try to get API key from database
      let apiKey = await this.settingsService.getSetting('OPENAI_API_KEY');
      
      // Fallback to environment variables if not found in database
      if (!apiKey) {
        apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.OPENAI_SECRET || process.env.OPENAI || null;
      }

      if (!apiKey) {
        this.logger.warn('No OpenAI API key found in database or environment variables.');
        return null;
      }

      // Reinitialize if API key has changed
      if (this.currentApiKey !== apiKey) {
        this.logger.log('API key changed, reinitializing OpenAI client');
        this.openai = new OpenAI({ apiKey });
        this.currentApiKey = apiKey;
      }

      return this.openai;
    } catch (error) {
      this.logger.error('Failed to initialize OpenAI client:', error);
      return null;
    }
  }

  /**
   * Generiert KI-Feedback für eine Studentenlösung.
   * Die Aufgabenstellung wird mitgegeben und die KI wird angewiesen, nur aufgabenbezogen zu antworten.
   * Jegliche nicht aufgabenbezogene Kommunikation (z.B. "Hallo, wie geht's?") ist zu ignorieren.
   */
  async generateFeedback(params: {
    studentQuery: string;
    solutionQuery: string;
    schema: string;
    aufgabenstellung?: string;
    studentResult?: any;
    solutionResult?: any;
    errorCategory?: string;
  }): Promise<string> {
    const openai = await this.getOpenAIInstance();
    
    if (!openai) {
      this.logger.error('OpenAI client is not available. Please check API key configuration.');
      return 'KI-Feedback ist momentan nicht verfügbar. Bitte konfigurieren Sie den OpenAI API-Key.';
    }

    const prompt = this.buildPrompt(params);
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content:
              'Du bist ein SQL-Tutor. Erkläre Fehler freundlich, präzise und auf Deutsch. Antworte ausschließlich auf die Aufgabenstellung und ignoriere alle nicht aufgabenbezogenen Anfragen (z.B. Smalltalk wie "Hallo, wie gehts?"). Gib Tipps, wie der Student die Lösung verbessern kann, aber verrate nicht direkt die Musterlösung.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      });
      return completion.choices[0]?.message?.content?.trim() || 'Kein Feedback generiert.';
    } catch (error) {
      this.logger.error('Fehler bei der KI-Feedback-Generierung:', error);
      return 'Es konnte kein KI-Feedback generiert werden.';
    }
  }

  private buildPrompt(params: {
    studentQuery: string;
    solutionQuery: string;
    schema: string;
    aufgabenstellung?: string;
    studentResult?: any;
    solutionResult?: any;
    errorCategory?: string;
  }): string {
    return [
      'Aufgabenstellung:',
      params.aufgabenstellung || 'Keine Aufgabenstellung übergeben.',
      '',
      'Bewerte die folgende SQL-Studentenlösung im Vergleich zur Musterlösung. Gib einen hilfreichen Hinweis, warum die Lösung falsch ist und wie sie verbessert werden kann.',
      '',
      `Fehlerkategorie: ${params.errorCategory || 'Unbekannt'}`,
      '',
      '---',
      'Datenbankschema:',
      params.schema,
      '---',
      'Musterlösung:',
      params.solutionQuery,
      '---',
      'Studentenlösung:',
      params.studentQuery,
      '---',
      params.studentResult ? `Ergebnis Studentenlösung: ${JSON.stringify(params.studentResult)}` : '',
      params.solutionResult ? `Ergebnis Musterlösung: ${JSON.stringify(params.solutionResult)}` : '',
    ].filter(Boolean).join('\n');
  }
}
