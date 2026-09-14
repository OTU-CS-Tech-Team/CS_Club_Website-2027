export type ClubEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  images: string[];
};

export type NewsItem = {
  id: string;
  title: string;
  body: string;
  postedOn: string;
};

export type HackHiveClip = {
  id: string;
  src: string;
  type: 'image' | 'video';
};
