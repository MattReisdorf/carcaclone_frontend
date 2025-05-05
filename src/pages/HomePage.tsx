import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Lobby } from "../interfaces/LobbyInterfaces";

// Importing logo from assets
import logo from "../assets/carcaclone.png";

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
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000
    });
    stompClient.onConnect = () => {
      stompClient.subscribe("/topic/lobby", (message) => {
        try {
          const lobby: Lobby = JSON.parse(message.body);
          console.log(lobby);
          if (lobby.lobbyId) {
            navigate(`/lobby/${lobby.lobbyId}`)
          }
        } catch (error) {
          console.error("Error parsing lobby creation message: ", error);
        }
      })
    }
    stompClient.activate();
    console.log("Stomp Client Activated");
    clientRef.current = stompClient;
    console.log("Client Ref Set To: ", clientRef.current)

    return () => {
      stompClient.deactivate();
      console.log("Stomp Client Deactivated");
    }
  }, []);

  // Create Lobby Handler
  const createLobby = () => {
    console.log("Create Lobby Handler")
    clientRef.current?.publish({
      destination: "/app/createLobby",
      body: JSON.stringify({
        action: "createLobby",
        playerId: playerId,
        playerName: playerName
      })
    })
  }

  return (
    <div className="bg-mirage-500 flex h-screen w-full">
      <div className="grid h-full w-full grid-cols-1 grid-rows-[80px_repeat(6,_minmax(0,_1fr))_40px] gap-4 p-4 md:grid-cols-2">
        <div className="row-span-1 flex h-full w-full items-center justify-center md:col-span-2">
          <img src={logo} alt="Carcaclone" style={{ height: 64, width: 205 }} />
        </div>

        <div className="row-span-2 flex h-full w-full items-center justify-center md:row-span-6">
          <div className="border-alabaster-500 aspect-square h-full border md:h-[65%] md:max-h-full md:w-auto md:max-w-[90%]">
            {/* Artwork Placeholder */}
            <div className="text-alabaster-500 flex h-full w-full items-center justify-center">
              Artwork
            </div>
          </div>
        </div>

        <div className="row-span-4 flex h-full w-full items-center justify-center md:row-span-6">
          <div className="aspect-square h-full md:h-[65%] md:max-h-full md:w-auto md:max-w-[90%]">
            <div className="grid h-full w-full grid-cols-1 grid-rows-4 gap-4 md:max-h-[350px]">
              <div className="row-span-1 h-full w-full">
                <h1 className="font-roboto text-alabaster-500 pt-4 text-center text-xl md:text-xl">
                  Free Online Carcassonne Alternative
                </h1>
              </div>

              <div className="md:max-h- row-span-3 grid h-full w-full grid-cols-1 grid-rows-3 gap-4 p-4">
                <div className="h-full w-full">
                  <Link to="/how-to-play">
                    <button className="bg-supernova-500 text-mirage-500 h-full w-full transform cursor-pointer rounded-lg border border-transparent font-semibold hover:scale-102 hover:border">
                      How to Play
                    </button>
                  </Link>
                </div>

                <div className="h-full w-full">
                  <button
                    className="bg-picton-blue-500 text-mirage-500 h-full w-full transform cursor-pointer rounded-lg border border-transparent font-semibold hover:scale-102 hover:border"
                    onClick={createLobby}
                  >
                    Create Lobby
                  </button>
                </div>

                <div className="h-full w-full">
                  <Link to="/lobbies">
                    <button className="bg-picton-blue-500 text-mirage-500 h-full w-full transform cursor-pointer rounded-lg border border-transparent py-3 font-semibold hover:scale-102 hover:border">
                      Join Lobby
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row-span-1 grid h-full w-full grid-cols-5 grid-rows-1 md:col-span-2">
          <div className="col-span-1 flex h-full w-full items-center justify-start">
            <h1 className="text-alabaster-500 font-roboto pl-2 text-sm">
              v0.1
            </h1>
          </div>
          <div className="col-span-3 flex h-full w-full items-center justify-center">
            <h1 className="text-alabaster-500 font-roboto text-center text-sm">
              Made by Matt Reisdorf
            </h1>
          </div>
          <div className="col-span-1 flex h-full w-full items-center justify-end">
            <h1 className="text-alabaster-500 font-roboto pr-2 text-sm">GH</h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
