import { Component } from '@angular/core';

@Component({
  selector: 'app-welcome',
  template: `
    <div class="welcome-container">
      <h1>Willkommen bei SQLearner</h1>
      <p>Ihre Plattform zum Lernen und Üben von SQL</p>
    </div>
  `,
  styles: [`
    .welcome-container {
      padding: 2rem;
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      margin-bottom: 1rem;
      color: var(--text-color);
    }
    p {
      color: var(--text-color);
      font-size: 1.2rem;
    }
  `]
})
export class WelcomeComponent {} 