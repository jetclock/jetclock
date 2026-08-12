import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import './index.css';

const APP_ORIGIN = 'https://app.jetclock.io';

function Loader() {
    const [systemID, setSystemID] = useState(null);
    const [version, setVersion] = useState(null);
    const [clockType, setClockType] = useState('');
    const [flashVersion, setFlashVersion] = useState(1);
    const [loading, setLoading] = useState(true);
    const iframeRef = useRef(null);

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
        window.go.main.App.GetClockType()
          .then(type => setClockType(type || 'desk'))  // Default to 'desk' if empty
          .catch(err => {
              console.error(err);
              setClockType('desk');
          });
        window.go.main.App.GetFlashVersion()
          .then(version => setFlashVersion(version || 1))  // Default to 1 if not set
          .catch(err => {
              console.error(err);
              setFlashVersion(1);
          });
    }, []);
    // Set up message listener for iframe commands
    useEffect(() => {
        const handleMessage = async (event) => {
            // Verify origin for security
            if (event.origin !== APP_ORIGIN) {
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

    // Show iframe once we have the systemID
    useEffect(() => {
        console.log('Loading state check:', { systemID, version, loading });
        if (systemID && version) {
            console.log('Setting loading to false');
            setLoading(false);
        }
    }, [systemID, version]);

    // --- Keyboard handoff to the hosted UI ---------------------------------
    // keydown is only ever delivered to the focused document, and on boot that
    // is this loader, not the iframe. The hosted app binds arrow keys to cycle
    // glances, so without a handoff those presses die here — and on a Zero
    // (no touchscreen) nothing ever taps the iframe to move focus to it.
    //
    // Two mechanisms, and they cannot double-fire: a keydown goes to exactly
    // one document and key events do not cross frame boundaries. If focus() below
    // took, the iframe gets the press and this listener never sees it; if focus
    // is still here, the forward is what gets it there.
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
            e.preventDefault();
            iframeRef.current?.contentWindow?.postMessage(
                { type: 'jetclock:key', key: e.key },
                APP_ORIGIN
            );
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    // Hand focus to the iframe as soon as its document is up. Cross-origin
    // contentWindow.focus() is permitted; only reaching *into* the document is not.
    const focusFrame = () => {
        try {
            iframeRef.current?.contentWindow?.focus();
        } catch (err) {
            console.warn('Could not focus clock iframe:', err);
        }
    };

    if (loading) {
        console.log('Showing loading screen');
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <div className="text-white text-lg">Loading...</div>
            </div>
        );
    }

    const clockUrl = `${APP_ORIGIN}/clock/${systemID}?version=${version}&type=${clockType}&flashVersion=${flashVersion}`;
    
    console.log('Rendering with:', { systemID, version, loading });

    return (
        <div className="w-full h-full">
            <iframe
                ref={iframeRef}
                src={clockUrl}
                onLoad={focusFrame}
                className="border-0"
                title="JetClock"
                allow="fullscreen"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    outline: 'none'
                }}
            />
        </div>
    );
}

render(<Loader />, document.getElementById('root'));
