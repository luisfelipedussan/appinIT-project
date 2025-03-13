import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Game } from '../interfaces/game.interface';

interface Player {
  id: number;
  name: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private createPlayer(name: string): Observable<Player> {
    return this.http.post<Player>(`${this.apiUrl}/players/`, { name });
  }

  createGame(player1Name: string, player2Name: string): Observable<any> {
    const payload = {
      player1_name: player1Name,
      player2_name: player2Name
    };
    
    return this.http.post(`${this.apiUrl}/create-game/`, payload).pipe(
      tap(response => console.log('Juego creado:', response))
    );
  }

  makeMove(gameId: number, playerId: number, movement: string): Observable<Game> {
    const payload = {
      player_id: playerId,
      movement: movement
    };
    
    return this.http.post<Game>(`${this.apiUrl}/games/${gameId}/make_move/`, payload).pipe(
      tap(response => console.log('Movimiento realizado:', response))
    );
  }

  getGameState(gameId: number): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/games/${gameId}/`).pipe(
      tap(game => console.log('Estado del juego:', game))
    );
  }

  restartGame(gameId: number): Observable<Game> {
    return this.http.post<Game>(`${this.apiUrl}/games/${gameId}/restart_game/`, {}).pipe(
      tap(response => console.log('Juego reiniciado:', response))
    );
  }
} 