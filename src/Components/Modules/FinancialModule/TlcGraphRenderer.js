import React from "react";
import ChartVisualiser from "./NewCharts";

const TlcGraphRenderer = ({ plots }) => {
  console.log("Rendering TlcGraphRenderer with plots:", plots);

  if (!plots) return null;

  const plotEntries = Object.entries(plots);

  return (
    <>
      {plotEntries.map(([plotName, plotObject], index) => {

        const plotData = plotObject?.plot_data;

        if (!plotData) return null;

        return (
          <div key={index} className="chart-visualizer-card">
            <ChartVisualiser
              plotData={plotData}
              plotIndex={index}
              plotName={plotName}
            />
          </div>
        );
      })}
    </>
  );
};

export default TlcGraphRenderer;