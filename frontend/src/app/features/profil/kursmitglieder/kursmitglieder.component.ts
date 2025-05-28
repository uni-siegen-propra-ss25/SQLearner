import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-kursmitglieder',
  templateUrl: './kursmitglieder.component.html',
  styleUrls: ['./kursmitglieder.component.scss']
})
export class KursmitgliederComponent implements OnInit {
  studenten = [
    { name: 'Anna Müller', email: 'anna@example.com', lastLogin: new Date('2025-05-24T10:15:00') },
    { name: 'Lukas Schmidt', email: 'lukas@example.com', lastLogin: new Date('2025-05-23T16:42:00') },
    { name: 'Sarah Roth', email: 'sarah@example.com', lastLogin: new Date('2025-05-22T08:30:00') }
  ];

  constructor() {}

  ngOnInit(): void {}
}

