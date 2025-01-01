import React from "react";

const TableComponent = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No data available.</p>;
  }

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr>
          <th style={{ border: "1px solid black", padding: "8px" }}>Key</th>
          <th style={{ border: "1px solid black", padding: "8px" }}>Color</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            <td style={{ border: "1px solid black", padding: "8px" }}>{row.name}</td>
            <td style={{ border: "1px solid black", padding: "8px" }}>{row.age}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableComponent;
