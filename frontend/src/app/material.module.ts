import { NgModule } from '@angular/core';
import { MatButtonModule }     from '@angular/material/button';
import { MatToolbarModule }    from '@angular/material/toolbar';
import { MatIconModule }       from '@angular/material/icon';
import { MatSidenavModule }    from '@angular/material/sidenav';

/**
 * MaterialModule imports and exports Angular Material modules.
 * This allows for easy access to commonly used Material components throughout the application.
 * 
 * @module MaterialModule
 */
@NgModule({
  exports: [
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
  ]
})
export class MaterialModule { }