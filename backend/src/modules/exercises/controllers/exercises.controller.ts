import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ExercisesService } from '../services/exercises.service';
import { Exercise } from '@prisma/client';
import { CreateExerciseDto } from '../models/create-exercise.dto';
import { UpdateExerciseDto } from '../models/update-exercise.dto';
import { ReorderExercisesDto } from '../models/reorder-exercises.dto';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorator';

/**
 * Controller managing exercise-related operations within topics.
 * Handles CRUD operations for exercises and their ordering within topics.
 * Supports different types of exercises including SQL queries, multiple choice,
 * and free text answers. Protected by role-based access control for modifications.
 *
 * @class ExercisesController
 */
@ApiTags('Exercises')
@Controller('topics/:topicId/exercises')
export class ExercisesController {
    constructor(private readonly exercisesService: ExercisesService) {}

    /**
     * Retrieves all exercises within a topic.
     * 
     * @param topicId - The ID of the topic whose exercises to retrieve
     * @returns Promise resolving to an array of Exercise objects
     */
    @Get()
    @ApiOperation({ summary: 'Get all exercises in a topic' })
    @ApiParam({ name: 'topicId', description: 'Topic ID' })
    @ApiResponse({ status: 200, description: 'List of all exercises in the topic' })
    async getExercises(@Param('topicId') topicId: number): Promise<Exercise[]> {
        const exercises = await this.exercisesService.getExercises(topicId);
        return exercises;
    }

    /**
     * Retrieves a specific exercise by ID.
     * 
     * @param id - The ID of the exercise to retrieve
     * @returns Promise resolving to the Exercise object
     * @throws NotFoundException if the exercise does not exist
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get an exercise by ID' })
    @ApiParam({ name: 'topicId', description: 'Topic ID' })
    @ApiParam({ name: 'id', description: 'Exercise ID' })
    @ApiResponse({ status: 200, description: 'The found exercise' })
    @ApiResponse({ status: 404, description: 'Exercise not found' })
    async getExerciseById(@Param('id') id: number): Promise<Exercise> {
        const exercise = await this.exercisesService.getExerciseById(id);
        if (!exercise) {
            throw new NotFoundException('Exercise not found');
        }
        return exercise;
    }

    /**
     * Creates a new exercise in a topic.
     * 
     * @param topicId - The ID of the topic to create the exercise in
     * @param createExerciseDto - The data for creating the new exercise
     * @returns Promise resolving to the ID of the created exercise
     */
    @Post()
    @Roles(Role.TUTOR, Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new exercise' })
    @ApiParam({ name: 'topicId', description: 'Topic ID' })
    @ApiResponse({ status: 201, description: 'The exercise has been created' })
    async createExercise(
        @Param('topicId') topicId: number,
        @Body() createExerciseDto: CreateExerciseDto,
    ): Promise<number> {
        createExerciseDto.topicId = topicId;
        const exerciseId = await this.exercisesService.createExercise(createExerciseDto);
        return exerciseId;
    }

    /**
     * Updates an existing exercise.
     * 
     * @param id - The ID of the exercise to update
     * @param updateExerciseDto - The data to update the exercise with
     * @returns Promise resolving to the updated Exercise object
     * @throws NotFoundException if the exercise does not exist
     */
    @Put(':id')
    @Roles(Role.TUTOR, Role.ADMIN)
    @ApiOperation({ summary: 'Update an exercise' })
    @ApiParam({ name: 'id', description: 'Exercise ID' })
    @ApiResponse({ status: 200, description: 'The exercise has been updated' })
    async updateExercise(
        @Param('id') id: number,
        @Body() updateExerciseDto: UpdateExerciseDto,
    ): Promise<Exercise> {
        const exercise = await this.exercisesService.updateExercise(id, updateExerciseDto);
        return exercise;
    }

    /**
     * Removes an exercise.
     * 
     * @param id - The ID of the exercise to remove
     * @throws NotFoundException if the exercise does not exist
     */
    @Delete(':id')
    @Roles(Role.TUTOR, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an exercise' })
    @ApiParam({ name: 'id', description: 'Exercise ID' })
    @ApiResponse({ status: 204, description: 'The exercise has been deleted' })
    @ApiResponse({ status: 404, description: 'Exercise not found' })
    async removeExercise(@Param('id') id: number): Promise<void> {
        await this.exercisesService.removeExercise(id);
        return;
    }

    /**
     * Updates the order of exercises within a topic.
     * 
     * @param topicId - The ID of the topic containing the exercises
     * @param reorderExercisesDto - The new order of exercises
     * @throws NotFoundException if any exercise does not exist
     */
    @Put('reorder')
    @Roles(Role.TUTOR, Role.ADMIN)
    @ApiOperation({ summary: 'Reorder exercises in a topic' })
    @ApiParam({ name: 'topicId', description: 'Topic ID' })
    @ApiResponse({ status: 200, description: 'Exercises have been reordered' })
    async reorderExercises(
        @Param('topicId') topicId: number,
        @Body() reorderExercisesDto: ReorderExercisesDto,
    ): Promise<void> {
        await this.exercisesService.reorderExercises(topicId, reorderExercisesDto);
        return;
    }
}
