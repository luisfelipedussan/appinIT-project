import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  makeMove(gameId: number, playerId: number, movement: string): Observable<any> {
    const payload = {
      player_id: playerId,
      movement: movement
    };
    
    return this.http.post(`${this.apiUrl}/games/${gameId}/make_move/`, payload);
  }

  getGameState(gameId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/games/${gameId}/`);
  }
} 