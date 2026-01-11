
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, FeedPost } from '../types';
import { Heart, MessageCircle, Share2, Play, Bookmark, Loader2 } from 'lucide-react';
import OptimizedImage, { triggerHaptic } from '../utils/performance';

// Base mock data for procedural generation
const AVATAR_SEEDS = ['Val', 'Mike', 'Pro', 'Sara', 'Leo', 'Nina', 'Tom', 'Alex', 'David', 'Eva'];
const TOPICS = ['#Slang', '#Idioms', '#Grammar', '#Culture', '#Pronunciation', '#Vocab'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const CONTENT_IMAGES = [
    'https://images.unsplash.com/photo-1528605105345-5344ea20e269?q=80&w=1000',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&q=80',
    'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1000&q=80',
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1000&q=80',
    'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=1000&q=80',
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1000&q=80',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1000&q=80',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&q=80'
];
const TEXTS = [
    'When we say "Parce" in Medellín, it means friend! 🇨🇴',
    'Idiom of the day: "Hit the books" = To study hard! 📚',
    'Stop saying "Comfortable" wrong! Say: "Comf-ter-bul".',
    'Learn how to order coffee like a local in Bogota. ☕️',
    'The difference between "Ser" and "Estar" finally explained!',
    'POV: You are trying to understand Chilean accents. 😅',
    '3 words you need to know for business meetings.',
    'Why you should never say "Estoy caliente" when you are hot!',
];

const generatePost = (id: number): FeedPost => {
    const seed = AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)];
    return {
        id: `post_${id}`,
        author: `${seed}_${Math.floor(Math.random() * 100)}`,
        authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
        type: 'video',
        likes: Math.floor(Math.random() * 5000) + 100,
        topicTag: TOPICS[Math.floor(Math.random() * TOPICS.length)],
        difficulty: DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)] as any,
        text: TEXTS[Math.floor(Math.random() * TEXTS.length)],
        contentUrl: CONTENT_IMAGES[Math.floor(Math.random() * CONTENT_IMAGES.length)]
    };
};

const SimulatedVideo = ({ src, isActive }: { src: string, isActive: boolean }) => {
    // Uses Ken Burns effect to simulate motion on static images
    return (
        <div className="absolute inset-0 bg-black overflow-hidden">
            <motion.div
                animate={isActive ? { scale: [1, 1.2], x: [0, -20] } : { scale: 1, x: 0 }}
                transition={{ duration: 15, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                className="w-full h-full"
            >
                <img src={src} className="w-full h-full object-cover opacity-80" alt="Video Content" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
            
            {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
                        <Play fill="white" size={32} className="ml-2"/>
                    </div>
                </div>
            )}
        </div>
    );
};

const SocialFeed: React.FC<{ lang: Language }> = ({ lang }) => {
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        const initialPosts = Array.from({ length: 5 }, (_, i) => generatePost(i));
        setPosts(initialPosts);
        setActiveId(initialPosts[0].id);
    }, []);

    const loadMorePosts = useCallback(() => {
        if (loading) return;
        setLoading(true);
        // Simulate network delay
        setTimeout(() => {
            const currentCount = posts.length;
            const newPosts = Array.from({ length: 5 }, (_, i) => generatePost(currentCount + i));
            setPosts(prev => [...prev, ...newPosts]);
            setLoading(false);
        }, 800);
    }, [posts.length, loading]);

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    loadMorePosts();
                }
            },
            { threshold: 0.5 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) observer.unobserve(observerTarget.current);
        };
    }, [loadMorePosts]);

    const toggleLike = (id: string) => {
        triggerHaptic('medium');
        const newSet = new Set(likedPosts);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setLikedPosts(newSet);
    };

    return (
        <div className="h-full w-full bg-black md:rounded-[40px] overflow-hidden border border-white/10 shadow-2xl relative">
            <div className="absolute top-6 left-0 right-0 z-30 flex justify-center pointer-events-none">
                <div className="flex gap-4 text-sm font-bold drop-shadow-md">
                    <span className="text-white/60">Following</span>
                    <span className="text-white relative">
                        For You
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full"/>
                    </span>
                </div>
            </div>

            <div className="h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
                {posts.map((post) => (
                    <div 
                        key={post.id} 
                        className="h-full w-full snap-start relative flex items-center justify-center bg-slate-900 border-b border-white/5"
                        onMouseEnter={() => setActiveId(post.id)} // Desktop fallback
                        onClick={() => setActiveId(post.id)} // Mobile fallback
                        onTouchEnd={() => setActiveId(post.id)}
                    >
                        <SimulatedVideo src={post.contentUrl || ''} isActive={activeId === post.id} />

                        {/* Right Sidebar Actions */}
                        <div className="absolute right-2 bottom-24 flex flex-col gap-6 z-30 items-center">
                            <div className="relative mb-2">
                                <img src={post.authorAvatar} className="w-12 h-12 rounded-full border-2 border-white" />
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">+</div>
                            </div>

                            <button onClick={() => toggleLike(post.id)} className="flex flex-col items-center gap-1 group">
                                <div className="p-2">
                                    <Heart 
                                        fill={likedPosts.has(post.id) ? "#ef4444" : "rgba(0,0,0,0.5)"} 
                                        color={likedPosts.has(post.id) ? "#ef4444" : "white"} 
                                        size={32} 
                                        className={`drop-shadow-lg ${likedPosts.has(post.id) ? "scale-110" : ""}`} 
                                    />
                                </div>
                                <span className="text-xs font-bold text-white shadow-black drop-shadow-md">{post.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
                            </button>

                            <button className="flex flex-col items-center gap-1">
                                <MessageCircle size={32} fill="white" className="text-white drop-shadow-lg opacity-90"/>
                                <span className="text-xs font-bold text-white shadow-black drop-shadow-md">42</span>
                            </button>

                            <button className="flex flex-col items-center gap-1">
                                <Bookmark size={32} fill="white" className="text-white drop-shadow-lg opacity-90"/>
                                <span className="text-xs font-bold text-white shadow-black drop-shadow-md">Save</span>
                            </button>

                            <button className="flex flex-col items-center gap-1">
                                <Share2 size={32} className="text-white drop-shadow-lg opacity-90"/>
                                <span className="text-xs font-bold text-white shadow-black drop-shadow-md">Share</span>
                            </button>
                        </div>

                        {/* Content Info */}
                        <div className="absolute bottom-0 left-0 right-16 p-4 pb-8 z-20 space-y-3 bg-gradient-to-t from-black/80 to-transparent pt-20 pointer-events-none">
                            <div className="flex items-center gap-2">
                                <span className="text-white font-black text-sm drop-shadow-md">@{post.author}</span>
                                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase">{post.difficulty}</span>
                            </div>
                            <p className="text-white text-sm font-medium leading-snug drop-shadow-md">{post.text}</p>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center text-[8px]">🎵</div>
                                <span className="text-xs text-white/90">Original Audio - {post.author}</span>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Loader Sentinel */}
                <div ref={observerTarget} className="h-20 w-full flex items-center justify-center bg-black">
                    {loading && <Loader2 className="animate-spin text-white" size={32} />}
                </div>
            </div>
        </div>
    );
};

export default SocialFeed;
