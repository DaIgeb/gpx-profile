type TLineString = {
  type: "LineString";
  coordinates: number[][]
}

type TAnyType = {
  type: "NotLineString";
}

type TFeature = {
  type: "Feature";
  properties: {
    coordTimes: string[];
    name: string;
    time: string;
  };
  geometry: TLineString;
}

type TFeatureCollection = {
  type: "FeatureCollection";
  features: TFeature[];
}

type TGeoJson = TFeatureCollection;

declare module "togeojson" {
  export const gpx: (doc: Document) => TGeoJson;
}

declare const process: any;
