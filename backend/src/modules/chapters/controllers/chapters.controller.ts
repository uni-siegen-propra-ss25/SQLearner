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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ChaptersService } from '../services/chapters.service';
import { CreateChapterDto } from '../models/create-chapter.dto';
import { UpdateChapterDto } from '../models/update-chapter.dto';
import { Chapter } from '@prisma/client';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorator';

/**
 * Controller handling chapter-related operations in the learning system.
 * Provides endpoints for CRUD operations on chapters, which are the highest-level
 * organizational units in the learning content hierarchy.
 *
 * @class ChaptersController
 */
@ApiTags('Chapters')
@Controller('chapters')
export class ChaptersController {
    constructor(private readonly chaptersService: ChaptersService) {}

    /**
     * Retrieves all chapters in the system.
     * Returns the chapters with their associated topics and exercises.
     *
     * @returns Promise resolving to an array of Chapter objects
     */
    @Get()
    @ApiOperation({ summary: 'Get all chapters' })
    @ApiResponse({ status: 200, description: 'List of all chapters' })
    async getChapters(): Promise<Chapter[]> {
        const chapters = await this.chaptersService.getChapters();
        return chapters;
    }

    /**
     * Retrieves a specific chapter by ID.
     * Returns the chapter with its associated topics and exercises.
     *
     * @param id - The ID of the chapter to retrieve
     * @returns Promise resolving to the Chapter object
     * @throws NotFoundException if the chapter does not exist
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get a chapter by ID' })
    @ApiParam({ name: 'id', description: 'Chapter ID' })
    @ApiResponse({ status: 200, description: 'The found chapter' })
    @ApiResponse({ status: 404, description: 'Chapter not found' })
    async getChapterById(@Param('id') id: number): Promise<Chapter> {
        const chapter = await this.chaptersService.getChapterById(id);
        return chapter;
    }

    /**
     * Creates a new chapter.
     *
     * @param createChapterDto - The data for creating the new chapter
     * @returns Promise resolving to the ID of the created chapter
     */
    @Post()
    @Roles(Role.TUTOR, Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new chapter' })
    @ApiResponse({ status: 201, description: 'The chapter has been created' })
    async createChapter(@Body() createChapterDto: CreateChapterDto): Promise<number> {
        const chapterId = await this.chaptersService.createChapter(createChapterDto);
        return chapterId;
    }

    /**
     * Updates an existing chapter.
     *
     * @param id - The ID of the chapter to update
     * @param updateChapterDto - The data to update the chapter with
     * @returns Promise resolving to the updated Chapter object
     * @throws NotFoundException if the chapter does not exist
     */
    @Put(':id')
    @Roles(Role.TUTOR, Role.ADMIN)
    @ApiOperation({ summary: 'Update a chapter' })
    @ApiParam({ name: 'id', description: 'Chapter ID' })
    @ApiResponse({ status: 200, description: 'The chapter has been updated' })
    async updateChapter(
        @Param('id') id: number,
        @Body() updateChapterDto: UpdateChapterDto,
    ): Promise<Chapter> {
        const chapter = await this.chaptersService.updateChapter(id, updateChapterDto);
        return chapter;
    }

    /**
     * Removes a chapter and all its associated topics and exercises.
     *
     * @param id - The ID of the chapter to remove
     * @throws NotFoundException if the chapter does not exist
     */
    @Delete(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a chapter' })
    @ApiParam({ name: 'id', description: 'Chapter ID' })
    @ApiResponse({ status: 204, description: 'The chapter has been deleted' })
    async deleteChapter(@Param('id') id: number): Promise<void> {
        await this.chaptersService.deleteChapter(id);
        return;
    }
}
