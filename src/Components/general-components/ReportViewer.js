import React from "react";
import '../../Styles/general-styles/ReportViewer.css'

const ReportViewer = ({ report }) => {
  if (!report) return null;

  const lines = report.split('\n');

  return lines.map((line, index) => {
    // Big heading (## heading)
    if (line.startsWith('## ')) {
      return (
        <h2 key={index} className="main-heading">
          {line.replace('## ', '').trim()}
        </h2>
      );
    }

    // Numbered headings (1., 2.)
    else if (/^\d+\.\s/.test(line)) {
      return (
        <h3 key={index} className="number-heading">
          {line.trim().replace(/^\d+\.\s*/, '')} {/* Remove the number */}
        </h3>
      );
    }

    // Subheadings starting with * and ending with ** (e.g., *4. Performance Evaluation**)
    else if (line.trim().startsWith('*') && line.trim().endsWith('**')) {
      return (
        <h4 key={index} className="sub-heading">
          {line.replace(/^\*\s*/, '').replace(/\*\*$/, '').trim()}
        </h4>
      );
    }

    // Bullet points with bold labels
    else if (line.trim().startsWith('* **')) {
      const match = line.match(/\*\*\s*(.*?)\s*\*\*/); // Capture bold text
      const boldText = match ? match[1] : '';
      let restText = line.replace(`* **${boldText}**`, '').trim();

      // Replace double colons with single colon
      restText = restText.replace(/^:+\s*/, '').replace('::', ':');

      return (
        <div key={index} className="bullet">
          <strong>{boldText}:</strong> {restText}
        </div>
      );
    }

    // Regular sub bullets (* )
    else if (line.trim().startsWith('*')) {
      return (
        <div key={index} className="sub-bullet">
          {line.replace('*', '').replace('::', ':').trim()}
        </div>
      );
    }

    // Normal paragraph
    else {
      return <p key={index}>{line.trim()}</p>;
    }
  });
};

export default ReportViewer;
