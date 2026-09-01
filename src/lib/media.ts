export type MediaVideo = {
  id: string;
  title: {
    es: string;
    en: string;
  };
  description: {
    es: string;
    en: string;
  };
  category: string;
  videoUrl: string;
  thumbnail?: string;
  featuredOnHome: boolean;
};

export const mediaVideos: MediaVideo[] = [
  {
    id: "orangeball-platform-preview",
    title: {
      es: "Orangeball Dreams Platform Preview",
      en: "Orangeball Dreams Platform Preview",
    },
    description: {
      es: "Una primera mirada a la plataforma Orangeball Dreams, creada para dar más visibilidad a atletas, entrenadores y oportunidades internacionales.",
      en: "A first look at the Orangeball Dreams platform, created to give more visibility to athletes, coaches and international opportunities.",
    },
    category: "Platform",
    videoUrl: "https://www.youtube.com/embed/VIDEO_ID_AQUI",
    thumbnail: "/images/media/platform-preview.webp",
    featuredOnHome: true,
  },
  {
    id: "athlete-representation",
    title: {
      es: "Athlete Representation",
      en: "Athlete Representation",
    },
    description: {
      es: "Contenido dedicado al acompañamiento de atletas, exposición internacional y construcción de carrera.",
      en: "Content focused on athlete support, international exposure and career development.",
    },
    category: "Agency",
    videoUrl: "https://www.youtube.com/embed/VIDEO_ID_AQUI",
    thumbnail: "/images/media/athlete-representation.webp",
    featuredOnHome: true,
  },
  {
    id: "player-visibility",
    title: {
      es: "Player Visibility",
      en: "Player Visibility",
    },
    description: {
      es: "Vídeos, perfiles y contenido digital pensados para aumentar la exposición de jugadores y entrenadores.",
      en: "Videos, profiles and digital content designed to increase exposure for players and coaches.",
    },
    category: "Scouting",
    videoUrl: "https://www.youtube.com/embed/VIDEO_ID_AQUI",
    thumbnail: "/images/media/player-visibility.webp",
    featuredOnHome: true,
  },
];
