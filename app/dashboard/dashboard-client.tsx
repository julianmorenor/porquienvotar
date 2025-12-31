"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { AnalyticsLog } from '@/lib/types';
import { Users, AlertTriangle, TrendingUp, Lock } from 'lucide-react';

interface DashboardProps {
    data: AnalyticsLog[];
    stats: {
        totalConversations: number;
        topConcern: string;
        topCandidate: string;
    };
    chartData: {
        concerns: { name: string; value: number }[];
        candidates: { name: string; value: number }[];
    };
}

const COLORS = ['#7C3AED', '#A78BFA', '#4F46E5', '#818CF8'];

export default function DashboardClient({ data, stats, chartData }: DashboardProps) {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Citizen Pulse Dashboard</h1>
                <p className="text-slate-500">Analítica en tiempo real de intenciones de voto y preocupaciones ciudadanas.</p>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Conversaciones</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalConversations}</h3>
                        </div>
                        <div className="p-3 bg-violet-50 text-violet-600 rounded-lg">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-600">
                        <TrendingUp size={16} className="mr-1" />
                        <span className="font-medium">+12%</span>
                        <span className="text-slate-400 ml-1">vs ayer</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Top Preocupación</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-2 truncate">{stats.topConcern}</h3>
                        </div>
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-500">Detectada en 45% de sesiones</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Top Candidato</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats.topCandidate}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Lock size={24} />
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-500">Recomendado más frecuentemente</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart: Dolores Ciudadanos */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[400px]">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Mapa de Dolores Ciudadanos</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.concerns}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#F8FAFC' }}
                                />
                                <Bar dataKey="value" fill="#7C3AED" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart: Candidate Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[400px]">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Distribución de Sugerencias</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.candidates}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.candidates.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Sentiment Matrix / Raw Logs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">Registro de Intenciones Recientes</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                            <tr>
                                <th className="px-6 py-3">Timestamp</th>
                                <th className="px-6 py-3">Ubicación</th>
                                <th className="px-6 py-3">Candidato Ganador</th>
                                <th className="px-6 py-3">Preocupaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.slice(0, 5).map((log, i) => (
                                <tr key={i} className="bg-white border-b border-slate-50 hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {new Date(log.timestamp as any).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{log.user_location}</td>
                                    <td className="px-6 py-4 text-violet-600 font-medium">{log.winning_candidate}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {log.user_intents?.map((intent, j) => (
                                                <span key={j} className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                    {intent.topic} ({intent.sentiment})
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
