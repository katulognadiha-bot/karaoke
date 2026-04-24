export const searchYoutube = async (query) => {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("YouTube API Key missing!");
    return [];
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${encodeURIComponent(
        query + " karaoke"
      )}&type=video&key=${apiKey}`
    );
    const data = await response.json();

    if (data.error) {
      console.error("YouTube API Error:", data.error.message);
      return [];
    }

    return data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channel: item.snippet.channelTitle,
    }));
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
};
