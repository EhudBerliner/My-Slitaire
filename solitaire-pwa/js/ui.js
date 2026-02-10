class UIManager {
    constructor(game) {
        this.game = game;
        this.draggedCard = null;
        this.dragSource = null; // { type: 'tableau', index: 0 }
        this.offset = { x: 0, y: 0 };
        this.elTableau = document.getElementById('tableau');
        this.elStock = document.getElementById('stock');
        this.elWaste = document.getElementById('waste');
    }

    render() {
        // Render Stock & Waste
        this.elStock.innerHTML = this.game.stock.length ? `<div class="card back" onclick="app.drawStock()"></div>` : `<div class="refresh" onclick="app.resetStock()">Start Over</div>`;
        this.elWaste.innerHTML = '';
        if (this.game.waste.length) {
            let card = this.game.waste[this.game.waste.length - 1];
            this.elWaste.appendChild(this.createCardEl(card, 'waste', 0));
        }

        // Render Foundations
        this.game.foundations.forEach((pile, idx) => {
            const el = document.getElementById(`f-${idx}`);
            el.innerHTML = pile.length ? '' : el.getAttribute('data-suit'); // Clear or show symbol
            if (pile.length) {
                el.appendChild(this.createCardEl(pile[pile.length - 1], 'foundation', idx));
            }
        });

        // Render Tableau
        this.elTableau.innerHTML = '';
        this.game.tableau.forEach((col, colIdx) => {
            let colDiv = document.createElement('div');
            colDiv.className = 'tableau-col';
            colDiv.dataset.idx = colIdx;
            
            // Empty column drop zone
            colDiv.addEventListener('pointerup', (e) => this.handleDrop(e, 'tableau', colIdx));

            let topOffset = 0;
            col.forEach((card, cardIdx) => {
                let cardEl = this.createCardEl(card, 'tableau', colIdx);
                cardEl.style.top = `${topOffset}px`;
                cardEl.style.zIndex = cardIdx;
                
                // Event Listeners for Drag
                if (card.faceUp) {
                    this.addDragEvents(cardEl, card, colIdx, cardIdx);
                }
                
                colDiv.appendChild(cardEl);
                topOffset += card.faceUp ? 30 : 10; // Condensed view for face down
            });
            this.elTableau.appendChild(colDiv);
        });

        // Update Stats
        document.getElementById('scoreDisplay').innerText = this.game.score;
        document.getElementById('movesDisplay').innerText = this.game.moves;
    }

    createCardEl(card, source, idx) {
        let el = document.createElement('div');
        el.className = `card ${card.faceUp ? card.color : 'back'}`;
        el.id = card.id;
        
        if (card.faceUp) {
            const suitMap = { 'h':'♥', 'd':'♦', 'c':'♣', 's':'♠' };
            const valMap = { 1:'A', 11:'J', 12:'Q', 13:'K' };
            let val = valMap[card.value] || card.value;
            el.innerHTML = `<div class="top">${val} ${suitMap[card.suit]}</div><div class="center">${suitMap[card.suit]}</div>`;
        }
        return el;
    }

    addDragEvents(el, card, colIdx, cardIdx) {
        el.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.draggedCard = { el, card, colIdx, cardIdx };
            this.game.saveState(); // Save before move
            
            // Calculate Offset
            const rect = el.getBoundingClientRect();
            this.offset.x = e.clientX - rect.left;
            this.offset.y = e.clientY - rect.top;
            
            el.classList.add('dragging');
            el.setPointerCapture(e.pointerId);
            
            // Allow dragging a stack
            this.draggedStack = [];
            if (this.game.tableau[colIdx]) {
                this.draggedStack = this.game.tableau[colIdx].slice(cardIdx);
            }
        });

        el.addEventListener('pointermove', (e) => {
            if (!this.draggedCard || this.draggedCard.el !== el) return;
            el.style.left = `${e.clientX - this.offset.x - el.parentElement.getBoundingClientRect().left}px`;
            el.style.top = `${e.clientY - this.offset.y - el.parentElement.getBoundingClientRect().top}px`;
        });

        el.addEventListener('pointerup', (e) => {
            if (!this.draggedCard) return;
            el.classList.remove('dragging');
            el.releasePointerCapture(e.pointerId);
            
            // Check drops (Logic handled in handleDrop via elementFromPoint usually, 
            // but here we rely on the event bubbling to the drop target if we hide the dragged element)
            // Implementation simplified: Drop logic is triggered by the TARGET element's pointerup
            
            this.draggedCard = null;
            this.render(); // Re-render snaps back if no valid drop
        });
    }

    handleDrop(e, targetType, targetIdx) {
        if (!this.draggedCard) return;
        // Logic to validate move and update Game State
        // This connects UI drag to Game Logic
        let card = this.draggedCard.card;
        let valid = false;
        
        // ... (Full validation logic to be connected in main.js)
        // For brevity: call app.attemptMove(card, targetType, targetIdx);
        app.attemptMove(this.draggedCard, targetType, targetIdx);
        e.stopPropagation();
    }
}