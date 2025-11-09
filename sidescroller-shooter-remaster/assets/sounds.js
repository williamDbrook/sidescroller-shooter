/*
  Audio manifest + preloader that tolerates the different sound folder names in the repo:
  - assets/sounds
  - assets/Sound
  - sounds
  - Sound
  Update the file names below to match your disk.
*/

export const soundFiles = {
    // Example entries — replace/add real filenames from your assets folders
    shoot: 'shoot.wav',
    explosion: 'explosion.wav',
    musicLoop: 'music.ogg',
    sfxHit: 'hit.wav'
};

export const sounds = {}; // populated by preloadSounds()

const soundCandidateDirs = [
    './sounds',
    './Sound',
    './assets/sounds',
    './assets/Sound',
    '../assets/sounds',
    '../assets/Sound',
    '/assets/sounds',
    '/assets/Sound'
];

function tryLoadAudioFromSrc(src) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.src = src;
        // Some browsers do not fire oncanplaythrough until user gesture; we accept "loadedmetadata" as progress
        const onLoad = () => {
            cleanup();
            resolve(audio);
        };
        const onError = (e) => {
            cleanup();
            reject(new Error(`Audio failed to load: ${src}`));
        };
        function cleanup() {
            audio.removeEventListener('canplaythrough', onLoad);
            audio.removeEventListener('loadedmetadata', onLoad);
            audio.removeEventListener('error', onError);
        }
        audio.addEventListener('canplaythrough', onLoad, { once: true });
        audio.addEventListener('loadedmetadata', onLoad, { once: true });
        audio.addEventListener('error', onError, { once: true });
        // start loading
        audio.load();
    });
}

async function tryLoadAudioWithDirs(filename) {
    let lastError = null;
    for (const dir of soundCandidateDirs) {
        const src = `${dir}/${filename}`;
        try {
            const audio = await tryLoadAudioFromSrc(src);
            return { audio, src };
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError || new Error(`Could not find audio file ${filename} in candidate dirs`);
}

/**
 * Preload all audio listed in soundFiles.
 * Resolves with the sounds object once all are at least metadata-loaded.
 */
export async function preloadSounds() {
    const entries = Object.entries(soundFiles);
    const total = entries.length;
    let loaded = 0;

    for (const [key, filename] of entries) {
        try {
            const { audio, src } = await tryLoadAudioWithDirs(filename);
            sounds[key] = audio;
            loaded += 1;
            // optional: console.info(`${key} loaded from ${src} (${loaded}/${total})`);
        } catch (err) {
            console.error(`Failed to load sound "${key}" (${filename}):`, err);
            throw err;
        }
    }
    return sounds;
}