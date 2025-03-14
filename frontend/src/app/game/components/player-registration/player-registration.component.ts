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
      padding: 30px;
      background: #f4f1e8;
      border: 4px solid #000;
      border-radius: 15px;
      box-shadow: 8px 8px 0 #000;
    }

    h2 {
      color: #000;
      text-shadow: 2px 2px 0 #6b4e71;
      font-family: 'Arial Black', sans-serif;
      font-size: 28px;
      margin-bottom: 25px;
      text-align: center;
    }

    .form-group {
      margin: 25px 0;
      text-align: left;
    }

    label {
      display: block;
      margin-bottom: 10px;
      font-family: 'Arial Black', sans-serif;
      color: #4a6741;
      font-size: 18px;
      font-weight: bold;
    }

    .vintage-input {
      width: 100%;
      padding: 12px;
      font-size: 16px;
      background: #fff;
      border: 3px solid #000;
      border-radius: 8px;
      box-shadow: 3px 3px 0 #000;
      transition: all 0.2s ease;
    }

    .vintage-input:focus {
      outline: none;
      transform: translate(-2px, -2px);
      box-shadow: 5px 5px 0 #000;
    }

    .error-message {
      color: #d32f2f;
      font-size: 14px;
      margin-top: 8px;
      font-weight: bold;
      text-shadow: 1px 1px 0 rgba(0,0,0,0.1);
    }

    .vintage-button {
      width: 100%;
      font-size: 24px;
      padding: 15px 30px;
      margin-top: 30px;
      cursor: pointer;
      background: #4a6741;
      color: white;
      border: 3px solid #000;
      border-radius: 8px;
      transition: all 0.2s ease;
      box-shadow: 4px 4px 0 #000;
      font-family: 'Arial Black', sans-serif;
      text-transform: uppercase;
    }

    .vintage-button:hover {
      background: #6b4e71;
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0 #000;
    }

    .vintage-button:active {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 #000;
    }

    .vintage-button:disabled {
      background: #cccccc;
      cursor: not-allowed;
      border-color: #666;
      box-shadow: none;
      transform: none;
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