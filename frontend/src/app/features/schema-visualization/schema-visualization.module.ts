import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { ErDiagramComponent } from './components/er-diagram/er-diagram.component';

@NgModule({
    declarations: [ErDiagramComponent],
    imports: [CommonModule, MaterialModule],
    exports: [ErDiagramComponent],
})
export class SchemaVisualizationModule {}
