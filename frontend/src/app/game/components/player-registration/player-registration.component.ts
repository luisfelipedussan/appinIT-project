import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-player-registration',
  standalone: false,
  template: `
    <div class="vintage-card registration-form">
      <h2>Piedra, Papel o Tijera</h2>
      <form [formGroup]="registrationForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="player1">Jugador 1</label>
          <input 
            id="player1"
            type="text"
            class="vintage-input"
            formControlName="player1Name"
            placeholder="Nombre del Jugador 1">
        </div>
        
        <div class="form-group">
          <label for="player2">Jugador 2</label>
          <input 
            id="player2"
            type="text"
            class="vintage-input"
            formControlName="player2Name"
            placeholder="Nombre del Jugador 2">
        </div>

        <button 
          type="submit" 
          class="vintage-button"
          [disabled]="!registrationForm.valid">
          Comenzar Juego
        </button>
      </form>
    </div>
  `,
  styles: [`
    .registration-form {
      max-width: 400px;
      margin: 40px auto;
      text-align: center;
    }

    .form-group {
      margin: 20px 0;
      text-align: left;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-family: var(--font-primary);
      font-size: 14px;
    }

    .vintage-input {
      width: 100%;
      margin-bottom: 15px;
    }

    h2 {
      font-family: var(--font-primary);
      color: var(--primary-color);
      text-shadow: 2px 2px 0 var(--secondary-color);
      margin-bottom: 30px;
    }
  `]
})
export class PlayerRegistrationComponent {
  registrationForm: FormGroup;
  @Output() playersRegistered = new EventEmitter<{player1Name: string, player2Name: string}>();

  constructor(private fb: FormBuilder) {
    this.registrationForm = this.fb.group({
      player1Name: ['', Validators.required],
      player2Name: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.registrationForm.valid) {
      this.playersRegistered.emit(this.registrationForm.value);
    }
  }
} 