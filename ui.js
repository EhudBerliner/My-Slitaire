/**
 * SOLITAIRE UI MANAGER
 * Version: 2.0.0
 * Handles all UI rendering and interactions
 */

class UIManager {
    constructor(game) {
        this.game = game;
        this.draggedCard = null;
        this.draggedSource = null;
        this.draggedIndex = null;
        this.touchStartTime = 0;
        this.animationsEnabled = true;
        
        this.initElements();
        this.initEventListeners();
        this.updateDisplay();
    }

    /**
     * Initialize DOM element references
     */
    initElements() {
        // Header elements
        this.timeDisplay = document.getElementById('timeDisplay');
        this.movesDisplay = document.getElementById('movesDisplay');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.versionDisplay = document.getElementById('versionDisplay');
        
        // Game board elements
        this.stockPile = document.getElementById('stock');
        this.wastePile = document.getElementById('waste');
        this.foundationPiles = [
            document.getElementById('foundation-0'),
            document.getElementById('foundation-1'),
            document.getElementById('foundation-2'),
            document.getElementById('foundation-3')
        ];
        this.tableauContainer = document.getElementById('tableau');
        
        // Menu elements
        this.sideMenu = document.getElementById('sideMenu');
        this.overlay = document.getElementById('overlay');
        
        // Buttons
        this.menuBtn = document.getElementById('menuBtn');
        this.closeMenuBtn = document.getElementById('closeMenuBtn');
        this.undoBtn = document.getElementById('undoBtn');
        this.hintBtn = document.getElementById('hintBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.autoCompleteBtn = document.getElementById('autoCompleteBtn');
        this.newGameFromWin = document.getElementById('newGameFromWin');
        this.resetStatsBtn = document.getElementById('resetStatsBtn');
        
        // Settings
        this.difficultySelect = document.getElementById('difficultySelect');
        this.tableThemeSelect = document.getElementById('tableThemeSelect');
        this.cardBackSelect = document.getElementById('cardBackSelect');
        this.soundToggle = document.getElementById('soundToggle');
        this.animationsToggle = document.getElementById('animationsToggle');
        this.largeCardsToggle = document.getElementById('largeCardsToggle');
        
        // Stats elements
        this.statsGamesPlayed = document.getElementById('statsGamesPlayed');
        this.statsGamesWon = document.getElementById('statsGamesWon');
        this.statsWinRate = document.getElementById('statsWinRate');
        this.statsBestScore = document.getElementById('statsBestScore');
        this.statsAvgTime = document.getElementById('statsAvgTime');
        
        // Modal
        this.winModal = document.getElementById('winModal');
        this.hintIndicator = document.getElementById('hintIndicator');
    }

    /**
     * Initialize all event listeners
     */
    initEventListeners() {
        // Menu toggle
        this.menuBtn.addEventListener('click', () => this.openMenu());
        this.closeMenuBtn.addEventListener('click', () => this.closeMenu());
        this.overlay.addEventListener('click', () => this.closeMenu());
        
        // Game controls
        this.undoBtn.addEventListener('click', () => this.handleUndo());
        this.hintBtn.addEventListener('click', () => this.handleHint());
        this.newGameBtn.addEventListener('click', () => this.handleNewGame());
        this.autoCompleteBtn.addEventListener('click', () => this.handleAutoComplete());
        this.newGameFromWin.addEventListener('click', () => this.handleNewGame());
        this.resetStatsBtn.addEventListener('click', () => this.handleResetStats());
        
        // Stock pile
        this.stockPile.addEventListener('click', () => this.handleStockClick());
        
        // Settings
        this.difficultySelect.addEventListener('change', (e) => this.handleDifficultyChange(e));
        this.tableThemeSelect.addEventListener('change', (e) => this.handleThemeChange(e));
        this.cardBackSelect.addEventListener('change', (e) => this.handleCardBackChange(e));
        this.soundToggle.addEventListener('change', (e) => this.handleSoundToggle(e));
        this.animationsToggle.addEventListener('change', (e) => this.handleAnimationsToggle(e));
        this.largeCardsToggle.addEventListener('change', (e) => this.handleLargeCardsToggle(e));
        
        // Timer update
        setInterval(() => this.updateTime(), 1000);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Apply saved settings
        this.applySavedSettings();
    }

    /**
     * Render the entire game board
     */
    render() {
        this.renderStock();
        this.renderWaste();
        this.renderFoundations();
        this.renderTableau();
        this.updateDisplay();
        this.game.saveGame();
    }

    /**
     * Render stock pile
     */
    renderStock() {
        this.stockPile.innerHTML = '';
        
        if (this.game.stock.length > 0) {
            const cardEl = this.createCardElement(this.game.stock[this.game.stock.length - 1], false);
            this.stockPile.appendChild(cardEl);
        } else {
            // Show refresh icon
            const placeholder = document.createElement('div');
            placeholder.className = 'pile-placeholder';
            placeholder.innerHTML = `
                <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" opacity="0.5" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                </svg>
            `;
            this.stockPile.appendChild(placeholder);
        }
    }

    /**
     * Render waste pile
     */
    renderWaste() {
        this.wastePile.innerHTML = '';
        
        const visibleCards = Math.min(3, this.game.waste.length);
        const startIndex = Math.max(0, this.game.waste.length - visibleCards);
        
        for (let i = startIndex; i < this.game.waste.length; i++) {
            const card = this.game.waste[i];
            const cardEl = this.createCardElement(card, true);
            cardEl.style.position = 'absolute';
            cardEl.style.left = `${(i - startIndex) * 20}px`;
            cardEl.style.zIndex = i;
            
            // Only top card is draggable
            if (i === this.game.waste.length - 1) {
                this.makeDraggable(cardEl, 'waste', i);
            }
            
            this.wastePile.appendChild(cardEl);
        }
    }

    /**
     * Render foundation piles
     */
    renderFoundations() {
        for (let i = 0; i < 4; i++) {
            const pile = this.game.foundations[i];
            const pileEl = this.foundationPiles[i];
            pileEl.innerHTML = '';
            
            if (pile.length > 0) {
                const card = pile[pile.length - 1];
                const cardEl = this.createCardElement(card, true);
                this.makeDraggable(cardEl, 'foundation', i);
                pileEl.appendChild(cardEl);
            } else {
                const placeholder = document.createElement('div');
                placeholder.className = 'pile-placeholder';
                const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
                const symbols = ['♥', '♦', '♣', '♠'];
                placeholder.textContent = symbols[i];
                pileEl.appendChild(placeholder);
            }
            
            // Make foundation a drop target
            this.makeDropTarget(pileEl, 'foundation', i);
        }
    }

    /**
     * Render tableau piles
     */
    renderTableau() {
        this.tableauContainer.innerHTML = '';
        
        for (let colIdx = 0; colIdx < 7; colIdx++) {
            const pile = this.game.tableau[colIdx];
            const colEl = document.createElement('div');
            colEl.className = 'tableau-col';
            colEl.dataset.index = colIdx;
            
            let topOffset = 0;
            pile.forEach((card, cardIdx) => {
                const cardEl = this.createCardElement(card, card.faceUp);
                cardEl.style.top = `${topOffset}px`;
                cardEl.style.zIndex = cardIdx;
                
                if (card.faceUp) {
                    this.makeDraggable(cardEl, 'tableau', colIdx, cardIdx);
                }
                
                colEl.appendChild(cardEl);
                topOffset += card.faceUp ? 30 : 15;
            });
            
            // Make tableau column a drop target
            this.makeDropTarget(colEl, 'tableau', colIdx);
            
            this.tableauContainer.appendChild(colEl);
        }
    }

    /**
     * Create a card element
     */
    createCardElement(card, faceUp) {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${faceUp ? card.color : 'back'}`;
        
        if (faceUp) {
            const suitSymbols = {
                'hearts': '♥',
                'diamonds': '♦',
                'clubs': '♣',
                'spades': '♠'
            };
            
            const valueSymbols = {
                1: 'A',
                11: 'J',
                12: 'Q',
                13: 'K'
            };
            
            const value = valueSymbols[card.value] || card.value;
            const suit = suitSymbols[card.suit];
            
            cardEl.innerHTML = `
                <div class="card-top">${value}${suit}</div>
                <div class="card-center">${suit}</div>
                <div class="card-bottom">${value}${suit}</div>
            `;
        }
        
        // Store card data
        cardEl.dataset.suit = card.suit;
        cardEl.dataset.value = card.value;
        cardEl.dataset.color = card.color;
        
        return cardEl;
    }

    /**
     * Make a card draggable
     */
    makeDraggable(cardEl, source, sourceIndex, cardIndex = null) {
        let startX, startY, offsetX, offsetY;
        let isDragging = false;
        
        const handleStart = (e) => {
            e.preventDefault();
            
            const touch = e.type.includes('touch') ? e.touches[0] : e;
            const rect = cardEl.getBoundingClientRect();
            
            startX = touch.clientX;
            startY = touch.clientY;
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;
            
            this.draggedCard = cardEl;
            this.draggedSource = source;
            this.draggedSourceIndex = sourceIndex;
            this.draggedCardIndex = cardIndex;
            
            cardEl.classList.add('dragging');
            this.game.saveState();
            
            // Add move listener
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('touchmove', handleMove);
            document.addEventListener('mouseup', handleEnd);
            document.addEventListener('touchend', handleEnd);
        };
        
        const handleMove = (e) => {
            if (!this.draggedCard) return;
            isDragging = true;
            
            const touch = e.type.includes('touch') ? e.touches[0] : e;
            
            // Update card position
            this.draggedCard.style.position = 'fixed';
            this.draggedCard.style.left = `${touch.clientX - offsetX}px`;
            this.draggedCard.style.top = `${touch.clientY - offsetY}px`;
            this.draggedCard.style.zIndex = '9999';
            
            // Highlight drop targets
            this.highlightDropTargets(touch.clientX, touch.clientY);
        };
        
        const handleEnd = (e) => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchend', handleEnd);
            
            if (isDragging) {
                const touch = e.type.includes('touch') ? e.changedTouches[0] : e;
                this.handleDrop(touch.clientX, touch.clientY);
            }
            
            this.clearHighlights();
            this.draggedCard = null;
            isDragging = false;
            
            this.render();
        };
        
        cardEl.addEventListener('mousedown', handleStart);
        cardEl.addEventListener('touchstart', handleStart, { passive: false });
    }

    /**
     * Make an element a drop target
     */
    makeDropTarget(element, type, index) {
        element.dataset.dropType = type;
        element.dataset.dropIndex = index;
    }

    /**
     * Highlight valid drop targets
     */
    highlightDropTargets(x, y) {
        this.clearHighlights();
        
        const element = document.elementFromPoint(x, y);
        if (!element) return;
        
        const dropTarget = element.closest('[data-drop-type]');
        if (dropTarget) {
            const card = {
                suit: this.draggedCard.dataset.suit,
                value: parseInt(this.draggedCard.dataset.value),
                color: this.draggedCard.dataset.color
            };
            
            const targetType = dropTarget.dataset.dropType;
            const targetIndex = parseInt(dropTarget.dataset.dropIndex);
            
            let isValid = false;
            
            if (targetType === 'foundation') {
                const pile = this.game.foundations[targetIndex];
                const targetCard = pile.length > 0 ? pile[pile.length - 1] : null;
                isValid = this.game.isValidFoundationMove(card, targetCard);
            } else if (targetType === 'tableau') {
                const pile = this.game.tableau[targetIndex];
                const targetCard = pile.length > 0 ? pile[pile.length - 1] : null;
                isValid = this.game.isValidTableauMove(card, targetCard);
            }
            
            if (isValid) {
                dropTarget.classList.add('drop-target');
            }
        }
    }

    /**
     * Clear all drop target highlights
     */
    clearHighlights() {
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
    }

    /**
     * Handle card drop
     */
    handleDrop(x, y) {
        const element = document.elementFromPoint(x, y);
        if (!element) return;
        
        const dropTarget = element.closest('[data-drop-type]');
        if (!dropTarget) return;
        
        const targetType = dropTarget.dataset.dropType;
        const targetIndex = parseInt(dropTarget.dataset.dropIndex);
        
        let success = false;
        
        if (this.draggedSource === 'waste') {
            if (targetType === 'foundation') {
                success = this.game.moveWasteToFoundation(targetIndex);
            } else if (targetType === 'tableau') {
                success = this.game.moveWasteToTableau(targetIndex);
            }
        } else if (this.draggedSource === 'tableau') {
            if (targetType === 'foundation') {
                success = this.game.moveTableauToFoundation(this.draggedSourceIndex, this.draggedCardIndex, targetIndex);
            } else if (targetType === 'tableau') {
                success = this.game.moveTableauToTableau(this.draggedSourceIndex, this.draggedCardIndex, targetIndex);
            }
        } else if (this.draggedSource === 'foundation') {
            if (targetType === 'tableau') {
                success = this.game.moveFoundationToTableau(this.draggedSourceIndex, targetIndex);
            }
        }
        
        if (success) {
            this.playSound('move');
            this.triggerHaptic();
            
            // Check for win
            if (this.game.isWon()) {
                setTimeout(() => this.showWinModal(), 500);
            }
        }
    }

    /**
     * Handle stock pile click
     */
    handleStockClick() {
        if (this.game.drawFromStock()) {
            this.playSound('card');
            this.render();
        }
    }

    /**
     * Handle undo button
     */
    handleUndo() {
        if (this.game.undo()) {
            this.playSound('undo');
            this.render();
        }
    }

    /**
     * Handle hint button
     */
    handleHint() {
        const hint = this.game.findHint();
        
        if (!hint) {
            this.showHintMessage('אין מהלכים זמינים');
            return;
        }
        
        this.playSound('hint');
        
        // Highlight the hint
        if (hint.type === 'draw-stock') {
            this.showHintMessage('שלוף קלף מהקופה');
            this.stockPile.style.animation = 'pulse 0.6s ease 3';
            setTimeout(() => {
                this.stockPile.style.animation = '';
            }, 1800);
        } else {
            this.showHintMessage('מהלך אפשרי מסומן בהבהוב');
            this.highlightHint(hint);
        }
    }

    /**
     * Highlight hint on board
     */
    highlightHint(hint) {
        // This will be handled by adding pulse animation to relevant cards
        // Implementation depends on hint type
        setTimeout(() => {
            // Remove highlights
        }, 2000);
    }

    /**
     * Show hint message
     */
    showHintMessage(message) {
        this.hintIndicator.textContent = message;
        this.hintIndicator.classList.add('active');
        setTimeout(() => {
            this.hintIndicator.classList.remove('active');
        }, 2000);
    }

    /**
     * Handle new game
     */
    handleNewGame() {
        if (confirm('האם להתחיל משחק חדש?')) {
            this.game.init();
            this.render();
            this.closeMenu();
            this.hideWinModal();
            this.playSound('shuffle');
        }
    }

    /**
     * Handle auto-complete
     */
    handleAutoComplete() {
        if (this.game.canAutoComplete()) {
            this.game.autoComplete();
            this.render();
            setTimeout(() => this.showWinModal(), 500);
            this.closeMenu();
        } else {
            this.showHintMessage('לא ניתן להשלים אוטומטית כעת');
        }
    }

    /**
     * Handle reset stats
     */
    handleResetStats() {
        if (confirm('האם לאפס את כל הסטטיסטיקות?')) {
            this.game.resetStats();
            this.updateStatsDisplay();
        }
    }

    /**
     * Handle difficulty change
     */
    handleDifficultyChange(e) {
        this.game.drawCount = parseInt(e.target.value);
        this.game.saveSettings();
    }

    /**
     * Handle theme change
     */
    handleThemeChange(e) {
        const theme = e.target.value;
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        if (theme !== 'green') {
            document.body.classList.add(`theme-${theme}`);
        }
        localStorage.setItem('solitaire_theme', theme);
    }

    /**
     * Handle card back change
     */
    handleCardBackChange(e) {
        const cardBack = e.target.value;
        document.body.className = document.body.className.replace(/card-back-\w+/g, '');
        if (cardBack !== 'blue') {
            document.body.classList.add(`card-back-${cardBack}`);
        }
        localStorage.setItem('solitaire_cardback', cardBack);
    }

    /**
     * Handle sound toggle
     */
    handleSoundToggle(e) {
        this.game.settings.sound = e.target.checked;
        this.game.saveSettings();
    }

    /**
     * Handle animations toggle
     */
    handleAnimationsToggle(e) {
        this.game.settings.animations = e.target.checked;
        this.animationsEnabled = e.target.checked;
        
        if (!e.target.checked) {
            document.body.classList.add('no-animations');
        } else {
            document.body.classList.remove('no-animations');
        }
        
        this.game.saveSettings();
    }

    /**
     * Handle large cards toggle
     */
    handleLargeCardsToggle(e) {
        this.game.settings.largeCards = e.target.checked;
        
        if (e.target.checked) {
            document.body.classList.add('large-cards');
        } else {
            document.body.classList.remove('large-cards');
        }
        
        this.game.saveSettings();
    }

    /**
     * Apply saved settings
     */
    applySavedSettings() {
        // Theme
        const theme = localStorage.getItem('solitaire_theme') || 'green';
        this.tableThemeSelect.value = theme;
        if (theme !== 'green') {
            document.body.classList.add(`theme-${theme}`);
        }
        
        // Card back
        const cardBack = localStorage.getItem('solitaire_cardback') || 'blue';
        this.cardBackSelect.value = cardBack;
        if (cardBack !== 'blue') {
            document.body.classList.add(`card-back-${cardBack}`);
        }
        
        // Settings
        this.difficultySelect.value = this.game.drawCount;
        this.soundToggle.checked = this.game.settings.sound;
        this.animationsToggle.checked = this.game.settings.animations;
        this.largeCardsToggle.checked = this.game.settings.largeCards;
        
        if (!this.game.settings.animations) {
            document.body.classList.add('no-animations');
        }
        
        if (this.game.settings.largeCards) {
            document.body.classList.add('large-cards');
        }
    }

    /**
     * Update display (score, moves, time)
     */
    updateDisplay() {
        this.scoreDisplay.textContent = this.game.score;
        this.movesDisplay.textContent = this.game.moves;
        this.updateStatsDisplay();
    }

    /**
     * Update time display
     */
    updateTime() {
        this.timeDisplay.textContent = this.game.formatTime(this.game.time);
    }

    /**
     * Update stats display
     */
    updateStatsDisplay() {
        this.statsGamesPlayed.textContent = this.game.stats.gamesPlayed;
        this.statsGamesWon.textContent = this.game.stats.gamesWon;
        this.statsWinRate.textContent = `${this.game.getWinRate()}%`;
        this.statsBestScore.textContent = this.game.stats.bestScore;
        this.statsAvgTime.textContent = this.game.formatTime(this.game.getAverageTime());
    }

    /**
     * Show win modal
     */
    showWinModal() {
        const winData = this.game.winGame();
        
        document.getElementById('winTime').textContent = this.game.formatTime(winData.time);
        document.getElementById('winMoves').textContent = winData.moves;
        document.getElementById('winScore').textContent = winData.score;
        
        this.winModal.classList.add('active');
        this.playSound('win');
        this.createConfetti();
        this.updateStatsDisplay();
    }

    /**
     * Hide win modal
     */
    hideWinModal() {
        this.winModal.classList.remove('active');
    }

    /**
     * Create confetti animation
     */
    createConfetti() {
        const container = document.getElementById('confettiContainer');
        container.innerHTML = '';
        
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = `${Math.random() * 3}s`;
            confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
            container.appendChild(confetti);
        }
    }

    /**
     * Open side menu
     */
    openMenu() {
        this.sideMenu.classList.add('open');
        this.overlay.classList.add('active');
        this.updateStatsDisplay();
    }

    /**
     * Close side menu
     */
    closeMenu() {
        this.sideMenu.classList.remove('open');
        this.overlay.classList.remove('active');
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        // Ctrl/Cmd + Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            this.handleUndo();
        }
        
        // H for hint
        if (e.key === 'h' || e.key === 'H') {
            this.handleHint();
        }
        
        // N for new game
        if (e.key === 'n' || e.key === 'N') {
            this.handleNewGame();
        }
        
        // Space for draw
        if (e.key === ' ') {
            e.preventDefault();
            this.handleStockClick();
        }
    }

    /**
     * Play sound effect
     */
    playSound(type) {
        if (!this.game.settings.sound) return;
        
        // Create simple beep sounds using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch (type) {
            case 'move':
                oscillator.frequency.value = 523.25; // C5
                gainNode.gain.value = 0.1;
                break;
            case 'card':
                oscillator.frequency.value = 392.00; // G4
                gainNode.gain.value = 0.1;
                break;
            case 'undo':
                oscillator.frequency.value = 329.63; // E4
                gainNode.gain.value = 0.1;
                break;
            case 'hint':
                oscillator.frequency.value = 659.25; // E5
                gainNode.gain.value = 0.1;
                break;
            case 'win':
                oscillator.frequency.value = 783.99; // G5
                gainNode.gain.value = 0.15;
                break;
            case 'shuffle':
                oscillator.frequency.value = 261.63; // C4
                gainNode.gain.value = 0.1;
                break;
        }
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    /**
     * Trigger haptic feedback
     */
    triggerHaptic() {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }
}
