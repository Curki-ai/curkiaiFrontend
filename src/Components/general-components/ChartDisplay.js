import React from 'react';
import Plot from 'react-plotly.js';

const ChartsDisplay = ({ figures }) => {
  return (
    <div className="card-grid">
      {figures.map((item, index) => (
        <div key={index} style={{ marginBottom: '30px' }}>
          <h3>{item.title}</h3>
          <Plot
            data={item.figure.data}
            layout={{
              ...item.figure.layout,
              autosize: true,
              margin: { t: 40, l: 40, r: 40, b: 40 },
            }}
            style={{ width: '100%', height: '400px' }}
            config={{ responsive: true }}
          />
        </div>
      ))}
    </div>
  );
};

export default ChartsDisplay;
