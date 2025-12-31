/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: "#7C3AED", // Violet-600
                secondary: "#1E293B", // Dark Gray
                background: "#F8FAFC", // Very Light Gray

                // New Theme Colors
                'bg-0': 'var(--bg-0)',
                'bg-100': 'var(--bg-100)',
                'bg-200': 'var(--bg-200)',
                'bg-300': 'var(--bg-300)',
                'text-100': 'var(--text-100)',
                'text-200': 'var(--text-200)',
                'text-300': 'var(--text-300)',
                'text-400': 'var(--text-400)',
                'text-500': 'var(--text-500)',
                'accent': 'var(--accent)',
                'accent-hover': 'var(--accent-hover)',
            },
            maxWidth: {
                '2xl': '42rem',
            },
            fontFamily: {
                serif: ['"Source Serif 4"', 'Georgia', 'serif'],
                sans: ['"Inter"', '"Onest"', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)', filter: 'blur(4px)' },
                    '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
                },
            },
        },
    },
    plugins: [],
}
