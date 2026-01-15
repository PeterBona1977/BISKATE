import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Can be imported from a shared config
const locales = ['pt', 'en'];

export default getRequestConfig(async ({ locale }) => {
    // Provide a fallback for invalid or missing locales to avoid crashing the root layout
    const baseLocale = locales.includes(locale as any) ? locale : 'pt';

    try {
        return {
            locale: baseLocale, // Important: Include the locale in the return object
            messages: (await import(`../messages/${baseLocale}.json`)).default
        };
    } catch (error) {
        console.error(`Failed to load messages for locale ${baseLocale}:`, error);
        return {
            locale: 'pt',
            messages: (await import(`../messages/pt.json`)).default
        };
    }
});
