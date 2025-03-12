import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlayerRegistrationComponent } from './components/player-registration/player-registration.component';

const routes: Routes = [
  {
    path: '',
    component: PlayerRegistrationComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GameRoutingModule { }
