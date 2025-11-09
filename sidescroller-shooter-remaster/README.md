# README for SideScroller Shooter Remaster

## Project Overview

The SideScroller Shooter Remaster is a 2D side-scrolling shooter game where players navigate through levels, interact with enemies, and manage resources. The game features various establishments that players can enter, each offering different gameplay mechanics.

## Features

- **Player Control**: Move, shoot, and interact with the environment.
- **Enemy AI**: Enemies that chase the player and can inflict damage.
- **Establishments**: Enter stores, restaurants, and attempt robberies.
- **Health and Currency Management**: Players can heal and purchase items using in-game currency.
- **Responsive Graphics**: Dynamic loading of images and sounds for a smooth gaming experience.

## File Structure

```
sidescroller-shooter-remaster
├── src
│   ├── index.html          # Main HTML file for the game
│   ├── main.js             # Entry point for the game logic
│   ├── game_loop.js        # Contains the game loop and rendering logic
│   ├── player.js           # Player class with properties and methods
│   ├── enemy.js            # Enemy class with properties and methods
│   ├── graphics_loader.js   # Functions for loading images and sounds
│   ├── audio.js            # Audio management for sound effects and music
│   ├── input.js            # Input handling for keyboard and mouse
│   ├── ui.js               # User interface management
│   ├── physics.js          # Physics calculations and collision detection
│   ├── utils.js            # Utility functions used throughout the game
│   └── constants.js        # Constants used in the game
├── assets
│   ├── graphics            # Folder for game graphics
│   └── sounds              # Folder for game sounds
├── .gitignore              # Git ignore file
├── package.json            # NPM configuration file
└── README.md               # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd sidescroller-shooter-remaster
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage

To start the game, open `index.html` in a web browser. Use the keyboard to control the player and interact with the game world.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for details.