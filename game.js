/** 
 * SOLITAIRE PRO - GAME LOGIC
 * Version: 2.1.0
 * Full Klondike Solitaire implementation
 */

const VERSION = '2.2.0';
const CARD_OFFSET = 38;

/**  
 * Main Game Class
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
        this.history = [];
        this.drawCount = 3;
        this.timerInterval = null;
    }

    init() {
        this.createDeck();
        this.shuffle();
        this.deal();
        this.startTimer();
        this.saveGame();
    }

    createDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        this.deck = [];
        for (let suit of suits) {
            for (let value = 1; value <= 13; value++) {
                this.deck.push({ 
                    suit, 
                    value, 
                    faceUp: false,
                    id: `${suit}-${value}`
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
            for (let j = i; j < 7; j++) {
                let card = this.deck[cardIdx++];
                card.faceUp = (i === j);
                this.tableau[j].push(card);
            }
        }
        
        this.stock = this.deck.slice(cardIdx).map(c => {
            c.faceUp = false;
            return c;
        });
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.score = 0;
        this.moves = 0;
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.time = 0;
        this.timerInterval = setInterval(() => {
            this.time++;
            if (window.ui) window.ui.updateStats();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    drawFromStock() {
        if (this.stock.length > 0) {
            for (let i = 0; i < this.drawCount && this.stock.length > 0; i++) {
                const card = this.stock.pop();
                card.faceUp = true;
                this.waste.push(card);
            }
        } else if (this.waste.length > 0) {
            this.stock = this.waste.reverse().map(c => {
                c.faceUp = false;
                return c;
            });
            this.waste = [];
        }
        this.moves++;
        this.saveGame();
    }

    canPlaceOnTableau(card, targetPile) {
        if (!targetPile || targetPile.length === 0) {
            return card.value === 13;
        }
        
        const topCard = targetPile[targetPile.length - 1];
        if (!topCard.faceUp) return false;
        
        const cardColor = ['hearts', 'diamonds'].includes(card.suit) ? 'red' : 'black';
        const topColor = ['hearts', 'diamonds'].includes(topCard.suit) ? 'red' : 'black';
        
        return cardColor !== topColor && card.value === topCard.value - 1;
    }

    canPlaceOnFoundation(card, foundationIndex) {
        const foundation = this.foundations[foundationIndex];
        
        if (foundation.length === 0) {
            return card.value === 1;
        }
        
        const topCard = foundation[foundation.length - 1];
        return card.suit === topCard.suit && card.value === topCard.value + 1;
    }

    moveToFoundation(card, fromPile, foundationIndex) {
        if (fromPile && fromPile.length > 0 && fromPile[fromPile.length - 1] === card) {
            if (this.canPlaceOnFoundation(card, foundationIndex)) {
                this.foundations[foundationIndex].push(fromPile.pop());
                
                if (fromPile.length > 0 && !fromPile[fromPile.length - 1].faceUp) {
                    fromPile[fromPile.length - 1].faceUp = true;
                    this.score += 5;
                }
                
                this.score += 10;
                this.moves++;
                this.saveGame();
                this.checkWin();
                return true;
            }
        }
        return false;
    }

    moveCards(fromPile, cardIndex, toPile) {
        if (!fromPile || !toPile || cardIndex < 0 || cardIndex >= fromPile.length) {
            return false;
        }

        const cardsToMove = fromPile.slice(cardIndex);
        const bottomCard = cardsToMove[0];
        
        if (!this.canPlaceOnTableau(bottomCard, toPile)) {
            return false;
        }

        fromPile.splice(cardIndex);
        toPile.push(...cardsToMove);
        
        if (fromPile.length > 0 && !fromPile[fromPile.length - 1].faceUp) {
            fromPile[fromPile.length - 1].faceUp = true;
            this.score += 5;
        }
        
        this.moves++;
        this.saveGame();
        return true;
    }

    autoMoveToFoundation() {
        let moved = false;
        
        if (this.waste.length > 0) {
            const card = this.waste[this.waste.length - 1];
            for (let i = 0; i < 4; i++) {
                if (this.moveToFoundation(card, this.waste, i)) {
                    moved = true;
                    break;
                }
            }
        }
        
        if (!moved) {
            for (let pile of this.tableau) {
                if (pile.length > 0) {
                    const card = pile[pile.length - 1];
                    if (card.faceUp) {
                        for (let i = 0; i < 4; i++) {
                            if (this.moveToFoundation(card, pile, i)) {
                                moved = true;
                                break;
                            }
                        }
                    }
                }
                if (moved) break;
            }
        }
        
        if (moved && window.ui) {
            window.ui.render();
            if (navigator.vibrate) navigator.vibrate(10);
        }
        return moved;
    }

    checkWin() {
        const totalInFoundations = this.foundations.reduce((sum, f) => sum + f.length, 0);
        if (totalInFoundations === 52) {
            this.stopTimer();
            this.recordWin();
            setTimeout(() => this.showWinAnimation(), 300);
        }
    }

    recordWin() {
        const stats = this.loadStats();
        stats.gamesCompleted++;
        stats.gamesWon++;
        stats.currentStreak++;
        stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
        
        if (!stats.bestMoves || this.moves < stats.bestMoves) {
            stats.bestMoves = this.moves;
        }
        
        if (!stats.bestTime || this.time < stats.bestTime) {
            stats.bestTime = this.time;
        }
        
        stats.totalTime += this.time;
        
        this.saveStats(stats);
    }

    showWinAnimation() {
        document.querySelectorAll('.card').forEach((card, i) => {
            setTimeout(() => {
                card.classList.add('winning');
            }, i * 50);
        });
        
        setTimeout(() => {
            document.getElementById('winTime').textContent = this.formatTime(this.time);
            document.getElementById('winMoves').textContent = this.moves;
            document.getElementById('winScore').textContent = this.score;
            document.getElementById('winModal').classList.add('active');
            document.getElementById('overlay').classList.add('active');
            
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100, 50, 200]);
            }
        }, 1000);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    findHint() {
        if (this.waste.length > 0) {
            const card = this.waste[this.waste.length - 1];
            for (let i = 0; i < 4; i++) {
                if (this.canPlaceOnFoundation(card, i)) {
                    return { type: 'waste-to-foundation', card, target: i };
                }
            }
        }
        
        if (this.waste.length > 0) {
            const card = this.waste[this.waste.length - 1];
            for (let i = 0; i < 7; i++) {
                if (this.canPlaceOnTableau(card, this.tableau[i])) {
                    return { type: 'waste-to-tableau', card, target: i };
                }
            }
        }
        
        for (let i = 0; i < 7; i++) {
            const pile = this.tableau[i];
            if (pile.length > 0) {
                const card = pile[pile.length - 1];
                if (card.faceUp) {
                    for (let j = 0; j < 4; j++) {
                        if (this.canPlaceOnFoundation(card, j)) {
                            return { type: 'tableau-to-foundation', card, source: i, target: j };
                        }
                    }
                }
            }
        }
        
        for (let i = 0; i < 7; i++) {
            const pile = this.tableau[i];
            for (let j = pile.length - 1; j >= 0; j--) {
                if (pile[j].faceUp) {
                    for (let k = 0; k < 7; k++) {
                        if (k !== i && this.canPlaceOnTableau(pile[j], this.tableau[k])) {
                            return { type: 'tableau-to-tableau', card: pile[j], source: i, target: k };
                        }
                    }
                }
            }
        }
        
        return null;
    }

    saveGame() {
        const state = {
            stock: this.stock,
            waste: this.waste,
            tableau: this.tableau,
            foundations: this.foundations,
            score: this.score,
            moves: this.moves,
            time: this.time,
            version: VERSION
        };
        localStorage.setItem('solitaire_save', JSON.stringify(state));
    }

    loadGame() {
        const saved = localStorage.getItem('solitaire_save');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.version && state.version === VERSION) {
                    Object.assign(this, state);
                    this.startTimer();
                    return true;
                }
            } catch (e) {
                console.error('Failed to load game:', e);
            }
        }
        return false;
    }

    saveStats(stats) {
        localStorage.setItem('solitaire_stats', JSON.stringify(stats));
    }

    loadStats() {
        const saved = localStorage.getItem('solitaire_stats');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            gamesCompleted: 0,
            gamesWon: 0,
            currentStreak: 0,
            bestStreak: 0,
            totalTime: 0,
            bestTime: null,
            bestMoves: null
        };
    }
}

/**
 * UI Manager Class
 */
