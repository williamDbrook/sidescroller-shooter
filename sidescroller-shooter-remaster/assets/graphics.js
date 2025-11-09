// Simple image manifest + preloader for the project

export const imageFiles = {
    enemy: 'enemy.png',
    background: 'bg.png',
    restaurant: 'reastaurant_screen.png', // keep disk spelling or rename file on disk
    robbery: 'robbery_screen.png',
    robberySuccess: 'robbery_screen_succes.png',
    robberyFailure: 'robbery_screen_failed.png',
    store: 'store_screen.png',
    hud: 'hud.png',
    mainMenu: 'mainmenu.png',
    arrow: 'mark.png',
    controls: 'how.png',
    player: 'player.png'
};

export const images = {}; // populated by preloadImages()

const candidateDirs = [
    './graphic',
    './graphics',
    './assets/graphic',
    './assets/graphics',
    '../assets/graphic',
    '../assets/graphics',
    '/assets/graphic',
    '/assets/graphics'
];

function tryLoadImageFromSrc(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Image failed to load: ${src}`));
    });
}

async function tryLoadImageWithDirs(filename) {
    let lastError = null;
    for (const dir of candidateDirs) {
        const src = `${dir}/${filename}`;
        try {
            const img = await tryLoadImageFromSrc(src);
            return { img, src };
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError || new Error(`Could not find ${filename} in candidate dirs`);
}

/**
 * Preload all images listed in imageFiles.
 * Returns a Promise that resolves with the images object when done.
 * Tries multiple candidate directories so it works with different asset-folder names.
 */
export async function preloadImages() {
    const entries = Object.entries(imageFiles);
    const total = entries.length;
    let loaded = 0;

    for (const [key, filename] of entries) {
        try {
            const { img, src } = await tryLoadImageWithDirs(filename);
            images[key] = img;
            loaded += 1;
            // optional: console.info(`${key} loaded from ${src} (${loaded}/${total})`);
        } catch (err) {
            console.error(`Failed to load image "${key}" (${filename}):`, err);
            throw err; // propagate — caller can decide to continue or halt
        }
    }
    return images;
}