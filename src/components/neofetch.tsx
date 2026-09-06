const ASCII = [
  "      ███                                      ██████",
  "     ▒▒▒                                      ███▒▒███",
  "     █████ ████████  ████████   █████ █████  ▒███ ▒▒▒",
  "    ▒▒███ ▒▒███▒▒███▒▒███▒▒███ ▒▒███ ▒▒███  ███████",
  "     ▒███  ▒███ ▒▒▒  ▒███ ▒███  ▒▒▒█████▒  ▒▒▒███▒",
  "     ▒███  ▒███      ▒███ ▒███   ███▒▒▒███   ▒███",
  "     ▒███  █████     ████ █████ █████ █████  █████",
  "     ▒███ ▒▒▒▒▒     ▒▒▒▒ ▒▒▒▒▒ ▒▒▒▒▒ ▒▒▒▒▒  ▒▒▒▒▒",
  " ███ ▒███",
  "▒▒██████",
  " ▒▒▒▒▒▒",
].join("\n");

const INFO: [string, string][] = [
  ["role", "software engineer"],
  ["location", "vila chã, portugal"],
  ["stack", "rust · go · typescript"],
  ["site", "jrnxf.co"],
  ["github", "github.com/jrnxf"],
];

const PALETTE = [
  "#333333",
  "#999999",
  "#e5e5e5",
  "#ffffff",
  "oklch(0.78 0.12 25)",
  "oklch(0.68 0.12 25)",
  "oklch(0.58 0.12 25)",
  "oklch(0.48 0.12 25)",
];

export function Neofetch({ mail }: { mail: string }) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-10">
      <pre className="shrink-0 text-[8px] leading-none text-accent xs:text-[9px] sm:text-[13px]">
        {ASCII}
      </pre>
      <div className="flex flex-col gap-0.5">
        <p>
          <span className="text-accent">colby</span>@<span className="text-accent">jrnxf</span>
        </p>
        <p className="text-neutral-600">-----------</p>
        {INFO.map(([label, val]) => (
          <p key={label}>
            <span className="inline-block w-[9ch] text-accent">{label}</span>
            {val}
          </p>
        ))}
        <p>
          <span className="inline-block w-[9ch] text-accent">mail</span>
          {mail}
        </p>
        <div className="mt-2 flex">
          {PALETTE.map((color) => (
            <span key={color} className="h-3.5 w-7" style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>
    </div>
  );
}
