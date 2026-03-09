import { BrowserRouter, Routes, Route } from "react-router-dom";
import NarrativeTracker from "./pages/NarrativeTracker";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NarrativeTracker />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
