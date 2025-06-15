import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import Clock from 'react-clock';
import 'react-clock/dist/Clock.css';
import WifiStatus from "./WifiStatus";

const Dashboard = () => {
    const [value, setValue] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setValue(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="custom-clock">
            <Clock
                value={value}
                size={480}
                hourMarksWidth={2}
                minuteMarksWidth={2}
                renderHourMarks
                useMillisecondPrecision
            />
            <WifiStatus />
        </div>
    );
};

export default Dashboard;
