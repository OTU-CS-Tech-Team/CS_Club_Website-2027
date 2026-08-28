export type ClubEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  images: string[];
  isUpcoming: boolean;
};

export type NewsItem = {
  id: string;
  title: string;
  body: string;
  postedOn: string;
};
