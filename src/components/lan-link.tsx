import { useEffect, useState } from "react";

const LAN_URL = "https://lan.jrnxf.co";

// The hostname only resolves via local DNS (pihole) or the tailnet, so this
// probe fails for everyone else and the link never renders. Reachability is
// the gate; the name itself is public knowledge via CT logs.
export function LanLink() {
  const [reachable, setReachable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    fetch(`${LAN_URL}/favicon.ico`, {
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(() => setReachable(true))
      .catch(() => {})
      .finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  if (!reachable) return null;

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
