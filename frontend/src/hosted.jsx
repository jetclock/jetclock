import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { PlaneAnimation } from './components/Plane/PlaneAnimation';
import './index.css';

function Loader() {
    const [systemID, setSystemID] = useState(null);
    const [version, setVersion] = useState(null);
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

    useEffect(() => {
        if (version && systemID) {
            window.location.replace(`https://app.jetclock.io/clock/${systemID}?version=${version}`);
        }
    }, [systemID, version]);

    return (
        <div>
        </div>
    );
}

render(<Loader />, document.getElementById('root'));
