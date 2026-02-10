/**
 * PWA MANAGER
 * Version: 2.0.0
 * Handles PWA installation, updates, and offline functionality
 */

const PWAManager = {
    version: '2.0.0',
    
    /**
     * Initialize PWA functionality
     */
    init() {
        this.updateVersionDisplay();
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupUpdateCheck();
        this.setupVersionClick();
        this.checkForUpdates();
    },

    /**
     * Update version display in UI
     */
    updateVersionDisplay() {
        const versionDisplays = document.querySelectorAll('#versionDisplay, #aboutVersion');
        versionDisplays.forEach(el => {
            if (el) el.textContent = `v${this.version}`;
        });
    },

    /**
     * Register service worker
     */
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('Service Worker not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker registered:', registration);

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('New Service Worker found');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateNotification();
                    }
                });
            });

            // Check for updates periodically
            setInterval(() => {
                registration.update();
            }, 60000); // Check every minute

        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    },

    /**
     * Setup install prompt
     */
    setupInstallPrompt() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button (optional)
            this.showInstallButton(deferredPrompt);
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA installed');
            deferredPrompt = null;
        });
    },

    /**
     * Show install button
     */
    showInstallButton(prompt) {
        // You can add an install button to the menu here
        // For now, just log
        console.log('App can be installed');
    },

    /**
     * Setup update check
     */
    setupUpdateCheck() {
        // Listen for service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('Service Worker updated');
            });
        }
    },

    /**
     * Show update notification
     */
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #2e7d32;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            display: flex;
            gap: 15px;
            align-items: center;
        `;
        
        notification.innerHTML = `
            <span>עדכון זמין</span>
            <button style="background: white; color: #2e7d32; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                טען מחדש
            </button>
        `;
        
        const button = notification.querySelector('button');
        button.addEventListener('click', () => {
            window.location.reload();
        });
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            notification.remove();
        }, 10000);
    },

    /**
     * Setup version click for hard reset
     */
    setupVersionClick() {
        const versionEl = document.getElementById('versionDisplay');
        if (!versionEl) return;

        versionEl.addEventListener('click', async () => {
            if (!confirm('האם לבצע איפוס מלא והתקנה מחדש?\n\nפעולה זו תמחק:\n- כל המטמון\n- Service Workers\n- נתוני המשחק השמורים\n- הגדרות\n\nהמשחק יטען מחדש אוטומטית.')) {
                return;
            }

            await this.hardReset();
        });
    },

    /**
     * Perform hard reset
     */
    async hardReset() {
        try {
            // 1. Unregister all service workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                    console.log('Service Worker unregistered');
                }
            }

            // 2. Clear all caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
                console.log('All caches cleared');
            }

            // 3. Clear localStorage
            localStorage.clear();
            console.log('localStorage cleared');

            // 4. Clear sessionStorage
            sessionStorage.clear();
            console.log('sessionStorage cleared');

            // 5. Clear IndexedDB (if used)
            if ('indexedDB' in window) {
                const databases = await indexedDB.databases();
                databases.forEach(db => {
                    indexedDB.deleteDatabase(db.name);
                });
                console.log('IndexedDB cleared');
            }

            // 6. Show loading message
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
                ">
                    <div style="font-size: 24px; margin-bottom: 20px;">מאפס ומתקין מחדש...</div>
                    <div style="
                        width: 50px;
                        height: 50px;
                        border: 5px solid rgba(255,255,255,0.3);
                        border-top-color: white;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    "></div>
                    <style>
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    </style>
                </div>
            `;

            // 7. Hard reload from server
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);

        } catch (error) {
            console.error('Hard reset failed:', error);
            alert('שגיאה באיפוס. נסה לרענן את הדף ידנית.');
        }
    },

    /**
     * Check for updates from server
     */
    async checkForUpdates() {
        try {
            // Try to fetch the latest version info
            const response = await fetch('./manifest.json', {
                cache: 'no-store'
            });
            
            if (response.ok) {
                const manifest = await response.json();
                // You can add version checking logic here
                console.log('Checked for updates');
            }
        } catch (error) {
            // Offline - this is fine for PWA
            console.log('Offline or no updates available');
        }
    },

    /**
     * Check if app is installed
     */
    isInstalled() {
        // Check if running in standalone mode
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone ||
               document.referrer.includes('android-app://');
    },

    /**
     * Check if online
     */
    isOnline() {
        return navigator.onLine;
    },

    /**
     * Setup online/offline detection
     */
    setupNetworkDetection() {
        window.addEventListener('online', () => {
            console.log('App is online');
            this.showNetworkStatus(true);
        });

        window.addEventListener('offline', () => {
            console.log('App is offline');
            this.showNetworkStatus(false);
        });
    },

    /**
     * Show network status notification
     */
    showNetworkStatus(isOnline) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: ${isOnline ? '#4caf50' : '#f44336'};
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
        `;
        
        notification.textContent = isOnline ? 'מקוון' : 'לא מקוון';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    /**
     * Request persistent storage
     */
    async requestPersistentStorage() {
        if ('storage' in navigator && 'persist' in navigator.storage) {
            const persistent = await navigator.storage.persist();
            console.log('Persistent storage:', persistent);
        }
    }
};

// Initialize PWA when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PWAManager.init());
} else {
    PWAManager.init();
}
