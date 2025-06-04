// pluginHost.js
;(function(window) {
    // ────────────────────────────────────────────────────────────────────────────────
    // 1) Plugin → Go: catch any postMessage from iframes and forward into Wails.
    // ────────────────────────────────────────────────────────────────────────────────
    window.addEventListener("message", (event) => {
        console.log("received:", event, event.data)
        const data = event.data;
        if (!data || typeof data !== "object") return;

        const { pluginToken } = data;
        if (typeof pluginToken !== "string" || pluginToken === "") return;

        try {
            window.runtime.EventsEmit("plugin:message", JSON.stringify(data));
        } catch (err) {
            console.warn("pluginHost: cannot emit plugin:message (Wails not ready?):", err);
        }
    });

    // ────────────────────────────────────────────────────────────────────────────────
    // 2) Go → Plugin: forward each "plugin:event:<token>" back to exactly one iframe.
    // ────────────────────────────────────────────────────────────────────────────────
    function forwardToIframe(pluginToken, rawJSON) {
        // Look up the <iframe> whose data-plugin-token matches.
        const selector = `iframe[data-plugin-token="${pluginToken}"]`;
        const iframe = document.querySelector(selector);
        if (!iframe) {
            console.warn("pluginHost: no iframe found for token", pluginToken);
            return;
        }
        let data;
        try {
            data = JSON.parse(rawJSON);
        } catch (err) {
            console.error("pluginHost: invalid JSON from Go:", err, rawJSON);
            return;
        }
        iframe.contentWindow.postMessage(data, "*");
    }

    // Call this for every loaded plugin token so we subscribe to its events.
    function subscribeToPluginEvents(pluginToken) {
        if (!window.runtime || !window.runtime.EventsOn) {
            console.warn("pluginHost: Wails EventsOn not available yet");
            return;
        }
        window.runtime.EventsOn(`plugin:event:${pluginToken}`, (raw) => {
            forwardToIframe(pluginToken, raw);
        });
    }

    // When DOM is ready, we can safely subscribe for any already-known tokens (if any).
    // document.addEventListener("DOMContentLoaded", () => {
    //     // If you already know some pluginTokens on load, call subscribeToPluginEvents(token)
    //     // Also listen for newly loaded plugins from Go
    //     if (window.runtime && window.runtime.EventsOn) {
    //         window.runtime.EventsOn("jetclock:plugin.load", (raw) => {
    //             // raw is a JSON string: { token: "...", manifest: {...} }
    //             let info;
    //             try {
    //                 info = JSON.parse(raw);
    //             } catch (e) {
    //                 console.error("Failed to parse plugin.load data:", e);
    //                 return;
    //             }
    //             const token = info.token;
    //             // Construct the plugin UI URL. Our Go exposeUIServing serves at:
    //             //   http://localhost:3456/plugins/<token>/
    //             // When the iframe navigates here, the handler will call GetContent and return HTML.
    //             const uiUrl = `http://localhost:3456/plugins/${token}/`;
    //
    //             // Assign the plugin’s UI into the next free iframe slot:
    //             window.assignPluginToNextSlot(token, uiUrl);
    //         });
    //     }
    // });

    // ────────────────────────────────────────────────────────────────────────────────
    // 3) Clock‐face slot assignment logic
    // ────────────────────────────────────────────────────────────────────────────────

    // Order in which to place newly loaded plugins (hours on a clock face):
    const loadOrder = [6, 12, 3, 9, 2, 10, 4, 8, 1, 11, 5, 7];
    let nextSlotIndex = 0;

    /**
     * assignPluginToNextSlot
     *   - pluginToken: the unguessable ID your Go backend generated
     *   - pluginUrl:    URL where the iframe should load (e.g. "http://localhost:34115/hello.html")
     *
     * Looks up the next available hour from `loadOrder`, finds the matching <iframe data-plugin-token>,
     * sets its `data-plugin-token` and `src`, unhides it, and subscribes to its event channel.
     */
    window.assignPluginToNextSlot = function(pluginToken, pluginUrl) {
        if (nextSlotIndex >= loadOrder.length) {
            console.error("pluginHost: all 12 slots are filled; cannot load more plugins");
            return;
        }
        const hour = loadOrder[nextSlotIndex++];
        const slotId = `slot-${hour}`;

        const iframe = document.getElementById(slotId);
        if (!iframe) {
            console.error("pluginHost: missing iframe with id", slotId);
            return;
        }

        // Tag the iframe so we can target it later
        iframe.setAttribute("data-plugin-token", pluginToken);
        // Unhide and point to the plugin’s UI
        iframe.src = pluginUrl + `?pluginToken=${pluginToken}`;
        iframe.style.display = "block";

        // Subscribe to its backend→UI events
        subscribeToPluginEvents(pluginToken);
    };
})(window);
