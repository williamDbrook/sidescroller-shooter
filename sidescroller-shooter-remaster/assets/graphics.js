// Simple image manifest + preloader that probes likely asset folders (graphic / graphics / src variants)
export const imageFiles = {
    enemy: 'enemy.png',
    background: 'bg.png',
    restaurant: 'reastaurant_screen.png', // keep disk spelling if that is what you have
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

export const images = {};

const candidateDirs = [
    '/assets/graphic',
    '/assets/graphics',
    '/graphic',
    '/graphics',
    '/src/graphic',
    '/src/graphics',
    './assets/graphic',
    './assets/graphics',
    './graphic',
    './graphics',
    '../assets/graphic',
    '../assets/graphics'
];

function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Image failed to load: ${url}`));
    });
}

async function findAndLoadImage(filename) {
    let lastErr = null;
    for (const dir of candidateDirs) {
        const url = `${dir}/${filename}`;
        try {
            const img = await loadImageFromUrl(url);
            return { img, url };
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr || new Error(`Could not find ${filename} in candidate dirs`);
}

export async function preloadImages() {
    const entries = Object.entries(imageFiles);
    for (const [key, filename] of entries) {
        try {
            const { img, url } = await findAndLoadImage(filename);
            images[key] = img;
            // optional: console.info(`${key} loaded from ${url}`);
        } catch (err) {
            console.error(`Failed to load image "${key}" (${filename}):`, err);
            throw err;
        }
    }
    return images;
}