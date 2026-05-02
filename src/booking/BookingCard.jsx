import { useEffect, useState } from "react";
import PixelCard from "./PixelCard.jsx";

function themePalette() {
  const dark =
    document.documentElement.getAttribute("data-theme") === "dark" ||
    document.body.classList.contains("dark");
  return dark
    ? "#7c6cff,#a090ff,#5a4acb,#c8bbff"
    : "#c8a76a,#e8d8b8,#f6efe2";
}

export default function BookingCard() {
  const [colors, setColors] = useState(themePalette);

  useEffect(() => {
    const sync = () => setColors(themePalette());
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
    mo.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => mo.disconnect();
  }, []);

  return (
    <PixelCard
      variant="default"
      gap={6}
      speed={35}
      colors={colors}
      className="bookingPixelCard"
    >
      <div className="bookingPixelContent">
        <div className="bookingPixelBlock bookingPixelBlock--top">
          <p className="dot-font bookingEyebrow">BOOK A CALL</p>
        </div>
        <div className="bookingPixelBlock bookingPixelBlock--middle">
          <h3>Let's talk</h3>
          <p>
            A quick call to understand your idea and see if we click.
          </p>
        </div>
        <div className="bookingPixelBlock bookingPixelBlock--bottom">
          {/* Replace with your real Cal.com or Calendly link if this slug changes */}
          <a
            href="https://cal.com/josh-allen-v1jqpl"
            target="_blank"
            rel="noopener noreferrer"
            className="bookingButton"
          >
            Book a call
          </a>
        </div>
      </div>
    </PixelCard>
  );
}
