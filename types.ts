
export type Suit = '♥' | '♦' | '♣' | '♠';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface PlayerState {
  hand: Card[];
  faceUp: Card[];
  faceDown: Card[];
}

export enum GamePhase {
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export enum Player {
  USER = 'USER',
  COMPUTER = 'COMPUTER'
}
