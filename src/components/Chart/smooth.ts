export const smoothenCoordinates = (geoJson: TGeoJson, distanceThreshold: number): TTotalDistance<TPoint>[] => {
  if (geoJson.type === 'FeatureCollection') {
    return geoJson.features.reduce(
      (previous, current) => {
        if (previous.length > 0) {
          return previous;
        }

        if (current.type === 'Feature') {
          const geometry = current.geometry;
          if (geometry.type === 'LineString') {
            return mapLineString(geometry, distanceThreshold);
          }
        }

        return [];
      },
      []
    );
  }

  return [];
};

const mapLineString = (geometry: TLineString, distanceThreshold: number): TTotalDistance<TPoint>[] => {
  const pointsWithDistance = geometry.coordinates
    .map<TInternalPoint>(point => ({
      lat: point[1],
      long: point[0],
      altitude: point.length > 2 ? point[2] : undefined,
    }))
    .map((point, idx, points) => {
      if (idx === 0) {
        return {
          ...point,
          distance: 0,
          elevation: 0
        };
      }

      const pp = points[idx - 1];
      const elevation = pp.altitude && point.altitude ?
        point.altitude - (pp.altitude || 0) :
        undefined;

      return {
        ...point,
        distance: getDistanceFromLatLonInKm(
          point.lat,
          point.long,
          pp.lat,
          pp.long
        ),
        elevation
      };
    });

  if (distanceThreshold === 0) {
    return addTotalDistance(pointsWithDistance.map((point, idx) => ({
      distance: point.distance,
      altitude: point.altitude,
      slope: point.distance !== 0 ?
        (point.elevation !== undefined ? Math.abs(point.elevation / point.distance / 10) : undefined)
        : 0
    })));
  }

  let previousPoint: TPoint = {
    distance: 0,
    altitude: pointsWithDistance[0].altitude,
    slope: 0
  };

  const smoothenedPoints: TPoint[] = [previousPoint];

  let distance = 0;
  let climbing = 0;
  for (let i = 1; i < pointsWithDistance.length; i++) {
    const currentPoint = pointsWithDistance[i];
    distance += currentPoint.distance;
    climbing += currentPoint.elevation || 0;

    if (distance === distanceThreshold) {
      previousPoint = {
        distance: distanceThreshold,
        altitude: currentPoint.altitude,
        slope: Math.abs(climbing / distanceThreshold / 10)
      };

      smoothenedPoints.push(previousPoint);

      distance = 0;
      climbing = 0;
    } else if (distance > distanceThreshold) {
      const additionalPoints = inflate(distance, climbing, previousPoint.altitude, distanceThreshold);

      previousPoint = additionalPoints[additionalPoints.length - 1];

      smoothenedPoints.push(...additionalPoints);

      const climbingExcess =
        (currentPoint.elevation || 0) -
        (currentPoint.elevation || 0) / distance * additionalPoints.length * distanceThreshold;

      distance = distance - additionalPoints.length * distanceThreshold;
      climbing = climbingExcess;
    }
  }

  if (distance > 0) {
    previousPoint = {
      distance: distanceThreshold,
      altitude: pointsWithDistance[pointsWithDistance.length - 1].altitude,
      slope: Math.abs(climbing / distance / 10)
    };

    smoothenedPoints.push(previousPoint);
  }

  return addTotalDistance(smoothenedPoints);
};

export const inflate = (distance: number, climbing: number, baseAltitude: number | undefined, threshold: number)
  : TPoint[] => {
  const gradient = climbing / distance;
  const slope = Math.abs(gradient / 10);
  const result: TPoint[] = [];
  do {
    result.push({
      distance: threshold,
      altitude: baseAltitude ? baseAltitude + (result.length + 1) * gradient * threshold : undefined,
      slope
    });
  } while (result.length * threshold < distance);

  return result;
};

type TDistance<T> = T & {
  distance: number;
};

export type TTotalDistance<T> = TDistance<T> & {
  totalDistance: number;
};

const addTotalDistance = <T>(distances: TDistance<T>[]): TTotalDistance<T>[] => {
  return distances.reduce<TTotalDistance<T>[]>(
    (prev, cur) => {
      if (prev.length > 0) {
        const previous = prev[prev.length - 1];
        return [
          ...prev,
          Object.assign(cur, { totalDistance: previous.totalDistance + cur.distance })
        ];
      }

      return [
        ...prev,
        Object.assign(cur, { totalDistance: 0 })
      ];
    },
    []
  );
};

const deg2radFactor = Math.PI / 180;
const R = 6371; // Radius of the earth in km

export type TPoint = TDistance<{
  altitude?: number;
  slope?: number;
}>;

type TInternalPoint = {
  lat: number;
  long: number;
  altitude?: number;
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