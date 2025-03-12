import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { GameRoutingModule } from './game-routing.module';
import { PlayerRegistrationComponent } from './components/player-registration/player-registration.component';

@NgModule({
  declarations: [
    PlayerRegistrationComponent
  ],
  imports: [
    CommonModule,
    GameRoutingModule,
    ReactiveFormsModule
  ],
  exports: [
    PlayerRegistrationComponent
  ]
})
export class GameModule { }
