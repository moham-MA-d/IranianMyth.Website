import * as go from "gojs";

class PoolLayout extends go.GridLayout {
  constructor(init) {
    super();
    this.cellSize = new go.Size(1, 1);
    this.wrappingColumn = 1;
    this.wrappingWidth = Infinity;
    this.isRealtime = false; // don't continuously layout while dragging
    this.alignment = go.GridAlignment.Position;
    // Sort based on the location of each Group (useful when Groups can be moved up/down to change order)
    this.comparer = (a, b) => {
      // First try to use the order property from the data
      const aOrder = a.data?.order;
      const bOrder = b.data?.order;
      
      if (aOrder !== undefined && bOrder !== undefined) {
        return aOrder - bOrder;
      }
      
      // Fall back to Y position if order is not specified
      const ay = a.location.y;
      const by = b.location.y;
      if (isNaN(ay) || isNaN(by)) return 0;
      if (ay < by) return -1;
      if (ay > by) return 1;
      return 0;
    };
    // Custom bounds computation for Groups
    this.boundsComputation = (part, layout, rect) => {
      part.getDocumentBounds(rect);
      rect.inflate(-1, -1); // Negative strokeWidth of the border Shape
      return rect;
    };
    if (init) Object.assign(this, init); // Apply any initialization properties
  }
}

export default PoolLayout;
