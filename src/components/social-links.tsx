import { HugeiconsIcon } from '@hugeicons/react'
import {
  GithubIcon,
  NewTwitterIcon,
  InstagramIcon,
  YoutubeIcon,
  Linkedin01Icon,
} from '@hugeicons/core-free-icons'

const socialLinks = [
  { url: 'https://github.com/jrnxf', label: 'github', icon: GithubIcon },
  {
    url: 'https://twitter.com/jrn_xf',
    label: 'twitter',
    icon: NewTwitterIcon,
  },
  {
    url: 'https://instagram.com/jrn.xf',
    label: 'instagram',
    icon: InstagramIcon,
  },
  {
    url: 'https://www.youtube.com/@jrnxf',
    label: 'youtube',
    icon: YoutubeIcon,
  },
  {
    url: 'https://linkedin.com/in/jrnxf',
    label: 'linkedin',
    icon: Linkedin01Icon,
  },
]

export function SocialLinks() {
  return (
    <div className="flex gap-5">
      {socialLinks.map(({ url, label, icon }) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`follow me on ${label}`}
          className="text-neutral-500 transition-all duration-200 hover:scale-110 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-md"
        >
          <HugeiconsIcon icon={icon} size={18} strokeWidth={1.5} />
        </a>
      ))}
    </div>
  )
}
