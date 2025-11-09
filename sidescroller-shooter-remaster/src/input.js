const keys = {};
const keyStates = {
    pressed: {},
    released: {}
};

function handleKeyDown(event) {
    keys[event.code] = true;
    keyStates.pressed[event.code] = true;
}

function handleKeyUp(event) {
    keys[event.code] = false;
    keyStates.released[event.code] = true;
}

function isKeyPressed(key) {
    return keyStates.pressed[key] || false;
}

function isKeyReleased(key) {
    return keyStates.released[key] || false;
}

function resetKeyStates() {
    keyStates.pressed = {};
    keyStates.released = {};
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

export { keys, isKeyPressed, isKeyReleased, resetKeyStates };