const graphicsLoader = (() => {
    function preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Error loading image at ${src}`));
        });
    }

    function preloadSound(src) {
        const sound = new Audio(src);
        sound.load();
        return sound;
    }

    return {
        preloadImage,
        preloadSound
    };
})();

export default graphicsLoader;