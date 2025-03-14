import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameService } from '../../services/game.service';
import { Game } from '../../interfaces/game.interface';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { interval, Subscription } from 'rxjs';
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
      background: #f4f1e8;
      border: 4px solid #000;
      border-radius: 15px;
      box-shadow: 8px 8px 0 #000;
    }

    .score-board {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      background: #e8e4d9;
      padding: 20px;
      border: 3px solid #000;
      border-radius: 10px;
      box-shadow: 4px 4px 0 #000;
    }

    .player {
      text-align: center;
      padding: 20px;
      border-radius: 8px;
      transition: all 0.3s ease;
      min-width: 200px;
      background: #fff;
      border: 2px solid #000;
      box-shadow: 3px 3px 0 #000;
    }

    .player.active {
      background-color: #6b4e71;
      color: white;
      transform: scale(1.05);
      border: 3px solid #000;
    }

    .vs {
      font-size: 32px;
      font-weight: bold;
      color: #000;
      text-shadow: 2px 2px 0 #6b4e71;
      font-family: 'Arial Black', sans-serif;
    }

    .score {
      font-size: 24px;
      margin-top: 10px;
      font-weight: bold;
      color: #4a6741;
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

    .round-history {
      margin-top: 30px;
      border: 3px solid #000;
      border-radius: 10px;
      padding: 15px;
      background: #e8e4d9;
      box-shadow: 4px 4px 0 #000;
    }

    .round-history h3 {
      color: #000;
      text-shadow: 2px 2px 0 #6b4e71;
      font-family: 'Arial Black', sans-serif;
      margin-bottom: 15px;
    }

    .round {
      padding: 15px;
      margin: 10px 0;
      background-color: #fff;
      border: 2px solid #000;
      border-radius: 8px;
      box-shadow: 3px 3px 0 #000;
    }

    .moves-history {
      display: flex;
      justify-content: space-around;
      margin-top: 10px;
      font-size: 24px;
      font-weight: bold;
    }

    .waiting-message {
      font-size: 24px;
      color: #6b4e71;
      margin: 20px 0;
      font-weight: bold;
      text-shadow: 1px 1px 0 #000;
    }

    .game-over {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      background: #e8e4d9;
      border: 3px solid #000;
      border-radius: 10px;
      box-shadow: 4px 4px 0 #000;
    }

    .game-over h2 {
      color: #000;
      text-shadow: 2px 2px 0 #6b4e71;
      font-family: 'Arial Black', sans-serif;
      margin-bottom: 15px;
    }

    .game-status {
      text-align: center;
      margin: 20px 0;
    }

    .game-status h3 {
      color: #000;
      text-shadow: 2px 2px 0 #6b4e71;
      font-family: 'Arial Black', sans-serif;
      font-size: 28px;
      margin-bottom: 10px;
    }

    .game-status p {
      color: #4a6741;
      font-weight: bold;
      font-size: 18px;
    }
  `]
})
export class GameBoardComponent implements OnInit, OnDestroy {
  game: Game | null = null;
  isPlayer1Turn = true;
  gameId: number = 0;
  private updateSubscription?: Subscription;
  private isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
    private gameService: GameService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.gameId = +params['id'];
      if (this.isBrowser) {
        this.updateGameState();
      }
    });
  }

  ngOnDestroy() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  private updateGameState() {
    if (!this.isBrowser) return;

    this.updateSubscription = interval(1000).pipe(
      switchMap(() => this.gameService.getGameState(this.gameId))
    ).subscribe({
      next: (game) => {
        this.game = game;
        this.updateGameStatus();
      },
      error: (error) => console.error('Error al actualizar el estado:', error)
    });
  }

  private updateGameStatus() {
    if (!this.game) return;
    
    const currentRound = this.game.rounds[this.game.rounds.length - 1];
    
    console.log('Estado actual:', {
      currentRound,
      rounds: this.game.rounds,
      isPlayer1Turn: this.isPlayer1Turn,
      roundsLength: this.game.rounds.length,
      scores: {
        player1: this.game.player1_score,
        player2: this.game.player2_score
      }
    });

    // Si no hay ronda actual, comienza el jugador 1
    if (!currentRound) {
      this.isPlayer1Turn = true;
      return;
    }

    // Si la ronda actual está completa o tiene ganador, la siguiente ronda comienza con el jugador 1
    if ((currentRound.player1_move && currentRound.player2_move) || currentRound.winner) {
      this.isPlayer1Turn = true;
      return;
    }

    // Durante una ronda en progreso
    if (currentRound.player1_move === null) {
      this.isPlayer1Turn = true;
    } else if (currentRound.player2_move === null) {
      this.isPlayer1Turn = false;
    }
  }

  get canMakeMove(): boolean {
    if (!this.game || !this.game.is_active) return false;
    
    const currentRound = this.game.rounds[this.game.rounds.length - 1];
    
    console.log('Verificando si puede mover:', {
      currentRound,
      isPlayer1Turn: this.isPlayer1Turn,
      roundsLength: this.game.rounds.length,
      scores: {
        player1: this.game.player1_score,
        player2: this.game.player2_score
      }
    });

    // Si no hay ronda actual, solo el jugador 1 puede comenzar
    if (!currentRound) {
      return this.isPlayer1Turn;
    }

    // Si la ronda actual está completa o tiene ganador, solo el jugador 1 puede comenzar la siguiente
    if ((currentRound.player1_move && currentRound.player2_move) || currentRound.winner) {
      return this.isPlayer1Turn;
    }

    // Durante una ronda en progreso
    if (this.isPlayer1Turn) {
      return currentRound.player1_move === null;
    } else {
      return currentRound.player1_move !== null && currentRound.player2_move === null;
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
    
    console.log('Realizando movimiento:', {
      playerId,
      move,
      isPlayer1Turn: this.isPlayer1Turn,
      currentRound: this.game.rounds[this.game.rounds.length - 1],
      scores: {
        player1: this.game.player1_score,
        player2: this.game.player2_score
      }
    });

    this.gameService.makeMove(this.gameId, playerId, move).subscribe({
      next: (updatedGame) => {
        console.log('Juego actualizado después del movimiento:', updatedGame);
        this.game = updatedGame;
        
        const currentRound = updatedGame.rounds[updatedGame.rounds.length - 1];
        
        // Si la ronda está completa
        if (currentRound.player1_move && currentRound.player2_move) {
          this.isPlayer1Turn = true;  // El siguiente turno es para el jugador 1
        } else if (currentRound.player1_move === null) {
          this.isPlayer1Turn = true;  // Es turno del jugador 1
        } else {
          this.isPlayer1Turn = false; // Es turno del jugador 2
        }
      },
      error: (error) => {
        console.error('Error al realizar movimiento:', error);
        if (error.error?.error) {
          alert(error.error.error);
        } else {
          alert('Error al realizar el movimiento. Intenta de nuevo.');
        }
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
