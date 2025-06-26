import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { PlaneAnimation } from './components/Plane/PlaneAnimation';
import './index.css';

function Loader() {
    const [systemID, setSystemID] = useState(null);
    const [version, setVersion] = useState(null);
    const [animDone, setAnimDone] = useState(false);

    // 1. ask Go for the SystemID
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

    // 2. when BOTH animation finished and ID received → redirect
    useEffect(() => {
        if (animDone && systemID) {
            window.location.replace(`https://app.jetclock.io/clock/${systemID}?version=${version}`);
        }
    }, [animDone, systemID]);

    return (
        <div
            style={{
                background: '#000',
                color: '#fff',
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <PlaneAnimation onFinish={() => setAnimDone(true)} />
            <p style={{ marginTop: 24 }}>
                {systemID ? 'Launching clock…' : 'Fetching System ID…'}
            </p>
        </div>
    );
}

render(<Loader />, document.getElementById('root'));
