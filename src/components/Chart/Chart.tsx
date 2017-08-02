import * as React from 'react';
import * as ChartJs from 'chart.js';

import { smoothenCoordinates, TCoords } from './smooth';

type TProps = {
  redraw?: boolean;
};
type TState = { coords: TCoords[]; chart?: ChartJs; };

export class Chart extends React.Component<TProps, TState> {
  private fileInput: HTMLInputElement | null;
  private thresholdInput: HTMLInputElement | null;
  private canvas: HTMLCanvasElement | null;

  constructor(props: TProps) {
    super(props);

    this.state = { coords: [] };
  }

  componentDidMount() {
    this.initializeChart(this.props);
  }

  componentWillUnmount() {
    const chart = this.state.chart;
    if (chart) {
      chart.destroy();
    }
  }

  componentWillUpdate(nextProps: TProps, nextState: TState) {
    const chart = nextState.chart;
    if (chart) {
      if (nextProps.redraw) {
        chart.destroy();
        this.initializeChart(nextProps);
      } else {
        // Update chart
        if (chart.data && chart.data.datasets && nextState.coords.length > 0) {
          const courseDistance = nextState.coords[nextState.coords.length - 1].totalDistance;
          if (this.canvas) {
            const ctx = this.canvas.getContext('2d');
            if (ctx) {
              var gradientFill = ctx.createLinearGradient(ctx.canvas.width, 0, 0, 0);
              nextState.coords.forEach(coord => {
                if (coord.slope) {
                  gradientFill.addColorStop(coord.totalDistance / courseDistance, this.getColorFromSlope(coord.slope));
                }
              });

              chart.data.datasets[0].backgroundColor = gradientFill;
              chart.data.datasets[0].borderColor = gradientFill;
            }
          }
          chart.data.labels = nextState.coords.map(c => c.totalDistance.toFixed(2));
          chart.data.datasets[0].data = nextState.coords.map(c => c.altitude || 0);
        }
        chart.resize();
        chart.update();
      }
    }
  }

  render() {
    return (
      <div>
        <input type="file" ref={(ele) => this.fileInput = ele} />
        <input type="number" ref={(ele) => this.thresholdInput = ele} defaultValue="0.5" />
        <button onClick={this.loadFile}>Load</button>
        <div style={{ width: '100%', height: '800px' }}>
          <canvas id="myChart" ref={(ele) => this.canvas = ele} />
        </div>
        {this.state.coords.length > 0 && <table>
          <thead>
            <tr>
              <td>Latitude</td>
              <td>Longitude</td>
              <td>Altitude</td>
              <td>Slope</td>
              <td>Distance</td>
              <td>Total Distance</td>
            </tr>
          </thead>
          <tbody>
            {this.state.coords.map((c, idx) => <tr key={idx}>
              <td>{c.lat.toFixed(4)}</td>
              <td>{c.long.toFixed(4)}</td>
              <td>{c.altitude !== undefined ? c.altitude.toFixed(0) : 'none'}</td>
              <td>{c.slope !== undefined ? c.slope.toFixed(1) : 'none'}</td>
              <td>{c.distance}</td>
              <td>{c.totalDistance}</td>
            </tr>)}
          </tbody>
        </table>
        }
      </div>
    );
  }

  private getColorFromSlope = (slope: number) => {
    if (slope > 10) {
      return 'rgba(255, 0, 0, 0.6)';
    } else if (slope < 4) {
      return 'rgba(28, 168, 0, 0.6)';
    }

    return 'rgba(255, 255, 0, 0.6)';
  }

  private initializeChart = (nextProps: TProps) => {
    if (this.canvas) {
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        const validData = this.state.coords.filter((c, idx) => idx < 10);
        const data = validData.map(c => c.altitude || 0);
        const labels = validData.map(c => c.totalDistance.toFixed(2));

        const gradientStroke = ctx.createLinearGradient(500, 0, 100, 0);
        gradientStroke.addColorStop(0, '#80b6f4');
        gradientStroke.addColorStop(1, '#f49080');

        const gradientFill = ctx.createLinearGradient(500, 0, 100, 0);
        gradientFill.addColorStop(0, 'rgba(128, 182, 244, 0.6)');
        gradientFill.addColorStop(0.25, 'rgba(244, 144, 128, 0.6)');
        gradientFill.addColorStop(0.5, 'rgba(128, 182, 244, 0.6)');
        gradientFill.addColorStop(1, 'rgba(244, 144, 128, 0.6)');

        const chart = new ChartJs(
          ctx,
          {
            type: 'line',
            data: {
              labels: labels,
              datasets: [{
                borderColor: gradientStroke,
                backgroundColor: gradientFill,
                pointRadius: 0,
                data: data,
                label: 'Altitude',
                fill: true
              }]
            },
            options: {
              responsive: false,
              maintainAspectRatio: false
            }
          }
        );
        this.setState({ chart });
      }
    }
  }

  private loadFile = () => {
    if (this.fileInput && this.fileInput.files && this.fileInput.files.length > 0) {
      const receivedText = () => {
        var markup, result, n, aByte, byteStr;

        markup = [];
        result = fr.result;
        for (n = 0; n < result.length; ++n) {
          aByte = result.charCodeAt(n);
          byteStr = aByte.toString(16);
          if (byteStr.length < 2) {
            byteStr = '0' + byteStr;
          }
          markup.push(byteStr);
        }

        const coords = smoothenCoordinates(result, this.thresholdInput ? parseFloat(this.thresholdInput.value) : 0.5);
        this.setState({ coords });
      };

      const file = this.fileInput.files[0];
      const fr = new FileReader();
      fr.onload = receivedText;
      fr.readAsText(file);
    }
  }
}