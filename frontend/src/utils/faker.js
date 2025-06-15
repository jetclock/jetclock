export const fakePlane = {
    lat: 51.51, // Latitude of plane
    lon: -0.1,  // Longitude of plane
    heading: 90, // East
    velocity: 250, // meters per second (~900 km/h)
    altitude: 35000, // feet
    speed: 250, // Used for mph
    callsign: "BAW123",
    icao: "ABCD",
    aircraft: {
        aircraft: {
            registered_owner_operator_flag_code: "BAW"
        }
    },
    route: {
        flightroute: {
            origin: {
                municipality: "London",
                country_name: "United Kingdom"
            },
            airline: {
                icao: "BAW"
            }
        }
    }
};
