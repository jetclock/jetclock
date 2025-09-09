/**
 * JetClock Device Control Library
 * 
 * This library provides a clean interface for controlling JetClock hardware
 * from within the iframe application.
 * 
 * Usage:
 *   import JetClockDevice from './jetclock-device.js';
 *   const device = new JetClockDevice();
 *   await device.init();
 *   await device.screen.off();
 */

class JetClockDevice {
    constructor() {
        this._messageId = 0;
        this._pendingRequests = new Map();
        this._initialized = false;
        this._systemInfo = null;
        
        // Create namespaced APIs using direct Go method calls
        this.screen = {
            // Turn screen on at full brightness
            on: () => this._callMethod('SetBrightness', [100]),
            // Turn screen off
            off: () => this._callMethod('SetBrightness', [0]),
            // Toggle between off and full brightness
            toggle: async () => {
                const brightness = await this._callMethod('GetBrightness');
                return this._callMethod('SetBrightness', [brightness > 0 ? 0 : 100]);
            },
            // Get current brightness status
            status: async () => {
                const brightness = await this._callMethod('GetBrightness');
                return { 
                    screenOn: brightness > 0,
                    brightness: brightness 
                };
            },
            // Set brightness as percentage (0-100)
            setBrightness: (level) => {
                // Ensure level is between 0-100
                level = Math.max(0, Math.min(100, level));
                return this._callMethod('SetBrightness', [level]);
            },
            // Get current brightness level (0-100)
            getBrightness: () => this._callMethod('GetBrightness')
        };
        
        this.system = {
            reboot: () => this._callMethod('Reboot'),
            reload: () => this._callMethod('reloadIframe'),
            info: async () => {
                if (!this._systemInfo) {
                    const [systemID, version] = await Promise.all([
                        this._callMethod('GetSystemID'),
                        this._callMethod('GetVersion')
                    ]);
                    this._systemInfo = { systemID, version };
                }
                return this._systemInfo;
            }
        };
    }
    
    /**
     * Initialize the device communication
     * @returns {Promise<Object>} System information
     */
    async init() {
        if (this._initialized) {
            return this._systemInfo;
        }
        
        // Set up message listener
        window.addEventListener('message', this._handleMessage.bind(this));
        
        // Get initial system info
        this._systemInfo = await this.system.info();
        this._initialized = true;
        
        console.log('JetClock Device initialized:', this._systemInfo);
        return this._systemInfo;
    }
    
    /**
     * Check if running in JetClock environment
     * @returns {boolean}
     */
    static isJetClockEnvironment() {
        return window.parent !== window && 
               (window.location.hostname === 'app.jetclock.io' || 
                window.location.hostname === 'localhost');
    }
    
    /**
     * Call a Go method through the parent window
     * @private
     */
    _callMethod(method, args = []) {
        if (!JetClockDevice.isJetClockEnvironment()) {
            console.warn('Not running in JetClock environment, method simulated:', method, args);
            // Return mock data for development
            return Promise.resolve(this._getMockResponse(method));
        }
        
        return new Promise((resolve, reject) => {
            const messageId = ++this._messageId;
            const timeoutId = setTimeout(() => {
                this._pendingRequests.delete(messageId);
                reject(new Error(`Method '${method}' timed out after 5 seconds`));
            }, 5000);
            
            this._pendingRequests.set(messageId, {
                resolve,
                reject,
                timeoutId,
                method
            });
            
            window.parent.postMessage({
                method,
                args,
                messageId
            }, '*');
        });
    }
    
    /**
     * Handle incoming messages from parent
     * @private
     */
    _handleMessage(event) {
        const { method, result, error } = event.data || {};
        
        if (!method) {
            return;
        }
        
        // Find matching request by method
        for (const [id, request] of this._pendingRequests.entries()) {
            if (request.method === method) {
                clearTimeout(request.timeoutId);
                this._pendingRequests.delete(id);
                
                if (error) {
                    request.reject(new Error(error));
                } else {
                    request.resolve(result);
                }
                break;
            }
        }
    }
    
    /**
     * Get mock response for development
     * @private
     */
    _getMockResponse(method) {
        const mockResponses = {
            'GetSystemID': 'dev-mock-id',
            'GetVersion': 'dev-0.0.0',
            'GetBrightness': 1,
            'SetBrightness': { success: true },
            'Reboot': { success: true },
            'reloadIframe': { success: true }
        };
        return mockResponses[method] || { success: true };
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        window.removeEventListener('message', this._handleMessage.bind(this));
        for (const request of this._pendingRequests.values()) {
            clearTimeout(request.timeoutId);
        }
        this._pendingRequests.clear();
    }
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    window.JetClockDevice = JetClockDevice;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JetClockDevice;
}

export default JetClockDevice;