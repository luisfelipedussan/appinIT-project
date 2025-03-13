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
          <p class="score">Victorias: {{ game.player1_score }}</p>
        </div>
        <div class="vs">VS</div>
        <div class="player" [class.active]="!isPlayer1Turn">
          <h2>{{ game.player2.name }}</h2>
          <p class="score">Victorias: {{ game.player2_score }}</p>
        </div>
      </div>

      <div class="game-status">
        <h3>{{ gameStatus }}</h3>
        <p *ngIf="game.is_active">Gana el primero en conseguir 3 victorias</p>
      </div>

      <div class="moves" *ngIf="game.is_active">
        <div class="move-buttons" *ngIf="canMakeMove">
          <button 
            class="vintage-button"
            *ngFor="let move of ['ROCK', 'PAPER', 'SCISSORS']"
            (click)="makeMove(move)"
            [disabled]="!canMakeMove">
            {{ getMoveIcon(move) }} {{ getMoveName(move) }}
          </button>
        </div>
        <p *ngIf="!canMakeMove" class="waiting-message">
          {{ isPlayer1Turn ? 'Esperando al Jugador 1...' : 'Esperando al Jugador 2...' }}
        </p>
      </div>

      <div class="round-history">
        <h3>Historial de Rondas</h3>
        <div class="round" *ngFor="let round of game.rounds">
          <p>{{ round.result }}</p>
          <div class="moves-history" *ngIf="round.player1_move && round.player2_move">
            <span>{{ game.player1.name }}: {{ getMoveIcon(round.player1_move) }}</span>
            <span>{{ game.player2.name }}: {{ getMoveIcon(round.player2_move) }}</span>
          </div>
        </div>
      </div>

      <div class="game-over" *ngIf="!game.is_active">
        <h2>¡Juego Terminado!</h2>
        <p>Ganador: {{ game.winner?.name }}</p>
        <button class="vintage-button" (click)="restartGame()">Jugar de Nuevo</button>
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
      background: #f5f5f5;
      padding: 20px;
      border-radius: 10px;
    }

    .player {
      text-align: center;
      padding: 20px;
      border-radius: 8px;
      transition: all 0.3s ease;
      min-width: 200px;
    }

    .player.active {
      background-color: #4CAF50;
      color: white;
      transform: scale(1.05);
    }

    .vs {
      font-size: 24px;
      font-weight: bold;
      color: #666;
    }

    .score {
      font-size: 24px;
      margin-top: 10px;
      font-weight: bold;
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
      cursor: pointer;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      transition: all 0.3s ease;
    }

    .vintage-button:hover {
      background: #45a049;
      transform: translateY(-2px);
    }

    .vintage-button:disabled {
      background: #cccccc;
      cursor: not-allowed;
    }

    .round-history {
      margin-top: 30px;
    }

    .round {
      padding: 15px;
      margin: 10px 0;
      background-color: #f5f5f5;
      border-radius: 8px;
      border-left: 4px solid #4CAF50;
    }

    .moves-history {
      display: flex;
      justify-content: space-around;
      margin-top: 10px;
      font-size: 20px;
    }

    .waiting-message {
      font-size: 20px;
      color: #666;
      margin: 20px 0;
    }

    .game-over {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 10px;
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
      this.updateGameState();
    });
  }

  private updateGameState() {
    interval(1000).pipe(
      switchMap(() => this.gameService.getGameState(this.gameId))
    ).subscribe({
      next: (game) => {
        this.game = game;
        this.updateGameStatus();
      },
      error: (error) => console.error('Error al actualizar el estado:', error)
    });
  }

  get canMakeMove(): boolean {
    if (!this.game || !this.game.is_active) return false;
    
    const currentRound = this.game.rounds[this.game.rounds.length - 1];
    
    // Si no hay ronda actual, permitir que el jugador 1 comience
    if (!currentRound) return this.isPlayer1Turn;
    
    // Si ambos jugadores han movido, permitir que el jugador 1 comience una nueva ronda
    if (currentRound.player1_move && currentRound.player2_move) {
      return this.isPlayer1Turn;
    }
    
    // Durante una ronda en progreso
    if (this.isPlayer1Turn) {
      return !currentRound.player1_move;
    } else {
      return !currentRound.player2_move && !!currentRound.player1_move;
    }
  }

  get gameStatus(): string {
    if (!this.game) return 'Cargando...';
    if (!this.game.is_active && this.game.winner) {
      return `¡${this.game.winner.name} ha ganado el juego!`;
    }
    if (this.canMakeMove) {
      return `Turno de ${this.isPlayer1Turn ? this.game.player1.name : this.game.player2.name}`;
    }
    return 'Esperando al otro jugador...';
  }

  makeMove(move: string) {
    if (!this.game || !this.canMakeMove) return;

    const playerId = this.isPlayer1Turn ? this.game.player1.id : this.game.player2.id;
    
    this.gameService.makeMove(this.gameId, playerId, move).subscribe({
      next: (updatedGame) => {
        this.game = updatedGame;
        
        const currentRound = updatedGame.rounds[updatedGame.rounds.length - 1];
        
        // Cambiar el turno solo si el movimiento actual está completo
        if (currentRound) {
          if (this.isPlayer1Turn && currentRound.player1_move) {
            this.isPlayer1Turn = false;
          } else if (!this.isPlayer1Turn && currentRound.player2_move) {
            this.isPlayer1Turn = true;
          }
        }
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

  getMoveName(move: string): string {
    switch (move) {
      case 'ROCK': return 'Piedra';
      case 'PAPER': return 'Papel';
      case 'SCISSORS': return 'Tijera';
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

    // Si la ronda actual está completa, la siguiente ronda comienza con el jugador 1
    if (currentRound.player1_move && currentRound.player2_move) {
      this.isPlayer1Turn = true;
    } else {
      // Durante una ronda, el turno depende de quién ya ha movido
      this.isPlayer1Turn = !currentRound.player1_move;
    }
  }

  restartGame(): void {
    if (!this.game) return;
    
    this.gameService.restartGame(this.gameId).subscribe({
      next: (newGame: Game) => {
        this.game = newGame;
        this.isPlayer1Turn = true;
      },
      error: (error: any) => {
        console.error('Error al reiniciar el juego:', error);
        alert('Error al reiniciar el juego. Intenta de nuevo.');
      }
    });
  }
}
