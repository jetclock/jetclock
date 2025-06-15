// src/components/WifiStatus.js
import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import wifiIcon from '../assets/images/wifi.svg';
import hotspotIcon from '../assets/images/cell_tower.svg';

const MODE_UNKNOWN = 0;
const MODE_INFRA = 1;
const MODE_AP = 2;

const WifiStatus = () => {
    const iconRef = useRef(null);

    useEffect(() => {
        const icon = iconRef.current;
        if (!icon) return;

        icon.src = wifiIcon;
        icon.alt = "Wi-Fi";

        window.runtime.EventsOn("jetclock:wifi.mode", (mode) => {
            console.log("📶 wifi.mode event:", mode);
            switch (mode) {
                case MODE_AP:
                    icon.src = hotspotIcon;
                    icon.alt = "Hotspot";
                    break;
                case MODE_INFRA:
                    icon.src = wifiIcon;
                    icon.alt = "Wi-Fi";
                    break;
                default:
                    icon.src = wifiIcon;
                    icon.alt = "Unknown";
                    break;
            }
        });
    }, []);

    return (
        <div id="wifi-mode">
            <img id="wifi-mode-icon" ref={iconRef} width="24" height="24" />
        </div>
    );
};

export default WifiStatus;
