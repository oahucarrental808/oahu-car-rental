import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import TopNav from "./components/TopNav";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
import ErrorBoundary from "./components/ErrorBoundary";
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
import Destinations from "./pages/Destinations";
import QrRedirect from "./pages/QrRedirect";
import SignedContractSuccess from "./pages/SignedContractSuccess";
import SubmissionSuccess from "./pages/SubmissionSuccess";

import MileageOut from "./pages/MileageOut";
import MileageIn from "./pages/MileageIn";
import SignedContract from "./pages/SignedContract";

import AdminPickupInstructions from "./pages/AdminPickupInstructions";
import AdminDropoffInstructions from "./pages/AdminDropoffInstructions";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
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
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/request/success" element={<RequestSuccess />} />
              <Route path="/admin/request-customer-info" element={<AdminRequestCustomerInfo />} />
              <Route path="/admin/customer-info" element={<AdminCustomerInfo />} />
              <Route path="/success" element={<CustomerSuccess />} />
              <Route path="/submission-success" element={<SubmissionSuccess />} />

              {/* Mileage flows */}
              <Route path="/mileageOut" element={<MileageOut />} />
              <Route path="/mileageIn" element={<MileageIn />} />

              {/* Admin instruction pages */}
              <Route path="/admin/pickup-instructions" element={<AdminPickupInstructions />} />
              <Route path="/admin/dropoff-instructions" element={<AdminDropoffInstructions />} />

              {/* Signed contract upload */}
              <Route path="/signedContract" element={<SignedContract />} />
              <Route path="/signed-contract/success" element={<SignedContractSuccess />} />

              {/* QR code redirect */}
              <Route path="/qr" element={<QrRedirect />} />
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
    </ErrorBoundary>
    </QueryClientProvider>
  );
}
