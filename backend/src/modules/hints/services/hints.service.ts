import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hint } from '../hints.entity';

/**
 * Service for managing Hint entities.
 */
@Injectable()
export class HintsService {
  constructor(
    @InjectRepository(Hint)
    private hintRepository: Repository<Hint>,
  ) {}

  /**
   * Get all stored hints.
   * @returns List of Hint entities
   */
  findAll(): Promise<Hint[]> {
    return this.hintRepository.find();
  }

  /**
   * Create and store a new hint.
   * @param text The content of the hint
   * @returns The newly created Hint
   */
  create(text: string): Promise<Hint> {
    const hint = this.hintRepository.create({ text });
    return this.hintRepository.save(hint);
  }

  /**
   * Remove a hint by ID.
   * @param id The ID of the hint to delete
   */
  remove(id: number): Promise<void> {
    return this.hintRepository.delete(id).then(() => undefined);
  }
}
