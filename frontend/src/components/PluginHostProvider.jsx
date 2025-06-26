import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { PluginContext } from '../contexts/PluginContext';

const loadOrder = [6, 12, 3, 9, 2, 10, 4, 8, 1, 11, 5, 7];

export default function PluginHostProvider({ children }) {
    const [nextSlotIndex, setNextSlotIndex] = useState(0);

    const assignPluginToNextSlot = (pluginToken, pluginUrl) => {
        if (nextSlotIndex >= loadOrder.length) {
            console.error("pluginHost: all 12 slots are filled");
            return;
        }

        const hour = loadOrder[nextSlotIndex];
        const slotId = `slot-${hour}`;
        const iframe = document.getElementById(slotId);

        if (!iframe) {
            console.error("pluginHost: missing iframe with id", slotId);
            return;
        }

        iframe.setAttribute("data-plugin-token", pluginToken);
        iframe.src = `${pluginUrl}?pluginToken=${pluginToken}`;
        iframe.style.display = "block";

        subscribeToPluginEvents(pluginToken);
        setNextSlotIndex(i => i + 1);
    };

    const subscribeToPluginEvents = (pluginToken) => {
        if (!window.runtime || !window.runtime.EventsOn) {
            console.warn("pluginHost: Wails EventsOn not available");
            return;
        }

        window.runtime.EventsOn(`plugin.event:${pluginToken}`, (raw) => {
            const iframe = document.querySelector(`iframe[data-plugin-token="${pluginToken}"]`);
            if (!iframe) return;

            try {
                const data = JSON.parse(raw);
                data.pluginToken = pluginToken;
                iframe.contentWindow.postMessage(data, "*");
            } catch (err) {
                console.error("pluginHost: invalid JSON", err, raw);
            }
        });
    };

    useEffect(() => {
        const handleMessage = (event) => {
            const data = event.data;
            if (!data || typeof data !== "object") return;

            const { pluginToken } = data;
            if (typeof pluginToken !== "string") return;

            try {
                window.runtime.EventsEmit("plugin.message", JSON.stringify(data));
            } catch (err) {
                console.warn("pluginHost: Wails not ready?", err);
            }
        };

        window.addEventListener("message", handleMessage);

        // Load the debug-bridge and pluginHost.js
        const pluginHostScript = document.createElement("script");
        pluginHostScript.src = "/src/utils/debug-bridge.js";
        pluginHostScript.async = true;
        document.body.appendChild(pluginHostScript);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    useEffect(() => {
        if (!window.runtime?.EventsOn) return;
        window.runtime.EventsOn("jetclock:plugin.loaded", (info) => {
            try {
                const token = info.token;
                const uiUrl = `http://localhost:3456/expose/${token}/`;
                assignPluginToNextSlot(token, uiUrl);
            } catch (e) {
                console.error("plugin.loaded error:", e);
            }
        });
    }, [nextSlotIndex]);

    return (
        <PluginContext.Provider value={{ assignPluginToNextSlot }}>
            {children}
        </PluginContext.Provider>
    );
}
