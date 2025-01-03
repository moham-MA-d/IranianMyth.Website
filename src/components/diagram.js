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
          movable: isEditMode,
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
          movable: isEditMode,
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

    // Custom converter functions for handling location with 3 decimal places
    function parseLocation(str) {
      const pt = go.Point.parse(str);
      return new go.Point(
        Number(pt.x.toFixed(2)),
        Number(pt.y.toFixed(2))
      );
    }

    function stringifyLocation(pt) {
      return `${Number(pt.x).toFixed(2)} ${Number(pt.y).toFixed(2)}`;
    }

    myDiagram.nodeTemplate = $(
      go.Node,
      "Auto",
      {
        locationSpot: go.Spot.Center, // Ensures the location is the center of the node
        isLayoutPositioned: false, // Prevent layout from overriding locations
      },
      new go.Binding("location", "loc", parseLocation).makeTwoWay(
        stringifyLocation
      ),
      $(go.Shape, "Rectangle", {
        fill: "white",
        portId: "",
        fromLinkable: true,
        toLinkable: true,
      }),
      $(
        go.Panel,
        "Vertical",
        $(go.Picture, {
          desiredSize: new go.Size(110, 110),
        }).bind("source", "image"),
        $(go.TextBlock, { margin: 5 }).bind("text", "name")
      )
    );

    myDiagram.linkTemplate = $(
      go.Link,
      {
        routing: go.Link.AvoidsNodes,
        corner: 5,
        relinkableFrom: true,
        relinkableTo: true,
      },
      $(go.Shape, { strokeWidth: 2 }, new go.Binding("stroke", "color")),
      $(go.Shape, { toArrow: "Standard" }),
      $(
        go.TextBlock,
        { segmentOffset: new go.Point(0, -10) },
        new go.Binding("text", "relation")
      )
    );

    // Add listeners for various events
    myDiagram.addDiagramListener("SelectionMoved", function (e) {
      e.subject.each(function (part) {
        if (part instanceof go.Node && part.data) {
          // Extracting node information
          const nodeData = part.data; // The data object from your node
          OnNodeMoved(nodeData);
        } else if (part instanceof go.Link) {
          // It's a link
          //console.log("Link moved nodeData:", part.data);
        }
      });
    });

    myDiagram.addDiagramListener("LinkRelinked", function (e) {
      console.log("LinkRelinked");
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

  const OnNodeMoved = async (node) => {
    try {
      const response = await fetch("http://localhost:5000/roots/moveNode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: node.id, loc: node.loc }),
      });
      let res = await response.json();
      if (!res.isSuccess) throw new Error(res.message);
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

  const handleSave = () => {
    const updatedNodes = diagramRef.current.model.nodeDataArray.map((node) => ({
      id: node.id,
      loc: node.loc, // New location
      name: node.name,
    }));

    const updatedLinks = diagramRef.current.model.linkDataArray.map((link) => ({
      id: link.id,
      isDelete: link, // i need help in here
    }));

    saveHandler(updatedNodes, updatedLinks); // Call the save handler passed as a prop
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
      />
      {isEditMode && (
        <button
          onClick={handleSave}
          style={{ marginTop: "10px", padding: "5px 10px" }}
        >
          Save Changes
        </button>
      )}
    </div>
  );
};

export default DiagramComponent;
