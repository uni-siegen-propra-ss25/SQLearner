import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

import { ChaptersModule } from './modules/chapters/chapters.module';
import { TopicsModule } from './modules/topics/topics.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { DatabasesModule } from './modules/databases/databases.module';
import { AdminModule } from './modules/admin/admin.module';
import { ChatModule } from './modules/chat/chat.module';
import { ProgressModule } from './modules/progress/progress.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        AuthModule,
        UsersModule,
        DatabasesModule,
        ChaptersModule,
        TopicsModule,
        ExercisesModule,
        AdminModule,
        ChatModule,
        ProgressModule,
        BookmarksModule,     
        ],
})
export class AppModule {}
