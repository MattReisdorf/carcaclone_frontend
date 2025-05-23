import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Lobby } from "../interfaces/LobbyInterfaces";

// Importing logo from assets
import logo from "../assets/carcaclone.png";

import background from "../assets/landing-background-v1.png";

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

const HomePage: React.FC = () => {
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
      destination: "/app/lobby/createLobby",
      body: JSON.stringify({
        action: "createLobby",
        playerId: playerId,
        playerName: playerName,
      }),
    });
  };

  return (
    <div
      className="bg-mirage-500 h-screen w-full bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="flex h-full w-full flex-col gap-4">
        <header className="flex h-[80px] w-full items-center justify-center">
          <img src={logo} alt="Carcaclone" style={{ height: 64, width: 205 }} />
        </header>
        <div className="flex w-full flex-1 flex-col items-center justify-center">
          <div className="flex h-[400px] w-[345px] flex-col gap-4">
            <div className="flex h-1/3 w-full items-center justify-center">
              <h1 className="font-roboto text-alabaster-500 text-center text-2xl font-semibold">
                Free Online Carcassonne
              </h1>
            </div>

            <div className="grid h-2/3 w-full grid-cols-1 grid-rows-3 gap-4">
              <div className="row-span-1 h-full w-full">
                <Link to="/how-to-play">
                  <button className="bg-supernova-500 text-mirage-500 h-full w-full transform cursor-pointer rounded-lg border border-transparent font-semibold hover:scale-102 hover:border">
                    How to Play
                  </button>
                </Link>
              </div>
              <div className="row-span-1 h-full w-full">
                <button
                  className="bg-picton-blue-500 text-mirage-500 h-full w-full transform cursor-pointer rounded-lg border border-transparent font-semibold hover:scale-102 hover:border"
                  onClick={createLobby}
                >
                  Create Lobby
                </button>
              </div>
              <div className="row-span-1 h-full w-full">
                <Link to="/lobbies">
                  <button className="bg-picton-blue-500 text-mirage-500 h-full w-full transform cursor-pointer rounded-lg border border-transparent py-3 font-semibold hover:scale-102 hover:border">
                    Join Lobby
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <footer className="grid h-[80px] w-full grid-cols-5 grid-rows-1">
          <div className="col-span-1 flex h-full w-full items-end justify-start">
            <h1 className="text-alabaster-500 font-roboto pl-2 text-sm">
              v0.1
            </h1>
          </div>
          <div className="col-span-3 flex h-full w-full items-end justify-center">
            <h1 className="text-alabaster-500 font-roboto text-center text-sm">
              Made by Matt Reisdorf
            </h1>
          </div>
          <div className="col-span-1 flex h-full w-full items-end justify-end">
            <h1 className="text-alabaster-500 font-roboto pr-2 text-sm">GH</h1>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