class UIManager {
    constructor(game) {
        this.game = game;
        this.draggedCards = [];
        this.dragSource = null;
        this.dragStartIndex = -1;
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.timeDisplay = document.getElementById('timeDisplay');
        this.movesDisplay = document.getElementById('movesDisplay');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.tableauContainer = document.getElementById('tableau');
        this.stockPile = document.getElementById('stock');
        this.wastePile = document.getElementById('waste');
    }

    initEventListeners() {
        document.getElementById('menuBtn').onclick = () => this.toggleMenu();
        document.getElementById('overlay').onclick = () => this.closeMenu();
        
        this.stockPile.onclick = () => {
            this.game.drawFromStock();
            this.render();
            if (navigator.vibrate) navigator.vibrate(10);
        };
        
        document.getElementById('versionBadge').onclick = () => this.forceReinstall();
        
        this.wastePile.ondblclick = (e) => {
            e.preventDefault();
            this.game.autoMoveToFoundation();
        };
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'h' || e.key === 'H') {
                this.showHint();
            } else if (e.key === 'n' || e.key === 'N') {
                newGame();
            }
        });
        
        this.initDragAndDrop();
    }

    initDragAndDrop() {
        let isDragging = false;
        let dragElement = null;
        let dragCards = [];
        let dragSourcePile = null;
        let dragSourceIndex = -1;
        let offsetX = 0;
        let offsetY = 0;

        const handleStart = (e) => {
            const isTouch = e.type === 'touchstart';
            const target = e.target.closest('.card');
            
            if (!target || target.classList.contains('face-down')) return;
            
            const pileElement = target.closest('.card-slot, .tableau-pile');
            if (!pileElement) return;
            
            e.preventDefault();
            
            const clientX = isTouch ? e.touches[0].clientX : e.clientX;
            const clientY = isTouch ? e.touches[0].clientY : e.clientY;
            
            const rect = target.getBoundingClientRect();
            offsetX = clientX - rect.left;
            offsetY = clientY - rect.top;
            
            const cardId = target.dataset.cardId;
            
            if (pileElement.id === 'waste') {
                dragSourcePile = this.game.waste;
                dragSourceIndex = dragSourcePile.length - 1;
                dragCards = [dragSourcePile[dragSourceIndex]];
            } else if (pileElement.classList.contains('tableau-pile')) {
                const pileIndex = parseInt(pileElement.dataset.pile);
                dragSourcePile = this.game.tableau[pileIndex];
                dragSourceIndex = parseInt(target.dataset.index);
                dragCards = dragSourcePile.slice(dragSourceIndex);
            } else {
                return;
            }
            
            isDragging = true;
            dragElement = target.cloneNode(true);
            dragElement.style.position = 'fixed';
            dragElement.style.pointerEvents = 'none';
            dragElement.style.zIndex = '10000';
            dragElement.style.left = (clientX - offsetX) + 'px';
            dragElement.style.top = (clientY - offsetY) + 'px';
            dragElement.classList.add('dragging');
            document.body.appendChild(dragElement);
            
            target.style.opacity = '0.3';
        };

        const handleMove = (e) => {
            if (!isDragging || !dragElement) return;
            
            e.preventDefault();
            
            const isTouch = e.type === 'touchmove';
            const clientX = isTouch ? e.touches[0].clientX : e.clientX;
            const clientY = isTouch ? e.touches[0].clientY : e.clientY;
            
            dragElement.style.left = (clientX - offsetX) + 'px';
            dragElement.style.top = (clientY - offsetY) + 'px';
        };

        const handleEnd = (e) => {
            if (!isDragging) return;
            
            const isTouch = e.type === 'touchend';
            const clientX = isTouch ? e.changedTouches[0].clientX : e.clientX;
            const clientY = isTouch ? e.changedTouches[0].clientY : e.clientY;
            
            if (dragElement) dragElement.remove();
            
            const elementBelow = document.elementFromPoint(clientX, clientY);
            const dropTarget = elementBelow?.closest('.card-slot, .tableau-pile');
            
            let moved = false;
            
            if (dropTarget) {
                if (dropTarget.id && dropTarget.id.startsWith('foundation-')) {
                    const foundationIndex = parseInt(dropTarget.id.split('-')[1]);
                    if (dragCards.length === 1) {
                        moved = this.game.moveToFoundation(dragCards[0], dragSourcePile, foundationIndex);
                    }
                } else if (dropTarget.classList.contains('tableau-pile')) {
                    const targetPileIndex = parseInt(dropTarget.dataset.pile);
                    const targetPile = this.game.tableau[targetPileIndex];
                    moved = this.game.moveCards(dragSourcePile, dragSourceIndex, targetPile);
                }
            }
            
            if (moved && navigator.vibrate) {
                navigator.vibrate(20);
            }
            
            document.querySelectorAll('.card').forEach(c => c.style.opacity = '');
            
            isDragging = false;
            dragElement = null;
            dragCards = [];
            dragSourcePile = null;
            dragSourceIndex = -1;
            
            this.render();
        };

        document.addEventListener('mousedown', handleStart);
        document.addEventListener('touchstart', handleStart, { passive: false });
        
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove, { passive: false });
        
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);
    }

    render() {
        this.renderTableau();
        this.renderStock();
        this.renderWaste();
        this.renderFoundations();
        this.updateStats();
    }

    renderTableau() {
        this.tableauContainer.innerHTML = '';
        
        this.game.tableau.forEach((pile, pileIndex) => {
            const pileDiv = document.createElement('div');
            pileDiv.className = 'card-slot tableau-pile';
            pileDiv.dataset.pile = pileIndex;
            
            if (pile.length === 0) {
                const placeholder = document.createElement('span');
                placeholder.className = 'pile-placeholder';
                placeholder.textContent = '👑';
                pileDiv.appendChild(placeholder);
            }
            
            pile.forEach((card, cardIndex) => {
                const cardDiv = this.createCardElement(card);
                cardDiv.style.top = (cardIndex * CARD_OFFSET) + 'px';
                cardDiv.dataset.pile = pileIndex;
                cardDiv.dataset.index = cardIndex;
                
                cardDiv.ondblclick = (e) => {
                    e.preventDefault();
                    if (cardIndex === pile.length - 1) {
                        this.game.autoMoveToFoundation();
                    }
                };
                
                pileDiv.appendChild(cardDiv);
            });
            
            this.tableauContainer.appendChild(pileDiv);
        });
    }

    createCardElement(card) {
        const div = document.createElement('div');
        const colorClass = ['hearts', 'diamonds'].includes(card.suit) ? 'red' : 'black';
        div.className = `card ${card.faceUp ? '' : 'face-down'} ${colorClass}`;
        div.dataset.cardId = card.id;
        
        if (card.faceUp) {
            const suits = { 
                hearts: '♥', 
                diamonds: '♦', 
                clubs: '♣', 
                spades: '♠' 
            };
            const displayValue = card.value === 1 ? 'A' : 
                               card.value === 11 ? 'J' : 
                               card.value === 12 ? 'Q' : 
                               card.value === 13 ? 'K' : 
                               card.value;
            
            div.innerHTML = `
                <div class="card-top">
                    <span class="card-value">${displayValue}</span>
                    <span class="card-suit">${suits[card.suit]}</span>
                </div>
                <div class="card-center">${suits[card.suit]}</div>
                <div class="card-bottom">
                    <span class="card-value">${displayValue}</span>
                    <span class="card-suit">${suits[card.suit]}</span>
                </div>
            `;
        }
        
        return div;
    }

    renderStock() {
        const placeholder = this.stockPile.querySelector('.pile-placeholder');
        this.stockPile.innerHTML = '';
        this.stockPile.appendChild(placeholder);
        
        if (this.game.stock.length > 0) {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card face-down';
            this.stockPile.appendChild(cardDiv);
        }
    }

    renderWaste() {
        const placeholder = this.wastePile.querySelector('.pile-placeholder');
        this.wastePile.innerHTML = '';
        this.wastePile.appendChild(placeholder);
        
        if (this.game.waste.length > 0) {
            const topCard = this.game.waste[this.game.waste.length - 1];
            topCard.faceUp = true;
            const cardDiv = this.createCardElement(topCard);
            
            cardDiv.ondblclick = (e) => {
                e.preventDefault();
                this.game.autoMoveToFoundation();
            };
            
            this.wastePile.appendChild(cardDiv);
        }
    }

    renderFoundations() {
        this.game.foundations.forEach((pile, i) => {
            const fPile = document.getElementById(`foundation-${i}`);
            const placeholder = fPile.querySelector('.pile-placeholder');
            fPile.innerHTML = '';
            fPile.appendChild(placeholder);
            
            if (pile.length > 0) {
                const topCard = pile[pile.length - 1];
                topCard.faceUp = true;
                fPile.appendChild(this.createCardElement(topCard));
            }
        });
    }

    updateStats() {
        const mins = Math.floor(this.game.time / 60);
        const secs = this.game.time % 60;
        this.timeDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        this.movesDisplay.textContent = this.game.moves;
        this.scoreDisplay.textContent = this.game.score;
    }

    toggleMenu() {
        const menu = document.getElementById('sideMenu');
        const overlay = document.getElementById('overlay');
        menu.classList.toggle('open');
        overlay.classList.toggle('active');
    }

    closeMenu() {
        document.getElementById('sideMenu').classList.remove('open');
        document.getElementById('overlay').classList.remove('active');
    }

    async forceReinstall() {
        if (!confirm('Are you sure? This will delete all data and reinstall the application.')) {
            return;
        }
        
        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
            
            localStorage.clear();
            
            window.location.reload(true);
        } catch (error) {
            console.error('Force reinstall failed:', error);
            alert('Reset error. Try refreshing the page.');
        }
    }

    showHint() {
        const hint = this.game.findHint();
        
        if (hint) {
            const cardElements = document.querySelectorAll(`.card[data-card-id="${hint.card.id}"]`);
            cardElements.forEach(el => {
                el.classList.add('hint-glow');
                setTimeout(() => el.classList.remove('hint-glow'), 3000);
            });
            
            if (navigator.vibrate) navigator.vibrate(50);
        } else {
            alert('No possible moves found. Try drawing from the deck.');
        }
    }
}

