import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';   // ← correct path

export default function SystemIDLabel() {
    const [id, setId] = useState('loading…');

    useEffect(() => {
        window.go.main.App.GetSystemID()
            .then(setId)
            .catch(console.error);
    }, []);

    return <span>System ID: {id}</span>;
}
