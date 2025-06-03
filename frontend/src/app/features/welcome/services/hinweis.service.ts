import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HinweisService {
  private hinweiseSubject = new BehaviorSubject<string[]>([]);
  hinweise$ = this.hinweiseSubject.asObservable();

  constructor() {}

  getHinweise(): string[] {
    return this.hinweiseSubject.value;
  }

  addHinweis(hinweis: string): void {
    const updated = [...this.hinweiseSubject.value, hinweis];
    this.hinweiseSubject.next(updated);
  }

  removeHinweis(index: number): void {
    const updated = this.hinweiseSubject.value.filter((_, i) => i !== index);
    this.hinweiseSubject.next(updated);
  }

  setHinweise(hinweise: string[]): void {
    this.hinweiseSubject.next(hinweise);
  }
}