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
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ExercisesService } from '../services/exercises.service';
import { DatabasesService } from '../../databases/services/databases.service';
import { ExerciseGenerationService } from '../services/exercise-generation.service';
import { ExerciseType, Difficulty } from '@prisma/client';
import { Exercise } from '@prisma/client';
import { CreateExerciseDto } from '../models/create-exercise.dto';
import { UpdateExerciseDto } from '../models/update-exercise.dto';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/role/role.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';

/**
 * Controller managing exercise-related operations within topics.
 * Handles CRUD operations for exercises and their ordering within topics.
 * Supports different types of exercises including SQL queries, multiple choice,
 * and free text answers. Protected by role-based access control for modifications.
 *
 * @class ExercisesController
 */
@ApiTags('Exercises')
@Controller('exercises')
export class ExercisesController {
    constructor(
        private readonly exercisesService: ExercisesService,
        private readonly databasesService: DatabasesService,
        private readonly exerciseGenerationService: ExerciseGenerationService,
    ) {}
    /**
     * Generates a new exercise using AI (OpenAI).
     *
     * @param body - The parameters for generation (type, difficulty, databaseId, syntaxElements, sqlConcepts)
     * @returns Promise resolving to generated exercise fields
     */
    @Post('generate')
    @Roles(Role.TUTOR, Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Generate a new exercise using AI' })
    @ApiResponse({ status: 200, description: 'Generated exercise fields' })
    async generateExercise(@Body() body: {
        type: string;
        difficulty: string;
        databaseId?: number;
        syntaxElements?: string[];
        sqlConcepts?: string[];
    }): Promise<{ title: string; description: string; solution: string }> {
        // Typen in Enum casten
        let type: ExerciseType;
        let difficulty: Difficulty;
        try {
            type = ExerciseType[body.type as keyof typeof ExerciseType];
            difficulty = Difficulty[body.difficulty as keyof typeof Difficulty];
        } catch {
            throw new Error('Ungültiger Typ oder Schwierigkeitsgrad');
        }
        return this.exerciseGenerationService.generateExercise({
            type,
            difficulty,
            databaseId: body.databaseId,
            syntaxElements: body.syntaxElements,
            sqlConcepts: body.sqlConcepts,
        });
    }

    /**
     * Retrieves exercises. If topicId is provided, returns exercises for that topic.
     * Otherwise returns all exercises.
     *
     * @param topicId - Optional ID of the topic whose exercises to retrieve
     * @returns Promise resolving to an array of Exercise objects
     */
    @Get()
    @ApiOperation({ summary: 'Get all exercises' })
    @ApiResponse({ status: 200, description: 'List of all exercises' })
    async getAllExercises(): Promise<Exercise[]> {
        return this.exercisesService.getAllExercises();
    }

    @Get('topics/:topicId')
    @ApiOperation({ summary: 'Get all exercises in a topic' })
    @ApiParam({ name: 'topicId', description: 'Topic ID' })
    @ApiResponse({ status: 200, description: 'List of all exercises in the topic' })
    async getExercisesByTopic(@Param('topicId') topicId: number): Promise<Exercise[]> {
        return this.exercisesService.getExercises(topicId);
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
    @ApiResponse({ status: 201, description: 'The exercise has been created' })
    async createExercise(@Body() createExerciseDto: CreateExerciseDto): Promise<number> {
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
     * Submits an answer for an exercise (choice or text-based).
     * Requires authentication and evaluates the answer for correctness.
     *
     * @param id - The ID of the exercise to submit answer for
     * @param body - The answer submission data
     * @param userId - The authenticated user's ID
     * @returns Promise resolving to the submission result with feedback
     * @throws NotFoundException if the exercise does not exist
     */
    @Post(':id/submit')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.STUDENT)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Submit and evaluate an answer for an exercise' })
    @ApiParam({ name: 'id', description: 'Exercise ID' })
    @ApiResponse({ 
        status: 200, 
        description: 'Answer submitted successfully',
        schema: {
            type: 'object',
            properties: {
                isCorrect: { type: 'boolean', description: 'Whether the answer was correct' },
                feedback: { type: 'string', description: 'Feedback message about the answer' },
                exerciseId: { type: 'number', description: 'ID of the exercise' },
                userId: { type: 'number', description: 'ID of the user who submitted the answer' }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Exercise not found' })
    async submitAnswer(
        @Param('id') id: number,
        @Body() body: { answerText: string, connectionDetails?: { host: string; port: number } },
        @GetUser('id') userId: number,
    ) {
        return this.exercisesService.submitAnswer(id, body.answerText, userId, body.connectionDetails);
    }

    /**
     * Runs a SQL query for an exercise.
     *
     * @param id - The ID of the exercise to run the query for
     * @param body - The query to run
     * @returns Promise resolving to the query result
     * @throws NotFoundException if the exercise or database does not exist
     */
    @Post(':id/run-query')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Run a SQL query for an exercise' })
    @ApiParam({ name: 'id', description: 'Exercise ID' })
    @ApiResponse({ status: 200, description: 'Query executed successfully' })
    @ApiResponse({ status: 404, description: 'Exercise or database not found' })
    async runQuery(
        @Param('id') id: number,
        @Body() body: { query: string, connectionDetails?: { host: string; port: number } },
    ): Promise<{ columns: string[]; rows: any[] }> {
        console.log('=== DEBUG: ExercisesController.runQuery ===');
        console.log('Exercise ID:', id);
        console.log('Request body:', body);
        console.log('Query:', body.query);
        console.log('Connection Details:', body.connectionDetails);
        
        const result = await this.exercisesService.runQuery(id, body.query, body.connectionDetails);
        console.log('Controller result:', result);
        return result;
    }
}
