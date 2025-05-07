import React, { useCallback, useEffect, useRef, useState } from "react";
import { Lobby } from "../interfaces/LobbyInterfaces";
import axios from "axios";

import background from "../assets/landing-background-v1.png";
import { Link, useNavigate } from "react-router-dom";
import GamePiece from "../components/GamePiece";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// For Generating Player Names
import {
  uniqueNamesGenerator,
  names,
  NumberDictionary,
} from "unique-names-generator";

// Generate Player's UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (character) {
      const rand = (Math.random() * 16) | 0,
        value = character === "x" ? rand : (rand & 0x3) | 0x8;
      return value.toString(16);
    },
  );
};

const LobbyList: React.FC = () => {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);
  const navigate = useNavigate();

  // Retrieve or Generate and Store Player's UUID
  let playerId = localStorage.getItem("playerId");
  if (!playerId) {
    playerId = generateUUID();
    localStorage.setItem("playerId", playerId);
  }

  // Retreive or Generate and Store Player's Display Name
  let playerName = localStorage.getItem("playerName");
  if (!playerName) {
    playerName = uniqueNamesGenerator({
      dictionaries: [names, NumberDictionary.generate({ min: 100, max: 999 })],
      length: 2,
      separator: "",
      style: "capital",
    });
    localStorage.setItem("playerName", playerName);
  }

  // For callback div animation
  const [tick, setTick] = useState<number>(0);
  const [barWidth, setBarWidth] = useState<"0%" | "100%">("0%");
  const [transitionEnabled, setTransitionEnabled] = useState<boolean>(false);

  const getLobbies = useCallback(async () => {
    try {
      const response = await axios.get<Lobby[]>("/api/lobbies");
      setLobbies(response?.data);
      setError(null);
      setTick((t) => t + 1);
    } catch (error: any) {
      console.error(error.message);
      setError(error.message || "Failed to load lobbies");
    }
  }, []);

  useEffect(() => {
    getLobbies();

    const lobbyPolling = window.setInterval(getLobbies, 5000);

    return () => window.clearInterval(lobbyPolling);
  }, [getLobbies]);

  useEffect(() => {
    setTransitionEnabled(false);
    setBarWidth("0%");

    const id = window.setTimeout(() => {
      setTransitionEnabled(true);
      setBarWidth("100%");
    }, 20);

    return () => window.clearTimeout(id);
  }, [tick]);

  // Set up STOMP Client on Mount
  useEffect(() => {
    const stompClient = new Client({
      brokerURL: undefined,
      webSocketFactory: () =>
        new SockJS(`http://localhost:8080/ws?playerId=${playerId}`),
      reconnectDelay: 5000,
      connectHeaders: { playerId },
      debug: (msg) => console.log("[STOMP]", msg),
    });
    stompClient.onConnect = () => {
      stompClient.subscribe(`/user/queue/lobbyCreated`, (message) => {
        try {
          const lobby: Lobby = JSON.parse(message.body);
          console.log(lobby);
          if (lobby.lobbyId) {
            navigate(`/lobby/${lobby.lobbyId}`);
          }
        } catch (error) {
          console.error("Error parsing lobby creation message: ", error);
        }
      });
    };
    stompClient.activate();
    console.log("Stomp Client Activated");
    clientRef.current = stompClient;
    console.log("Client Ref Set To: ", clientRef.current);

    return () => {
      stompClient.deactivate();
      console.log("Stomp Client Deactivated");
    };
  }, []);

  // Create Lobby Handler
  const createLobby = () => {
    console.log("Create Lobby Handler");
    clientRef.current?.publish({
      destination: "/app/createLobby",
      body: JSON.stringify({
        action: "createLobby",
        playerId: playerId,
        playerName: playerName,
      }),
    });
  };

  if (error) {
    return (
      <div
        className="bg-mirage-500 flex h-screen w-full flex-col gap-4 bg-cover bg-center p-4"
        style={{ backgroundImage: `url(${background})` }}
      >
        <div className="h-[50px] w-full" />
        <div className="flex h-full w-full flex-1 flex-col items-center justify-center gap-4">
          <div className="bg-mirage-600 border-alabaster-900 flex h-full max-h-[600px] w-full max-w-[800px] flex-col rounded-2xl border-2 p-4">
            <div className="flex h-[50px] w-full items-center justify-center">
              <h1 className="font-roboto text-alabaster-500 text-xl font-semibold">
                No Active Lobbies
              </h1>
            </div>
            <div className="flex w-full flex-1 flex-col items-center justify-center gap-16">
              <h2 className="font-roboto text-alabaster-500 text-center text-lg">
                There was an issue getting the active lobbies. Please try again
                later.
              </h2>
              <h3 className="font-roboto text-alabaster-500 text-md text-center">
                {error}
              </h3>
            </div>

            <div className="flex h-[80px] w-full items-center justify-center p-4"></div>
          </div>
        </div>
        <div className="h-[50px] w-full" />
      </div>
    );
  }
  return (
    <div
      className="bg-mirage-500 flex h-screen w-full flex-col gap-4 bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="h-[50px] w-full" />
      <div className="flex h-full w-full flex-1 flex-col items-center justify-center gap-4">
        <div className="bg-mirage-600 border-alabaster-900 flex h-full max-h-[600px] w-full max-w-[800px] flex-col rounded-2xl border-2 p-4">
          <div className="flex h-[50px] w-full items-center justify-center">
            <h1 className="font-roboto text-alabaster-500 text-xl font-semibold">
              Active Lobbies
            </h1>
          </div>
          <div
            className="bg-supernova-500 h-[2px]"
            style={{
              width: barWidth,
              transition: transitionEnabled ? "width 5000ms linear" : "none",
            }}
          />

          <div className="scroll hide-scrollbar flex w-full flex-1 flex-col overflow-scroll">
            {lobbies.length === 0 ? (
              <div className="flex w-full flex-1 flex-col items-center justify-center gap-16">
                <h2 className="font-roboto text-alabaster-500 text-center text-lg">
                  There are no currently active lobbies.
                </h2>
              </div>
            ) : (
              <ul className="">
                {lobbies.map((lobby) => {
                  return (
                    <li
                      key={lobby.lobbyId}
                      className="odd:bg-picton-blue-900 even:bg-picton-blue-950 flex p-4"
                    >
                      <Link
                        to={`/lobby/${lobby.lobbyId}`}
                        className="text-alabaster-500 font-roboto underline"
                      >
                        {lobby.lobbyId.slice(0, 8).toUpperCase()}
                      </Link>
                      <div className="flex flex-1 items-center justify-end">
                        {Array.from({ length: lobby.players.length }).map(
                          (_, index) => (
                            <GamePiece key={index} fill="#F8FAFC" />
                          ),
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex h-[80px] w-full items-center justify-center p-4">
            <button
              className="bg-supernova-500 text-mirage-500 mt-4 h-full w-full max-w-[270px] transform cursor-pointer rounded-lg border border-transparent font-semibold hover:scale-102 hover:border"
              onClick={createLobby}
            >
              Create Lobby
            </button>
          </div>
        </div>
      </div>
      <div className="h-[50px] w-full" />
    </div>
  );
};

export default LobbyList;
