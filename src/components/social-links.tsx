import {
  GithubIcon,
  InstagramIcon,
  Linkedin01Icon,
  NewTwitterIcon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const socialLinks = [
  { url: "https://github.com/jrnxf", label: "github", icon: GithubIcon },
  {
    url: "https://linkedin.com/in/jrnxf",
    label: "linkedin",
    icon: Linkedin01Icon,
  },
  {
    url: "https://instagram.com/jrn.xf",
    label: "instagram",
    icon: InstagramIcon,
  },
  {
    url: "https://twitter.com/jrn_xf",
    label: "twitter",
    icon: NewTwitterIcon,
  },
  {
    url: "https://www.youtube.com/@jrnxf",
    label: "youtube",
    icon: YoutubeIcon,
  },
];

export function SocialLinks() {
  return (
    <div className="flex items-center gap-[22px]">
      {socialLinks.map(({ url, label, icon }) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`follow me on ${label}`}
          className="flex rounded-md text-neutral-500 transition-colors duration-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <HugeiconsIcon icon={icon} size={16} strokeWidth={1.5} />
        </a>
      ))}
    </div>
  );
}
