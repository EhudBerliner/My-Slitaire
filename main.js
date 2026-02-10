/**
 * MAIN APPLICATION ENTRY POINT
 * Version: 2.0.0
 * Initializes and runs the Solitaire game
 */

// Global instances
let game = null;
let ui = null;

/**
 * Initialize the application
 */
function initApp() {
    console.log('Initializing Solitaire Pro v2.0.0');
    
    // Create game instance
    game = new SolitaireGame();
    
    // Create UI instance
    ui = new UIManager(game);
    
    // Try to load saved game
    const hasGameLoaded = game.loadGame();
    
    if (!hasGameLoaded) {
        // Start new game if no saved game
        game.init();
    }
    
    // Initial render
    ui.render();
    
    // Setup auto-save
    setupAutoSave();
    
    // Setup visibility change handler
    setupVisibilityHandler();
    
    // Setup beforeunload handler
    setupBeforeUnload();
    
    console.log('Solitaire Pro initialized successfully');
}

/**
 * Setup auto-save interval
 */
function setupAutoSave() {
    // Save game every 5 seconds
    setInterval(() => {
        if (game) {
            game.saveGame();
        }
    }, 5000);
}

/**
 * Setup visibility change handler
 */
function setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is hidden - save game
            if (game) {
                game.saveGame();
            }
        } else {
            // Page is visible - update UI
            if (ui) {
                ui.updateDisplay();
            }
        }
    });
}

/**
 * Setup beforeunload handler
 */
function setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
        if (game) {
            game.saveGame();
        }
    });
}

/**
 * Handle page load error
 */
function handleLoadError(error) {
    console.error('Failed to load application:', error);
    
    document.body.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
            color: white;
            font-family: sans-serif;
            text-align: center;
            padding: 20px;
        ">
            <h1 style="font-size: 32px; margin-bottom: 20px;">⚠️ שגיאה</h1>
            <p style="font-size: 18px; margin-bottom: 30px;">
                אירעה שגיאה בטעינת המשחק
            </p>
            <button onclick="window.location.reload()" style="
                background: white;
                color: #2e7d32;
                border: none;
                padding: 15px 30px;
                font-size: 16px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
            ">
                נסה שוב
            </button>
        </div>
    `;
}

/**
 * Wait for DOM to be ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            initApp();
        } catch (error) {
            handleLoadError(error);
        }
    });
} else {
    try {
        initApp();
    } catch (error) {
        handleLoadError(error);
    }
}

// Export for debugging
if (typeof window !== 'undefined') {
    window.SolitaireApp = {
        game,
        ui,
        version: '2.0.0'
    };
}
