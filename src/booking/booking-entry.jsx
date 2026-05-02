import { createRoot } from "react-dom/client";
import BookingCard from "./BookingCard.jsx";

const el = document.getElementById("booking-pixel-root");
if (el) {
  createRoot(el).render(<BookingCard />);
}
