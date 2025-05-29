import { Controller, Get, Post, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/role/role.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { Roles } from '../../../common/decorators/role.decorator';
import { ProgressService } from '../services/progress.service';
import { UserProgressSummary, ExerciseProgressUpdate } from '../models/progress.model';

@Controller('api/progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
    constructor(private readonly progressService: ProgressService) {}    @Get('user')
    @Roles('STUDENT')
    async getUserProgress(@GetUser('id') userId: number): Promise<UserProgressSummary> {
        return this.progressService.getUserProgress(userId);
    }

    @Get('user/:id')
    @Roles('TUTOR', 'ADMIN')
    async getUserProgressById(@Param('id', ParseIntPipe) userId: number): Promise<UserProgressSummary> {
        return this.progressService.getUserProgress(userId);
    }

    @Post('exercise/:id')
    @Roles('STUDENT')
    async updateExerciseProgress(
        @Param('id', ParseIntPipe) exerciseId: number,
        @Body() progressUpdate: ExerciseProgressUpdate,
        @GetUser('id') userId: number,
    ): Promise<void> {
        return this.progressService.updateExerciseProgress(userId, exerciseId, progressUpdate);
    }
}
