import { Candidate } from '@/lib/types';
import { useState } from 'react';
import { Share2 } from 'lucide-react';

interface ResultsViewProps {
    candidates: Candidate[];
}

export default function ResultsView({ candidates }: ResultsViewProps) {
    const [leadGenChecked, setLeadGenChecked] = useState(false);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Tus Resultados</h2>
                <p className="text-slate-500">Basado en tus respuestas, estos son los perfiles más afines.</p>
            </div>

            <div id="results-capture" className="grid gap-6 md:grid-cols-1">
                {candidates.map((candidate, idx) => (
                    <div
                        key={idx}
                        className="group relative bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-violet-100"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {/* Placeholder or Image */}
                                <span className="text-2xl font-bold text-slate-300">{candidate.name[0]}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-slate-900">{candidate.name}</h3>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                                        {candidate.affinity}% Afín
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                    {candidate.summary}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                            <button className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors">
                                Ver detalles →
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        className="mt-1 w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                        checked={leadGenChecked}
                        onChange={(e) => setLeadGenChecked(e.target.checked)}
                    />
                    <span className="text-sm text-slate-600">
                        Me gustaría recibir información verificada sobre estos candidatos via WhatsApp.
                        <span className="block text-slate-400 text-xs mt-1">(Opcional. Respetamos tu privacidad)</span>
                    </span>
                </label>
            </div>

            <div className="flex justify-center pt-4">
                <button
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
                    onClick={() => alert('¡Captura esta pantalla y compártela!')}
                >
                    <Share2 size={16} />
                    Compartir Resumen
                </button>
            </div>
        </div>
    );
}
