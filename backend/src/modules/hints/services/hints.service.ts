import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hint } from '../hints.entity';

@Injectable()
export class HintsService {
  constructor(
    @InjectRepository(Hint)
    private hintRepository: Repository<Hint>,
  ) {}

  findAll(): Promise<Hint[]> {
    return this.hintRepository.find();
  }

  create(text: string): Promise<Hint> {
    const hint = this.hintRepository.create({ text });
    return this.hintRepository.save(hint);
  }

  remove(id: number): Promise<void> {
    return this.hintRepository.delete(id).then(() => undefined);
  }
}
