import { Component } from '@angular/core';

@Component({
  selector: 'app-fragen-chat',
  templateUrl: './fragen-chat.component.html',
  styleUrls: ['./fragen-chat.component.scss']
})
export class FragenChatComponent {
  newMessage: string = '';
  messages: { from: 'student' | 'tutor'; text: string; timestamp: Date }[] = [
    { from: 'student', text: 'Benötigen wir für die Aufgabe 8 den NATURAL JOIN?', timestamp: new Date() },
    { from: 'tutor', text: 'Für diese Aufgabe nicht. Es wäre aber nicht verkehrt für die Klausur beide Varianten zu lernen', timestamp: new Date() }
  ];

  sendMessage() {
    const trimmed = this.newMessage.trim();
    if (trimmed) {
      this.messages.push({
        from: 'student',
        text: trimmed,
        timestamp: new Date()
      });

      this.newMessage = '';

      setTimeout(() => {
        this.messages.push({
          from: 'tutor',
          text: 'Danke für deine Frage! Ich schaue es mir an.',
          timestamp: new Date()
        });
      }, 1000);
    }
  }

  deleteMessage(msgToDelete: { from: string; text: string; timestamp: Date }) {
    this.messages = this.messages.filter(msg => msg !== msgToDelete);
  }

  handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      console.log('Datei hochgeladen:', file.name);

      this.messages.push({
        from: 'student',
        text: `📎 Datei angehängt: ${file.name}`,
        timestamp: new Date()
      });
    }
  }
}

