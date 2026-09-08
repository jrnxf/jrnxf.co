import { useEffect, useState } from "react";

export const LAN_URL = "https://lan.jrnxf.co";

// No reachability probe: a background request from a public page to a private
// address triggers Chrome's Local Network Access permission prompt. Instead the
// link is gated by a localStorage flag, set via the hidden `lan` terminal
// command. Top-level navigation to the LAN site never prompts. The hostname is
// public knowledge anyway (CT logs); access is gated by DNS + the tailnet.
const KEY = "lan";
const EVENT = "lan-changed";

export function enableLan() {
  localStorage.setItem(KEY, "1");
  window.dispatchEvent(new Event(EVENT));
}

export function disableLan() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function LanLink() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const read = () => setShown(localStorage.getItem(KEY) === "1");
    read();
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);

  if (!shown) return null;

  return (
    <>
      <a
        href={LAN_URL}
        className="text-neutral-500 transition-colors hover:text-neutral-300 motion-safe:animate-[fade-in_300ms_ease-out]"
      >
        lan
      </a>
      <span>·</span>
    </>
  );
}
