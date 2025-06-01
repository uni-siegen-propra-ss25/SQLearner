import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { ChatPanelComponent } from './components/chat-panel/chat-panel.component';

@NgModule({
    declarations: [ChatPanelComponent],
    imports: [CommonModule, FormsModule, MaterialModule],
    exports: [ChatPanelComponent],
})
export class ChatModule {}
