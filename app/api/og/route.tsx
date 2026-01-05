import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Extract params
        const name = searchParams.get('name') || 'Mi Candidato';
        const affinity = searchParams.get('affinity') || '0';
        const party = searchParams.get('party') || '';
        const topics = searchParams.get('topics') || '';

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#FAF9F5', // Site ivory bg-0
                        backgroundImage: 'radial-gradient(circle at 25px 25px, #DDDDDD 2%, transparent 0%), radial-gradient(circle at 75px 75px, #DDDDDD 2%, transparent 0%)',
                        backgroundSize: '100px 100px',
                        padding: '60px',
                    }}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', marginBottom: '40px' }}>
                        <span style={{ fontSize: 32, fontWeight: 700, color: '#1F1E1D' }}>
                            porquien<span style={{ background: 'linear-gradient(to right, #FF3B30, #FF9500, #28CD41, #007AFF)', backgroundClip: 'text', color: 'transparent' }}>votar</span>.co
                        </span>
                    </div>

                    {/* Card Container */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'rgba(255, 255, 255, 0.6)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(221, 221, 221, 0.4)',
                            borderRadius: '40px',
                            padding: '50px',
                            width: '100%',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
                            alignItems: 'center',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: 24, color: '#73726C', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                            Mi Perfil Electoral
                        </div>

                        <div
                            style={{
                                fontSize: 80,
                                fontWeight: 800,
                                background: 'linear-gradient(to right, #FF3B30, #FF9500, #28CD41, #007AFF)',
                                backgroundClip: 'text',
                                color: 'transparent',
                                marginBottom: '20px',
                            }}
                        >
                            {affinity}%
                        </div>

                        <div style={{ fontSize: 40, fontWeight: 600, color: '#1F1E1D', marginBottom: '5px' }}>
                            {name}
                        </div>

                        <div style={{ fontSize: 20, color: '#888888', marginBottom: '30px' }}>
                            {party}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
                            {topics.split(',').map((topic) => (
                                <div
                                    key={topic}
                                    style={{
                                        padding: '8px 20px',
                                        backgroundColor: '#F0EEE6',
                                        borderRadius: '20px',
                                        fontSize: 16,
                                        color: '#3D3D3A',
                                        border: '1px solid #DDDDDD',
                                    }}
                                >
                                    {topic}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer CTA */}
                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 600, color: '#1F1E1D', marginBottom: '10px' }}>
                            ¿Y tú por quién vas a votar?
                        </div>
                        <div style={{ fontSize: 18, color: '#73726C' }}>
                            Descúbrelo en porquienvotar.co
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1080,
                height: 1920,
            }
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
