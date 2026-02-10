/**
 * SOLITAIRE GAME LOGIC ENGINE
 * Version: 2.0.0
 */

class SolitaireGame {
    constructor() {
        this.deck = [];
        this.stock = [];
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.tableau = [[], [], [], [], [], [], []];
        this.score = 0;
        this.moves = 0;
        this.time = 0;
        this.timerInterval = null;
        this.history = [];
        this.maxHistorySize = 50;
        this.drawCount = 3;
        this.settings = { sound: true, animations: true, largeCards: false };
        this.stats = { gamesPlayed: 0, gamesWon: 0, bestScore: 0, totalTime: 0 };
        this.loadSettings();
        this.loadStats();
    }

    init() {
        this.deck = this.createDeck();
        this.shuffle();
        this.deal();
        this.score = 0;
        this.moves = 0;
        this.time = 0;
        this.history = [];
        this.startTimer();
        this.stats.gamesPlayed++;
        this.saveStats();
    }

    createDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const deck = [];
        for (let suit of suits) {
            for (let value = 1; value <= 13; value++) {
                deck.push({
                    suit: suit,
                    value: value,
                    color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black',
                    faceUp: false
                });
            }
        }
        return deck;
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    deal() {
        this.tableau = [[], [], [], [], [], [], []];
        this.foundations = [[], [], [], []];
        this.stock = [];
        this.waste = [];
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row <= col; row++) {
                const card = this.deck.pop();
                card.faceUp = (row === col);
                this.tableau[col].push(card);
            }
        }
        this.stock = this.deck.map(card => { card.faceUp = false; return card; });
    }

    saveState() {
        const state = {
            stock: JSON.parse(JSON.stringify(this.stock)),
            waste: JSON.parse(JSON.stringify(this.waste)),
            tableau: JSON.parse(JSON.stringify(this.tableau)),
            foundations: JSON.parse(JSON.stringify(this.foundations)),
            score: this.score,
            moves: this.moves
        };
        this.history.push(state);
        if (this.history.length > this.maxHistorySize) this.history.shift();
    }

    undo() {
        if (this.history.length === 0) return false;
        const state = this.history.pop();
        this.stock = state.stock;
        this.waste = state.waste;
        this.tableau = state.tableau;
        this.foundations = state.foundations;
        this.score = state.score;
        this.moves = state.moves;
        return true;
    }

    drawFromStock() {
        if (this.stock.length === 0) {
            if (this.waste.length === 0) return false;
            this.saveState();
            this.stock = this.waste.reverse().map(card => { card.faceUp = false; return card; });
            this.waste = [];
            this.moves++;
            return true;
        }
        this.saveState();
        const drawCount = Math.min(this.drawCount, this.stock.length);
        for (let i = 0; i < drawCount; i++) {
            const card = this.stock.pop();
            card.faceUp = true;
            this.waste.push(card);
        }
        this.moves++;
        return true;
    }

    isValidMove(card, targetCard, targetType) {
        if (targetType === 'foundation') {
            return this.isValidFoundationMove(card, targetCard);
        } else if (targetType === 'tableau') {
            return this.isValidTableauMove(card, targetCard);
        }
        return false;
    }

    isValidFoundationMove(card, targetCard) {
        if (!card) return false;
        if (!targetCard) return card.value === 1;
        return card.suit === targetCard.suit && card.value === targetCard.value + 1;
    }

    isValidTableauMove(card, targetCard) {
        if (!card) return false;
        if (!targetCard) return card.value === 13;
        return card.color !== targetCard.color && card.value === targetCard.value - 1;
    }

    moveWasteToFoundation(foundationIndex) {
        if (this.waste.length === 0) return false;
        const card = this.waste[this.waste.length - 1];
        const targetPile = this.foundations[foundationIndex];
        const targetCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : null;
        if (this.isValidFoundationMove(card, targetCard)) {
            this.saveState();
            this.waste.pop();
            this.foundations[foundationIndex].push(card);
            this.score += 10;
            this.moves++;
            return true;
        }
        return false;
    }

    moveWasteToTableau(tableauIndex) {
        if (this.waste.length === 0) return false;
        const card = this.waste[this.waste.length - 1];
        const targetPile = this.tableau[tableauIndex];
        const targetCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : null;
        if (this.isValidTableauMove(card, targetCard)) {
            this.saveState();
            this.waste.pop();
            this.tableau[tableauIndex].push(card);
            this.score += 5;
            this.moves++;
            return true;
        }
        return false;
    }

    moveTableauToFoundation(tableauIndex, cardIndex, foundationIndex) {
        const sourcePile = this.tableau[tableauIndex];
        if (cardIndex !== sourcePile.length - 1) return false;
        const card = sourcePile[cardIndex];
        const targetPile = this.foundations[foundationIndex];
        const targetCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : null;
        if (this.isValidFoundationMove(card, targetCard)) {
            this.saveState();
            sourcePile.pop();
            this.foundations[foundationIndex].push(card);
            if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].faceUp) {
                sourcePile[sourcePile.length - 1].faceUp = true;
                this.score += 5;
            }
            this.score += 10;
            this.moves++;
            return true;
        }
        return false;
    }

    moveTableauToTableau(sourceIndex, cardIndex, targetIndex) {
        if (sourceIndex === targetIndex) return false;
        const sourcePile = this.tableau[sourceIndex];
        const targetPile = this.tableau[targetIndex];
        if (cardIndex >= sourcePile.length) return false;
        const card = sourcePile[cardIndex];
        const targetCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : null;
        if (this.isValidTableauMove(card, targetCard)) {
            this.saveState();
            const cardsToMove = sourcePile.splice(cardIndex);
            this.tableau[targetIndex].push(...cardsToMove);
            if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].faceUp) {
                sourcePile[sourcePile.length - 1].faceUp = true;
                this.score += 5;
            }
            this.moves++;
            return true;
        }
        return false;
    }

    moveFoundationToTableau(foundationIndex, tableauIndex) {
        const sourcePile = this.foundations[foundationIndex];
        if (sourcePile.length === 0) return false;
        const card = sourcePile[sourcePile.length - 1];
        const targetPile = this.tableau[tableauIndex];
        const targetCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : null;
        if (this.isValidTableauMove(card, targetCard)) {
            this.saveState();
            sourcePile.pop();
            this.tableau[tableauIndex].push(card);
            this.score -= 15;
            this.moves++;
            return true;
        }
        return false;
    }

    findHint() {
        if (this.waste.length > 0) {
            const wasteCard = this.waste[this.waste.length - 1];
            for (let i = 0; i < 4; i++) {
                const foundationPile = this.foundations[i];
                const targetCard = foundationPile.length > 0 ? foundationPile[foundationPile.length - 1] : null;
                if (this.isValidFoundationMove(wasteCard, targetCard)) {
                    return { type: 'waste-to-foundation', source: 'waste', target: i };
                }
            }
        }
        if (this.waste.length > 0) {
            const wasteCard = this.waste[this.waste.length - 1];
            for (let i = 0; i < 7; i++) {
                const tableauPile = this.tableau[i];
                const targetCard = tableauPile.length > 0 ? tableauPile[tableauPile.length - 1] : null;
                if (this.isValidTableauMove(wasteCard, targetCard)) {
                    return { type: 'waste-to-tableau', source: 'waste', target: i };
                }
            }
        }
        for (let i = 0; i < 7; i++) {
            const tableauPile = this.tableau[i];
            if (tableauPile.length > 0) {
                const card = tableauPile[tableauPile.length - 1];
                if (card.faceUp) {
                    for (let j = 0; j < 4; j++) {
                        const foundationPile = this.foundations[j];
                        const targetCard = foundationPile.length > 0 ? foundationPile[foundationPile.length - 1] : null;
                        if (this.isValidFoundationMove(card, targetCard)) {
                            return { type: 'tableau-to-foundation', source: i, target: j };
                        }
                    }
                }
            }
        }
        for (let i = 0; i < 7; i++) {
            const sourcePile = this.tableau[i];
            for (let cardIdx = 0; cardIdx < sourcePile.length; cardIdx++) {
                const card = sourcePile[cardIdx];
                if (card.faceUp) {
                    for (let j = 0; j < 7; j++) {
                        if (i !== j) {
                            const targetPile = this.tableau[j];
                            const targetCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : null;
                            if (this.isValidTableauMove(card, targetCard)) {
                                return { type: 'tableau-to-tableau', source: i, cardIndex: cardIdx, target: j };
                            }
                        }
                    }
                }
            }
        }
        if (this.stock.length > 0 || this.waste.length > 0) {
            return { type: 'draw-stock' };
        }
        return null;
    }

    isWon() {
        return this.foundations.every(pile => pile.length === 13);
    }

    canAutoComplete() {
        if (this.stock.length > 0 || this.waste.length > 0) return false;
        for (let pile of this.tableau) {
            for (let card of pile) {
                if (!card.faceUp) return false;
            }
        }
        return true;
    }

    autoComplete() {
        if (!this.canAutoComplete()) return false;
        let moved = true;
        while (moved) {
            moved = false;
            for (let i = 0; i < 7; i++) {
                const pile = this.tableau[i];
                if (pile.length > 0) {
                    const card = pile[pile.length - 1];
                    for (let j = 0; j < 4; j++) {
                        if (this.moveTableauToFoundation(i, pile.length - 1, j)) {
                            moved = true;
                            break;
                        }
                    }
                }
            }
        }
        return this.isWon();
    }

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => { this.time++; }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    winGame() {
        this.stopTimer();
        this.stats.gamesWon++;
        this.stats.totalTime += this.time;
        if (this.score > this.stats.bestScore) {
            this.stats.bestScore = this.score;
        }
        this.saveStats();
        return { time: this.time, moves: this.moves, score: this.score };
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    saveSettings() {
        localStorage.setItem('solitaire_settings', JSON.stringify(this.settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('solitaire_settings');
        if (saved) this.settings = { ...this.settings, ...JSON.parse(saved) };
    }

    saveStats() {
        localStorage.setItem('solitaire_stats', JSON.stringify(this.stats));
    }

    loadStats() {
        const saved = localStorage.getItem('solitaire_stats');
        if (saved) this.stats = { ...this.stats, ...JSON.parse(saved) };
    }

    resetStats() {
        this.stats = { gamesPlayed: 0, gamesWon: 0, bestScore: 0, totalTime: 0 };
        this.saveStats();
    }

    getWinRate() {
        if (this.stats.gamesPlayed === 0) return 0;
        return Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100);
    }

    getAverageTime() {
        if (this.stats.gamesWon === 0) return 0;
        return Math.floor(this.stats.totalTime / this.stats.gamesWon);
    }

    saveGame() {
        const state = {
            stock: this.stock, waste: this.waste, tableau: this.tableau,
            foundations: this.foundations, score: this.score, moves: this.moves,
            time: this.time, drawCount: this.drawCount
        };
        localStorage.setItem('solitaire_game', JSON.stringify(state));
    }

    loadGame() {
        const saved = localStorage.getItem('solitaire_game');
        if (saved) {
            const state = JSON.parse(saved);
            this.stock = state.stock || [];
            this.waste = state.waste || [];
            this.tableau = state.tableau || [[], [], [], [], [], [], []];
            this.foundations = state.foundations || [[], [], [], []];
            this.score = state.score || 0;
            this.moves = state.moves || 0;
            this.time = state.time || 0;
            this.drawCount = state.drawCount || 3;
            this.startTimer();
            return true;
        }
        return false;
    }

    clearSavedGame() {
        localStorage.removeItem('solitaire_game');
    }
}
