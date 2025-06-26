import { h } from 'preact';
import { useEffect } from 'preact/hooks';

const PluginHost = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = './src/debug-bridge.js';
        script.async = true;
        document.body.appendChild(script);

        const onPluginLoaded = (info) => {
            try {
                console.log("processing plugin.loaded", info);
                const token = info.token;
                const uiUrl = `http://localhost:3456/expose/${token}/`;

                if (typeof window.assignPluginToNextSlot === "function") {
                    window.assignPluginToNextSlot(token, uiUrl);
                } else {
                    console.warn("assignPluginToNextSlot not defined yet");
                }
            } catch (e) {
                console.error("Error handling plugin.loaded:", e);
            }
        };

        window.runtime.EventsOn("jetclock:plugin.loaded", onPluginLoaded);

        return () => {
            // Cleanup if needed
        };
    }, []);

    return null; // No visible UI needed
};

export default PluginHost;
