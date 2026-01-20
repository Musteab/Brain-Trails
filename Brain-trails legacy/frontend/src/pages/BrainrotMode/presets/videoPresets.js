/**
 * Video Presets for Brainrot Mode
 * Curated selection of background videos
 */

export const VIDEO_PRESETS = {
  classic_brainrot: {
    id: 'classic_brainrot',
    name: 'Classic Brainrot',
    description: 'The OG focus content - Subway Surfers, Minecraft, etc.',
    emoji: '🧠',
    videos: [
      {
        id: 'subway-surfers',
        title: 'Subway Surfers Gameplay',
        youtubeId: 'WgkN9Z1DVLY',
        duration: '10+ hours',
      },
      {
        id: 'minecraft-parkour',
        title: 'Minecraft Parkour',
        youtubeId: 'n_Dv4JMiwK8',
        duration: '3 hours',
      },
      {
        id: 'satisfying-comp',
        title: 'Satisfying Compilation',
        youtubeId: 'ZM1fkHQP_Pw',
        duration: '1 hour',
      },
      {
        id: 'slime-asmr',
        title: 'Slime ASMR',
        youtubeId: '1JLUn2DFW4w',
        duration: '2 hours',
      },
    ],
  },
  gaming: {
    id: 'gaming',
    name: 'Gaming Content',
    description: 'Chill gaming footage for background',
    emoji: '🎮',
    videos: [
      {
        id: 'minecraft-building',
        title: 'Minecraft Peaceful Building',
        youtubeId: '9-9JPNLmT5s',
        duration: '4 hours',
      },
      {
        id: 'stardew-valley',
        title: 'Stardew Valley Gameplay',
        youtubeId: 'FjJx6u_5RdU',
        duration: '3 hours',
      },
      {
        id: 'animal-crossing',
        title: 'Animal Crossing Island Tour',
        youtubeId: 'auTi3stuL5M',
        duration: '2 hours',
      },
    ],
  },
  ambience: {
    id: 'ambience',
    name: 'ASMR & Ambience',
    description: 'Relaxing background sounds and visuals',
    emoji: '🌧️',
    videos: [
      {
        id: 'rain-ambience',
        title: 'Rain & Thunder',
        youtubeId: 'mPZkdNFkNps',
        duration: '8 hours',
      },
      {
        id: 'coffee-shop',
        title: 'Coffee Shop Ambience',
        youtubeId: 'h2zkV-l_TbY',
        duration: '3 hours',
      },
      {
        id: 'library-sounds',
        title: 'Library Ambience',
        youtubeId: '4d9H_1ygEv8',
        duration: '2 hours',
      },
      {
        id: 'fireplace',
        title: 'Cozy Fireplace',
        youtubeId: 'L_LUpnjgPso',
        duration: '10 hours',
      },
    ],
  },
  educational: {
    id: 'educational',
    name: 'Educational',
    description: 'Learn while you learn (muted)',
    emoji: '📚',
    videos: [
      {
        id: 'nature-doc',
        title: 'Nature Documentary',
        youtubeId: 'nlYlNF30bVg',
        duration: '4 hours',
      },
      {
        id: 'space-footage',
        title: 'Space & Stars',
        youtubeId: 'GoW8Tf7hTGA',
        duration: '2 hours',
      },
      {
        id: 'art-timelapse',
        title: 'Art Time-lapse',
        youtubeId: '0fEMJp70tGU',
        duration: '1 hour',
      },
    ],
  },
  satisfying: {
    id: 'satisfying',
    name: 'Satisfying',
    description: 'Oddly satisfying content',
    emoji: '✨',
    videos: [
      {
        id: 'pressure-washing',
        title: 'Pressure Washing',
        youtubeId: 'DbxJJmP-S5w',
        duration: '1 hour',
      },
      {
        id: 'restoration',
        title: 'Restoration Videos',
        youtubeId: 'bFN-KR4SoQQ',
        duration: '30 min',
      },
      {
        id: 'cooking',
        title: 'Cooking Compilation',
        youtubeId: 'egVGBKhBjgU',
        duration: '2 hours',
      },
    ],
  },
};

// Helper to get all videos as flat list
export function getAllVideos() {
  return Object.values(VIDEO_PRESETS).flatMap((category) =>
    category.videos.map((video) => ({
      ...video,
      category: category.id,
      categoryName: category.name,
    }))
  );
}

// Helper to get video by ID
export function getVideoById(videoId) {
  for (const category of Object.values(VIDEO_PRESETS)) {
    const video = category.videos.find((v) => v.id === videoId);
    if (video) {
      return { ...video, category: category.id };
    }
  }
  return null;
}

// Helper to get YouTube embed URL
export function getYouTubeEmbedUrl(youtubeId, options = {}) {
  const {
    autoplay = true,
    muted = true,
    loop = true,
    controls = false,
  } = options;

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: muted ? '1' : '0',
    loop: loop ? '1' : '0',
    controls: controls ? '1' : '0',
    playlist: youtubeId, // Required for looping
    modestbranding: '1',
    rel: '0',
  });

  return `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
}

// Get YouTube thumbnail URL
export function getYouTubeThumbnail(youtubeId, quality = 'hqdefault') {
  return `https://img.youtube.com/vi/${youtubeId}/${quality}.jpg`;
}

export default VIDEO_PRESETS;
