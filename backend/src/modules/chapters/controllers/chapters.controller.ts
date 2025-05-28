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

@ApiTags('Chapters')
@Controller('chapters')
export class ChaptersController {
    constructor(private readonly chaptersService: ChaptersService) {}

    @Get()
    @ApiOperation({ summary: 'Get all chapters' })
    @ApiResponse({ status: 200, description: 'List of all chapters' })
    async getChapters(): Promise<Chapter[]> {
        const chapters = await this.chaptersService.getChapters();
        return chapters;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a chapter by ID' })
    @ApiParam({ name: 'id', description: 'Chapter ID' })
    @ApiResponse({ status: 200, description: 'The found chapter' })
    @ApiResponse({ status: 404, description: 'Chapter not found' })
    async getChapterById(@Param('id') id: number): Promise<Chapter> {
        const chapter = await this.chaptersService.getChapterById(id);
        return chapter;
    }

    @Post()
    @Roles(Role.TUTOR, Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new chapter' })
    @ApiResponse({ status: 201, description: 'The chapter has been created' })
    async createChapter(@Body() createChapterDto: CreateChapterDto): Promise<number> {
        const chapterId = await this.chaptersService.createChapter(createChapterDto);
        return chapterId;
    }

    @Put(':id')
    @Roles(Role.TUTOR, Role.ADMIN)
    @ApiOperation({ summary: 'Update a chapter' })
    @ApiParam({ name: 'id', description: 'Chapter ID' })
    @ApiResponse({ status: 200, description: 'The chapter has been updated' })
    @ApiResponse({ status: 404, description: 'Chapter not found' })
    async updateChapter(
        @Param('id') id: number,
        @Body() updateChapterDto: UpdateChapterDto,
    ): Promise<Chapter> {
        const chapter = await this.chaptersService.updateChapter(id, updateChapterDto);
        return chapter;
    }

    @Delete(':id')
    @Roles(Role.TUTOR, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a chapter' })
    @ApiParam({ name: 'id', description: 'Chapter ID' })
    @ApiResponse({ status: 204, description: 'The chapter has been deleted' })
    @ApiResponse({ status: 404, description: 'Chapter not found' })
    async deleteChapter(@Param('id') id: number): Promise<void> {
        await this.chaptersService.deleteChapter(id);
        return;
    }
}
