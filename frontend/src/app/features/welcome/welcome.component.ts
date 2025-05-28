import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-welcome',
    templateUrl: './welcome.component.html',
    styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent {
    newHinweis: string = '';
    hinweise: string[] = [];

    fragen = [
        {name: 'Max M.', datum: '12.05', text: 'Könnte man ein Beispiel zu Aggregatfunktionen machen?'},  
        { name: 'Lisa S.', datum: '11.05', text: 'Ist der NATURAL JOIN prüfungsrelevant?' },
        { name: 'Jonas T.', datum: '10.05', text: 'Wie genau funktioniert Relationale Division?' },
    ];

// Spalten die in der Tabelle angezeigt werden sollen
    displayedColumns: string[] = ['titel', 'typ', 'kategorie', 'datum'];

// Beispielhafte Aufgaben-Daten, falls noch nicht vorhanden
    aufgaben = [
    { titel: 'GartenCenter', typ: 'SQL-Abfrage', kategorie: 'SQL', datum: '2025-05-01' },
    { titel: 'XML Basics', typ: 'Single Chioce', kategorie: 'XML', datum: '2025-05-05' },
    { titel: 'KinoBesuch', typ: 'SQL-Abfrage', kategorie: 'SQL', datum: '2025-05-10' },
    ];



    constructor(
        private router: Router,
        private route: ActivatedRoute,
    ) {}

    goToAufgaben() {
        this.router.navigate(['aufgaben'], { relativeTo: this.route });
    }

    goToFragen() {
        this.router.navigate(['fragen'], { relativeTo: this.route });
    }

    addHinweis() {
        if (this.newHinweis.trim()) {
            this.hinweise.push(this.newHinweis.trim());
            this.newHinweis = '';
        }
    }

    removeHinweis(index: number) {
        this.hinweise.splice(index, 1);
    }
}
