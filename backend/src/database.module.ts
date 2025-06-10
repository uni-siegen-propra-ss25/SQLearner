// Importiert das Modul-Dekorator von NestJS
import { Module } from '@nestjs/common';

// Importiert das TypeORM-Modul für die Integration von Datenbanken
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres', // Verwendeter Datenbanktyp
      url: process.env.DATABASE_URL, // Datenbank-URL aus Umgebungsvariablen
      entities: [__dirname + '/../**/*.entity.js'], // Sucht automatisch alle .entity.js-Dateien
      synchronize: true, // Automatischer Sync der DB-Struktur mit Entities (nur in Entwicklung!)
      
      // SSL nur in Produktionsumgebung aktivieren (z. B. für Heroku oder Railway)
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false,
    }),
  ],
  exports: [TypeOrmModule], // Macht das TypeORM-Modul für andere Module verfügbar
})
export class DatabaseModule {}
