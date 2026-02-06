import { Route, Routes } from "react-router-dom";
import Home from "@/components/app/page";
import Simulator from "@/components/app/simulator/Simulator";
import Navbar from "@/components/web/Navbar";
import WebTraining from "./components/app/web_training/WebTraining";

import { AuthProvider } from "@/context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/web-training" element={<WebTraining />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
