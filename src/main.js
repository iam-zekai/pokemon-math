import './styles.css'
import { showBestScore, showSelectScreen, startBattle, restartGame, setDifficulty, initKeyboard, initTitleSprites, showGymMap, backToTitle } from './game/engine.js'

// Expose to HTML event handlers
window.showSelectScreen = showSelectScreen
window.startBattle = startBattle
window.restartGame = restartGame
window.setDifficulty = setDifficulty
window.showGymMap = showGymMap
window.backToTitle = backToTitle

// Init
initTitleSprites()
showBestScore()
initKeyboard()
