/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./context/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#F97316', // Naranja marca
                    hover: '#EA580C',
                    foreground: '#FFFFFF',
                },
                brand: {
                    dark: '#8B4513', // Marrón del logo
                    soft: '#A16207',
                },
                secondary: {
                    DEFAULT: '#64748B', // Slate 500 (Text secondary)
                    foreground: '#FFFFFF',
                },
                accent: {
                    DEFAULT: '#F97316', // Use primary for accent largely
                    foreground: '#FFFFFF',
                },
                background: {
                    DEFAULT: '#F8FAFC', // Slate 50
                    alt: '#FFF7ED', // Orange 50
                    card: '#FFFFFF',
                },
                foreground: {
                    DEFAULT: '#1E293B', // Slate 800
                    muted: '#64748B', // Slate 500
                },
                border: '#E2E8F0', // Slate 200
                success: '#16A34A',
                error: '#DC2626',
            },
            backgroundImage: {
                'cta-gradient': 'linear-gradient(to right, #F97316, #FB923C)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Outfit', 'sans-serif'],
                serif: ['DM Serif Display', 'serif'],
            },
        },
    },
    plugins: [],
}
