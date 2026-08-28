import type { HackHiveProject } from '@/types/hackhive';

export const hackhiveProjects: HackHiveProject[] = [
  {
    id: 'doug-the-poker-bot',
    title: 'Doug the Poker Bot',
    description:
      'A robot to be the dealer at your next home poker match. Doug will deal cards, listen for player actions, and stream the game live with interesting stats for spectators to view.',
    category: 'poker robot',
    tag: 'HackHive 2026',
    year: 2026,
    team: 'Adrian Shkumbov, David Frieri, Jason Wang, Matthew Frieri',
    techStack: ['ESP32', 'Flask', 'OpenAI', 'React', 'YOLO'],
    thumbnail: '/projects/doug-the-poker-bot.png',
    mediaType: 'video',
    youtubeId: 'NdvToF_4Yp4',
    demoUrl: 'https://www.youtube.com/watch?v=NdvToF_4Yp4',
    award: 'Second place overall winner',
    githubUrl: 'https://github.com/MatthewFrieri/HackHive',
    devpostUrl: 'https://devpost.com/software/doug-the-poker-bot',
    featured: true,
    rotation: -4.5,
    attachment: 'pin',
    pinColor: 'red',
    annotation: {
      text: 'second place winner!',
      placement: 'bottom',
      ink: 'navy',
    },
  },
  {
    id: 'lockblock',
    title: 'lockblock',
    description:
      'Smart security that works while you sleep. Your door locks automatically when it sees a stranger. Unlock from your phone. Get instant alerts. Peace of mind, no strings attached.',
    category: 'smart lock',
    tag: 'Best Use of Solana',
    year: 2026,
    team: 'Ethan Yang, Ryan Gao, Jeremy Liu',
    techStack: ['Python', 'Flask', 'OpenCV', 'Solana', 'JavaScript', 'SQLite', 'HTML'],
    thumbnail: '/projects/lockblock.png',
    mediaType: 'video',
    youtubeId: '1hwgS66tB9k',
    demoUrl: 'https://www.youtube.com/watch?v=1hwgS66tB9k',
    award: 'Best use of Solana',
    githubUrl: 'https://github.com/e-yang6/lockblock',
    devpostUrl: 'https://devpost.com/software/lockblock-9ct281',
    featured: true,
    rotation: 3,
    attachment: 'tape',
    annotation: {
      text: 'best use of solana',
      placement: 'top',
      ink: 'red',
    },
  },
  {
    id: 'neuro-detect',
    title: 'Neuro Detect',
    description:
      'Neuro Detect is an AI-powered assistant that helps radiologists analyze brain MRI scans faster with clear, explainable insights.',
    category: 'Medical diagnostics',
    tag: 'HackHive 2026',
    year: 2026,
    team: 'Logan Yee, Krishna Mallick, Ali Hakkani, Kiran Sakthivel',
    techStack: ['TensorFlow', 'FastAPI', 'Python', 'JavaScript', 'Gemini API', 'Render', 'CSS'],
    thumbnail: '/projects/neuro-detect.png',
    mediaType: 'video',
    youtubeId: 'TcK3JO73CKs',
    demoUrl: 'https://www.youtube.com/watch?v=TcK3JO73CKs',
    award: 'First place overall winner',
    githubUrl: 'https://github.com/KrishnaKMA/hackathon-app',
    devpostUrl: 'https://devpost.com/software/neurodetect-rst574',
    featured: true,
    rotation: -2,
    attachment: 'pin',
    pinColor: 'green',
    annotation: {
      text: 'First place overall winner!',
      placement: 'top',
      ink: 'green',
    },
  },
  {
    id: 'cutos',
    title: 'cutOS',
    description:
      'AI-powered video editor. Edit with natural language and just tell it what you want. Automatic dubbing, voice isolation, and semantic smart search. Professional results, zero learning curve.',
    category: 'AI Editing software',
    tag: 'HackHive 2026',
    year: 2026,
    team: 'Shams Haroon, Jonathan David McKesey, Julian Cruzet, Vincent Wong',
    techStack: ['Next.js', 'OpenAI', 'ElevenLabs', 'TwelveLabs', 'Supabase', 'WebGL', 'FFmpeg'],
    thumbnail: '/projects/cutos.png',
    mediaType: 'video',
    youtubeId: 't0zHzwyXm_Q',
    demoUrl: 'https://www.youtube.com/watch?v=t0zHzwyXm_Q',
    award: 'Best use of ElevenLabs',
    githubUrl: 'https://github.com/shamsharoon/CutOS',
    devpostUrl: 'https://devpost.com/software/cutos',
    featured: true,
    rotation: 5,
    attachment: 'tape',
    annotation: {
      text: 'Best use of ElevenLabs',
      placement: 'bottom',
      ink: 'ink',
    },
  },
];

export function getProjectById(id: string): HackHiveProject | undefined {
  return hackhiveProjects.find((p) => p.id === id);
}

export function getRelatedProjects(id: string, limit = 3): HackHiveProject[] {
  return hackhiveProjects.filter((p) => p.id !== id).slice(0, limit);
}

export function getFeaturedProjects(): HackHiveProject[] {
  return hackhiveProjects.filter((p) => p.featured !== false);
}

export function getProjectHref(id: string): string {
  return `/hackhive/${id}`;
}
