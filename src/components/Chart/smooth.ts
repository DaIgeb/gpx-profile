import { gpx } from 'togeojson';
import { DOMParser } from 'xmldom';

export const smoothenCoordinates = (xmlString: string, distanceThreshold: number): TCoords[] => {
  const gpxFile = new DOMParser().parseFromString(xmlString);
  const geoJson: TGeoJson = gpx(gpxFile);

  if (geoJson.type === 'FeatureCollection') {
    return geoJson.features.reduce(
      (previous, current) => {
        if (previous.length > 0) {
          return previous;
        }

        if (current.type === 'Feature') {
          const geometry = current.geometry;
          if (geometry.type === 'LineString') {
            const coordinatesSmoothened = geometry.coordinates.reduce<TCoords[]>(
              (coordList, curCoords) => {
                if (coordList.length === 0) {
                  return [
                    ...coordList,
                    {
                      lat: curCoords[1],
                      long: curCoords[0],
                      distance: 0,
                      totalDistance: 0,
                      altitude: curCoords.length > 2 ? curCoords[2] : undefined,
                      slope: curCoords.length > 2 ? 0 : undefined
                    }
                  ];
                }

                const previousCoords = coordList[coordList.length - 1];

                const distance = getDistanceFromLatLonInKm(
                  curCoords[1],
                  curCoords[0],
                  previousCoords.lat,
                  previousCoords.long
                );
                if (distance < distanceThreshold) {
                  return coordList;
                }

                const elevation = curCoords.length > 2 ? curCoords[2] - (previousCoords.altitude || 0) : undefined;

                return [
                  ...coordList,
                  {
                    lat: curCoords[1],
                    long: curCoords[0],
                    distance: distance,
                    totalDistance: previousCoords.totalDistance + distance,
                    altitude: curCoords.length > 2 ? curCoords[2] : undefined,
                    slope: elevation !== undefined ? Math.abs(elevation) / distance / 10 : undefined
                  }
                ];
              },
              []
            );

            return coordinatesSmoothened;
          }
        }

        return [];
      },
      []
    );
  }

  return [];
};

const deg2radFactor = Math.PI / 180;
const R = 6371; // Radius of the earth in km

export type TCoords = {
  lat: number;
  long: number;
  distance: number;
  totalDistance: number;
  altitude?: number;
  slope?: number;
};

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = deg2rad(lat2 - lat1);  // Deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km

  return d;
}

function deg2rad(deg: number) {
  return deg * deg2radFactor;
}