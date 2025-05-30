import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly secret = process.env.API_KEY_ENCRYPTION_SECRET || 'default_secret_32_bytes_long!';

  constructor(private readonly prisma: PrismaService) {}

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.secret, 'utf-8'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(text: string): string {
    const [ivHex, encrypted] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.secret, 'utf-8'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async setApiKey(userId: number, apiKey: string) {
    const encrypted = this.encrypt(apiKey);
    // Upsert: update if exists, else create
    return this.prisma.adminApiKey.upsert({
      where: { userId },
      update: { apiKey: encrypted },
      create: { userId, apiKey: encrypted },
    });
  }

  async getApiKey(userId: number): Promise<string | null> {
    const record = await this.prisma.adminApiKey.findUnique({ where: { userId } });
    if (!record) return null;
    return this.decrypt(record.apiKey);
  }
}
