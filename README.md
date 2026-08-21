# Tic-Tac-Toe

A classic Tic-Tac-Toe game with a clean interface, multiple game modes, and online multiplayer functionality. Play against a friend, challenge a bot with varying difficulty, or connect with someone online for a match.

![Screenshot of the game board]() 

**Live Demo:** [Link to your live game] 

## Features

*   **Multiple Game Modes:**
    *   **Offline 1v1:** Play with a friend on the same device.
    *   **Player vs. Bot:** Challenge an AI with three difficulty levels.
    *   **Online 1v1:** Play against another person over the internet.
*   **AI Opponent:**
    *   **Easy:** The bot makes random moves.
    *   **Medium:** A smarter bot that will try to win and block your winning moves.
    *   **Hard:** An unbeatable bot that uses the minimax algorithm to determine the best possible move.
*   **Online Multiplayer:**
    *   **Peer-to-Peer:** Uses WebRTC (via PeerJS) for a direct, low-latency connection.
    *   **Simple Matchmaking:** Host a game and share a 6-character room code with your friend to connect.
    *   **Rematch:** Instantly start a new game with the same opponent after a match ends.
*   **Sleek UI:**
    *   Smooth animations for moves and win conditions.
    *   Score tracking across matches.
    *   Clear status indicators for game state and online connection.

## How to Play

### Offline Modes
1.  Open the game.
2.  Choose **"Offline 1v1"** to play against a friend on the same screen.
3.  Choose **"Player vs. Bot"** to play against the computer.
    *   Select a difficulty: Easy, Medium, or Hard.
    *   Decide whether you or the bot goes first.

### Online Mode

The online mode uses a peer-to-peer connection, so no central server is needed for gameplay.

**To Host a Game:**
1.  Select **"Online 1v1"** from the main menu.
2.  Click **"Host Game"**.
3.  A unique 6-character room code will be generated.
4.  Click the button to copy the code and send it to your friend.
5.  Wait for your friend to join the room. The game will start automatically.

**To Join a Game:**
1.  Select **"Online 1v1"** from the main menu.
2.  Click **"Join Game"**.
3.  Enter the 6-character room code you received from the host.
4.  The game will connect and start automatically.

## Technologies Used

*   **Frontend:** HTML5, CSS3, JavaScript (ES6+)
*   **Multiplayer:** [PeerJS](https://peerjs.com/) for WebRTC peer-to-peer connections.
*   **Networking:** STUN/TURN servers to facilitate connections between players behind NATs.

## Local Development

To run the project on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd Tic-Tac-Toe-Master
    ```

3.  **Open the game:**
    Simply open the `index.html` file in your web browser.

    For the best experience and to ensure the online features work correctly (due to browser security policies), it's recommended to serve the files using a local web server. You can use a simple tool like `live-server` for this.

    ```bash
    # If you have Node.js installed
    npm install -g live-server
    live-server
    ```

## License

This project is open-source.