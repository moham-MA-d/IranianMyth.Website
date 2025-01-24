import React, { useEffect, useRef, useState } from "react";
import * as go from "gojs";
import PoolLayout from "./PoolLayout";
import LaneResizingTool from "./LaneResizingTool";
import DetailModal from "./DetailModal";

const DiagramComponent = ({ nodes, links, saveHandler }) => {
  const diagramDiv = useRef(null);
  const diagramRef = useRef(null);
  const isEditMode = process.env.REACT_APP_ALLOW_EDIT === 'true';

  const [modalData, setModalData] = useState({
    isOpen: false,
    id: "",
    title: "",
    imageUrl: "",
    description: "",
    isLink: false
  });

  const handleCloseModal = () => {
    setModalData(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    // Clean up any existing diagram
    if (diagramRef.current) {
      diagramRef.current.div = null;
    }

    const $ = go.GraphObject.make;

    // Create the diagram with initial configuration
    const myDiagram = $(go.Diagram, diagramDiv.current, {
      "undoManager.isEnabled": isEditMode,
      "panningTool.isEnabled": false,
      "allowHorizontalScroll": false,
      //"allowVerticalScroll": false,
      "allowZoom": true,
      //initialAutoScale: go.Diagram.Center,
      "contentAlignment": go.Spot.Center,
      allowMove: isEditMode,
      allowCopy: isEditMode,
      allowDelete: isEditMode,
      allowDragOut: isEditMode,
      allowLink: isEditMode,
      allowRelink: isEditMode,
    });

    // Set wheel behavior after diagram creation
    if (isEditMode) {
      //myDiagram.toolManager.mouseWheelBehavior = go.ToolManager.WheelZoom;
    } else {
      // myDiagram.toolManager.mouseWheelBehavior = go.ToolManager.None;
    }

    myDiagram.layout = new PoolLayout();
    myDiagram.toolManager.resizingTool = new LaneResizingTool();

    myDiagram.groupTemplateMap.add(
      "pool",
      $(
        go.Group,
        "Auto",
        {
          layout: new PoolLayout(),
          layerName: "Background",
          movable: false,
          dragComputation: () => null, // Disable dragging computation
          selectable: isEditMode,
        },
        $(go.Shape, "Rectangle", {
          fill: "white",
          stroke: "black",
          strokeWidth: 2,
        }),
        $(
          go.Panel,
          "Table",
          { margin: 4 },
          $(
            go.TextBlock,
            {
              font: "bold 14pt sans-serif",
              editable: true,
              alignment: go.Spot.TopCenter,
            },
            new go.Binding("text", "text").makeTwoWay()
          )
        )
      )
    );

    myDiagram.groupTemplateMap.add(
      "Lane",
      $(
        go.Group,
        "Auto",
        {
          resizable: isEditMode,
          resizeObjectName: "HEADER",
          computesBoundsIncludingLinks: false,
          computesBoundsIncludingLocation: true,
          handlesDragDropForMembers: isEditMode,
          movable: false,
          dragComputation: () => null, // Disable dragging computation
          selectable: isEditMode,
          layout: $(go.GridLayout, {
            wrappingColumn: 1,
            cellSize: new go.Size(1, 1),
            spacing: new go.Size(4, 4),
          }),
        },
        // The outer shape of the lane
        $(go.Shape, "Rectangle", {
          name: "SHAPE",
          fill: "gray",
          stroke: "black",
          minSize: new go.Size(1000, 50), // Minimum size for lanes
        }),
        $(
          go.Panel,
          "Horizontal",
          {
            name: "HEADER",
            angle: 270, // Rotate the header to read sideways going up
            alignment: go.Spot.Left,
          },
          $(
            go.Panel,
            "Horizontal", // This panel is hidden when the swimlane is collapsed
            new go.Binding("visible", "isSubGraphExpanded").ofObject(),
            $(
              go.TextBlock,
              {
                font: "bold 13pt sans-serif",
                editable: true,
                margin: new go.Margin(2, 0, 0, 0),
              },
              new go.Binding("text", "name").makeTwoWay()
            ),
            $(
              go.Shape,
              "Diamond",
              {
                width: 8,
                height: 8,
                fill: "cyan",
                margin: new go.Margin(2, 2, 2, 2),
              },
              new go.Binding("fill", "color")
            )
          ),
          $(
            "SubGraphExpanderButton",
            { margin: 5 } // This remains always visible
          )
        ),
        //label
        $(
          go.Panel,
          "Table",
          { defaultRowSeparatorStroke: "black" },
          // Lane Header
          $(
            go.TextBlock,
            {
              row: 0,
              font: "bold 12pt sans-serif",
              margin: 5,
              editable: true,
              alignment: go.Spot.Center,
            },
            new go.Binding("text", "name").makeTwoWay() // Display the lane name
          ),
          // Placeholder for nodes in the lane
          $(
            go.Placeholder,
            { row: 1, padding: 5, alignment: go.Spot.TopLeft } // Dynamically size container
          )
        )
      )
    );

    const decimalCound = 5;
    // Custom converter functions for handling location with 3 decimal places
    function parseLocation(str) {
      const pt = go.Point.parse(str);
      return new go.Point(
        Number(pt.x.toFixed(decimalCound)),
        Number(pt.y.toFixed(decimalCound))
      );
    }

    function stringifyLocation(pt) {
      return `${Number(pt.x).toFixed(decimalCound)} ${Number(pt.y).toFixed(decimalCound)}`;
    }

    myDiagram.nodeTemplate = $(
      go.Node,
      "Auto",  // "Auto" panel so the Shape always surrounds the content (Picture + TextBlock)
      {
        locationSpot: go.Spot.Center, // Ensures the location is the center of the node
        isLayoutPositioned: false,    // Prevent layout from overriding locations
      },
      // Bind node's position
      new go.Binding("location", "loc", parseLocation).makeTwoWay(stringifyLocation),
    
      // 1) Main shape (round or square, large or small) based on `node.data.style`
      $(
        go.Shape,
        {
          // this shape is the "main port"
          portId: "",
          fill: "white",
          stroke: "black",
          fromLinkable: true,
          toLinkable: true,
        },
        // Pick "Ellipse" if style includes "round", else "Rectangle"
        new go.Binding("figure", "shape", style =>
          style?.includes("round") ? "Ellipse" : "Rectangle"
        ),
        // Pick 110×110 if style includes "large", else 60×60
        new go.Binding("desiredSize", "shape", style => {
          switch (style) {
            case "box-large":
              return new go.Size(110, 140);
            case "box-medium":
              return new go.Size(80, 110);
            case "box-small":
              return new go.Size(50, 80);
            default:
              return new go.Size(60, 60);  // default size if no match
          }
        }),
        
        
        // Adjust stroke width for large shapes (optional)
        new go.Binding("strokeWidth", "shape", style =>
          style?.includes("large") ? 1 : 1
        )
      ),
    
      // 2) Panel holding the Picture + TextBlock
      $(
        go.Panel,
        "Vertical",
        { margin: 5 },
        $(
          go.Picture,
          // Default or small
          {
            desiredSize: new go.Size(40, 40),
          },
          new go.Binding("source", "image"),
          // If style is "large", use bigger picture
          new go.Binding("desiredSize", "shape", style =>
            style?.includes("large") ? new go.Size(80, 80) : new go.Size(40, 40)
          )
        ),
        $(
          go.TextBlock,
          { margin: 5 },
          new go.Binding("text", "name")
        )
      ),
    
      // 3) Define your four port circles (Top, Left, Right, Bottom)
      $(go.Shape, "Circle", {
        portId: "T",            // Top port
        alignment: go.Spot.Top,
        fromSpot: go.Spot.Top,
        toSpot: go.Spot.Top,
        fromLinkable: true,
        toLinkable: true,
        width: 10,
        height: 10,
        fill: "transparent",    // can style for visibility
        strokeWidth: 0,
      }),
      $(go.Shape, "Circle", {
        portId: "L",            // Left port
        alignment: go.Spot.Left,
        fromSpot: go.Spot.Left,
        toSpot: go.Spot.Left,
        fromLinkable: true,
        toLinkable: true,
        width: 10,
        height: 10,
        fill: "transparent",
        strokeWidth: 0,
      }),
      $(go.Shape, "Circle", {
        portId: "R",            // Right port
        alignment: go.Spot.Right,
        fromSpot: go.Spot.Right,
        toSpot: go.Spot.Right,
        fromLinkable: true,
        toLinkable: true,
        width: 10,
        height: 10,
        fill: "transparent",
        strokeWidth: 0,
      }),
      $(go.Shape, "Circle", {
        portId: "B",            // Bottom port
        alignment: go.Spot.Bottom,
        fromSpot: go.Spot.Bottom,
        toSpot: go.Spot.Bottom,
        fromLinkable: true,
        toLinkable: true,
        width: 10,
        height: 10,
        fill: "transparent",
        strokeWidth: 0,
      })
    );
    

    myDiagram.linkTemplate = $(
      go.Link,
      {
        routing: go.Link.AvoidsNodes, // Adjust as needed (Straight or AvoidsNodes)
        corner: 5,
        relinkableFrom: true,
        relinkableTo: true,
        reshapable: true, // Allow reshaping
        resegmentable: true, // Allow resegmenting
        // Enable dragging of the entire link
        mouseDragEnter: function (e, link) {
          link.isSelected = true;
        },
        mouseDragLeave: function (e, link) {
          link.isSelected = false;
        },
      },
      new go.Binding("fromSpot", "fromSpot", go.Spot.parse),
      new go.Binding("toSpot", "toSpot", go.Spot.parse),
      $(go.Shape, { strokeWidth: 2 }, new go.Binding("stroke", "relation", getRelationColor)),
      $(go.Shape, { toArrow: "Standard" }),
      $(
        go.TextBlock,
        {
          visible: false,
          segmentOffset: new go.Point(0, -10)
        },
        new go.Binding("text", "relation")
      ),
      // Bind the points property to apply the coordinates
      new go.Binding("points").makeTwoWay(),

    );


    // Add listeners for various events
    myDiagram.addDiagramListener("SelectionMoved", function (e) {
      e.subject.each(function (part) {

        // Check if the selection contains a lane or pool
        const hasLaneOrPool = e.diagram.selection.any(function (part) {
          return part instanceof go.Group && part.data.category; // Check for lane or pool
        });

        if (hasLaneOrPool) {
          return; // Skip processing if a lane or pool is part of the selection
        }

        //prevent call move for nodes when pool or lanes are moved.
        if (part.data.category) {
          return;
        }

        if (part instanceof go.Node && part.data) {
          // Extracting node information
          const nodeData = part.data; // The data object from your node
          OnNodeMoved(nodeData, part.linksConnected);
        } else if (part instanceof go.Link) {
          // It's a link
          //console.log("Link moved nodeData:", part.data);
        }
      });
    });

    myDiagram.addDiagramListener("LinkDrawn", function (e) {

      // Get the link that was just drawn
      const link = e.subject;

      // Get the source and target nodes
      const sourceNode = link.fromNode;
      const targetNode = link.toNode;

      if (sourceNode && targetNode) {
        // Extract node data (modify according to your node model)
        const sourceId = sourceNode.data.id; // Data of the source node
        const targetId = targetNode.data.id; // Data of the target node

        OnLinkDrawn(sourceId, targetId);
      }
    });

    myDiagram.addDiagramListener("LinkReshaped", function (e) {
      const link = e.subject; // The reshaped link
      const sourceNodeId = link.fromNode.data.id;
      const targetNodeId = link.toNode.data.id;

      // Get the updated points
      const updatedPoints = [];
      link.points.each((point) => {
        updatedPoints.push({ x: point.x, y: point.y });
      });

      // Send the updated points to the server
      OnLinkReshaped(sourceNodeId, targetNodeId, updatedPoints);
    });


    myDiagram.addDiagramListener("SelectionDeleted", function (e) {
      e.subject.each(function (part) {
        if (part instanceof go.Node) {
          OnNodeDeleted(part.data.id);
        } else if (part instanceof go.Link) {
          OnLinkDeleted(part.data.id);
        }
      });
    });

    myDiagram.addDiagramListener("ClipboardPasted", function (e) {
      e.subject.each(function (part) {
        if (part instanceof go.Node) {
          OnNodeCopied(part.data);
        } else if (part instanceof go.Link) {
          //console.log("Link Copied:", part.data);
        }
      });
    });

    // Add click listeners for nodes and links
    myDiagram.addDiagramListener("ObjectDoubleClicked", function (e) {
      const part = e.subject.part;
      // Check for group first since Group is a subclass of Node
      if (part instanceof go.Group) {
        console.log("Group");
        return;
      } else if (part instanceof go.Node) {
        setModalData({
          id: part.data.id,
          isOpen: true,
          title: part.data.name || "Node Details",
          imageUrl: part.data.imageUrl || "",
          description: part.data.description || "",
          isLink: false
        });
      } else if (part instanceof go.Link) {
        setModalData({
          id: part.data.id,
          isOpen: true,
          title: part.data.name || "Link Details",
          description: part.data.description || "",
          isLink: true
        });
      }
    });


    // Assign the model
    myDiagram.model = new go.GraphLinksModel(nodes, links);

    // Set `id` as the key for links
    myDiagram.model.linkKeyProperty = "id";

    // Store diagram reference
    diagramRef.current = myDiagram;

    myDiagram.layout.isValidLayout = false; // Mark layout as invalid
    myDiagram.layoutDiagram(); // Force layout to reapply

    return () => {
      if (diagramRef.current) {
        diagramRef.current.div = null;
        diagramRef.current = null;
      }
    };
  }, [nodes, links, saveHandler, isEditMode]);


  const OnLinkReshaped = async (sourceNodeId, targetNodeId, points) => {
    try {
      const response = await fetch("http://localhost:5000/roots/reshapeLink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceNodeId: sourceNodeId,
          targetNodeId: targetNodeId,
          points: points,
        }),
      });
      let res = await response.json();
      if (!res.isSuccess) throw new Error(res.message);
      const result = await response.json();
    } catch (error) {
      alert(error);
    }
  }

  const OnNodeMoved = async (node, linksConnected) => {
    try {


      // Prepare the updated links data
      const updatedLinks = [];
      linksConnected.each((link) => {
        const points = [];
        link.points.each((point) => points.push({ x: point.x, y: point.y }));
        updatedLinks.push({
          id: link.data.id, // Link ID
          from: link.data.from, // Source node ID
          to: link.data.to, // Target node ID
          points: points, // Updated points
        });
      });

      console.log("updatedLinks: ", updatedLinks);


      const response = await fetch("http://localhost:5000/roots/moveNode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId: node.id, // Node data
          nodeLoc: node.loc, // Node data
          links: updatedLinks, // Updated links data
        }),
      });
      let res = await response.json();
      if (!res.isSuccess) throw new Error(res.message);
    } catch (error) {
      alert(error);
    }
  };

  const OnNodeDeleted = async (nodeId) => {
    try {
      const response = await fetch("http://localhost:5000/roots/deleteNode", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: nodeId }),
      });
      let res = await response.json();
      if (!res.isSuccess) throw new Error(res.message);
      alert(res.message);
    } catch (error) {
      alert(error);
    }
  };

  const OnNodeCopied = async (node) => {
    try {
      const response = await fetch("http://localhost:5000/roots/copyNode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node: node }),
      });
      let res = await response.json();
      if (!res.isSuccess) throw new Error(res.message);
      alert(res.message);
    } catch (error) {
      alert(error);
    }
  };

  const OnLinkDeleted = async (linkId) => {
    try {
      const response = await fetch("http://localhost:5000/roots/deleteLink", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: linkId }),
      });
      let res = await response.json();
      if (!res.isSuccess) throw new Error(res.message);
      const result = await response.json();
      alert(res.message);
    } catch (error) {
      alert(error);
    }
  };

  const OnLinkDrawn = async (sourceId, targetId) => {
    try {
      const response = await fetch("http://localhost:5000/roots/drawLink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: sourceId, targetId: targetId }),
      });
      let res = await response.json();
      if (!res.isSuccess) throw new Error(res.message);
      const result = await response.json();
      alert(res.message);
      console.log(result);
    } catch (error) {
      alert(error);
    }
  };

  const getRelationColor = (relation) => {
    switch (relation) {
      case "mrig":
        return "blue";
      case "prnt":
        return "green";
      case "empl":
        return "yellow";
      case "frnd":
        return "purple";
      case "enmy":
        return "red";
      case "adpt":
        return "gray";
      default:
        return "black";
    }
  };

  // Function to handle changes from the DetailModal
  const handleDetailModalSave = ({ id, name, description, isLink }) => {
    if (isLink) {
      const link = diagramRef.current.model.findLinkDataForKey(id);
      if (link) {
        diagramRef.current.model.setDataProperty(link, "name", name);
        diagramRef.current.model.setDataProperty(link, "description", description);
      }
    } else {
      const node = diagramRef.current.model.findNodeDataForKey(id);
      if (node) {
        diagramRef.current.model.setDataProperty(node, "name", name);
        diagramRef.current.model.setDataProperty(node, "description", description);
      }
    }
  };

  return (
    <div>
      <div
        ref={diagramDiv}
        style={{
          width: "100%",
          height: "500px",
          backgroundColor: "#DAE4E4",
          cursor: isEditMode ? 'default' : 'pointer'
        }}
      />
      <DetailModal
        id={modalData.id}
        isOpen={modalData.isOpen}
        onClose={handleCloseModal}
        title={modalData.title}
        imageUrl={modalData.imageUrl}
        description={modalData.description}
        isLink={modalData.isLink}
        onSave={handleDetailModalSave} // Pass the updated save handler

      />

    </div>
  );
};

export default DiagramComponent;
