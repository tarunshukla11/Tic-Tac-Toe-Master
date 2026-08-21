# 🎮 Tic-Tac-Toe Master

<p align="center">
  <strong>A modern Tic-Tac-Toe game with AI opponents, local multiplayer, and online 1v1 multiplayer.</strong>
</p>

<p align="center">
  <a href="https://tarunshukla11.github.io/Tic-Tac-Toe-Master/">🌐 Live Demo</a>
  •
  <a href="https://github.com/tarunshukla11/Tic-Tac-Toe-Master">💻 Source Code</a>
  •
  <a href="https://github.com/tarunshukla11/Tic-Tac-Toe-Master/releases">📱 Download APK</a>
</p>

---

## ✨ Overview

**Tic-Tac-Toe Master** is a feature-rich implementation of the classic Tic-Tac-Toe game built with **HTML, CSS, and JavaScript**.

It supports traditional local gameplay, multiple AI difficulty levels, and real-time online multiplayer using **PeerJS and WebRTC**.

The project is designed to work smoothly on desktop and mobile browsers, with an Android version available through Capacitor.

---

## 🚀 Features

### 👥 Offline 1v1

Play against another person on the same device.

* Two-player local gameplay
* Automatic turn handling
* Randomized player symbol assignment
* Score tracking
* Restart and main-menu controls
* Smooth game animations

### 🤖 Player vs Bot

Challenge the computer with three difficulty levels:

| Difficulty | Description                                            |
| ---------- | ------------------------------------------------------ |
| 🟢 Easy    | Makes simple/random moves                              |
| 🟡 Medium  | Attempts to win and block the player's moves           |
| 🔴 Hard    | Uses strategic decision-making and minimax-based logic |

You can also choose whether **you or the bot goes first**.

### 🌐 Online 1v1 Multiplayer

Play Tic-Tac-Toe with another player over the internet.

* Peer-to-peer multiplayer
* 6-character room codes
* Host or join a game
* Real-time move synchronization
* Connection status indicator
* Automatic player assignment
* Opponent disconnect handling
* Rematch system
* NAT traversal support through STUN/TURN configuration

The multiplayer system uses **PeerJS over WebRTC**, allowing players to establish a direct connection without requiring a dedicated game server.

### 🎨 Modern Interface

* Responsive layout
* Mobile-friendly design
* Animated loading screen
* Animated moves
* Win-line animation
* Game status indicators
* Scoreboard
* Online player information
* Rematch popup
* Clean dark-themed interface

---

## 🎮 Game Modes

```text
                    TIC-TAC-TOE MASTER
                           │
             ┌─────────────┼─────────────┐
             │             │             │
        Offline 1v1     Play vs Bot   Online 1v1
             │             │             │
          2 Players     ┌──┼──┐       Host / Join
                        │  │  │
                      Easy Med Hard
```

---

## 🌐 Online Multiplayer

### Host a Game

1. Open **Online 1v1**.
2. Select **Host Game**.
3. A unique 6-character room code is generated.
4. Copy the code.
5. Send the code to your opponent.
6. Wait for the opponent to join.
7. The game starts automatically.

### Join a Game

1. Open **Online 1v1**.
2. Select **Join Game**.
3. Enter the host's room code.
4. Select **Join**.
5. Wait for the connection.
6. Start playing.

### Connection Technology

Online multiplayer uses:

* **PeerJS**
* **WebRTC**
* **STUN**
* **TURN**

The project includes STUN and TURN configuration to improve connectivity across different networks, including situations where direct peer-to-peer connections may fail.

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript (ES6+)

### Multiplayer

* PeerJS
* WebRTC
* STUN
* TURN

PeerJS is loaded in the web application through its browser library.

### Android

* Capacitor
* Android SDK
* Gradle

The Android project is generated from the web application using Capacitor.

---

## 📁 Project Structure

```text
Tic-Tac-Toe-Master/
│
├── index.html          # Main game interface
├── style.css           # UI and animations
├── game.js             # Game logic and multiplayer
│
├── package.json        # Project configuration
├── package-lock.json   # Dependency lock file
├── capacitor.config.json
│
├── README.md           # Project documentation
└── .gitignore          # Git exclusions
```

The repository intentionally contains only the important source and project files. Generated Android build files, `node_modules`, local configuration, and other unnecessary files are excluded from version control.

---

## 💻 Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/tarunshukla11/Tic-Tac-Toe-Master.git
```

### 2. Enter the project

```bash
cd Tic-Tac-Toe-Master
```

### 3. Open the game

For basic offline gameplay, you can open:

```text
index.html
```

directly in a modern browser.

For the best experience, especially when testing online multiplayer, use a local web server.

### Using Live Server

If you have Node.js installed:

```bash
npm install -g live-server
```

Then run:

```bash
live-server
```

The game will open in your browser.

---

## 📱 Android App

An Android version of Tic-Tac-Toe Master has been built using **Capacitor**.

The APK can be distributed separately through the repository's **GitHub Releases** section.

### Android Build

The Android project is intentionally not included in the main source repository because generated Android/Gradle files are unnecessary for users who only need the web source and APK.

---

## 🔒 Repository Hygiene

This repository intentionally avoids committing:

```text
node_modules/
android/
android/app/build/
android/.gradle/
android/local.properties
.env
*.jks
*.keystore
*.pem
*.key
IDE configuration
temporary files
build output
```

This keeps the repository lightweight and helps prevent accidental exposure of local configuration or signing credentials.

---

## 📊 Project Highlights

| Feature                     | Status |
| --------------------------- | :----: |
| Offline 1v1                 |    ✅   |
| Easy AI                     |    ✅   |
| Medium AI                   |    ✅   |
| Hard AI                     |    ✅   |
| First/Second Turn Selection |    ✅   |
| Online 1v1                  |    ✅   |
| Room Codes                  |    ✅   |
| Peer-to-Peer Multiplayer    |    ✅   |
| STUN/TURN Support           |    ✅   |
| Connection Status           |    ✅   |
| Rematch System              |    ✅   |
| Score Tracking              |    ✅   |
| Responsive UI               |    ✅   |
| Android APK                 |    ✅   |

---

## 🔮 Future Improvements

Possible future improvements include:

* [ ] Player profiles
* [ ] Online player statistics
* [ ] Match history
* [ ] Leaderboards
* [ ] Custom player names
* [ ] Game sound effects
* [ ] Additional board themes
* [ ] Improved matchmaking
* [ ] Online authentication
* [ ] Progressive Web App support
* [ ] Production-grade multiplayer backend

---

## 📸 Screenshots

Screenshots can be added here as the project evolves.

Example:

```markdown
![Main Menu](screenshots/main-menu.png)

![Gameplay](screenshots/gameplay.png)

![Online Multiplayer](screenshots/online-multiplayer.png)
```

---

## 📄 License

This project is open-source.

See the repository for the latest source code and project information.

---

## 👨‍💻 Author

**Tarun Shukla**

Computer Science Engineering Student
Developer • Programmer • Builder

GitHub: **tarunshukla11**

---

<p align="center">
  ⭐ If you like the project, consider giving it a star!
</p>

<p align="center">
  Built with HTML, CSS, JavaScript, PeerJS and Capacitor.
</p>
