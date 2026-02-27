import './styles.css'
import { showBestScore, showSelectScreen, startBattle, restartGame, setDifficulty, initKeyboard, initTitleSprites, showGymMap, backToTitle, startEndless, switchPokemon, cancelSwitch, toggleBGM, toggleSFX, openSettings, closeSettings, acceptEvolution, declineEvolution, setBGM, quitBattle, confirmQuit, cancelQuit } from './game/engine.js'
import { BGM } from './game/sound.js'

// Connect BGM engine to game engine
setBGM(BGM)

// Expose to HTML event handlers
window.showSelectScreen = showSelectScreen
window.startBattle = startBattle
window.restartGame = restartGame
window.setDifficulty = setDifficulty
window.showGymMap = showGymMap
window.backToTitle = backToTitle
window.startEndless = startEndless
window.switchPokemon = switchPokemon
window.cancelSwitch = cancelSwitch
window.toggleBGM = toggleBGM
window.toggleSFX = toggleSFX
window.openSettings = openSettings
window.closeSettings = closeSettings
window.acceptEvolution = acceptEvolution
window.declineEvolution = declineEvolution
window.quitBattle = quitBattle
window.confirmQuit = confirmQuit
window.cancelQuit = cancelQuit

// Init
initTitleSprites()
showBestScore()
initKeyboard()
