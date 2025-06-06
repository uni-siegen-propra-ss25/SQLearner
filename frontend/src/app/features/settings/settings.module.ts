import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'app/material.module';
import { SettingsPageComponent } from './components/settings-page.component';
import { ApiKeyDialogComponent } from './dialogs/api-key-dialog.component';
import { SettingsRoutingModule } from './settings-routing.module';

@NgModule({
  declarations: [SettingsPageComponent, ApiKeyDialogComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    SettingsRoutingModule
  ]
})
export class SettingsModule {}
