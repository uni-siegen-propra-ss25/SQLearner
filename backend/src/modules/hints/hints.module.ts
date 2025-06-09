import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hint } from './hints.entity';
import { HintsService } from './services/hints.service';
import { HintsController } from './controllers/hints.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Hint])],
  providers: [HintsService],
  controllers: [HintsController],
})
export class HintsModule {}
