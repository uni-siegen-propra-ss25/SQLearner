import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationRailComponent } from './components/navigation-rail/navigation-rail.component';
import { MaterialModule } from '../material.module';

@NgModule({
    declarations: [NavigationRailComponent],
    imports: [CommonModule, MaterialModule, RouterModule],
    exports: [NavigationRailComponent],
})
export class SharedModule {}
