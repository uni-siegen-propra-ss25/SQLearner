import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { TopicsModule } from './modules/topics/topics.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { DatabasesModule } from './modules/databases/databases.module';
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
        ProgressModule,
        BookmarksModule,
    ],
})
export class AppModule {}
