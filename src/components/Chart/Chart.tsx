import * as React from 'react';
import { Line } from 'react-chartjs-2';

import * as ChartJs from 'chart.js';
import { gpx } from 'togeojson';
import { DOMParser } from 'xmldom';

import { smoothenCoordinates, TPoint, TTotalDistance } from './smooth';
import { Gradient, TBound } from './Gradient';

const classes = require<{
  chart: string;
  preview: string;
  hidden: string;
}>('./Chart.css');

type TProps = {};
type TState = {
  coords: TTotalDistance<TPoint>[];
  contentType: string;
  name: string;
  bounds: TBound[];
  width: number;
  min: number;
  max: number;
  climbing: number;
  descending: number;
};
const defaultThreshold = 0.1;
const defaultBounds: TBound[] = [
  { bound: 15, hue: 0, saturation: 100, lightness: 20 },
  { bound: 13.5, hue: 0, saturation: 100, lightness: 50 },
  { bound: 10, hue: 0, saturation: 100, lightness: 50 },
  { bound: 8, hue: 40, saturation: 100, lightness: 50 },
  { bound: 5, hue: 60, saturation: 100, lightness: 50 },
  { bound: 1, hue: 80, saturation: 100, lightness: 50 },
  { bound: 0, hue: 110, saturation: 100, lightness: 50 }
];

type TLineChart = Line & {
  chart_instance: ChartJs & { toBase64Image: () => string } | null;
};

export class Chart extends React.Component<TProps, TState> {
  private fileInput: HTMLInputElement | null;
  private thresholdInput: HTMLInputElement | null;
  private chartInstance: TLineChart | null;

  constructor(props: TProps) {
    super(props);

    this.state = {
      coords: [],
      contentType: 'profile',
      bounds: defaultBounds,
      width: window.innerWidth,
      name: '',
      min: 0,
      max: 0,
      climbing: 0,
      descending: 0
    };
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
  }

  updateWindowDimensions = () => {
    this.setState({ width: window.innerWidth });
  }

  render() {
    const { contentType, name, min, max, descending, climbing, coords } = this.state;

    return (
      <div>
        <div>
          <input type="file" ref={(ele) => this.fileInput = ele} onChange={this.loadFile} />
          <input
            type="number"
            ref={(ele) => this.thresholdInput = ele}
            step={0.05}
            min={0}
            defaultValue={defaultThreshold.toFixed(2)}
            onChange={this.loadFile}
          />
          <select value={contentType} onChange={(evt) => this.setState({ contentType: evt.target.value })}>
            <option value="profile">Profile</option>
            <option value="table">Table</option>
          </select>
        </div>
        <h2>{name}</h2>
        {coords.length > 0 && <div>
          <table>
            <tbody>
              <tr>
                <td>Min</td>
                <td>{min}</td>
              </tr>
              <tr>
                <td>Max</td>
                <td>{max}</td>
              </tr>
              <tr>
                <td>Climbing</td>
                <td>{climbing}</td>
              </tr>
              <tr>
                <td>Descending</td>
                <td>{descending}</td>
              </tr>
              <tr>
                <td>Distance</td>
                <td>{coords[coords.length - 1].totalDistance}</td>
              </tr>
            </tbody>
          </table>
        </div>}
        {contentType === 'table' && this.renderTable()}
        {this.renderProfile()}
      </div>
    );
  }

  private renderProfile = () => {
    const { contentType, width, coords, bounds } = this.state;
    const height = 200 * width / 600;

    const buildGradient = (canvas: HTMLCanvasElement) => {
      if (coords.length > 0) {
        const courseDistance = coords[coords.length - 1].totalDistance;

        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const chartArea = this.chartInstance && this.chartInstance.chart_instance ?
              this.chartInstance.chart_instance.chartArea :
              { left: 36, right: width - 5 };

            // width - 5
            const fill = ctx.createLinearGradient(chartArea.left + 4, 0, chartArea.right - chartArea.left / 9 * 4, 0);
            coords.forEach((coordinate, idx) => {
              if (coordinate.slope !== undefined) {
                const pointDistance = coordinate.totalDistance;
                const colorStopPosition = pointDistance / courseDistance;
                fill.addColorStop(
                  colorStopPosition,
                  this.getColorFromSlope(bounds, coordinate.slope)
                );
              }
            });
            return fill;
          }
        }
      }

