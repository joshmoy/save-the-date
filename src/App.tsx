import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UpdatesPage from "./pages/UpdatesPage";
// import UpdateDetailsPage from "./pages/UpdateDetailsPage";
import VenueSelectedPage from "./pages/VenueSelectedPage";
import EngagementVideoPage from "./pages/EngagementVideoPage";
import OfficialColorsPage from "./pages/OfficialColorsPage";
import VendorsPage from "./pages/VendorsPage";
import GiftingPage from "./pages/GiftingPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/updates" element={<UpdatesPage />} />
      {/* <Route path="/updates/:id" element={<UpdateDetailsPage />} /> */}
      <Route path="/updates/venue-selected" element={<VenueSelectedPage />} />
      <Route path="/updates/engagement-video" element={<EngagementVideoPage />} />
      <Route path="/updates/official-colors" element={<OfficialColorsPage />} />
      <Route path="/updates/vendors" element={<VendorsPage />} />
      <Route path="/updates/gifting" element={<GiftingPage />} />
    </Routes>
  );
}

export default App;
