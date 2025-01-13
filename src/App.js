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

  console.log("nodes ", nodes);
  console.log("links ", links);
  return (
    <div style={{background:'#000'}}>
     
      <DiagramComponent 
      nodes={nodes} 
      links={links} 
      />
    </div>
  );
};

export default App;