      return undefined;
    };

    const chartData = (canvas: HTMLCanvasElement) => {
      return {
        labels: coords.map(c => c.totalDistance.toFixed(1)),
        datasets: [{
          borderColor: 'transparent',
          backgroundColor: buildGradient(canvas),
          borderWidth: 0,
          pointRadius: 0,
          data: coords.map(c => c.altitude || 0),
          label: 'Altitude',
          fill: true
        }]
      };
    };

    return (
      <div className={contentType === 'profile' ? classes.chart : classes.hidden} >
        <Line
          height={height}
          width={width}
          data={chartData}
          ref={ref => this.chartInstance = ref as TLineChart}
          options={{
            legend: {
              display: false
            },
            scales: {
              yAxes: [{
                ticks: {
                  suggestedMin: 500,
                  suggestedMax: 1700
                }
              }]
            }
          }}
        />
        <Gradient bounds={bounds} onChange={(bds) => this.setState({ bounds: bds })} />
        {
          this.chartInstance && this.chartInstance.chart_instance &&
          <button
            onClick={() => {
              if (this.chartInstance && this.chartInstance.chart_instance) {
                const fileUrl = this.chartInstance.chart_instance.toBase64Image();
                window.open(fileUrl);
              }
            }}
          >
            Download Image
          </button>
        }
      </div>
    );
  }
  private renderTable = () => {
    const { coords } = this.state;
    return (
      <table>
        <thead>
          <tr>
            <td>Altitude</td>
            <td>Slope</td>
            <td>Distance</td>
            <td>Total Distance</td>
          </tr>
        </thead>
        <tbody>
          {coords.map((c, idx) => <tr
            key={idx}
            style={{
              backgroundColor: c.slope !== undefined ?
                this.getColorFromSlope(this.state.bounds, c.slope) : '#FFFFFF'
            }}
          >
            <td>{c.altitude !== undefined ? c.altitude.toFixed(0) : 'none'}</td>
            <td>{c.slope !== undefined ? c.slope.toFixed(1) : 'none'}</td>
            <td>{c.distance}</td>
            <td>{c.totalDistance}</td>
          </tr>)}
        </tbody>
      </table>
    );
  }

  private getColorFromSlope = (bounds: TBound[], slope: number) => {
    const boundIndex = bounds.findIndex(b => b.bound < slope);
    if (boundIndex !== -1) {
      if (boundIndex > 0) {
        const upperBound = bounds[boundIndex - 1];
        const lowerBound = bounds[boundIndex];
        const factor = (slope - lowerBound.bound) / (upperBound.bound - lowerBound.bound);
        const hue = factor * (lowerBound.hue - upperBound.hue) + upperBound.hue;
        const saturation = factor * (lowerBound.saturation - upperBound.saturation) + upperBound.saturation;
        const lightness = factor * (lowerBound.lightness - upperBound.lightness) + upperBound.lightness;

        return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`;
      }

      const bound = bounds[boundIndex];
      return `hsla(${bound.hue}, ${bound.saturation}%, ${bound.lightness}%, 0.6)`;
    } else {
      const lastBound = bounds[bounds.length - 1];
      return `hsla(${lastBound.hue}, ${lastBound.saturation}%, ${lastBound.lightness}%, 0.6)`;
    }
  }

  private loadFile = () => {
    if (this.fileInput && this.fileInput.files && this.fileInput.files.length > 0) {
      const receivedText = () => {
        const result = fr.result;
        const threshold = this.thresholdInput ? parseFloat(this.thresholdInput.value) : 0.5;

        const gpxFile = new DOMParser().parseFromString(result);
        const geoJson: TGeoJson = gpx(gpxFile);

        const geometry = geoJson.features[0].geometry.coordinates;

        const { min, max, climbing, descending } = geometry.reduce(
          (prev, cur) => {
            const altitude = cur[2];
            return ({
              min: Math.min(altitude, prev.min),
              max: Math.max(altitude, prev.max),
              climbing: prev.climbing + (altitude > prev.altitude ? altitude - prev.altitude : 0),
              descending: prev.descending + (altitude < prev.altitude ? prev.altitude - altitude : 0),
              altitude: altitude
            });
          },
          {
            min: Infinity,
            max: 0,
            climbing: 0,
            descending: 0,
            altitude: geometry[0][2]
          }
        );

        const coords = smoothenCoordinates(geoJson, isNaN(threshold) ? 0.5 : threshold);
        this.setState({ coords, name: geoJson.features[0].properties.name, min, max, climbing, descending });
      };

      const file = this.fileInput.files[0];
      const fr = new FileReader();
      fr.onload = receivedText;
      fr.readAsText(file);
    }
  }
}