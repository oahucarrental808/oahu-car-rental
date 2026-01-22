import { BrowserRouter, Routes, Route } from "react-router-dom";

import TopNav from "./components/TopNav";
import Home from "./pages/Home";
import Request from "./pages/Request";
import Faq from "./pages/Faq";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import RequestSuccess from "./components/RequestSuccess";
import AdminRequestCustomerInfo from "./pages/AdminRequestCustomerInfo";
import AdminCustomerInfo from "./pages/AdminCustomerInfo";
import CustomerSuccess from "./pages/CustomerSuccess";
import Gallery from "./pages/Gallery";

import MileageOut from "./pages/MileageOut";
import MileageIn from "./pages/MileageIn";
import SignedContract from "./pages/SignedContract";

import AdminPickupInstructions from "./pages/AdminPickupInstructions";
import AdminDropoffInstructions from "./pages/AdminDropoffInstructions";

export default function App() {
  return (
    <BrowserRouter>
      {/* Make the whole app a flex column that fills the viewport */}
      <div>
        <TopNav />

        {/* This is the key: content takes remaining height */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/request" element={<Request />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/request/success" element={<RequestSuccess />} />
            <Route path="/admin/request-customer-info" element={<AdminRequestCustomerInfo />} />
            <Route path="/admin/customer-info" element={<AdminCustomerInfo />} />
            <Route path="/success" element={<CustomerSuccess />} />

            {/* Mileage flows */}
            <Route path="/mileageOut" element={<MileageOut />} />
            <Route path="/mileageIn" element={<MileageIn />} />

            {/* Admin instruction pages */}
            <Route path="/admin/pickup-instructions" element={<AdminPickupInstructions />} />
            <Route path="/admin/dropoff-instructions" element={<AdminDropoffInstructions />} />

            {/* Signed contract upload */}
            <Route path="/signedContract" element={<SignedContract />} />
          </Routes>
        </main>

        <footer
          style={{
            opacity: 0.7,
            fontSize: "12px",
            padding: "18px 0",
            textAlign: "center",
          }}
        >
          © {new Date().getFullYear()} Oahu Car Rentals
        </footer>
      </div>
    </BrowserRouter>
  );
}
