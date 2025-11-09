const shootingSoundSrc = './assets/sounds/shoot_sound.mp3';

function preloadSound(src) {
    const sound = new Audio(src);
    sound.load();
    return sound;
}

const shootingSound = preloadSound(shootingSoundSrc);

export { shootingSound, preloadSound };