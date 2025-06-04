import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Delete, 
    Param, 
    UseGuards, 
    BadRequestException,
    NotFoundException,
    HttpStatus,
    HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from '../services/settings.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/role/role.guard';
import { Roles } from '../../../common/decorators/role.decorator';
import { Role } from '@prisma/client';

export const SETTINGS_KEYS = {
    OPENAI_API_KEY: 'OPENAI_API_KEY',
    // Add other settings keys here as needed
} as const;

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class SettingsController {
    constructor(private settingsService: SettingsService) {}

    @Get()
    @ApiOperation({ summary: 'Get all application settings' })
    @ApiResponse({ status: 200, description: 'List of all settings' })
    async getAllSettings() {
        const settings = await this.settingsService.getAllSettings();
        return settings.map(setting => ({
            name: setting.name,
            description: setting.description,
            hasValue: !!setting.value
        }));
    }

    @Get(':name')
    @ApiOperation({ summary: 'Get a specific setting value' })
    @ApiResponse({ status: 200, description: 'The setting value' })
    @ApiResponse({ status: 404, description: 'Setting not found' })
    async getSetting(@Param('name') name: string) {
        const value = await this.settingsService.getSetting(name);
        if (!value) {
            throw new NotFoundException(`Setting ${name} not found`);
        }
        return { value };
    }

    @Post(':name')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Create or update a setting' })
    @ApiResponse({ status: 200, description: 'Setting updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid setting name or value' })
    async setSetting(
        @Param('name') name: string,
        @Body('value') value: string,
        @Body('description') description?: string,
    ) {
        // Validate setting name
        if (!Object.values(SETTINGS_KEYS).includes(name as any)) {
            throw new BadRequestException(`Invalid setting name: ${name}`);
        }

        // Validate value is provided
        if (!value) {
            throw new BadRequestException('Value is required');
        }

        await this.settingsService.setSetting(name, value, description);
        return { success: true };
    }

    @Delete(':name')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a setting' })
    @ApiResponse({ status: 204, description: 'Setting deleted successfully' })
    @ApiResponse({ status: 404, description: 'Setting not found' })
    async deleteSetting(@Param('name') name: string) {
        const setting = await this.settingsService.getSetting(name);
        if (!setting) {
            throw new NotFoundException(`Setting ${name} not found`);
        }
        
        await this.settingsService.deleteSetting(name);
    }
}
