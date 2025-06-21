import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { TopicsModule } from './modules/topics/topics.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { DatabaseModule } from './modules/database/database.module';
import { ChatModule } from './modules/chat/chat.module';
import { ProgressModule } from './modules/progress/progress.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { TodosModule } from './modules/todos/todos.module';
import { HintsModule } from './modules/hints/hints.module';
import { QuestionModule } from './modules/questions/question.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        AuthModule,
        UsersModule,
        DatabaseModule,
        ChaptersModule,
        TopicsModule,
        ExercisesModule,
        ChatModule,
        ProgressModule,
        BookmarksModule,
        SettingsModule,
        TodosModule,
        HintsModule,
        QuestionModule,
    ],
})
export class AppModule {}
