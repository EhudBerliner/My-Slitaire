const game = new SolitaireGame();
const ui = new UIManager(game);

const app = {
    game: game,
    ui: ui,
    
    start() {
        this.loadGame();
        this.startTimer();
    },
    
    game: { // Wrapper for UI calls
        startNewGame: () => {
            game.init();
            ui.render();
            app.saveGame();
            app.closeMenu();
        },
        undo: () => {
            if(game.undo()) ui.render();
            app.closeMenu();
        },
        showHint: () => {
             // Simple hint logic
             alert('נסה להעביר קלף לערימת הבסיס או לפתוח עמודה חדשה');
             app.closeMenu();
        }
    },

    attemptMove(dragInfo, targetType, targetIdx) {
        // Complex logic connecting Drag UI to Game Logic
        const { card, colIdx, cardIdx } = dragInfo;
        
        let targetCard = null;
        if (targetType === 'tableau') {
            let col = game.tableau[targetIdx];
            if (col.length > 0) targetCard = col[col.length-1];
        } else if (targetType === 'foundation') {
            let pile = game.foundations[targetIdx];
            if (pile.length > 0) targetCard = pile[pile.length-1];
        }

        if (game.isValidMove(card, targetCard, targetType)) {
            // Execute Move
            // 1. Remove from Source
            let cardsToMove = [];
            if (dragInfo.cardIdx !== undefined) { // From Tableau
                 cardsToMove = game.tableau[colIdx].splice(cardIdx);
                 if(game.tableau[colIdx].length > 0) {
                     game.tableau[colIdx][game.tableau[colIdx].length-1].faceUp = true;
                 }
            } else { // From Waste
                cardsToMove = [game.waste.pop()];
            }

            // 2. Add to Target
            if (targetType === 'tableau') {
                game.tableau[targetIdx].push(...cardsToMove);
            } else {
                game.foundations[targetIdx].push(cardsToMove[0]);
                game.score += 10;
            }
            
            game.moves++;
            this.saveGame();
        }
        
        ui.render();
        this.checkWin();
    },

    drawStock() {
        game.saveState();
        if (game.stock.length > 0) {
            let card = game.stock.pop();
            card.faceUp = true;
            game.waste.push(card);
        }
        ui.render();
    },

    resetStock() {
        if (game.waste.length === 0) return;
        game.saveState();
        game.stock = game.waste.reverse().map(c => { c.faceUp = false; return c; });
        game.waste = [];
        ui.render();
    },
    
    checkWin() {
        if (game.foundations.every(p => p.length === 13)) {
            alert("ניצחת! כל הכבוד!");
        }
    },

    saveGame() {
        localStorage.setItem('solitaireState', JSON.stringify({
            stock: game.stock, waste: game.waste, 
            tableau: game.tableau, foundations: game.foundations,
            score: game.score, moves: game.moves, time: 0
        }));
    },
    
    loadGame() {
        const saved = localStorage.getItem('solitaireState');
        if (saved) {
            try {
                const s = JSON.parse(saved);
                game.stock = s.stock; game.waste = s.waste;
                game.tableau = s.tableau; game.foundations = s.foundations;
                game.score = s.score; game.moves = s.moves;
            } catch(e) { game.init(); }
        } else {
            game.init();
        }
        ui.render();
    },

    startTimer() {
        setInterval(() => {
            // Logic to update timer string
            // ...
        }, 1000);
    },

    closeMenu() {
        document.getElementById('sideMenu').classList.remove('open');
        document.getElementById('overlay').classList.remove('active');
    }
};

// UI Events
document.getElementById('menuBtn').onclick = () => {
    document.getElementById('sideMenu').classList.add('open');
    document.getElementById('overlay').classList.add('active');
};
document.getElementById('closeMenuBtn').onclick = app.closeMenu;
document.getElementById('overlay').onclick = app.closeMenu;

// Start App
app.start();