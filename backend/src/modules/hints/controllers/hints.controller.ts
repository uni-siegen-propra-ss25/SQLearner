import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/role/role.guard';
import { Roles } from '../../../common/decorators/role.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { HintsService } from '../services/hints.service';
import { CreateHintDto, UpdateHintDto } from '../dto/hint.dto';
import { HintData } from '../models/hint.model';
import { Role } from '@prisma/client';

@Controller('hints')
@UseGuards(JwtAuthGuard)
export class HintsController {
  constructor(private readonly hintsService: HintsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.TUTOR, Role.ADMIN)
  create(
    @GetUser('id') userId: number,
    @Body() createHintDto: CreateHintDto,
  ): Promise<HintData> {
    return this.hintsService.create(userId, createHintDto);
  }

  @Get()
  findAll(@GetUser('role') userRole: Role): Promise<HintData[]> {
    return this.hintsService.findAll(userRole);
  }

  @Get('manage')
  @UseGuards(RolesGuard)
  @Roles(Role.TUTOR, Role.ADMIN)
  findAllForManagement(): Promise<HintData[]> {
    return this.hintsService.findAllForManagement();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<HintData> {
    return this.hintsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.TUTOR, Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
    @Body() updateHintDto: UpdateHintDto,
  ): Promise<HintData> {
    return this.hintsService.update(id, userId, updateHintDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.TUTOR, Role.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
  ): Promise<void> {
    return this.hintsService.remove(id, userId);
  }
}
