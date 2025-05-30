import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiKeyService } from '../services/api-key.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/role/role.guard';
import { Roles } from '../../../common/decorators/role.decorator';

@Controller('admin/api-key')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  async setApiKey(@Request() req, @Body('apiKey') apiKey: string) {
    await this.apiKeyService.setApiKey(req.user.id, apiKey);
    return { success: true };
  }

  @Get()
  async getApiKey(@Request() req) {
    const apiKey = await this.apiKeyService.getApiKey(req.user.id);
    return { apiKey };
  }
}
