export interface Player {
  id: number;
  name: string;
  created_at: string;
}

export interface Game {
  id: number;
  player1: Player;
  player2: Player;
  player1_score: number;
  player2_score: number;
  winner: Player | null;
  is_active: boolean;
  status: string;
  rounds: Round[];
}

export interface Round {
  id: number;
  player1_move: string | null;
  player2_move: string | null;
  winner: Player | null;
  created_at: string;
  result: string;
} 