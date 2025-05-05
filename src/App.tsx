import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'

const App: React.FC = () => {

  return (
    <Router>
      <Routes>
        <Route path = "/" element = {<HomePage />} />
        {/* <Route path = "how-to-play" element = {<HowToPlay />} /> */}
        {/* <Route path = "lobbies" element = {<LobbyList />} /> */}
      </Routes>
    </Router>
  )
}

export default App
