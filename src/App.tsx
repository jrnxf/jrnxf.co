import { ShaderBackground } from "@/components/particle-field";
import { RepoRow } from "@/components/repo-row";
import { SocialLinks, socialLinks } from "@/components/social-links";
import { TerminalPrompt } from "@/components/terminal-prompt";
import type { GitHubRepo } from "@/lib/github";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import type { ReactNode } from "react";

const MAIL = "colby@jrnxf.co";

function Prompt({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-neutral-400 sm:gap-3">
      <span className="text-accent">❯</span>
      {children}
    </div>
  );
}

function Identity() {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-baseline sm:gap-4">
        <h1 className="text-[30px] font-bold leading-[1.05] tracking-[-0.02em] text-white sm:text-[40px] sm:leading-none">
          colby thomas
        </h1>
        <a
          href="https://github.com/jrnxf"
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit rounded-md text-[13px] text-neutral-500 transition-colors duration-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 sm:text-sm"
        >
          @jrnxf
        </a>
      </div>
      <p className="max-w-[560px] text-[13px] leading-[1.7] text-neutral-400 sm:text-sm">
        software engineer. i build small, fast tools for the terminal and the web, mostly in rust,
        go and typescript.
      </p>
    </div>
  );
}

function RepoTable({ repos }: { repos: GitHubRepo[] }) {
  return (
    <div className="flex flex-col border-t border-white/[0.08]">
      {repos.map((repo) => (
        <RepoRow key={repo.name} repo={repo} />
      ))}
    </div>
  );
}

export default function App({ repos }: { repos: GitHubRepo[] }) {
  const sorted = [...repos].sort((a, b) => b.stars - a.stars);
  const [cleared, setCleared] = useState(false);

  return (
    <>
      <ShaderBackground />
      <div className="relative z-10 flex min-h-dvh flex-col px-[22px] pb-10 pt-[max(22px,env(safe-area-inset-top))] font-mono sm:px-14 sm:pb-12 sm:pt-10">
        {/* status line */}
        <div className="flex justify-between text-xs tracking-[0.02em] text-neutral-500">
          <span>colby@jrnxf ~</span>
          <span className="sm:hidden">vila chã, pt</span>
          <span className="hidden sm:inline">vila chã, portugal · wet+1</span>
        </div>

        {!cleared && (
          <>
            {/* whoami */}
            <div className="mt-10 sm:mt-14">
              <Prompt>
                <span>whoami</span>
              </Prompt>
            </div>
            <div className="mt-3.5 pl-[22px] sm:mt-4 sm:pl-[26px]">
              <Identity />
            </div>

            {/* repos */}
            <div className="mt-9 sm:mt-11">
              <Prompt>
                <span>ls ~/repos --sort stars</span>
              </Prompt>
            </div>
            <div className="ml-[22px] mt-3 sm:ml-[26px] sm:mt-3.5">
              <RepoTable repos={sorted} />
            </div>
          </>
        )}

        {/* footer; after `clear` the prompt moves to the top of the screen */}
        <footer
          className={
            cleared
              ? "mt-6 flex flex-col gap-[22px] sm:gap-4"
              : "mt-auto flex flex-col gap-[22px] pt-12 sm:gap-4"
          }
        >
          {!cleared && (
            <>
              <div className="flex flex-col gap-2.5">
                <Prompt>
                  <span>mail</span>
                  <a
                    href={`mailto:${MAIL}`}
                    className="hidden border-b border-accent pb-px text-white transition-colors duration-200 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 sm:inline"
                  >
                    {MAIL}
                  </a>
                </Prompt>
                <a
                  href={`mailto:${MAIL}`}
                  className="ml-[22px] flex min-h-12 items-center justify-between rounded-lg border border-white/[0.14] bg-black/40 px-4 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 sm:hidden"
                >
                  {MAIL}
                  <span className="flex text-accent">
                    <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
                  </span>
                </a>
              </div>

              <div className="flex flex-col gap-2.5">
                <Prompt>
                  <span>open</span>
                  <div className="ml-1 hidden sm:block">
                    <SocialLinks />
                  </div>
                </Prompt>
                <div className="ml-[22px] grid grid-cols-5 gap-2 sm:hidden">
                  {socialLinks.map(({ url, label, icon }) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`follow me on ${label}`}
                      className="flex h-12 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    >
                      <HugeiconsIcon icon={icon} size={20} strokeWidth={1.5} />
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          <TerminalPrompt
            mail={MAIL}
            whoamiOutput={<Identity />}
            lsOutput={<RepoTable repos={sorted} />}
            onClear={() => setCleared(true)}
            onReset={() => setCleared(false)}
          />
        </footer>
      </div>
    </>
  );
}
