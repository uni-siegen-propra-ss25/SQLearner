import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-archiv',
    templateUrl: './archiv.component.html',
    styleUrls: ['./archiv.component.scss'],
})
export class ArchivComponent implements OnInit {
    fragen: any[] = [];

    ngOnInit(): void {
        const gespeicherte = localStorage.getItem('archivFragen');
        this.fragen = gespeicherte ? JSON.parse(gespeicherte) : [];
    }

    wiederherstellen(frage: any): void {
        const fragen = JSON.parse(localStorage.getItem('fragen') || '[]');
        if (!fragen.find((f: any) => f.frageId === frage.frageId)) {
            fragen.push(frage);
            localStorage.setItem('fragen', JSON.stringify(fragen));
        }
        this.entferneAusArchiv(frage);
    }

    endgueltigLoeschen(frage: any): void {
        if (confirm('Diese Frage endgültig löschen?')) {
            this.entferneAusArchiv(frage);
        }
    }

    private entferneAusArchiv(frage: any): void {
        this.fragen = this.fragen.filter((f) => f.frageId !== frage.frageId);
        localStorage.setItem('archivFragen', JSON.stringify(this.fragen));
    }
}

