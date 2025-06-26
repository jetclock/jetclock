import { h } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import { motion } from 'framer-motion';
import { ChevronUpIcon } from '@heroicons/react/20/solid';
import { PlaneAnimation } from './PlaneAnimation';

import { computeBearing, estimateNewPosition } from '../../utils/geo';
import { USER_LAT, USER_LON, USER_HEADING } from '../../utils/temp_consts';
import SystemIDLabel from "../SystemID";

export default function PlaneDetails({ planeData }) {
    const [arrowRotation, setArrowRotation] = useState(0);
    const [estimatedPosition, setEstimatedPosition] = useState(null);

    const planeDataRef = useRef(null);
    const lastUpdateTimeRef = useRef(0);

    useEffect(() => {
        if (!planeData) return;
        planeDataRef.current = planeData;
        lastUpdateTimeRef.current = Date.now();
        setEstimatedPosition({ lat: planeData.lat, lon: planeData.lon });
    }, [planeData]);

    useEffect(() => {
        const interval = setInterval(() => {
            const plane = planeDataRef.current;
            if (!plane) return;

            const heading =
                plane.heading || plane.track || plane.true_track || plane.true_heading;
            const speedKts = plane.velocity || plane.speed;
            if (heading == null || speedKts == null) return;

            const speedMps = speedKts / 1.944;
            const elapsedSec = (Date.now() - lastUpdateTimeRef.current) / 1000;

            const newPos = estimateNewPosition({
                lat: plane.lat,
                lon: plane.lon,
                heading,
                speed: speedMps,
                timeElapsed: elapsedSec,
            });

            setEstimatedPosition(newPos);

            const bearing = computeBearing(USER_LAT, USER_LON, newPos.lat, newPos.lon);
            let relativeAngle = bearing - USER_HEADING;
            if (relativeAngle > 180) relativeAngle -= 360;
            if (relativeAngle < -180) relativeAngle += 360;
            setArrowRotation(relativeAngle);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const airlineCode =
        planeData?.aircraft?.aircraft?.registered_owner_operator_flag_code ||
        planeData?.route?.flightroute?.airline?.icao;

    return (
        <div className="relative w-full h-full bg-black flex items-center flex-col gap-6 text-white">
            <PlaneAnimation />
            <SystemIDLabel />
            {/*<div className="flex flex-col items-center justify-center h-full">*/}
            {/*    <motion.div*/}
            {/*        animate={{ rotate: arrowRotation }}*/}
            {/*        transition={{ type: 'spring', stiffness: 60, damping: 20, duration: 1.5 }}*/}
            {/*    >*/}
            {/*        <ChevronUpIcon className="w-48 h-48 text-white" />*/}
            {/*    </motion.div>*/}

            {/*    <div className="text-5xl font-semibold text-center mt-4">*/}
            {/*        {planeData?.route?.flightroute?.origin?.municipality || planeData?.callsign}*/}
            {/*    </div>*/}
            {/*    <div className="text-xl mt-3">*/}
            {/*        {planeData?.route?.flightroute?.origin?.country_name || planeData?.icao}*/}
            {/*    </div>*/}
            {/*    <div className="text-md mt-3 opacity-80">*/}
            {/*        {(planeData?.speed * 2.23694).toFixed(0)} mph &nbsp;&nbsp;&nbsp;*/}
            {/*        {planeData?.altitude} ft*/}
            {/*    </div>*/}
            {/*</div>*/}

            {/*<div className="h-20 w-full bg-white flex justify-center items-center">*/}
            {/*    <img*/}
            {/*        src={`/assets/public/images/logos/${airlineCode}.png`}*/}
            {/*        className="w-32 h-32 object-contain"*/}
            {/*        alt="Airline logo"*/}
            {/*    />*/}
            {/*</div>*/}
        </div>
    );
}
