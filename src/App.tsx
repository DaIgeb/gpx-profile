import * as React from 'react';
import './App.css';

import { Chart } from './components/Chart';

const logo = require('./logo.svg');

class App extends React.Component<{}, {}> {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Create GPS elevation profiles</h2>
        </div>        
        <Chart />
      </div>
    );
  }
}

export default App;
