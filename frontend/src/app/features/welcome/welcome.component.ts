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
        {
            name: 'Max M.',
            datum: '12.05',
            text: 'Könnte man ein Beispiel zu Aggregatfunktionen machen?',
        },
        { name: 'Lisa S.', datum: '11.05', text: 'Ist der NATURAL JOIN prüfungsrelevant?' },
        { name: 'Jonas T.', datum: '10.05', text: 'Wie genau funktioniert Relationale Division?' },
    ];

    aufgaben = [
        { typ: 'SQL', kategorie: 'SQL-Query', titel: 'Bibliothek' },
        { typ: 'XML', kategorie: 'XML-Dokument', titel: 'Katalog' },
        { typ: 'RD', kategorie: 'Relationale Algebra', titel: 'Studentenliste' },
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
