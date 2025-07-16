import { Module } from '@nestjs/common';
import { HintsController } from './controllers/hints.controller';
import { HintsService } from './services/hints.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HintsController],
  providers: [HintsService],
  exports: [HintsService],
})
export class HintsModule {}
