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

interface ChatMessage {
  lobbyId: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  content: string;
  timestamp: number;
}

interface StartGameResponse {
  lobbyId: string;
  gameId: string;
}


export type { Player, Lobby, ChatMessage, StartGameResponse };