import type { HackHiveProject } from '@/types/hackhive';

export const hackhiveProjects: HackHiveProject[] = [
  {
    id: 'doug-the-poker-bot',
    title: 'Doug the Poker Bot',
    description:
      'A physical poker-playing robot built from 3D-printed parts, microcontrollers, and computer vision. Doug reads the table, makes decisions, and moves chips — a full hardware stack for autonomous gameplay.',
    category: 'poker robot',
    tag: 'HackHive 2026',
    year: 2026,
    team: 'Doug Team',
    techStack: ['ESP32', 'Python', 'OpenCV', '3D Printing'],
    thumbnail: '/projects/doug-the-poker-bot.png',
    mediaType: 'video',
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
      'Face recognition meets a physical deadbolt. Won MLH Best Use of Solana — decentralized, passwordless access control wired through a keypad, Arduino, and custom mechanical housing.',
    category: 'smart lock',
    tag: 'Best Use of Solana',
    year: 2026,
    team: 'Lock Block Team',
    techStack: ['Arduino', 'Solana', 'Face Recognition', 'Mechanical'],
    thumbnail: '/projects/lockblock.png',
    mediaType: 'video',
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
      'AI-powered neurological diagnostics using brain scan analysis. Interactive visualization surfaces patterns in neural imaging data to assist early detection workflows.',
    category: 'Medical diagnostics',
    tag: 'HackHive 2026',
    year: 2026,
    team: 'Neuro Detect Team',
    techStack: ['Python', 'TensorFlow', 'React', 'Medical Imaging'],
    thumbnail: '/projects/neuro-detect.png',
    mediaType: 'video',
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
      'Edit videos at the speed of thought. Search footage with natural language, let AI agents apply edits, arrange timelines, and transform your vision into reality.',
    category: 'AI Editing software',
    tag: 'HackHive 2026',
    year: 2026,
    team: 'CutOS Team',
    techStack: ['Next.js', 'TypeScript', 'AI Agents', 'Video Processing'],
    thumbnail: '/projects/cutos.png',
    mediaType: 'video',
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
