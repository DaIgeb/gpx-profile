type TLineString = {
  type: "LineString";
  coordinates: number[][]
}

type TAnyType = {
  type: "NotLineString";
}

type TFeature = {
  type: "Feature";
  properties: any;
  geometry: TLineString | TAnyType;
}

type TFeatureCollection = {
  type: "FeatureCollection";
  features: (TFeature | TAnyType)[];
}

type TGeoJson = TFeatureCollection | TLineString;

declare module "togeojson" {
  export const gpx: (doc: Document) => TGeoJson;
}