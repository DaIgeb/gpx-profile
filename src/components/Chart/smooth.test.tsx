import { expect } from 'chai';

import { smoothenCoordinates, inflate } from './smooth';

// tslint:disable-next-line
const smallFile = `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpsies="http://www.gpsies.com/GPX/1/0" creator="GPSies http://www.gpsies.com - Warmfahren" version="1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.gpsies.com/GPX/1/0 http://www.gpsies.com/gpsies.xsd">
  <metadata>
    <name>Warmfahren</name>
    <link href="http://www.gpsies.com/">
      <text>Warmfahren on GPSies.com</text>
    </link>
    <time>2017-07-28T16:38:58Z</time>
  </metadata>
  <trk>
    <name>Warmfahren on GPSies.com</name>
    <trkseg>
      <trkpt lat="47.10501073" lon="6.831049919">
        <ele>992.00000</ele>
        <time>2010-01-01T00:00:00Z</time>
      </trkpt>
      <trkpt lat="47.10504000" lon="6.831010000">
        <ele>992.00000</ele>
        <time>2010-01-01T00:00:01Z</time>
      </trkpt>
      <trkpt lat="47.10506000" lon="6.831070000">
        <ele>992.00000</ele>
        <time>2010-01-01T00:00:03Z</time>
      </trkpt>
      <trkpt lat="47.10626000" lon="6.830500000">
        <ele>997.00000</ele>
        <time>2010-01-01T00:00:53Z</time>
      </trkpt>
      <trkpt lat="47.10642000" lon="6.830480000">
        <ele>997.00000</ele>
        <time>2010-01-01T00:01:00Z</time>
      </trkpt>
      <trkpt lat="47.10654000" lon="6.830510000">
        <ele>997.00000</ele>
        <time>2010-01-01T00:01:05Z</time>
      </trkpt>
      <trkpt lat="47.10684000" lon="6.830860000">
        <ele>997.00000</ele>
        <time>2010-01-01T00:01:20Z</time>
      </trkpt>
      <trkpt lat="47.10693000" lon="6.830940000">
        <ele>997.00000</ele>
        <time>2010-01-01T00:01:24Z</time>
      </trkpt>
      <trkpt lat="47.10714000" lon="6.831060000">
        <ele>997.00000</ele>
        <time>2010-01-01T00:01:33Z</time>
      </trkpt>
      <trkpt lat="47.10732000" lon="6.831100000">
        <ele>998.00000</ele>
        <time>2010-01-01T00:01:41Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>
`;

it('smoothen without crashing', () => {
  smoothenCoordinates(smallFile, 0.001);
});

it('smoothen to 0.01', () => {
  const coordinates = smoothenCoordinates(smallFile, 0.01);
  expect(coordinates).to.be.an('array');
});

it('inflate to 1', () => {
  const points = inflate(5, 5, 900, 1);
  expect(points).to.be.an('array');
  expect(points).to.deep.equal(
    [
      { distance: 1, altitude: 900, slope: 0.1 },
      { distance: 1, altitude: 901, slope: 0.1 },
      { distance: 1, altitude: 902, slope: 0.1 },
      { distance: 1, altitude: 903, slope: 0.1 },
      { distance: 1, altitude: 904, slope: 0.1 }
    ]
  );
});

it('inflate to 0.01', () => {
  const points = inflate(0.05, 5, 900, 0.01);
  expect(points).to.be.an('array');
  expect(points.reduce((prev, cur) => prev + cur.distance, 0)).to.equal(0.05);
  expect(points).to.deep.equal(
    [
      { distance: 0.01, altitude: 900, slope: 10 },
      { distance: 0.01, altitude: 901, slope: 10 },
      { distance: 0.01, altitude: 902, slope: 10 },
      { distance: 0.01, altitude: 903, slope: 10 },
      { distance: 0.01, altitude: 904, slope: 10 }
    ]
  );
});
