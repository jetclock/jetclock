import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import './index.css';

function Loader() {
    const [systemID, setSystemID] = useState(null);
    const [version, setVersion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [clockStatus, setClockStatus] = useState({ screenon: true }); // Default to screen on
    const [brightness, setBrightness] = useState(0);

    // Get SystemID and Version from Go backend
    useEffect(() => {
        window.go.main.App.GetSystemID()
            .then(setSystemID)
            .catch(err => {
                console.error(err);
                setSystemID('unknown');
            });
        window.go.main.App.GetVersion()
            .then(setVersion)
            .catch(err => {
                console.error(err);
                setVersion('unknown');
            });
    }, []);

    // Check brightness every 5 seconds (optional - won't block app loading)
    useEffect(() => {
        let brightnessCheckActive = true;
        
        const checkBrightness = async () => {
            if (!brightnessCheckActive) return;
            
            try {
                const currentBrightness = await window.go.main.App.GetBrightness();
                if (brightnessCheckActive) {
                    setBrightness(currentBrightness);
                }
            } catch (error) {
                console.warn('Brightness control not available:', error.message);
                // Set brightness to a default value to prevent undefined behavior
                if (brightnessCheckActive) {
                    setBrightness(1);
                }
            }
        };

        // Initial check (don't block loading)
        setTimeout(checkBrightness, 1000);

        // Set up checking every 5 seconds
        const interval = setInterval(checkBrightness, 5000);

        return () => {
            brightnessCheckActive = false;
            clearInterval(interval);
        };
    }, []);

    // Poll clock status every 10 seconds
    useEffect(() => {
        if (!systemID) return;

        const pollClockStatus = async () => {
            try {
                const response = await fetch(`https://app.jetclock.io/api/clock-status?id=${systemID}`);
                if (response.ok) {
                    const status = await response.json();
                    setClockStatus(status);
                }
            } catch (error) {
                console.error('Failed to fetch clock status:', error);
            }
        };

        // Initial poll
        pollClockStatus();

        // Set up polling every 10 seconds
        const interval = setInterval(pollClockStatus, 10000);

        return () => clearInterval(interval);
    }, [systemID]);

    // Control screen based on status and brightness (optional - won't block app loading)
    useEffect(() => {
        let isActive = true;
        let lastAction = null; // Prevent repeated actions
        
        const controlScreen = async () => {
            try {
                if (!isActive) return;
                
                const currentAction = `${clockStatus.screenon}-${brightness}`;
                if (lastAction === currentAction) {
                    return; // Skip if we already performed this action
                }
                
                if (clockStatus.screenon && brightness === 0) {
                    // Screen should be on but brightness is 0 - turn on screen
                    try {
                        await window.go.main.App.SetBrightness(1);
                        if (isActive) {
                            setBrightness(1);
                            lastAction = `${clockStatus.screenon}-1`;
                            console.log('Turning on screen');
                        }
                    } catch (error) {
                        console.warn('Failed to turn on screen (brightness control not available):', error.message);
                        // Continue without brightness control
                        lastAction = `${clockStatus.screenon}-1`;
                    }
                } else if (!clockStatus.screenon && brightness > 0) {
                    // Screen should be off but brightness > 0 - turn off screen
                    try {
                        await window.go.main.App.SetBrightness(0);
                        if (isActive) {
                            setBrightness(0);
                            lastAction = `${clockStatus.screenon}-0`;
                            console.log('Turning off screen');
                        }
                    } catch (error) {
                        console.warn('Failed to turn off screen (brightness control not available):', error.message);
                        // Continue without brightness control
                        lastAction = `${clockStatus.screenon}-0`;
                    }
                }
            } catch (error) {
                console.error('Failed to control screen:', error);
            }
        };

        // Only control screen if we have both status and brightness, and don't block loading
        if (clockStatus.screenon !== undefined && brightness !== undefined) {
            // Delay screen control to not block initial loading
            setTimeout(controlScreen, 500);
        }
        
        return () => {
            isActive = false;
        };
    }, [clockStatus.screenon, brightness]);

    // Show iframe once we have the systemID (don't wait for brightness)
    useEffect(() => {
        console.log('Loading state check:', { systemID, version, loading });
        if (systemID && version) {
            console.log('Setting loading to false');
            setLoading(false);
            window.runtime.EventsEmit('app-ready');
        }
    }, [systemID, version]);

    if (loading) {
        console.log('Showing loading screen');
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <div className="text-white text-lg">Loading...</div>
            </div>
        );
    }

    const clockUrl = `https://app.jetclock.io/clock/${systemID}?version=${version}`;
    
    console.log('Rendering with:', { systemID, version, clockStatus, loading });

    return (
        <div className="w-full h-full">
            {clockStatus.screenon ? (
                <iframe
                    src={clockUrl}
                    className="w-full h-full border-0"
                    title="JetClock"
                    allow="fullscreen"
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        outline: 'none'
                    }}
                />
            ) : (
                <div className="w-full h-full bg-black flex items-center justify-center">
                    <div className="text-white text-lg">Screen Off</div>
                </div>
            )}
        </div>
    );
}

render(<Loader />, document.getElementById('root'));
