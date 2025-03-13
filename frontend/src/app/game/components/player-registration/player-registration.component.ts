import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-player-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="vintage-card registration-form">
      <h2>Piedra, Papel o Tijera</h2>
      <form [formGroup]="registrationForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="player1Name">Jugador 1:</label>
          <input 
            id="player1Name" 
            type="text" 
            formControlName="player1Name" 
            class="vintage-input"
            placeholder="Nombre del Jugador 1">
          <div class="error-message" *ngIf="registrationForm.get('player1Name')?.touched && registrationForm.get('player1Name')?.invalid">
            El nombre es requerido (mínimo 2 caracteres)
          </div>
        </div>

        <div class="form-group">
          <label for="player2Name">Jugador 2:</label>
          <input 
            id="player2Name" 
            type="text" 
            formControlName="player2Name" 
            class="vintage-input"
            placeholder="Nombre del Jugador 2">
          <div class="error-message" *ngIf="registrationForm.get('player2Name')?.touched && registrationForm.get('player2Name')?.invalid">
            El nombre es requerido (mínimo 2 caracteres)
          </div>
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
      padding: 20px;
    }
    .form-group {
      margin: 20px 0;
      text-align: left;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-family: var(--font-secondary);
    }
    .vintage-input {
      width: 100%;
      padding: 8px;
      margin-bottom: 5px;
      border: 2px solid var(--primary-color);
      border-radius: 4px;
    }
    .error-message {
      color: #d32f2f;
      font-size: 12px;
      margin-top: 5px;
    }
    .vintage-button {
      margin-top: 20px;
    }
  `]
})
export class PlayerRegistrationComponent {
  registrationForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private gameService: GameService
  ) {
    this.registrationForm = this.fb.group({
      player1Name: ['', [Validators.required, Validators.minLength(2)]],
      player2Name: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  onSubmit() {
    if (this.registrationForm.valid) {
      const player1Name = this.registrationForm.get('player1Name')?.value;
      const player2Name = this.registrationForm.get('player2Name')?.value;
      
      this.gameService.createGame(player1Name, player2Name).subscribe({
        next: (response) => {
          console.log('Juego creado:', response);
          this.router.navigate(['/game', response.id]);
        },
        error: (error) => {
          console.error('Error al crear el juego:', error);
          alert('Error al crear el juego. Por favor, intenta de nuevo.');
        }
      });
    }
  }
} 