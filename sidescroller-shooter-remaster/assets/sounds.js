// Simple robust audio manifest + preloader that probes multiple candidate dirs
export const soundFiles = {
    shoot: 'shoot_sound.mp3',
};

export const sounds = {}; // populated by preloadSounds()

const soundCandidateDirs = [
    '/assets/Sound',
    '/assets/sounds',
    './Sound',
    './sounds',
    '../assets/Sound',
    '../assets/sounds',
    '/Sound',
    '/sounds'
];

async function fetchAsBlob(url) {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
    const ct = res.headers.get('content-type') || '';
    // accept if content-type contains "audio" or it's a binary stream
    if (!ct.includes('audio') && !ct.includes('application/octet-stream') && !url.match(/\.(wav|mp3|ogg|m4a|aac|flac)$/i)) {
        console.warn(`Warning: fetched ${url} with content-type "${ct}"`);
    }
    return await res.blob();
}

function audioFromBlob(blob) {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);
    audio.src = url;
    // revoke object URL after metadata loads to free memory
    const cleanup = () => {
        try { URL.revokeObjectURL(url); } catch (e) {}
    };
    return new Promise((resolve, reject) => {
        const onLoaded = () => { cleanup(); resolve(audio); };
        const onError = (e) => { cleanup(); reject(new Error('Audio element failed to load')); };
        audio.addEventListener('loadedmetadata', onLoaded, { once: true });
        audio.addEventListener('canplaythrough', onLoaded, { once: true });
        audio.addEventListener('error', onError, { once: true });
        // ensure browser starts fetching (some browsers need play gesture, but loadedmetadata from blob usually fires)
        audio.load();
    });
}

async function tryLoadAudioWithDirs(filename) {
    let lastErr = null;
    for (const dir of soundCandidateDirs) {
        const url = `${dir}/${filename}`;
        try {
            const blob = await fetchAsBlob(url);
            const audio = await audioFromBlob(blob);
            return { audio, src: url };
        } catch (err) {
            lastErr = err;
            // continue trying next dir
        }
    }
    throw lastErr || new Error(`Could not find audio file ${filename} in candidate dirs`);
}

/**
 * Preload all audio listed in soundFiles.
 * Resolves with the sounds object once all are loaded (metadata/canplaythrough).
 */
export async function preloadSounds() {
    const entries = Object.entries(soundFiles);
    for (const [key, filename] of entries) {
        try {
            const { audio, src } = await tryLoadAudioWithDirs(filename);
            sounds[key] = audio;
            // optional: console.info(`sound ${key} loaded from ${src}`);
        } catch (err) {
            console.error(`Failed to load sound "${key}" (${filename}):`, err);
            throw err;
        }
    }
    return sounds;
}