/**
 * PWA Manager
 */
const PWAManager = {
    currentVersion: VERSION,
    
    async init() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered:', registration);
                
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('New service worker found');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('New version available!');
                            this.showUpdateNotification();
                        }
                    });
                });
                
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);
                
            } catch (err) {
                console.log('SW registration failed:', err);
            }
        }
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = e;
            console.log('App can be installed');
        });
    },
    
    showUpdateNotification() {
        const versionBadge = document.getElementById('versionBadge');
        if (versionBadge) {
            versionBadge.style.background = '#ff9800';
            versionBadge.title = 'גרסה חדשה זמינה! לחץ לעדכון';
        }
    }
};

/**
 * Global Helper Functions
 */
function newGame() {
    if (window.game.moves > 0) {
        if (!confirm('Are you sure? The current game will be lost.')) {
            return;
        }
    }
    
    closeModal();
    window.game.stopTimer();
    window.game.init();
    window.ui.render();
    window.ui.closeMenu();
}

function showHint() {
    window.ui.showHint();
    window.ui.closeMenu();
}

function undoMove() {
    alert('Undo feature will be added in the next update');
    window.ui.closeMenu();
}

function autoComplete() {
    if (!confirm('Auto-complete will move all possible cards to foundations. Continue?')) {
        return;
    }
    
    window.ui.closeMenu();
    
    const interval = setInterval(() => {
        const moved = window.game.autoMoveToFoundation();
        if (!moved) {
            clearInterval(interval);
            if (window.game.foundations.reduce((s, f) => s + f.length, 0) === 52) {
                setTimeout(() => {
                    alert('Congratulations! Game completed!');
                }, 500);
            }
        }
    }, 300);
}

