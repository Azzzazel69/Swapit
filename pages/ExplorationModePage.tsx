
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { api } from '../services/api.ts';
import { useAuth } from '../hooks/useAuth.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { useToast } from '../hooks/useToast.tsx';
import { useNavigate, Link } from 'react-router-dom';
import SwapSpinner from '../components/SwapSpinner.tsx';
import Button from '../components/Button.tsx';
import confetti from 'canvas-confetti';

const ExplorationModePage = () => {
    const { user } = useAuth();
    const { theme } = useColorTheme();
    const { showToast } = useToast();
    const navigate = useNavigate();
    
    const [items, setItems] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showTutorial, setShowTutorial] = useState(false);
    const [matchData, setMatchData] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
    
    // Feedback colors
    const likeOpacity = useTransform(x, [50, 150], [0, 1]);
    const dislikeOpacity = useTransform(x, [-50, -150], [0, 1]);

    const playSound = (type: 'swipe' | 'match') => {
        try {
            const audio = new Audio();
            if (type === 'swipe') {
                audio.src = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'; // Short pop/swipe
            } else {
                audio.src = 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'; // Success/Match
            }
            audio.volume = 0.4;
            audio.play().catch(() => {}); // Ignore errors if browser blocks autoplay
        } catch (e) {}
    };

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setLoading(true);
                const fetched = await api.getExplorationItems();
                setItems(fetched);
                
                const hasSeenTutorial = localStorage.getItem('swapit_exploration_tutorial');
                if (!hasSeenTutorial) {
                    setShowTutorial(true);
                }
            } catch (err) {
                showToast("Error al cargar artículos", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    const handleSwipe = async (type: 'LIKE' | 'DISLIKE') => {
        if (currentIndex >= items.length) return;
        
        playSound('swipe');
        const currentItem = items[currentIndex];
        try {
            const result = await api.swipeItem(currentItem.id, type);
            if (result.isMatch) {
                playSound('match');
                setMatchData({ ...result, item: currentItem });
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
            x.set(0); // Reset x for next card
            setCurrentImageIndex(0); // Reset image index for next card
            setCurrentIndex(prev => prev + 1);
        } catch (err) {
            showToast("Error al procesar acción", "error");
        }
    };

    const closeTutorial = () => {
        setShowTutorial(false);
        localStorage.setItem('swapit_exploration_tutorial', 'true');
    };

    if (loading) return <div className="flex justify-center items-center h-96"><SwapSpinner /></div>;

    if (currentIndex >= items.length) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6">
                <div className="text-6xl mb-4">🌍</div>
                <h2 className="text-2xl font-black mb-2">¡Has explorado todo por ahora!</h2>
                <p className="text-gray-500 mb-6">Vuelve más tarde para descubrir nuevos artículos en tu zona.</p>
                <Button onClick={() => navigate('/')}>Volver al Inicio</Button>
            </div>
        );
    }

    const currentItem = items[currentIndex];

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentImageIndex < currentItem.imageUrls.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
        }
    };

    return (
        <div className="relative max-w-lg mx-auto h-[85vh] flex flex-col pt-2">
            <AnimatePresence>
                {showTutorial && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-white text-center rounded-3xl"
                    >
                        <div className="text-5xl mb-6">✨</div>
                        <h2 className="text-3xl font-black mb-4">Modo Exploración</h2>
                        <div className="space-y-6 mb-8 text-lg">
                            <p className="flex items-center gap-3 justify-center">
                                <span className="p-2 bg-red-500 rounded-full">⬅️</span>
                                Desliza a la izquierda si no te interesa
                            </p>
                            <p className="flex items-center gap-3 justify-center">
                                <span className="p-2 bg-green-500 rounded-full">➡️</span>
                                Desliza a la derecha si te gusta
                            </p>
                            <p className="text-orange-400 font-bold">¡Si ambos os gustáis, habrá MATCH!</p>
                        </div>
                        <Button onClick={closeTutorial} className="w-full">¡Entendido!</Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {matchData && (
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-0 z-40 bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-8 text-center rounded-3xl shadow-2xl border-4 border-orange-500"
                    >
                        <div className="text-7xl mb-4 animate-bounce">❤️</div>
                        <h2 className="text-4xl font-black mb-2 text-orange-500">¡ES UN MATCH!</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            A <strong>{matchData.item.ownerName}</strong> también le interesa uno de tus artículos.
                        </p>
                        <div className="flex gap-4 mb-8">
                            <img src={matchData.item.imageUrls[0]} className="w-24 h-24 rounded-xl object-cover shadow-md" />
                            <div className="flex items-center text-2xl">↔️</div>
                            <img src={matchData.matchedItem.imageUrls[0]} className="w-24 h-24 rounded-xl object-cover shadow-md" />
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                            <Button onClick={() => navigate(`/chat/${matchData.exchangeId}`)}>Hablar ahora</Button>
                            <Button variant="secondary" onClick={() => setMatchData(null)}>Seguir explorando</Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Card Stack */}
            <div className="relative flex-grow perspective-1000">
                <motion.div
                    key={currentItem.id}
                    style={{ x, rotate }}
                    drag="x"
                    dragConstraints={{ left: -1000, right: 1000 }}
                    dragElastic={0.7}
                    onDragEnd={(_, info) => {
                        if (info.offset.x > 150) handleSwipe('LIKE');
                        else if (info.offset.x < -150) handleSwipe('DISLIKE');
                        else x.set(0);
                    }}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ x: x.get() > 0 ? 1000 : -1000, opacity: 0, transition: { duration: 0.3 } }}
                    className="absolute inset-0 bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 cursor-grab active:cursor-grabbing"
                >
                    {/* Visual Feedback Overlays */}
                    <motion.div 
                        style={{ opacity: likeOpacity }}
                        className="absolute inset-0 bg-green-500/40 z-30 pointer-events-none flex items-center justify-center"
                    >
                        <div className="border-4 border-green-500 text-green-500 font-black text-4xl px-6 py-2 rounded-xl rotate-[-20deg] uppercase bg-white/10 backdrop-blur-sm">
                            ¡Me gusta!
                        </div>
                    </motion.div>
                    <motion.div 
                        style={{ opacity: dislikeOpacity }}
                        className="absolute inset-0 bg-red-500/40 z-30 pointer-events-none flex items-center justify-center"
                    >
                        <div className="border-4 border-red-500 text-red-500 font-black text-4xl px-6 py-2 rounded-xl rotate-[20deg] uppercase bg-white/10 backdrop-blur-sm">
                            Pasar
                        </div>
                    </motion.div>

                    {/* Image and Overlays */}
                    <div className="relative w-full h-full">
                        <img 
                            src={currentItem.imageUrls[currentImageIndex]} 
                            className="w-full h-full object-cover select-none pointer-events-none" 
                        />
                        
                        {/* Image Navigation Taps */}
                        <div className="absolute inset-0 flex z-20">
                            <div className="w-1/2 h-full cursor-pointer" onClick={prevImage} />
                            <div className="w-1/2 h-full cursor-pointer" onClick={nextImage} />
                        </div>

                        {/* Progress Indicators (Dashes) */}
                        {currentItem.imageUrls.length > 1 && (
                            <div className="absolute top-3 left-0 right-0 px-4 flex gap-1.5 z-30">
                                {currentItem.imageUrls.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`h-1 flex-grow rounded-full transition-all ${idx === currentImageIndex ? 'bg-white' : 'bg-white/30'}`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Information Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-10" />
                        
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
                            <div className="flex items-center gap-2 mb-3">
                                <img src={currentItem.ownerAvatarUrl} className="w-10 h-10 rounded-full border-2 border-white/50" />
                                <div>
                                    <span className="font-black text-base block leading-tight">{currentItem.ownerName}</span>
                                    <span className="text-xs opacity-80 flex items-center gap-1">
                                        <span>📍</span> {currentItem.ownerLocation.city}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-3xl font-black mb-2 tracking-tight">{currentItem.title}</h3>
                            
                            <p className="text-gray-200 text-sm line-clamp-2 mb-4 max-w-[90%]">
                                {currentItem.description}
                            </p>

                            <div className="flex justify-between items-end">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black uppercase text-orange-400 bg-orange-500/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-orange-500/30 inline-block w-fit">
                                        Busco: {currentItem.wishedItem || 'Cualquier cosa'}
                                    </span>
                                </div>
                                <Link 
                                    to={`/item/${currentItem.id}`} 
                                    className="pointer-events-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/20 transition-all"
                                >
                                    Ver más
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-8 py-8">
                <button 
                    onClick={() => handleSwipe('DISLIKE')}
                    className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-xl flex items-center justify-center text-red-500 border border-gray-100 dark:border-gray-700 hover:scale-110 active:scale-90 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <button 
                    onClick={() => handleSwipe('LIKE')}
                    className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-xl flex items-center justify-center text-green-500 border border-gray-100 dark:border-gray-700 hover:scale-110 active:scale-90 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ExplorationModePage;
