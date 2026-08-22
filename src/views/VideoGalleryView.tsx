import React, { useState, useEffect } from 'react';
import { VideoItem, VideoCategory } from '../types/ysp';
import { getVideosFromFirestore } from '../lib/firebaseVideo';
import { VideoPlayer, isYouTubeUrl, getYouTubeVideoId } from '../components/VideoPlayer';
import { 
  Film, 
  Play, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  X, 
  Share2, 
  Landmark,
  Sparkles,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

const CATEGORIES: string[] = [
  'ALL',
  'Parliamentary Sessions',
  'Youth Senate Events',
  'Seminars',
  'Conferences',
  'Training Sessions',
  'District Activities',
  'Media Coverage',
  'Official Messages'
];

export const VideoGalleryView: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected Video for Player Modal
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  const loadPublishedVideos = async () => {
    setLoading(true);
    try {
      const allVideos = await getVideosFromFirestore();
      // Filter published only for public gallery
      const published = allVideos.filter(v => v.status === 'published');
      setVideos(published);
    } catch (e) {
      console.warn('Failed to load published videos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublishedVideos();
  }, []);

  const filteredVideos = videos.filter(vid => {
    const matchesCategory = selectedCategory === 'ALL' || vid.category === selectedCategory;
    const matchesSearch = 
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 bg-slate-50 text-slate-900">
      
      {/* Official Video Gallery Banner */}
      <div className="bg-emerald-950 text-white rounded-3xl p-8 md:p-10 border-b-4 border-amber-500 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs uppercase tracking-widest rounded-full flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-amber-400" />
              Parliamentary Archives
            </span>
            <span className="px-3 py-1 bg-emerald-900/80 text-emerald-200 border border-emerald-700/60 font-bold text-xs uppercase rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Master Recordings Preserved
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Official Video Gallery & Assembly Proceedings
          </h1>
          <p className="text-xs md:text-sm text-emerald-100/90 leading-relaxed">
            Watch authentic video recordings of Youth Senate of Pakistan parliamentary sessions, youth leadership conventions, policy debates, and national speeches.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, topic, or speaker..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs font-bold text-slate-500">
            Showing <span className="text-amber-600 font-extrabold">{filteredVideos.length}</span> recorded sessions
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-emerald-950 shadow-md font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Videos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Video Gallery Grid */}
      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading master video gallery records...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm">
          <Film className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Videos Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are currently no published videos matching your selected filter or search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map(vid => (
            <div
              key={vid.id}
              onClick={() => setActiveVideo(vid)}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Thumbnail / Player Preview Header */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden">
                  {vid.thumbnailUrl ? (
                    <img 
                      src={vid.thumbnailUrl} 
                      alt={vid.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : isYouTubeUrl(vid.videoUrl) ? (
                    <img
                      src={`https://img.youtube.com/vi/${getYouTubeVideoId(vid.videoUrl)}/hqdefault.jpg`}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <video src={vid.videoUrl} className="w-full h-full object-cover" />
                  )}

                  {/* Play Overlay Button */}
                  <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 flex items-center justify-center transition-colors">
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-emerald-950 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </div>
                  </div>

                  {/* Category Pill Badge */}
                  <span className="absolute top-3 left-3 bg-emerald-950/90 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-500/30 backdrop-blur-sm shadow">
                    {vid.category}
                  </span>

                  {/* Duration Badge */}
                  {vid.duration && (
                    <span className="absolute bottom-3 right-3 bg-black/80 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                      {vid.duration}
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center text-[10px] font-bold text-slate-400 gap-1">
                    <Calendar className="w-3 h-3 text-amber-500" />
                    <span>Published: {new Date(vid.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                    {vid.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {vid.description || 'Watch the original video recording of this parliamentary proceeding.'}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-800 group-hover:text-amber-600">
                <span>Watch Full Session</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL VIDEO PLAYER MODAL */}
      {activeVideo && (
        <div 
          className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-3 md:p-6 overflow-y-auto"
          onClick={() => setActiveVideo(null)}
        >
          <div 
            className="max-w-5xl w-full bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 my-auto relative space-y-0"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500 text-emerald-950 font-black text-[10px] uppercase rounded-full">
                  {activeVideo.category}
                </span>
                <span className="text-xs font-bold text-slate-300 hidden sm:inline">
                  Youth Senate Official Video Archives
                </span>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full transition-colors"
                title="Close Player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Box */}
            <div className="aspect-video bg-black w-full relative">
              <VideoPlayer
                videoUrl={activeVideo.videoUrl}
                autoPlay
                className="w-full h-full object-contain"
                title={activeVideo.title}
              />
            </div>

            {/* Video Details & Related Videos Grid */}
            <div className="p-6 space-y-6 max-h-80 overflow-y-auto">
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    Original Master Recording
                  </span>
                  <span>Uploaded on {new Date(activeVideo.createdAt).toLocaleDateString()}</span>
                </div>
                <h2 className="text-xl font-extrabold text-white leading-snug">
                  {activeVideo.title}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeVideo.description || 'Full recorded video of Youth Senate assembly proceedings and leadership speeches.'}
                </p>
              </div>

              {/* Related Videos List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  More Assembly & Event Recordings
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {videos
                    .filter(v => v.id !== activeVideo.id)
                    .slice(0, 3)
                    .map(rel => (
                      <div
                        key={rel.id}
                        onClick={() => setActiveVideo(rel)}
                        className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-amber-500/60 cursor-pointer flex gap-3 items-center group transition-colors"
                      >
                        <div className="relative w-20 h-14 bg-black rounded-lg overflow-hidden shrink-0">
                          {rel.thumbnailUrl ? (
                            <img src={rel.thumbnailUrl} alt={rel.title} className="w-full h-full object-cover" />
                          ) : isYouTubeUrl(rel.videoUrl) ? (
                            <img
                              src={`https://img.youtube.com/vi/${getYouTubeVideoId(rel.videoUrl)}/hqdefault.jpg`}
                              alt={rel.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video src={rel.videoUrl} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play className="w-4 h-4 text-amber-400 fill-current" />
                          </div>
                        </div>
                        <div className="space-y-0.5 truncate">
                          <span className="text-[9px] font-bold text-amber-400 uppercase block">{rel.category}</span>
                          <h5 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">{rel.title}</h5>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
