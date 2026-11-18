import YoutubePlayer from "react-native-youtube-iframe";

import { extractYouTubeId } from "../utils/youtubeHelper";

export default function VideoPlayer({ videoId, height = 220 }) {
  const id = extractYouTubeId(videoId);

  if (!id) return null;

  return <YoutubePlayer height={height} play={false} videoId={id} />;
}
