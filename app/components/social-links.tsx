import {
  IconBrandGithub as GithubIcon,
  IconBrandInstagram as InstagramIcon,
  IconBrandLinkedin as LinkedinIcon,
  IconBrandTwitter as TwitterIcon,
  IconBrandYoutube as YoutubeIcon,
} from '@tabler/icons-react'

const socialLinks = [
  {
    url: 'https://github.com/jrnxf',
    label: 'github',
    Icon: GithubIcon,
  },
  {
    url: 'https://twitter.com/_jrnxf',
    label: 'twitter',
    Icon: TwitterIcon,
  },
  {
    url: 'https://instagram.com/_jrnxf',
    label: 'instagram',
    Icon: InstagramIcon,
  },
  {
    url: 'https://www.youtube.com/@jrnxf',
    label: 'youtube',
    Icon: YoutubeIcon,
  },
  {
    url: 'https://linkedin.com/in/jrnxf',
    label: 'linkedin',
    Icon: LinkedinIcon,
  },
]

export const SocialLinks = () => (
  <div className="flex justify-center space-x-6">
    {socialLinks.map(({ url, label, Icon }) => (
      <a
        key={url}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`follow me on ${label}`}
        className="rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400"
      >
        {/* @ts-ignore – this type is fine. i think there is a bug in the ts compiler atm */}
        <Icon size={28} className="cursor-pointer text-zinc-500" />
      </a>
    ))}
  </div>
)