function changeTheme(theme) {
    const themes = {
        green: '--table-bg-green',
        blue: '--table-bg-blue',
        red: '--table-bg-red',
        purple: '--table-bg-purple',
        dark: '--table-bg-dark'
    };
    
    document.body.style.background = `var(${themes[theme]})`;
    localStorage.setItem('solitaire_theme', theme);
    
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.theme === theme) {
            opt.classList.add('active');
        }
    });
}

function changeCardBack(style) {
    const backs = {
        blue: '--card-back-blue',
        red: '--card-back-red',
        green: '--card-back-green'
    };
    
    document.documentElement.style.setProperty('--current-card-back', `var(${backs[style]})`);
    localStorage.setItem('solitaire_cardback', style);
    window.ui.render();
}

function showStats() {
    const stats = window.game.loadStats();
    
    document.getElementById('totalGames').textContent = stats.gamesCompleted;
    
    const winRate = stats.gamesCompleted > 0 
        ? Math.round((stats.gamesWon / stats.gamesCompleted) * 100) 
        : 0;
    document.getElementById('winRate').textContent = winRate + '%';
    
    document.getElementById('winStreak').textContent = stats.currentStreak;
    
    const avgTime = stats.gamesWon > 0 
        ? Math.round(stats.totalTime / stats.gamesWon) 
        : 0;
    document.getElementById('avgTime').textContent = window.game.formatTime(avgTime);
    
    document.getElementById('bestMoves').textContent = stats.bestMoves || '--';
    
    document.getElementById('statsModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

function resetStats() {
    if (confirm('Are you sure? All statistics will be deleted.')) {
        localStorage.removeItem('solitaire_stats');
        window.ui.closeMenu();
        alert('Statistics have been reset');
    }
}

function showHelp() {
    document.getElementById('helpModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
    window.ui.closeMenu();
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.getElementById('overlay').classList.remove('active');
}

/**
 * App Initialization
 */
function initApp() {
    console.log('Solitaire Pro v' + VERSION);
    
    window.game = new SolitaireGame();
    window.ui = new UIManager(window.game);
    
    if (!window.game.loadGame()) {
        window.game.init();
    } else {
        console.log('Loaded saved game');
    }
    
    window.ui.render();
    PWAManager.init();

    const savedTheme = localStorage.getItem('solitaire_theme') || 'green';
    changeTheme(savedTheme);
    
    const savedCardBack = localStorage.getItem('solitaire_cardback') || 'blue';
    changeCardBack(savedCardBack);

    setInterval(() => {
        if (window.game.moves > 0) {
            window.game.saveGame();
        }
    }, 5000);
    
    window.addEventListener('beforeunload', (e) => {
        if (window.game.moves > 0 && window.game.foundations.reduce((s, f) => s + f.length, 0) < 52) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
