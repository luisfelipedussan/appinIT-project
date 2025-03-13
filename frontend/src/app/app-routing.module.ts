import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlayerRegistrationComponent } from './game/components/player-registration/player-registration.component';
import { GameBoardComponent } from './game/components/game-board/game-board.component';

export const routes: Routes = [
  { path: '', redirectTo: '/game', pathMatch: 'full' },
  { path: 'game', component: PlayerRegistrationComponent },
  { path: 'game/:id', component: GameBoardComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } 