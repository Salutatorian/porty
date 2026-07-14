export type PhotoItem = {
  id: string;
  title: string;
  location: string;
  year: string;
  image: string;
  dateTaken?: string;
  locationDetail?: string;
  camera?: string;
  description?: string;
  collection?: string;
};

export type BookItem = {
  title: string;
  author: string;
  status: "Read" | "Currently reading" | "Want to read";
  cover: string;
};

export type MovieItem = {
  title: string;
  year: string;
  director: string;
  status: "Watched" | "Currently watching" | "Watchlist";
  poster: string;
};

export const PHOTOS: PhotoItem[] = [
  {
    id: "after-the-storm",
    title: "After the storm",
    location: "Saipan",
    locationDetail: "Saipan, Northern Mariana Islands",
    year: "2026",
    dateTaken: "April 2026",
    description:
      "The mountains were still covered in low clouds after the weather passed.",
    collection: "Island weather",
    image: "https://picsum.photos/seed/after-the-storm/1400/1050",
  },
  {
    id: "harbor-light",
    title: "Harbor light",
    location: "Saipan",
    year: "2025",
    dateTaken: "November 2025",
    image: "https://picsum.photos/seed/harbor-light/1200/1600",
  },
  {
    id: "road-north",
    title: "Road north",
    location: "Northern Mariana Islands",
    year: "2025",
    dateTaken: "August 2025",
    image: "https://picsum.photos/seed/road-north/1600/1000",
  },
  {
    id: "kitchen-window",
    title: "Kitchen window",
    location: "Home",
    year: "2024",
    dateTaken: "December 2024",
    image: "https://picsum.photos/seed/kitchen-window/1200/1500",
  },
  {
    id: "morning-tide",
    title: "Morning tide",
    location: "Garapan",
    year: "2024",
    dateTaken: "June 2024",
    image: "https://picsum.photos/seed/morning-tide/1400/900",
  },
  {
    id: "late-ferry",
    title: "Late ferry",
    location: "Tinian",
    year: "2024",
    dateTaken: "March 2024",
    image: "https://picsum.photos/seed/late-ferry/1100/1500",
  },
  {
    id: "palm-shadow",
    title: "Palm shadow",
    location: "Saipan",
    year: "2023",
    dateTaken: "September 2023",
    image: "https://picsum.photos/seed/palm-shadow/1000/1400",
  },
  {
    id: "rain-on-tin",
    title: "Rain on tin",
    location: "Home",
    year: "2023",
    dateTaken: "July 2023",
    image: "https://picsum.photos/seed/rain-on-tin/1500/1000",
  },
  {
    id: "cliff-walk",
    title: "Cliff walk",
    location: "Banzai",
    year: "2023",
    dateTaken: "May 2023",
    image: "https://picsum.photos/seed/cliff-walk/1200/1700",
  },
  {
    id: "market-close",
    title: "Market close",
    location: "Chalan Kanoa",
    year: "2022",
    dateTaken: "October 2022",
    image: "https://picsum.photos/seed/market-close/1500/950",
  },
  {
    id: "blue-hour",
    title: "Blue hour",
    location: "Saipan",
    year: "2022",
    dateTaken: "February 2022",
    image: "https://picsum.photos/seed/blue-hour/1300/1300",
  },
  {
    id: "first-light",
    title: "First light",
    location: "Mount Tapochao",
    year: "2022",
    dateTaken: "January 2022",
    image: "https://picsum.photos/seed/first-light/1600/1100",
  },
];

export const BOOKS: BookItem[] = [
  {
    title: "The Creative Act",
    author: "Rick Rubin",
    status: "Read",
    cover: "https://picsum.photos/seed/creative-act/500/750",
  },
  {
    title: "The Design of Everyday Things",
    author: "Don Norman",
    status: "Currently reading",
    cover: "https://picsum.photos/seed/everyday-things/500/750",
  },
  {
    title: "Meditations",
    author: "Marcus Aurelius",
    status: "Want to read",
    cover: "https://picsum.photos/seed/meditations/500/750",
  },
  {
    title: "Working in Public",
    author: "Nadia Eghbal",
    status: "Read",
    cover: "https://picsum.photos/seed/working-in-public/500/750",
  },
  {
    title: "The Pragmatic Programmer",
    author: "Hunt & Thomas",
    status: "Read",
    cover: "https://picsum.photos/seed/pragmatic-programmer/500/750",
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    status: "Read",
    cover: "https://picsum.photos/seed/atomic-habits/500/750",
  },
  {
    title: "Deep Work",
    author: "Cal Newport",
    status: "Read",
    cover: "https://picsum.photos/seed/deep-work/500/750",
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    status: "Read",
    cover: "https://picsum.photos/seed/thinking-fast-slow/500/750",
  },
  {
    title: "The Mom Test",
    author: "Rob Fitzpatrick",
    status: "Read",
    cover: "https://picsum.photos/seed/mom-test/500/750",
  },
  {
    title: "Shape Up",
    author: "Ryan Singer",
    status: "Read",
    cover: "https://picsum.photos/seed/shape-up/500/750",
  },
  {
    title: "A Philosophy of Software Design",
    author: "John Ousterhout",
    status: "Want to read",
    cover: "https://picsum.photos/seed/philosophy-software/500/750",
  },
  {
    title: "The Almanack of Naval Ravikant",
    author: "Eric Jorgenson",
    status: "Read",
    cover: "https://picsum.photos/seed/naval-almanack/500/750",
  },
  {
    title: "Steal Like an Artist",
    author: "Austin Kleon",
    status: "Read",
    cover: "https://picsum.photos/seed/steal-like-artist/500/750",
  },
  {
    title: "Show Your Work!",
    author: "Austin Kleon",
    status: "Read",
    cover: "https://picsum.photos/seed/show-your-work/500/750",
  },
  {
    title: "The War of Art",
    author: "Steven Pressfield",
    status: "Read",
    cover: "https://picsum.photos/seed/war-of-art/500/750",
  },
  {
    title: "Bird by Bird",
    author: "Anne Lamott",
    status: "Want to read",
    cover: "https://picsum.photos/seed/bird-by-bird/500/750",
  },
  {
    title: "On Writing Well",
    author: "William Zinsser",
    status: "Read",
    cover: "https://picsum.photos/seed/on-writing-well/500/750",
  },
  {
    title: "The Elements of Style",
    author: "Strunk & White",
    status: "Read",
    cover: "https://picsum.photos/seed/elements-of-style/500/750",
  },
];

export const MOVIES: MovieItem[] = [
  {
    title: "Arrival",
    year: "2016",
    director: "Denis Villeneuve",
    status: "Watched",
    poster: "https://picsum.photos/seed/arrival/500/750",
  },
  {
    title: "Perfect Days",
    year: "2023",
    director: "Wim Wenders",
    status: "Currently watching",
    poster: "https://picsum.photos/seed/perfect-days/500/750",
  },
  {
    title: "In the Mood for Love",
    year: "2000",
    director: "Wong Kar-wai",
    status: "Watchlist",
    poster: "https://picsum.photos/seed/mood-for-love/500/750",
  },
  {
    title: "Blade Runner 2049",
    year: "2017",
    director: "Denis Villeneuve",
    status: "Watched",
    poster: "https://picsum.photos/seed/blade-runner/500/750",
  },
  {
    title: "Past Lives",
    year: "2023",
    director: "Celine Song",
    status: "Watched",
    poster: "https://picsum.photos/seed/past-lives/500/750",
  },
  {
    title: "Drive",
    year: "2011",
    director: "Nicolas Winding Refn",
    status: "Watched",
    poster: "https://picsum.photos/seed/drive/500/750",
  },
  {
    title: "Her",
    year: "2013",
    director: "Spike Jonze",
    status: "Watched",
    poster: "https://picsum.photos/seed/her-movie/500/750",
  },
  {
    title: "The Social Network",
    year: "2010",
    director: "David Fincher",
    status: "Watched",
    poster: "https://picsum.photos/seed/social-network/500/750",
  },
  {
    title: "Interstellar",
    year: "2014",
    director: "Christopher Nolan",
    status: "Watched",
    poster: "https://picsum.photos/seed/interstellar/500/750",
  },
  {
    title: "Moonlight",
    year: "2016",
    director: "Barry Jenkins",
    status: "Watched",
    poster: "https://picsum.photos/seed/moonlight/500/750",
  },
  {
    title: "The Tree of Life",
    year: "2011",
    director: "Terrence Malick",
    status: "Watchlist",
    poster: "https://picsum.photos/seed/tree-of-life/500/750",
  },
  {
    title: "Lost in Translation",
    year: "2003",
    director: "Sofia Coppola",
    status: "Watched",
    poster: "https://picsum.photos/seed/lost-in-translation/500/750",
  },
  {
    title: "Before Sunrise",
    year: "1995",
    director: "Richard Linklater",
    status: "Watched",
    poster: "https://picsum.photos/seed/before-sunrise/500/750",
  },
  {
    title: "Before Sunset",
    year: "2004",
    director: "Richard Linklater",
    status: "Watched",
    poster: "https://picsum.photos/seed/before-sunset/500/750",
  },
  {
    title: "Spirited Away",
    year: "2001",
    director: "Hayao Miyazaki",
    status: "Watched",
    poster: "https://picsum.photos/seed/spirited-away/500/750",
  },
  {
    title: "Children of Men",
    year: "2006",
    director: "Alfonso Cuarón",
    status: "Watched",
    poster: "https://picsum.photos/seed/children-of-men/500/750",
  },
  {
    title: "The Grand Budapest Hotel",
    year: "2014",
    director: "Wes Anderson",
    status: "Watched",
    poster: "https://picsum.photos/seed/grand-budapest/500/750",
  },
  {
    title: "Portrait of a Lady on Fire",
    year: "2019",
    director: "Céline Sciamma",
    status: "Watched",
    poster: "https://picsum.photos/seed/portrait-lady-fire/500/750",
  },
  {
    title: "Aftersun",
    year: "2022",
    director: "Charlotte Wells",
    status: "Watched",
    poster: "https://picsum.photos/seed/aftersun/500/750",
  },
  {
    title: "The Zone of Interest",
    year: "2023",
    director: "Jonathan Glazer",
    status: "Watched",
    poster: "https://picsum.photos/seed/zone-of-interest/500/750",
  },
  {
    title: "Dune: Part Two",
    year: "2024",
    director: "Denis Villeneuve",
    status: "Watched",
    poster: "https://picsum.photos/seed/dune-part-two/500/750",
  },
  {
    title: "Anatomy of a Fall",
    year: "2023",
    director: "Justine Triet",
    status: "Watched",
    poster: "https://picsum.photos/seed/anatomy-of-a-fall/500/750",
  },
  {
    title: "The Holdovers",
    year: "2023",
    director: "Alexander Payne",
    status: "Watched",
    poster: "https://picsum.photos/seed/holdovers/500/750",
  },
  {
    title: "Minari",
    year: "2020",
    director: "Lee Isaac Chung",
    status: "Watched",
    poster: "https://picsum.photos/seed/minari/500/750",
  },
];
