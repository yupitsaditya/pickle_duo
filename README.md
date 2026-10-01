# 🏓 Pickle Duo (2D Pickleball)

A real-time, local-multiplayer 2D Pickleball game designed to be played across multiple devices on the same Wi-Fi network. Built with a lightweight Ruby backend and a vanilla HTML5 Canvas frontend.

## ✨ Features
- **Cross-Device Multiplayer**: Player 1 can play on a laptop while Player 2 joins seamlessly from a mobile phone.
- **Buttery Smooth Controls**: Uses Client-Side Prediction to eliminate input lag on mobile devices.
- **Pickleball Rules**: Features sideout scoring (you only score points when you are the server) and realistic out-of-bounds boundaries.
- **Character Selection**: Choose from 5 different characters before jumping onto the court.
- **Zero Dependencies**: Runs purely on macOS's built-in Ruby standard library (`WEBrick`). No `npm`, no `pip`, no database required.

## 🚀 How to Run

Because this project uses standard Ruby, it requires zero installation or setup on a Mac.

1. Open your terminal and navigate to this folder.
2. Start the server:
   ```bash
   ruby server.rb
   ```
3. **Player 1 (Host)**: Open your web browser and go to `http://localhost:8000`
4. **Player 2 (Mobile/Other Device)**: 
   - Ensure you are on the same Wi-Fi network as the host.
   - Find the host's local IP address (e.g., `192.168.x.x`).
   - Open your mobile browser and go to `http://<HOST_IP>:8000`

## 🎮 How to Play

### Controls
- **Mobile**: Tap and drag your finger up and down anywhere on the court to move your paddle. 
- **Desktop**: Use the `W` and `S` keys, or the `Up` and `Down` arrow keys.

### Rules of our Arcade Version
1. **Serving**: The ball starts in the Server's hand. Tap the **SERVE NOW** button (or press `Spacebar` on desktop) to serve.
2. **Sideout Scoring**: You can only win a point if you are the one who served. If the receiving player wins the rally, they don't get a point—they just get the ball back (a "Sideout").
3. **Out of Bounds (Sidelines)**: If you hit the ball off the top or bottom of the court, you lose the rally.
4. **Out of Bounds (Baselines)**: If the ball flies past your paddle on the left or right side of the screen, you missed it and lose the rally.
5. **Winning**: The first player to reach **5 points** wins the match! You can instantly hit "Play Again" to restart.

## 🛠 Tech Stack
- **Backend**: Ruby (`WEBrick`)
- **Frontend**: Vanilla HTML, CSS (Material Design inspired), and JavaScript (Canvas API)
- **Networking**: Fast HTTP Short-polling with Server-Sent Beacons for connection resets.
