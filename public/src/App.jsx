import { HashRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Host from "./pages/Host";
import Participant from "./pages/Participant";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/host" element={<Host />} />
        <Route path="/host/:sessionId" element={<Host />} />
        <Route path="/r/:roomCode" element={<Participant />} />
      </Routes>
    </HashRouter>
  );
}
