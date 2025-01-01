import * as go from "gojs";


const MINLENGTH = 1000; // this controls the minimum length of any swimlane
const MINBREADTH = 120; // this controls the minimum breadth of any non-collapsed swimlane

// define a custom ResizingTool to limit how far one can shrink a lane Group
class LaneResizingTool extends go.ResizingTool {
  constructor(init) {
    super();
    if (init) Object.assign(this, init);
  }

  isLengthening() {
    return this.handle.alignment === go.Spot.Right;
  }

  computeMinSize() {
    const lane = this.adornedObject.part;
    // assert(lane instanceof go.Group && lane.category !== "Pool");
    const msz = computeMinLaneSize(lane); // get the absolute minimum size
    if (this.isLengthening()) {
      // compute the minimum length of all lanes
      const sz = computeMinPoolSize(lane.containingGroup);
      msz.width = Math.max(msz.width, sz.width);
    } else {
      // find the minimum size of this single lane
      const sz = computeLaneSize(lane);
      msz.width = Math.max(msz.width, sz.width);
      msz.height = Math.max(msz.height, sz.height);
    }
    return msz;
  }

  resize(newr) {
    const lane = this.adornedObject.part;
    if (this.isLengthening()) {
      // changing the length of all of the lanes
      lane.containingGroup.memberParts.each((lane) => {
        if (!(lane instanceof go.Group)) return;
        const shape = lane.resizeObject;
        if (shape !== null) {
          // set its desiredSize length, but leave each breadth alone
          shape.width = newr.width;
        }
      });
    } else {
      // changing the breadth of a single lane
      super.resize(newr);
    }
    relayoutDiagram(this.diagram); // now that the lane has changed size, layout the pool again
  }
}

// determine the minimum size of a Lane Group, even if collapsed
function computeMinLaneSize(lane) {
  if (!lane.isSubGraphExpanded) return new go.Size(MINLENGTH, 1);
  return new go.Size(MINLENGTH, MINBREADTH);
}

function computeMinPoolSize(pool) {
  // assert(pool instanceof go.Group && pool.category === "Pool");
  let len = MINLENGTH;
  pool.memberParts.each((lane) => {
    // pools ought to only contain lanes, not plain Nodes
    if (!(lane instanceof go.Group)) return;
    const holder = lane.placeholder;
    if (holder !== null) {
      len = Math.max(len, holder.actualBounds.width);
    }
  });
  return new go.Size(len, NaN);
}

// compute the minimum size for a particular Lane Group
function computeLaneSize(lane) {
  // assert(lane instanceof go.Group && lane.category !== "Pool");
  const sz = computeMinLaneSize(lane);
  if (lane.isSubGraphExpanded) {
    const holder = lane.placeholder;
    if (holder !== null) {
      sz.height = Math.ceil(Math.max(sz.height, holder.actualBounds.height));
    }
  }
  // minimum breadth needs to be big enough to hold the header
  const hdr = lane.findObject("HEADER");
  if (hdr !== null)
    sz.height = Math.ceil(Math.max(sz.height, hdr.actualBounds.height));
  return sz;
}


function relayoutDiagram(diagram) {
  diagram.layout.invalidateLayout();
  diagram.findTopLevelGroups().each((g) => {
    if (g.category === 'Pool') g.layout.invalidateLayout();
  });
  diagram.layoutDiagram();
}
// end LaneResizingTool class

export default LaneResizingTool;
