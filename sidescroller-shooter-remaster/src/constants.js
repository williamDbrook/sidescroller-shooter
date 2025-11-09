const gameState = {
    MAIN_MENU: 'mainMenu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    STORE_SCREEN: 'storeScreen',
    RESTAURANT_SCREEN: 'restaurantScreen',
    ROBBERY_SCREEN: 'robberyScreen',
    ROBBERY_SUCCESS: 'robberySuccess',
    ROBBERY_FAILURE: 'robberyFailure',
    GAME_OVER: 'gameOver',
    CONTROLS: 'controls'
};

const ammoTypes = {
    standard: { damage: 15, penetration: false, cost: 0 },
    highDamage: { damage: 30, penetration: false, cost: 3 },
    penetration: { damage: 15, penetration: true, cost: 5 },
};

const meals = {
    RED_FISH: { name: 'Red Fish', cost: 20, heal: 35 },
    BEEF_SOUP: { name: 'Beef Soup', cost: 10, heal: 15 },
    FRIED_PIRANHA: { name: 'Fried Piranha', cost: 70, heal: 'full' }
};

export { gameState, ammoTypes, meals };