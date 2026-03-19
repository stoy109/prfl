# 📡 S.A.T.E.L.L.I.T.E. 

A high-fidelity, music-reactive personal profile page built with **React** and **Framer Motion**. It features a dynamic orbital navigation system, live Discord presence integration, and rhythm-synced animations driven by Osu!mania chart data.

## ✨ Features

- **Visual Sync Engine**: Animations are mathematically mapped to the audio timeline, transitioning through different states like `VERSE`, `PRE-BUILD`, `DROP`, and `OUTRO`.
- **Orbital Navigation**: Social links orbit around a central anchor in a 3D-simulated elliptical path.
- **Discord Presence Integration**: Displays live status (Online/Idle/DND), Spotify activity, and custom status messages using the **Lanyard API**.
- **Kinetic Feedback**: The interface pulses and vibrates based on rhythm data (hit sounds) extracted from an Osu!beatmap.
- **Boot Sequence Overlay**: A terminal-style initialization overlay to manage browser audio autoplay restrictions.

## 🚀 Tech Stack

- **React 19** + **Vite**
- **Framer Motion** for state-driven animations
- **Howler.js** for precise audio management
- **Lanyard API** (WebSocket) for Discord presence
- **Lucide React** for iconography

## 🛠️ Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/stoy109/prfl.git
    cd prfl
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run in development mode**:
    ```bash
    npm run dev
    ```

4.  **Build for production**:
    ```bash
    npm run build
    ```

## 💖 Credits & Acknowledgments

- **Presence API**: [Lanyard](https://lanyard.rest/) by Phineas for the Discord integration.
- **Rhythm Data (Beatmap)**: Osu!mania chart metadata by [Blocko](https://osu.ppy.sh/beatmapsets/1773012#mania/3631139). Original beatmap used to drive the synchronized kinetic effects.
- **Audio Credits**: The music used is "S.A.T.E.L.L.I.T.E." (composed by Camellia, sync logic mapped to the specific osu! metadata).

---

Built with ⚡ by **stoy109**
