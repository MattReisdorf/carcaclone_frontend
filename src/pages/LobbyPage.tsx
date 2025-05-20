import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChatMessage, Lobby, Player, StartGameResponse } from "../interfaces/LobbyInterfaces";
import { generateUUID } from "../utils/GenerateUUID";
import { generateUniqueName } from "../utils/GenerateUniqueName";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import GamePiece from "../components/GamePiece";

import background from "../assets/landing-background-v1.png";

import { CheckIcon } from "@heroicons/react/24/solid";
import { XMarkIcon } from "@heroicons/react/24/solid";
import SendSquare from "../components/SendSquare";

const LobbyPage: React.FC = () => {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [host, setHost] = useState<Player | undefined>(undefined);
  const [colorModalOpen, setColorModalOpen] = useState<boolean>(false);
  const [modalPlayer, setModalPlayer] = useState<Player | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState<string>("");
  const navigate = useNavigate();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const clientRef = useRef<Client | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [chatMessages]);

  let playerId = localStorage.getItem("playerId");
  if (!playerId) {
    playerId = generateUUID();
    localStorage.setItem("playerId", playerId);
  }

  let playerName = localStorage.getItem("playerName");
  if (!playerName) {
    playerName = generateUniqueName();
    localStorage.setItem("playerName", playerName);
  }

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    // Clean up the event listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getLobby = useCallback(async () => {
    try {
      const response = await axios.get<Lobby>(`/api/lobbies/${lobbyId}`);
      setHost(response.data.players.find((player) => player.host));
    } catch {
      setError("Lobby not found or an error occurred.");
    }
  }, []);

  useEffect(() => {
    if (!lobbyId) return;
    getLobby();
  }, [lobbyId]);

  // Set up STOMP Client on Mount
  useEffect(() => {
    const stompClient = new Client({
      brokerURL: undefined,
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
    });
    stompClient.onConnect = () => {
      stompClient.subscribe(`/topic/lobby/${lobbyId}`, (message) => {
        try {
          const updated: Lobby = JSON.parse(message.body);
          if (updated.lobbyId === lobbyId) {
            // console.log("Lobby was updated");
            setLobby(updated);
          }
        } catch (error) {
          console.error("Error getting lobby sub message: ", error);
        }
      });
      stompClient.subscribe(`/topic/chat/${lobbyId}`, (message) => {
        const chat: ChatMessage = JSON.parse(message.body);
        // console.log("Chat Message: ", chat);
        setChatMessages((prev) => [...prev, chat]);
      });



      // --- TESTING RESPONESE FROM STARTGAME ENDPOINT ---
      stompClient.subscribe(`/topic/lobby/${lobbyId}/start`, (message) => {
        const response: StartGameResponse = JSON.parse(message.body);
        if (response.gameId) {
          navigate(`/${response.gameId}`)
        }
      });
      // --- ---

      if (!(host?.playerId === playerId)) {
        stompClient.publish({
          destination: "/app/joinLobby",
          body: JSON.stringify({
            action: "join",
            lobbyId: lobbyId,
            playerId: playerId,
            playerName: playerName,
          }),
        });
      }
    };

    stompClient.activate();
    // console.log("Stomp Client Activated");
    clientRef.current = stompClient;
    // console.log("Client Ref Set To: ", clientRef.current);
  }, []);

  const handleReadyToggle = () => {
    clientRef.current?.publish({
      destination: "/app/ready",
      body: JSON.stringify({
        action: "ready",
        lobbyId: lobbyId,
        playerId: playerId,
        playerName: playerName,
        playerColor: currentPlayer?.playerColor,
        isPlayerReady: !currentPlayer?.playerReady,
      }),
    });
  };

  const handlePrivateToggle = () => {
    // console.log(lobby?.privateLobby);
    // console.log(!lobby?.privateLobby);
    clientRef.current?.publish({
      destination: "/app/setPrivate",
      body: JSON.stringify({
        action: "setPrivate",
        lobbyId: lobbyId,
        isPrivateLobby: !lobby?.privateLobby,
      }),
    });
  };

  const handleColorChange = (color: string) => {
    clientRef.current?.publish({
      destination: "/app/changeColor",
      body: JSON.stringify({
        action: "changeColor",
        lobbyId: lobbyId,
        playerId: modalPlayer?.playerId,
        playerName: modalPlayer?.playerName,
        playerColor: modalPlayer?.playerColor,
        newPlayerColor: color,
      }),
    });
  };

  const handleStartGame = () => {
    console.log("Game Should Start");
    clientRef.current?.publish({
      destination: "/app/startGame",
      body: JSON.stringify({
        action: "startGame",
        lobbyId: lobbyId
      })
    })
  };

  const handleSendChat = () => {
    if (!chatDraft.trim() || !clientRef.current) {
      return;
    }
    const message: ChatMessage = {
      lobbyId: lobbyId!,
      senderId: playerId,
      senderName: playerName,
      senderColor: currentPlayer!.playerColor,
      content: chatDraft.trim(),
      timestamp: Date.now(),
    };
    clientRef.current.publish({
      destination: `/app/chat/${lobbyId}`,
      body: JSON.stringify(message),
    });
    setChatDraft("");
  };

  // console.log("Lobby: ", lobby);

  const currentPlayer = lobby?.players.find((p) => p.playerId === playerId);
  const allReady = lobby?.players.every((p) => p.playerReady);
  const enoughPlayers = lobby?.players.length! >= 2;
  // console.log(currentPlayer);

  const maxPlayers = 5;
  const slots = Array.from({ length: maxPlayers }, (_, i) => lobby?.players[i]);

  const allColors = ["red", "blue", "green", "yellow", "black"];
  const takenColors = new Set(lobby?.players.map((p) => p.playerColor));

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div
      className="bg-mirage-500 flex h-screen w-full flex-col gap-4 bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="h-[25px] w-full" />
      <div className="flex h-full w-full flex-1 flex-col items-center justify-center gap-4">
        <div className="bg-mirage-500 border-alabaster-900 grid h-full max-h-[600px] w-full max-w-[800px] grid-cols-1 grid-rows-9 gap-4 rounded-2xl border-2 p-4 md:grid-cols-2">
          <div
            className={`row-span-4 h-full w-full rounded-xl md:col-span-1 ${currentPlayer?.playerId === host?.playerId ? "md:row-span-7" : "md:row-span-8"}`}
          >
            <ul className="grid h-full w-full grid-cols-1 grid-rows-5 items-center justify-between gap-2 rounded-lg md:gap-4">
              {slots.map((player, index) => (
                <li
                  key={index}
                  className="bg-picton-blue-900 flex h-full w-full items-center justify-between rounded-lg p-2"
                >
                  {player ? (
                    <>
                      <span className="text-alabaster-500 font-roboto flex h-full items-center text-base font-semibold md:text-lg">
                        <div
                          className={`mr-2 flex aspect-square h-[50%] min-h-[34px] items-center justify-center rounded-md ${player.playerId === playerId ? "cursor-pointer hover:scale-110" : "cursor-default"} `}
                          onClick={
                            player.playerId === playerId
                              ? () => {
                                  setModalPlayer(player);
                                  setColorModalOpen(true);
                                }
                              : undefined
                          }
                        >
                          <GamePiece
                            outline={"#FFFFFF"}
                            outlineWidth={10}
                            height={windowWidth > 810 ? 30 : 24}
                            width={windowWidth > 810 ? 30 : 24}
                            fill={player.playerColor}
                          />
                        </div>
                        {player.playerName}
                      </span>
                      <span
                        className={`mr-2 ${player.playerReady ? "text-picton-blue-500" : "text-alabaster-700"} font-roboto text-base font-semibold`}
                      >
                        {player.playerReady ? "Ready" : "Not Ready"}
                      </span>
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      {/* TODO: Bot Logic */}
                      {/* <button className = "h-[70%] w-[100px] bg-primary-600 rounded-lg">
                              Add Bot
                            </button> */}
                      {/* TODO: Bot Logic */}
                      <span className="animate-ellipsis text-alabaster-500 font-roboto ml-6 text-sm md:text-base">
                        Waiting for player
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`bg-white flex flex-col rounded-lg p-2 ${currentPlayer?.playerId === host?.playerId ? "row-span-3" : "row-span-4"} h-full w-full md:col-span-1 ${currentPlayer?.playerId === host?.playerId ? "md:row-span-7" : "md:row-span-8"}`}
          >
            <div className="hide-scrollbar mb-2 flex-1 space-y-2 overflow-y-auto">
              {chatMessages.map((message, index) => {
                const player = lobby?.players.find(
                  (player) => player.playerId === message.senderId,
                );
                const color = player?.playerColor ?? message.senderColor;
                return (
                  <div key={index} className="rounded-lg p-2 font-roboto">
                    <strong className = {`text-${color}-500`}>{message.senderName}</strong>:{" "}
                    {message.content}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex w-full gap-2">
              <input
                className="placeholder-alabaster-700 border-alabaster-700 text-alabaster-700 active:text-alabaster-900 focus:text-alabaster-900 active:border-alabaster-900 focus:border-alabaster-900 flex-1 rounded border p-2 focus:ring-0 focus:outline-none"
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSendChat()}
                placeholder="Type a message..."
              />
              <button className="bg-picton-blue-950/30 hover:bg-picton-blue-950/50 cursor-pointer rounded p-2 hover:scale-104">
                <SendSquare
                  height={30}
                  width={30}
                  fill={"#f8fafc"}
                  outline={"#000"}
                />
              </button>
            </div>
          </div>

          <div className="row-span-3 rounded-lg md:col-span-2 md:row-span-2">
            <div
              className={`grid h-full w-full grid-cols-1 gap-2 ${currentPlayer?.playerId === host?.playerId ? "grid-rows-2" : "grid-rows-1"}`}
            >
              <div className="flex items-center justify-center">
                <label className="flex w-full items-center justify-center-safe">
                  <div
                    className={`text-alabaster-500 mr-2 h-[20px] w-[20px] cursor-pointer rounded-sm ${currentPlayer?.playerReady ? "bg-picton-blue-600 hover:scale-110" : "bg-red-600 hover:scale-110"}`}
                    onClick={handleReadyToggle}
                  >
                    {currentPlayer?.playerReady ? (
                      <CheckIcon className="text-background-200" />
                    ) : (
                      <XMarkIcon className="text-background-200" />
                    )}
                  </div>
                  <span className="text-alabaster-500 font-roboto text-sm">
                    Ready
                  </span>
                </label>
                {currentPlayer?.playerId === host?.playerId && (
                  <label className="flex w-full items-center justify-center-safe">
                    <div
                      className={`text-alabaster-500 mr-2 h-[20px] w-[20px] cursor-pointer rounded-sm ${lobby?.privateLobby ? "bg-picton-blue-600 hover:scale-110" : "bg-red-600 hover:scale-110"}`}
                      onClick={handlePrivateToggle}
                    >
                      {lobby?.privateLobby ? (
                        <CheckIcon className="" />
                      ) : (
                        <XMarkIcon className="" />
                      )}
                    </div>
                    <span className="text-alabaster-500 font-roboto text-sm">
                      Private Lobby
                    </span>
                  </label>
                )}
              </div>
              {currentPlayer?.playerId === host?.playerId && (
                <div className="flex h-full w-full items-center justify-center">
                  <button
                    onClick={handleStartGame}
                    disabled={!allReady || !enoughPlayers}
                    className="bg-supernova-500 text-background-100 h-full w-[365px] cursor-pointer rounded-lg hover:scale-102 disabled:cursor-default disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Start Game
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="h-[25px] w-full" />

      {colorModalOpen && modalPlayer && (
        <div className="bg-picton-blue-700/50 fixed inset-0 flex h-full w-full items-center justify-center pr-13 pl-13">
          <div className="bg-picton-blue-900 border-alabaster-600 h-64 w-96 rounded-lg border-2">
            <div className="bg-background-500 flex h-[20%] w-full items-center justify-evenly">
              <div className="flex h-full w-2/10 items-center justify-center"></div>
              <div className="flex h-full w-6/10 items-center justify-center">
                <h3 className="m-2 text-lg font-semibold">Choose a Color</h3>
              </div>
              <div
                onClick={() => {
                  setColorModalOpen(false);
                  setModalPlayer(null);
                }}
                className="flex w-2/10 cursor-pointer items-center justify-center"
              >
                <XMarkIcon className="h-[28px] w-[28px]" />
              </div>
            </div>
            <div className="flex h-[80%] w-full flex-wrap items-center justify-around">
              {allColors.map((c) => {
                const isTaken = takenColors.has(c);
                return (
                  <div
                    key={c}
                    className={`m-2 flex h-18 w-18 items-center justify-center rounded-md ${isTaken ? "opacity-30" : "transform cursor-pointer transition hover:scale-108"}`}
                    onClick={() => {
                      if (isTaken) return;
                      handleColorChange(c);
                      setColorModalOpen(false);
                    }}
                    aria-disabled={isTaken}
                  >
                    <GamePiece
                      outline={"#FFFFFF"}
                      outlineWidth={10}
                      fill={c}
                      height={50}
                      width={50}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LobbyPage;
