class SolitaireGame {
    constructor() {
        this.deck = [];
        this.stock = [];
        this.waste = [];
        this.foundations = [[], [], [], []]; // 4 piles
        this.tableau = [[], [], [], [], [], [], []]; // 7 piles
        this.history = []; // For Undo
        this.score = 0;
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
    }

    init() {
        this.createDeck();
        this.shuffle();
        this.deal();
        this.history = [];
        this.score = 0;
        this.moves = 0;
    }

    createDeck() {
        const suits = ['h', 'd', 'c', 's']; // hearts, diamonds, clubs, spades
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
        this.deck = [];
        for (let s of suits) {
            for (let v of values) {
                this.deck.push({
                    suit: s, value: v,
                    color: (s === 'h' || s === 'd') ? 'red' : 'black',
                    faceUp: false,
                    id: `${s}-${v}`
                });
            }
        }
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    deal() {
        this.tableau = [[], [], [], [], [], [], []];
        let cardIdx = 0;
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j <= i; j++) {
                let card = this.deck[cardIdx++];
                if (j === i) card.faceUp = true;
                this.tableau[i].push(card);
            }
        }
        this.stock = this.deck.slice(cardIdx);
        this.waste = [];
        this.foundations = [[], [], [], []];
    }

    // Save state for undo
    saveState() {
        const state = JSON.stringify({
            stock: this.stock, waste: this.waste,
            foundations: this.foundations, tableau: this.tableau,
            score: this.score, moves: this.moves
        });
        this.history.push(state);
        if (this.history.length > 20) this.history.shift(); // Limit undo steps
    }

    undo() {
        if (this.history.length === 0) return false;
        const state = JSON.parse(this.history.pop());
        this.stock = state.stock;
        this.waste = state.waste;
        this.foundations = state.foundations;
        this.tableau = state.tableau;
        this.score = state.score;
        this.moves = state.moves;
        return true;
    }

    // Rules
    isValidMove(card, target, type) { // type: 'tableau' or 'foundation'
        if (type === 'foundation') {
            // Foundation logic: Same suit, ascending order
            if (!target) return card.value === 1; // Ace on empty
            return card.suit === target.suit && card.value === target.value + 1;
        } else {
            // Tableau logic: Alt color, descending
            if (!target) return card.value === 13; // King on empty
            return card.color !== target.color && card.value === target.value - 1;
        }
    }
}