import { h, Fragment } from 'preact';
import { render } from 'preact';
import {useEffect, useRef, useState} from 'preact/hooks';
import "./utils/debug-bridge";
import '@splidejs/splide/dist/css/splide.min.css';
import Dashboard from "./components/Dashboard";
import SlideHolder from "./components/SlideHolder";
import PlaneDetails from "./components/Plane/PlaneDetails";
import WifiStatus from './components/WifiStatus';
import PluginHost from './components/PluginHost';
import {fakePlane} from "./utils/faker"

import './index.css';
import PluginSlots from "./components/PluginSlots";
import PluginHostProvider from "./components/PluginHostProvider";
import PlaneAnimation from "./components/Plane/PlaneAnimation";

export default function Home() {
    const homeRef = useRef(null); // ✅ Create ref

    const [statePlaneData, setPlaneData] = useState(null);
    const [slides, setSlides] = useState([
        {
            id: "time",
            component: null,
        },
        // { id: "moon", component: <Moon /> },
        // { id: "sun", component: <Sun /> },
    ]);

    useEffect(() => {
        if (homeRef.current) {
            const rect = homeRef.current.getBoundingClientRect();
            console.log(`📏 Dashboard size: ${rect.width}px x ${rect.height}px`);
        }
    }, []);
    const fetchPlanesAround = async () => {
        try {
            // const res = await fetch('/api/aircraft-proximity');
            // const json = await res.json();
            // setPlaneData(json.callsign ? json : null);
            setPlaneData(fakePlane);
        } catch (err) {
            console.error("Error fetching plane data:", err);
            setPlaneData(null);
        }
    };

    useEffect(() => {
        fetchPlanesAround();
        const interval = setInterval(fetchPlanesAround, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            ref={homeRef}
            className="bg-black text-white relative"
            style={{
                width: "480px",
                height: "480px",
            }}
        >
            <PlaneAnimation></PlaneAnimation>
            {/* Optional video background */}
            {/* <video autoPlay muted loop className="w-full h-full">
        <source src="/storm.mp4" type="video/mp4" />
      </video> */}
            {/*<PluginHostProvider>*/}
            {/*    <PluginSlots />*/}
            {/*</PluginHostProvider>*/}
            {/*{statePlaneData && (*/}
            {/*    <div className="absolute z-10 w-full h-full">*/}
            {/*        <PlaneDetails planeData={statePlaneData} />*/}
            {/*    </div>*/}
            {/*)}*/}
            {/*/!*<SystemIDLabel></SystemIDLabel>*!/*/}
            {/*/!*{new Date().getMonth() === 11 && (*!/*/}
            {/*/!*    <Snowfall snowflakeCount={55} speed={[0.5, 1.5]} />*!/*/}
            {/*/!*)}*!/*/}
            {/*<SlideHolder slides={slides}/>*/}
        </div>
    );
}
render(<Home />, document.querySelector('#root'));
