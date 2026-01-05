import { Candidate } from '@/lib/types';
import { useState } from 'react';
import { Share2, ArrowRight, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import InfiniteGrid from '@/components/ui/infinite-grid-integration';
import { motion } from 'framer-motion';

interface ResultsViewProps {
    candidates: Candidate[];
    selectedTopics: string[];
}

export default function ResultsView({ candidates, selectedTopics }: ResultsViewProps) {
    const [leadGenChecked, setLeadGenChecked] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        if (!candidates.length) return;

        setIsSharing(true);
        const topCandidate = [...candidates].sort((a, b) => b.affinity - a.affinity)[0];

        // Construct OG Image URL
        const ogUrl = new URL('/api/og', window.location.origin);
        ogUrl.searchParams.set('name', topCandidate.name);
        ogUrl.searchParams.set('affinity', topCandidate.affinity.toString());
        ogUrl.searchParams.set('party', topCandidate.party || '');
        ogUrl.searchParams.set('topics', selectedTopics.join(','));

        try {
            // Check if Web Share API is available for files
            const response = await fetch(ogUrl.toString());
            const blob = await response.blob();
            const file = new File([blob], 'tarjeton-electoral.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Mi Perfil Electoral - porquienvotar.co',
                    text: `He descubierto que mi candidato ideal es ${topCandidate.name}. ¡Descubre el tuyo en https://porquienvotar.co!`,
                });
            } else {
                // Fallback: Copy Link
                await navigator.clipboard.writeText(window.location.href);
                alert('¡Enlace copiado! Comparte tu resultado con tus amigos.');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            alert('No pudimos generar la imagen para compartir. Intenta capturando pantalla.');
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="relative w-full h-[100dvh] bg-bg-0 text-text-100 font-sans transition-colors duration-300 overflow-hidden flex flex-col">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <InfiniteGrid />
            </div>

            {/* Header */}
            <div className="fixed top-0 left-0 w-full p-4 z-[50] bg-bg-0/80 backdrop-blur">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="font-semibold tracking-tight text-2xl text-text-100">
                            porquien<span className="bg-gradient-to-r from-[#FF3B30] via-[#FF9500] via-[#28CD41] to-[#007AFF] bg-clip-text text-transparent">votar</span>.co
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full flex-1 flex flex-col overflow-y-auto no-scrollbar pt-24 pb-12">
                <div className="max-w-3xl mx-auto w-full px-6 space-y-12">

                    {/* Hero Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4"
                    >
                        <h1 className="text-4xl md:text-6xl font-serif font-medium tracking-tight">
                            Tus <span className="bg-gradient-to-r from-[#FF3B30] via-[#FF9500] via-[#28CD41] to-[#007AFF] bg-clip-text text-transparent italic">Resultados</span>
                        </h1>
                        <p className="text-lg text-text-300 font-light max-w-lg mx-auto leading-relaxed">
                            Basado en nuestro análisis, estos son los perfiles que mejor resuena con tus preocupaciones.
                        </p>
                    </motion.div>

                    {/* Candidates Grid */}
                    <div id="results-capture" className="space-y-6">
                        {candidates.sort((a, b) => b.affinity - a.affinity).map((candidate, idx) => (
                            <motion.div
                                key={candidate.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * (idx + 1) }}
                                className="group relative bg-bg-100/40 backdrop-blur-md border border-bg-300/40 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.01] overflow-hidden"
                            >
                                {/* Affinity Badge - Multicolor */}
                                <div className="absolute top-4 right-4 bg-bg-0 border border-bg-200 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                    <span className="bg-gradient-to-r from-[#FF3B30] via-[#FF9500] via-[#28CD41] to-[#007AFF] bg-clip-text text-transparent">
                                        {candidate.affinity}% Afín
                                    </span>
                                </div>

                                <div className="flex flex-col md:flex-row items-start gap-6 pt-2">
                                    <div className="w-20 h-20 rounded-2xl bg-bg-200 border border-bg-300 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
                                        {candidate.imageUrl ? (
                                            <img src={candidate.imageUrl} alt={candidate.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-3xl font-bold text-text-400">{candidate.name[0]}</span>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <div>
                                            <h3 className="text-2xl font-serif font-semibold text-text-100">{candidate.name}</h3>
                                            <p className="text-sm font-medium text-text-400">{candidate.party}</p>
                                        </div>
                                        <p className="text-[16px] text-text-200 font-light leading-relaxed">
                                            {candidate.summary}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-bg-200/50 flex justify-end">
                                    <button className="flex items-center gap-2 text-sm font-medium text-text-300 hover:text-text-100 transition-colors group-hover:translate-x-1 duration-300">
                                        Conocer propuestas <ArrowRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Lead Gen Box - Glass style */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white/30 backdrop-blur-xl rounded-3xl p-6 border border-bg-300/50 shadow-sm"
                    >
                        <label className="flex items-start gap-4 cursor-pointer group">
                            <div className="relative flex items-center pt-1">
                                <input
                                    type="checkbox"
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-bg-300 transition-all checked:bg-[#1877F2] checked:border-[#1877F2]"
                                    checked={leadGenChecked}
                                    onChange={(e) => setLeadGenChecked(e.target.checked)}
                                />
                                <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                </span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[15px] text-text-100 font-medium group-hover:text-black transition-colors">
                                    Me gustaría recibir información verificada sobre estos candidatos via WhatsApp o email.
                                </span>
                                <span className="block text-text-400 text-xs">
                                    Respetamos tu privacidad. Solo contenido sobre tus candidatos ideales.
                                </span>
                            </div>
                        </label>
                    </motion.div>

                    {/* Viral Share Button */}
                    <div className="flex flex-col items-center gap-4 pb-12">
                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className={clsx(
                                "group relative w-full py-5 rounded-2xl font-bold text-xl transition-all duration-300 shadow-xl overflow-hidden",
                                "bg-gradient-to-r from-[#FF3B30] via-[#FF9500] via-[#28CD41] to-[#007AFF] text-white",
                                "hover:scale-[1.02] active:scale-95 disabled:grayscale disabled:opacity-50"
                            )}
                        >
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                {isSharing ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        <span>Generando tu tarjetón...</span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 />
                                        <span>Compartir mi Tarjetón</span>
                                    </>
                                )}
                            </div>
                        </button>
                        <p className="text-text-400 text-sm">Crea una historia para WhatsApp o Instagram ✨</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
