import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface Entry {
  id: number;
  cmd: string;
  output: ReactNode;
}

const SITES: Record<string, string> = {
  github: "https://github.com/jrnxf",
  linkedin: "https://linkedin.com/in/jrnxf",
  instagram: "https://instagram.com/jrn.xf",
  twitter: "https://twitter.com/jrn_xf",
  youtube: "https://www.youtube.com/@jrnxf",
};

const HELP = `available commands:
  whoami         who am i
  ls             list repos
  echo <text>    say it back
  mail           send me an email
  open <site>    github · linkedin · instagram · twitter · youtube
  clear          clear the screen
  reset          restore the home screen`;

export function TerminalPrompt({
  mail,
  whoamiOutput,
  lsOutput,
  onClear,
  onReset,
}: {
  mail: string;
  whoamiOutput: ReactNode;
  lsOutput: ReactNode;
  onClear: () => void;
  onReset: () => void;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [value, setValue] = useState("");
  const [past, setPast] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  // Typing anywhere on the page focuses the prompt; the first key is applied
  // by hand because focus lands after the event has already been dispatched.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = inputRef.current;
      if (!el || document.activeElement === el) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key.length === 1) {
        e.preventDefault();
        setValue((v) => v + e.key);
        el.focus();
      } else if (e.key === "Backspace" || e.key === "Enter") {
        el.focus();
      }
    };
    // Clicking empty space focuses the prompt too, like a real terminal —
    // desktop only, so mobile taps don't pop the keyboard while scrolling.
    const onClick = (e: MouseEvent) => {
      if (!window.matchMedia("(pointer: fine)").matches) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("a,button,input,textarea")) return;
      if (window.getSelection()?.toString()) return;
      inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    if (entries.length > 0) endRef.current?.scrollIntoView({ block: "end" });
  }, [entries]);

  const print = (cmd: string, output: ReactNode) => {
    setEntries((prev) => [...prev, { id: nextId.current++, cmd, output }]);
  };

  const run = (raw: string) => {
    const cmd = raw.trim();
    if (cmd !== "") setPast((prev) => [...prev, cmd]);
    setHistIdx(-1);

    if (cmd === "") {
      print("", null);
      return;
    }

    const [name, ...args] = cmd.split(/\s+/);

    switch (name) {
      case "help":
        print(cmd, <pre className="whitespace-pre-wrap">{HELP}</pre>);
        break;
      case "whoami":
        print(cmd, whoamiOutput);
        break;
      case "ls":
        print(cmd, lsOutput);
        break;
      case "echo":
        print(cmd, args.length > 0 ? <p>{args.join(" ")}</p> : null);
        break;
      case "mail":
        window.location.href = `mailto:${mail}`;
        print(
          cmd,
          <p>
            drafting email to{" "}
            <a href={`mailto:${mail}`} className="text-white hover:text-accent">
              {mail}
            </a>{" "}
            ... (click the address if nothing opened)
          </p>,
        );
        break;
      case "open": {
        const site = args[0]?.toLowerCase();
        if (!site) {
          print(
            cmd,
            <p>
              usage: open {"<site>"} — {Object.keys(SITES).join(" · ")}
            </p>,
          );
        } else if (SITES[site]) {
          window.open(SITES[site], "_blank", "noopener,noreferrer");
          print(cmd, <p>opening {site} ...</p>);
        } else {
          print(cmd, <p>open: unknown site: {site}</p>);
        }
        break;
      }
      case "clear":
        setEntries([]);
        onClear();
        break;
      case "reset":
        setEntries([]);
        onReset();
        break;
      case "sudo":
        print(cmd, <p>nice try.</p>);
        break;
      case "exit":
        print(cmd, <p>there is no escape. try `help`.</p>);
        break;
      default:
        print(cmd, <p>command not found: {name} — try `help`</p>);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry) => (
        <div key={entry.id} className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 text-sm text-neutral-400 sm:gap-3">
            <span className="text-accent">❯</span>
            <span>{entry.cmd}</span>
          </div>
          {entry.output != null && (
            <div className="pl-[22px] text-[13px] leading-[1.7] text-neutral-400 sm:pl-[26px]">
              {entry.output}
            </div>
          )}
        </div>
      ))}

      {/* live prompt */}
      <div
        className="flex cursor-text items-center gap-2.5 text-sm text-neutral-400 sm:gap-3"
        onClick={() => inputRef.current?.focus()}
      >
        <span className="text-accent">❯</span>
        <span className="flex min-w-0 items-center">
          <span className="whitespace-pre-wrap break-all text-white">{value}</span>
          <span
            className="inline-block h-[17px] w-[9px] shrink-0 bg-[#e5e5e5] [animation:blink_1.1s_steps(1)_infinite]"
            aria-hidden="true"
          />
        </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              run(value);
              setValue("");
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              if (past.length === 0) return;
              const idx = histIdx === -1 ? past.length - 1 : Math.max(0, histIdx - 1);
              setHistIdx(idx);
              setValue(past[idx]);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              if (histIdx === -1) return;
              const idx = histIdx + 1;
              if (idx >= past.length) {
                setHistIdx(-1);
                setValue("");
              } else {
                setHistIdx(idx);
                setValue(past[idx]);
              }
            } else if (e.key === "c" && e.ctrlKey) {
              setValue("");
              setHistIdx(-1);
            } else if (e.key === "l" && e.ctrlKey) {
              e.preventDefault();
              setEntries([]);
              onClear();
            }
          }}
          aria-label="terminal input"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          className="absolute h-px w-px opacity-0"
        />
      </div>
      <div ref={endRef} />
    </div>
  );
}
