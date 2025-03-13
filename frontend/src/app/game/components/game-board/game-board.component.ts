import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameService } from '../../services/game.service';
import { Game } from '../../interfaces/game.interface';
import { CommonModule } from '@angular/common';
import { interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-container" *ngIf="game">
      <div class="score-board">
        <div class="player" [class.active]="isPlayer1Turn">
          <h2>{{ game.player1.name }}</h2>
          <p class="score">Puntuación: {{ game.player1_score }}</p>
        </div>
        <div class="vs">VS</div>
        <div class="player" [class.active]="!isPlayer1Turn">
          <h2>{{ game.player2.name }}</h2>
          <p class="score">Puntuación: {{ game.player2_score }}</p>
        </div>
      </div>

      <div class="game-status">
        <h3>{{ gameStatus }}</h3>
      </div>

      <div class="moves" *ngIf="game.is_active">
        <div class="move-buttons" *ngIf="canMakeMove">
          <button 
            class="vintage-button"
            *ngFor="let move of ['ROCK', 'PAPER', 'SCISSORS']"
            (click)="makeMove(move)"
            [disabled]="!canMakeMove">
            {{ getMoveIcon(move) }}
          </button>
        </div>
        <p *ngIf="!canMakeMove">Esperando al otro jugador...</p>
      </div>

      <div class="round-history">
        <h3>Historial de Rondas</h3>
        <div class="round" *ngFor="let round of game.rounds">
          <p>{{ round.result }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .game-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .score-board {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .player {
      text-align: center;
      padding: 20px;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .player.active {
      background-color: var(--primary-color);
      color: white;
    }

    .vs {
      font-size: 24px;
      font-weight: bold;
    }

    .score {
      font-size: 20px;
      margin-top: 10px;
    }

    .moves {
      text-align: center;
      margin: 30px 0;
    }

    .move-buttons {
      display: flex;
      justify-content: center;
      gap: 20px;
    }

    .vintage-button {
      font-size: 24px;
      padding: 15px 30px;
    }

    .round-history {
      margin-top: 30px;
    }

    .round {
      padding: 10px;
      margin: 5px 0;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
  `]
})
export class GameBoardComponent implements OnInit {
  game: Game | null = null;
  isPlayer1Turn = true;
  gameId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private gameService: GameService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.gameId = +params['id'];
      // Actualizar el estado del juego cada 2 segundos
      interval(2000).pipe(
        switchMap(() => this.gameService.getGameState(this.gameId))
      ).subscribe(game => {
        this.game = game;
        this.updateGameStatus();
      });
    });
  }

  get canMakeMove(): boolean {
    if (!this.game || !this.game.is_active) return false;
    
    const currentRound = this.game.rounds[this.game.rounds.length - 1];
    if (!currentRound) return this.isPlayer1Turn;
    
    if (this.isPlayer1Turn) {
      return currentRound.player1_move === null;
    } else {
      return currentRound.player2_move === null && currentRound.player1_move !== null;
    }
  }

  get gameStatus(): string {
    if (!this.game) return 'Cargando...';
    if (!this.game.is_active) return `¡${this.game.winner?.name} ha ganado el juego!`;
    return this.canMakeMove ? 'Tu turno' : 'Esperando al otro jugador...';
  }

  makeMove(move: string) {
    if (!this.game || !this.canMakeMove) return;

    const playerId = this.isPlayer1Turn ? this.game.player1.id : this.game.player2.id;
    
    this.gameService.makeMove(this.gameId, playerId, move).subscribe({
      next: (updatedGame) => {
        this.game = updatedGame;
        this.isPlayer1Turn = !this.isPlayer1Turn;
      },
      error: (error) => {
        console.error('Error al realizar movimiento:', error);
        alert('Error al realizar el movimiento. Intenta de nuevo.');
      }
    });
  }

  getMoveIcon(move: string): string {
    switch (move) {
      case 'ROCK': return '✊';
      case 'PAPER': return '✋';
      case 'SCISSORS': return '✌️';
      default: return '';
    }
  }

  private updateGameStatus() {
    if (!this.game) return;
    
    const currentRound = this.game.rounds[this.game.rounds.length - 1];
    if (!currentRound) {
      this.isPlayer1Turn = true;
      return;
    }

    this.isPlayer1Turn = currentRound.player1_move === null || 
      (currentRound.player1_move !== null && currentRound.player2_move !== null);
  }
}
