import './styles.css'
import { showBestScore, showSelectScreen, startBattle, restartGame, setDifficulty, initKeyboard, initTitleSprites } from './game/engine.js'

// Expose to HTML event handlers
window.showSelectScreen = showSelectScreen
window.startBattle = startBattle
window.restartGame = restartGame
window.setDifficulty = setDifficulty

// Init
initTitleSprites()
showBestScore()
initKeyboard()
