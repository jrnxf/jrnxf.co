import { Neofetch } from "@/components/neofetch";
import { ShaderBackground } from "@/components/particle-field";
import { RepoRow } from "@/components/repo-row";
import { TerminalPrompt } from "@/components/terminal-prompt";
import type { GitHubRepo } from "@/lib/github";
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
  const stars = repos.reduce((total, repo) => total + repo.stars, 0);
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
            {/* neofetch */}
            <div className="mt-10 sm:mt-14">
              <Prompt>
                <span>neofetch</span>
              </Prompt>
            </div>
            <div className="mt-3.5 pl-[22px] text-[13px] leading-[1.7] text-neutral-400 sm:mt-4 sm:pl-[26px]">
              <Neofetch mail={MAIL} stars={stars} />
            </div>

            {/* repos */}
            <div className="mt-9 sm:mt-11">
              <Prompt>
                <span>ls</span>
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
              : "mt-9 flex flex-col gap-[22px] sm:mt-11 sm:gap-4"
          }
        >
          <TerminalPrompt
            mail={MAIL}
            stars={stars}
            lsOutput={<RepoTable repos={sorted} />}
            onClear={() => setCleared(true)}
            onReset={() => setCleared(false)}
          />
        </footer>
      </div>
    </>
  );
}
