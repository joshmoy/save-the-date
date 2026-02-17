import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UpdatesPage from "./pages/UpdatesPage";
import UpdateDetailsPage from "./pages/UpdateDetailsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/updates" element={<UpdatesPage />} />
      <Route path="/updates/:id" element={<UpdateDetailsPage />} />
    </Routes>
  );
}

export default App;
