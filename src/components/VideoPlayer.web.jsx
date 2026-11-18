import { extractYouTubeId } from "../utils/youtubeHelper";

export default function VideoPlayer({ videoId, height = 220 }) {
  const id = extractYouTubeId(videoId);

  if (!id) return null;

  return (
    <iframe
      width="100%"
      height={height}
      src={`https://www.youtube.com/embed/${id}`}
      title="Contenido multimedia de MindHub"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      style={{
        border: "none",
        borderRadius: 16,
      }}
    />
  );
}
