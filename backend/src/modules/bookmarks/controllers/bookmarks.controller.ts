import { Controller, Get, Post, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/role/role.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { Roles } from '../../../common/decorators/role.decorator';
import { BookmarksService } from '../services/bookmarks.service';
import { BookmarkData, CreateBookmarkDto } from '../models/bookmark.model';

@Controller('api/bookmarks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookmarksController {
    constructor(private readonly bookmarksService: BookmarksService) {}    @Get('user')
    @Roles('STUDENT')
    async getUserBookmarks(@GetUser('id') userId: number): Promise<BookmarkData[]> {
        return this.bookmarksService.getUserBookmarks(userId);
    }

    @Post()
    @Roles('STUDENT')
    async createBookmark(
        @Body() createBookmarkDto: CreateBookmarkDto,
        @GetUser('id') userId: number,
    ): Promise<BookmarkData> {
        return this.bookmarksService.createBookmark(userId, createBookmarkDto.exerciseId);
    }

    @Delete(':id')
    @Roles('STUDENT')
    async removeBookmark(
        @Param('id', ParseIntPipe) bookmarkId: number,
        @GetUser('id') userId: number,
    ): Promise<void> {
        return this.bookmarksService.removeBookmark(bookmarkId, userId);
    }
}
