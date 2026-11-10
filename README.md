# 🐝 BeeReady — 2026–2027 School Spelling Bee App

An interactive cross-platform (**Android, iPhone, and Web**) Spelling Bee practice app built with **React Native (Expo)** and **Local SQLite (`expo-sqlite`)**, containing all **450 words** from the official *2026–2027 School Spelling Bee Study List with Definitions*.

## ✨ Key Features

1. **Complete 450-Word Official Dataset (`src/data/words.json` & Local SQLite)**
   - **One Bee (1st–3rd Grade)**: Words `#1` – `#150`
   - **Two Bee (4th–6th Grade)**: Words `#151` – `#300`
   - **Three Bee (7th–8th Grade)**: Words `#301` – `#450`
   - Includes every word's official **Part of Speech**, **Definition**, **Merriam-Webster style Example Sentence** (blanked out as `________` during quizzes to avoid spoiling the spelling), and direct **Merriam-Webster.com** dictionary link.

2. **Authentic Competition Stage Experience**
   - **🔊 Pronouncer TTS**: Hear each word at normal speed or slow speed (`🐢`), plus audio playback for Part of Speech, Definition, and Example Sentence.
   - **✋ Anti-Cheat Spelling Bee Keypad**: Custom in-app QWERTY keypad prevents mobile keyboard predictive text/auto-complete from giving away the spelling.
   - **🎤 Voice Input (Spell Out Loud)**: Speak letters one by one (`"B - U - N - N - Y"` or `"bee you double n why"`) with real-time phonetic letter parsing and audio read-back.
   - **Official Grading Rules**: Case-insensitive, accepts official alternate British/preferred spellings (`fertilizer/fertiliser`, `brazier/brasier`, `glycerin/glycerine`, `kerosene/kerosine`, `materialize/materialise`, `odorant/odourant`), and accepts ASCII equivalents for accented characters (`piñata/pinata`, `éclair/eclair`).

3. **Gamification for Kids**
   - **👑 Bee Evolution Ranks**: Evolve from `🥚 Larva Learner` → `🐝 Worker Bee` → `🌸 Nectar Scout` → `🛡️ Hive Guardian` → `👑 Royal Bee` → `🏆 Grand Champion Bee`.
   - **🍯 Honey Points & 🔥 Combo Streaks**: Earn Honey Points and streak bonuses with confetti burst animations.
   - **🏅 10 Collectible Badges**: Unlock badges in the Trophy Cabinet.

4. **Wrong Word Bank & Mastery System (`Review Hive`)**
   - Automatically saves missed words to the local SQLite database.
   - Tracks review mastery (`Needs Practice 0/2 → 1/2 → Mastered 2/2 ✅`) and lets students filter by **Needs Practice**, **Mastered**, or **All Past Mistakes**.

5. **Multi-Profile Support (For Siblings/Family)**
   - Multiple children can create their own Speller Profile on a single device with separate progress, Honey Points, badges, and Wrong Word Banks.

---

## 🚀 How to Run on Android, iPhone, or Web

```bash
# 1. Install dependencies
npm install

# 2. Start Expo server (Scan QR code with Expo Go on Android or Camera app on iPhone)
npx expo start

# Or run directly in your computer browser:
npx expo start --web
```
