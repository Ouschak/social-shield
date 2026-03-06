import type { Config } from 'tailwindcss';

export default {
    content: ['./src/**/*.{ts,tsx,html}'],
    theme: {
        extend: {
            width: {
                popup: '360px',
            },
            height: {
                popup: '540px',
            },
        },
    },
    plugins: [],
} satisfies Config;
