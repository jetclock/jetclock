import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import './index.css';

function Loader() {
    const [systemID, setSystemID] = useState(null);
    const [version, setVersion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [clockStatus, setClockStatus] = useState({ screenon: true }); // Default to screen on
    const [iframeKey, setIframeKey] = useState(0); // Key to force iframe reload

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


    // Poll clock status every 10 seconds
    useEffect(() => {
        if (!systemID) return;

        const pollClockStatus = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            try {
                const response = await fetch(`https://app.jetclock.io/api/clock-status?id=${systemID}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const status = await response.json();
                    setClockStatus(status);
                    
                    // Check if reboot timestamp exists and is within last 60 seconds
                    if (status.reboot) {
                        const rebootTime = status.reboot * 1000; // Convert UNIX timestamp to milliseconds
                        const currentTime = Date.now();
                        const timeDiff = (currentTime - rebootTime) / 1000; // difference in seconds
                        
                        if (timeDiff <= 60 && timeDiff >= 0) {
                            console.log('Reboot timestamp within 60 seconds, rebooting...');
                            try {
                                await window.go.main.App.Reboot();
                            } catch (error) {
                                console.error('Failed to reboot:', error);
                            }
                        }
                    }
                }
            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    console.log('Request timed out after 5 seconds');
                } else {
                    console.error('Failed to fetch clock status:', error);
                }
            }
        };

        // Initial poll
        pollClockStatus();

        // Set up polling every 20 seconds
        const interval = setInterval(pollClockStatus, 20000);

        return () => clearInterval(interval);
    }, [systemID]);

    // Control screen brightness based on status API
    useEffect(() => {
        if (clockStatus.screenon === undefined) return;
        
        const setBrightness = async () => {
            const targetBrightness = clockStatus.screenon ? 1 : 0;
            
            try {
                // Check current brightness first
                const currentBrightness = await window.go.main.App.GetBrightness();
                
                // Only update if brightness needs to change
                if (currentBrightness !== targetBrightness) {
                    await window.go.main.App.SetBrightness(targetBrightness);
                }
            } catch (error) {
                console.warn('Failed to control screen brightness:', error.message);
            }
        };

        setBrightness();
    }, [clockStatus.screenon]);

    // Reload iframe every 6 hours (only when screen is on)
    useEffect(() => {
        if (!clockStatus.screenon) return;
        
        const reloadInterval = setInterval(() => {
            setIframeKey(prev => prev + 1);
        }, 2 * 60 * 60 * 1000); // 2 hours in milliseconds
        
        return () => clearInterval(reloadInterval);
    }, [clockStatus.screenon]);

    // Show iframe once we have the systemID (don't wait for brightness)
    useEffect(() => {
        console.log('Loading state check:', { systemID, version, loading });
        if (systemID && version) {
            console.log('Setting loading to false');
            setLoading(false);
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
                    key={iframeKey}
                    src={clockUrl}
                    className="border-0"
                    title="JetClock"
                    allow="fullscreen"
                    style={{
                        width: '480px',
                        height: '480px',
                        border: 'none',
                        outline: 'none'
                    }}
                />
            ) : (
                <div className="w-full h-full bg-black flex items-center justify-center"></div>
            )}
        </div>
    );
}

render(<Loader />, document.getElementById('root'));
