import React from 'react';

const MarkdownParser = ({ text }) => {
  // Function to remove serial numbers (like 1. or 2.)
  const removeSerialNumber = (line) => {
    return line.replace(/^\d+\.\s*/, ''); // Removes leading "number. " (e.g., "1. ", "2. ")
  };

  // If no bold markdown present, handle plain string
  if (!text.includes('**')) {
    const simpleLines = text.split('\n');
    return (
      <>
        {simpleLines.map((line, idx) => (
          <div key={idx}>{removeSerialNumber(line)}</div>
        ))}
      </>
    );
  }

  // Else, handle bold markdown + line breaks + remove serial number
  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, lineIndex) => {
        const cleanLine = removeSerialNumber(line);
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g); // Split bold parts

        return (
          <div key={lineIndex}>
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.replace(/\*\*/g, '')}</strong>;
              } else {
                return <span key={i}>{part}</span>;
              }
            })}
          </div>
        );
      })}
    </>
  );
};

export default MarkdownParser;
