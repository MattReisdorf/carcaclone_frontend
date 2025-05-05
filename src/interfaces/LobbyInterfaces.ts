interface Player {
  playerId: string;
  playerName: string;
  playerColor: string;
  host: boolean;
  playerReady: boolean;
}

interface Lobby {
  lobbyId: string;
  players: Player[];
  gameStarted: boolean;
  privateLobby: boolean;
}


export type { Player, Lobby };