const APP_VERSION = 'v1.0.1'; // Change this to trigger updates

const PWA = {
    init() {
        this.updateVersionUI();
        this.registerSW();
        this.handleInstallPrompt();
    },

    updateVersionUI() {
        const vEl = document.getElementById('versionDisplay');
        if(vEl) {
            vEl.textContent = APP_VERSION;
            vEl.addEventListener('click', this.hardReset);
        }
    },

    async hardReset() {
        if(!confirm(`לבצע איפוס מלא לגרסה ${APP_VERSION}? כל המידע יימחק.`)) return;
        
        // 1. Unregister SW
        if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (let reg of regs) await reg.unregister();
        }
        
        // 2. Clear Caches
        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
        }
        
        // 3. Clear Storage
        localStorage.clear();
        
        // 4. Reload
        window.location.reload(true);
    },

    registerSW() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('SW Registered', reg))
                .catch(err => console.log('SW Error', err));
        }
    },

    handleInstallPrompt() {
        let deferredPrompt;
        const installBtn = document.getElementById('installBtn');
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.style.display = 'block';
            
            installBtn.addEventListener('click', () => {
                installBtn.style.display = 'none';
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choice) => {
                    console.log('User choice:', choice.outcome);
                    deferredPrompt = null;
                });
            });
        });
    }
};

PWA.init();