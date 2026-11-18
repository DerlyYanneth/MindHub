export const extractYouTubeId = (value) => {
  if (!value) return "";

  const input = String(value).trim();

  if (!input) return "";

  // Si ya es un ID de YouTube
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
};

export const getYouTubeThumbnail = (value) => {
  const id = extractYouTubeId(value);

  if (!id) {
    return "https://placehold.co/600x400/png?text=MindHub";
  }

  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
};

export const getYouTubeUrl = (value) => {
  const id = extractYouTubeId(value);

  if (!id) return "";

  return `https://www.youtube.com/watch?v=${id}`;
};

export const isYouTubeUrl = (value) => {
  if (!value) return false;

  return value.includes("youtube.com") || value.includes("youtu.be");
};
