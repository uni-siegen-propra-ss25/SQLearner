import { Module } from '@nestjs/common';
import { HintsService } from './services/hints.service';
import { HintsController } from './controllers/hints.controller';
import { PrismaService } from 'src/prisma/prisma.service'; 
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [HintsService, PrismaService],
  controllers: [HintsController],
})
export class HintsModule {}
