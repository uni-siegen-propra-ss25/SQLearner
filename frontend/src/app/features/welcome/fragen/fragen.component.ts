import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-fragen',
    templateUrl: './fragen.component.html',
    styleUrls: ['./fragen.component.scss'],
})
export class FragenComponent implements OnInit {
    fragen = [
        {
            id: 1,
            name: 'Max M.',
            datum: '30.05.2025',
            uhrzeit: '12:17:53',
            text: 'Ich verstehe NATURAL JOIN nicht ganz...',
        },
        {
            id: 2,
            name: 'Lisa S.',
            datum: '29.05.2025',
            uhrzeit: '10:05:12',
            text: 'Koennte man ein Beispiel zu Aggregatfunktionen machen?',
        },
        {
            id: 3,
            name: 'Jonas T.',
            datum: '28.05.2025',
            uhrzeit: '15:45:33',
            text: 'Wie genau funktioniert Relationale Division?',
        },
    ];

    get ungeleseneNachrichten(): number {
        return this.fragen.length;
    }

    angepinnt: any[] = [];

    ausgewaehlteFrage: any = null;
    antwortText: string = '';
    anhangName: string = '';

    ngOnInit() {
        this.ladeAngepinnt();
    }

    beantworten(frage: any, event: Event) {
        event.preventDefault();
        this.ausgewaehlteFrage = frage;
        this.antwortText = '';
        this.anhangName = '';
    }

    antwortAbbrechen() {
        this.ausgewaehlteFrage = null;
        this.antwortText = '';
        this.anhangName = '';
    }

    anhangHinzufuegen(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.anhangName = file.name;
        }
    }

    antwortAbschicken() {
        if (!this.ausgewaehlteFrage) return;

        const antwort = {
            frageId: this.ausgewaehlteFrage.id,
            frageText: this.ausgewaehlteFrage.text,
            student: this.ausgewaehlteFrage.name,
            antwort: this.antwortText,
            datei: this.anhangName,
            uhrzeit: new Date().toLocaleTimeString(),
            datum: new Date().toLocaleDateString(),
        };

        const beantwortet = JSON.parse(localStorage.getItem('beantworteteFragen') || '[]');

        const index = beantwortet.findIndex((a: any) => a.frageId === antwort.frageId);

        if (index === -1) {
            beantwortet.push(antwort);
        } else {
            beantwortet[index] = antwort;
        }

        localStorage.setItem('beantworteteFragen', JSON.stringify(beantwortet));

        // Entferne aus offenen Fragen
        this.fragen = this.fragen.filter((f) => f.id !== this.ausgewaehlteFrage.id);

        this.antwortAbbrechen();
    }

    anpinnen(frage: any, event: Event) {
        event.preventDefault();

        if (!this.angepinnt.find((f) => f.id === frage.id)) {
            this.angepinnt.push(frage);
            this.speichern();
        }

        this.fragen = this.fragen.filter((f) => f.id !== frage.id);
    }

    archivieren(frage: any, event: Event) {
        event.preventDefault();

        const beantwortet = JSON.parse(localStorage.getItem('beantworteteFragen') || '[]');
        const archiv = JSON.parse(localStorage.getItem('archivFragen') || '[]');

        // Prüfe ob Frage beantwortet wurde
        const antwortObj = beantwortet.find((f: any) => f.frageId === frage.id);

        if (antwortObj) {
            // Wenn beantwortet, komplette Antwort mit Frage ins Archiv schieben
            if (!archiv.find((f: any) => f.frageId === frage.id)) {
                archiv.push(antwortObj);
            }
        } else {
            // Wenn nicht beantwortet, Frage als solches ins Archiv
            if (!archiv.find((f: any) => f.id === frage.id)) {
                archiv.push(frage);
            }
        }

        localStorage.setItem('archivFragen', JSON.stringify(archiv));

        // Frage aus offenen Fragen entfernen
        this.fragen = this.fragen.filter((f) => f.id !== frage.id);
    }

    loeschen(frage: any, event: Event): void {
        event.preventDefault();

        const beantwortet = JSON.parse(localStorage.getItem('beantworteteFragen') || '[]');
        const papierkorb = JSON.parse(localStorage.getItem('papierkorbFragen') || '[]');

        const antwortObj = beantwortet.find((f: any) => f.frageId === frage.id);

        if (antwortObj) {
            if (!papierkorb.find((f: any) => f.frageId === frage.id)) {
                papierkorb.push(antwortObj);
            }
        } else {
            if (!papierkorb.find((f: any) => f.id === frage.id)) {
                papierkorb.push(frage);
            }
        }

        localStorage.setItem('papierkorbFragen', JSON.stringify(papierkorb));

        // Frage aus offenen Fragen entfernen
        this.fragen = this.fragen.filter((f) => f.id !== frage.id);
    }

    entferneAngepinnt(frage: any, event: Event) {
        event.preventDefault();

        this.angepinnt = this.angepinnt.filter((f) => f.id !== frage.id);
        this.speichern();
    }

    speichern() {
        localStorage.setItem('angepinnt', JSON.stringify(this.angepinnt));
    }

    ladeAngepinnt() {
        const gespeicherte = localStorage.getItem('angepinnt');
        if (gespeicherte) {
            this.angepinnt = JSON.parse(gespeicherte);
        }
    }
}
