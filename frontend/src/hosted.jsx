import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import './index.css';

function Loader() {
    const [systemID, setSystemID] = useState(null);
    const [version, setVersion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [iframeKey, setIframeKey] = useState(0);

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

    // Set up message listener for iframe commands
    useEffect(() => {
        const handleMessage = async (event) => {
            // Verify origin for security
            if (event.origin !== 'https://app.jetclock.io') {
                console.warn('Ignoring message from untrusted origin:', event.origin);
                return;
            }

            const { method, args = [] } = event.data || {};
            
            if (!method) {
                console.warn('No method specified in message');
                return;
            }
            
            try {
                let result;
                
                // Call the appropriate Go function based on method name
                if (window.go?.main?.App?.[method]) {
                    console.log(`Calling Go method: ${method}`, args);
                    result = await window.go.main.App[method](...args);
                } else if (method === 'reloadIframe') {
                    // Simple iframe reload - just change the key
                    console.log('Reloading iframe');
                    setIframeKey(prev => prev + 1);
                    result = { success: true };
                } else {
                    throw new Error(`Method '${method}' not found`);
                }

                // Send response back to iframe
                if (event.source && event.source.postMessage) {
                    event.source.postMessage({
                        method: method,
                        result: result,
                        error: null
                    }, event.origin);
                }
            } catch (err) {
                console.error(`Error calling ${method}:`, err);
                
                // Send error response
                if (event.source && event.source.postMessage) {
                    event.source.postMessage({
                        method: method,
                        result: null,
                        error: err.message
                    }, event.origin);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    // Reload iframe every 2 hours
    useEffect(() => {
        const reloadInterval = setInterval(() => {
            setIframeKey(prev => prev + 1);
        }, 2 * 60 * 60 * 1000); // 2 hours in milliseconds
        
        return () => clearInterval(reloadInterval);
    }, []);

    // Show iframe once we have the systemID
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
    // const clockUrl = `https://app.jetclock.io/clock/00000000874f46d7`;
    
    console.log('Rendering with:', { systemID, version, loading });

    return (
        <div className="w-full h-full">
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
        </div>
    );
}

render(<Loader />, document.getElementById('root'));
