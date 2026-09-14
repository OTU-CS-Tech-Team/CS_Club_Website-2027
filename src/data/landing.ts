import type { ClubEvent, HackHiveClip, NewsItem } from '@/types/landing';

export { getPastEvents, getUpcomingEvents } from '@/lib/eventSchedule';

export const events: ClubEvent[] = [
  {
    id: 'leetcode-workshop',
    title: 'LeetCode & Algorithm Workshop',
    description:
      'Join us for our LeetCode Workshop, an essential session for students preparing for technical job interviews. Led by Dr. Ali, the workshop will introduce key problem-solving strategies and common patterns found in coding interviews. Students will gain practical experience by walking through real LeetCode-style questions and learning effective approaches to algorithms. The event is open to all CS and Software Engineering students, with walk-ins encouraged.',
    date: '2026-09-12',
    time: '6:00 PM – 8:00 PM',
    location: 'SIRC 2020',
    images: ['/events/workshop.svg', '/events/hacknight.svg'],
  },
  {
    id: 'hackhive-info',
    title: 'HackHive Info Night',
    description:
      'What HackHive actually is, how teams form, and what last year’s winners shipped. Bring a laptop if you have one. No project idea required — we will match people who want to build together.',
    date: '2026-09-26',
    time: '5:30 PM – 7:00 PM',
    location: 'UB 2050',
    images: ['/events/hacknight.svg'],
  },
  {
    id: 'resume-roast',
    title: 'Resume Roast',
    description:
      'Bring a PDF. Execs and a couple of upper-years will mark it up like a code review: what to cut, what to quantify, and what recruiters actually scan for. First 40 people through the door.',
    date: '2026-10-08',
    time: '6:30 PM – 8:00 PM',
    location: 'ERC 1058',
    images: ['/events/career.svg'],
  },
  {
    id: 'git-workshop',
    title: 'Git, but for real',
    description:
      'Branches, rebase vs merge, and how not to lose a weekend to a bad pull. Optional — this one sits past the landing-page cap of three.',
    date: '2026-10-22',
    time: '6:00 PM – 7:30 PM',
    location: 'SIRC 3110',
    images: ['/events/workshop.svg'],
  },
  {
    id: 'club-fair',
    title: 'Clubs Fair booth',
    description:
      'We ran the booth, handed out stickers, and signed up a pile of first-years. Photos live on Instagram.',
    date: '2026-08-10',
    time: '11:00 AM – 3:00 PM',
    location: 'Founders Walk',
    images: ['/events/career.svg'],
  },
];

export const news: NewsItem[] = [
  {
    id: 'workshop-note',
    title: 'LeetCode & Algorithm Workshop',
    body: 'Join us for our LeetCode Workshop, an essential session for students preparing for technical job interviews. Led by Dr. Ali, the workshop will introduce key problem-solving strategies and common patterns found in coding interviews. Students will gain practical experience by walking through real LeetCode-style questions and learning effective approaches to algorithms. The event is open to all CS and Software Engineering students, with walk-ins encouraged. Join us to strengthen your skills, build confidence, and prepare for future opportunities in tech.',
    postedOn: '2025-11-13',
  },
];

// Last year's recap (unlisted YouTube). Plays on the homepage when scrolled into view.
export const recapYoutubeId = 'jjOVJi_N3zg';

export const hackhiveSneakPeekClips: HackHiveClip[] = [
  { id: 'neuro-detect', src: '/projects/neuro-detect.png', type: 'image' },
  { id: 'doug', src: '/projects/doug-the-poker-bot.png', type: 'image' },
  { id: 'lockblock', src: '/projects/lockblock.png', type: 'image' },
  { id: 'cutos', src: '/projects/cutos.png', type: 'image' },
  { id: 'flash-ai', src: '/projects/flash-ai.png', type: 'image' },
];
