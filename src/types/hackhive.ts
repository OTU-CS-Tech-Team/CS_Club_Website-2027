export type CorkboardAnnotation = {
  text: string;
  placement: 'top' | 'bottom';
  ink: 'red' | 'navy' | 'ink' | 'green';
};

export type HackHiveProject = {
  id: string;
  title: string;
  description: string;
  category: string;
  tag: string;
  year: number;
  team: string;
  techStack: string[];
  thumbnail: string;
  mediaType: 'image' | 'video';
  videoSrc?: string;
  youtubeId?: string;
  demoUrl?: string;
  award?: string;
  githubUrl?: string;
  devpostUrl?: string;
  featured?: boolean;
  rotation: number;
  attachment: 'pin' | 'tape';
  pinColor?: 'red' | 'green';
  annotation?: CorkboardAnnotation;
};
