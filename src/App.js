import React, { useState, useEffect } from "react";
import DiagramComponent from "./components/diagram";
import { fetchDiagramData } from "./services/api.service";

const App = () => {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchDiagramData();
      setNodes(data.nodes || []); // Ensure fallback to empty array
      setLinks(data.links || []);
    };
    loadData();
  }, []);

  // Function to send updated nodes to the backend
  const saveDiagram = async (updatedNodes) => {
    try {
      const response = await fetch("http://localhost:5000/roots/saveDiagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: updatedNodes }),
      });
      if (!response.ok) throw new Error("Failed to save data");
      const result = await response.json();
      console.log("Save Successful:", result);
      alert("Diagram saved successfully!");
    } catch (error) {
      console.error("Error saving diagram:", error);
      alert("Failed to save diagram.");
    }
  };

  console.log("NL ", nodes);
  return (
    <div style={{background:'#000'}}>
      <h1>Mythological Diagram</h1>

      <h2>Nodes Data</h2>
      <DiagramComponent nodes={nodes} links={links} saveHandler={saveDiagram} />
    </div>
  );
};

export default App;
