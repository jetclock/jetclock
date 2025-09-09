// JetClock API for iframe communication
// This file can be included in the iframe app to communicate with the parent window

class JetClockAPI {
    constructor() {
        this.messageId = 0;
        this.pendingCallbacks = new Map();
        this.origin = window.location.origin;
        
        // Set up message listener for responses
        window.addEventListener('message', (event) => {
            const { type, payload, error } = event.data || {};
            
            if (type && type.endsWith('_response')) {
                const messageType = type.replace('_response', '');
                const callbacks = this.pendingCallbacks.get(messageType);
                
                if (callbacks) {
                    callbacks.forEach(callback => {
                        if (error) {
                            callback.reject(new Error(error));
                        } else {
                            callback.resolve(payload);
                        }
                    });
                    this.pendingCallbacks.delete(messageType);
                }
            }
        });
    }
    
    sendMessage(type, payload = {}) {
        return new Promise((resolve, reject) => {
            // Store callback for response
            if (!this.pendingCallbacks.has(type)) {
                this.pendingCallbacks.set(type, []);
            }
            this.pendingCallbacks.get(type).push({ resolve, reject });
            
            // Send message to parent
            window.parent.postMessage({
                type,
                payload,
                messageId: ++this.messageId
            }, '*'); // Parent will verify origin
            
            // Timeout after 5 seconds
            setTimeout(() => {
                const callbacks = this.pendingCallbacks.get(type);
                if (callbacks) {
                    const index = callbacks.findIndex(cb => cb.resolve === resolve);
                    if (index !== -1) {
                        callbacks.splice(index, 1);
                        reject(new Error('Request timeout'));
                    }
                }
            }, 5000);
        });
    }
    
    // Reboot the device
    async reboot() {
        return this.sendMessage('reboot');
    }
    
    // Turn screen on/off
    async setScreenOn(screenOn) {
        return this.sendMessage('setScreenOn', { screenOn });
    }
    
    // Get current screen status
    async getScreenStatus() {
        return this.sendMessage('getScreenStatus');
    }
    
    // Force reload the iframe
    async reloadIframe() {
        return this.sendMessage('reloadIframe');
    }
    
    // Get system information
    async getSystemInfo() {
        return this.sendMessage('getSystemInfo');
    }
}

// Export for use in iframe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JetClockAPI;
} else {
    window.JetClockAPI = JetClockAPI;
}