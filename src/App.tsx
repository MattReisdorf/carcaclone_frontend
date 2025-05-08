import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LobbyList from "./pages/LobbyList";
import LobbyPage from "./pages/LobbyPage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* <Route path = "how-to-play" element = {<HowToPlay />} /> */}
        <Route path = "/lobbies" element = {<LobbyList />} />
        <Route path = "/lobby/:lobbyId" element = {<LobbyPage />} />
      </Routes>
    </Router>
  );
};

export default App;
