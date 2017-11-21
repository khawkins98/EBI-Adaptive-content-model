## About

Tooling to visualise EBI content relationships using D3.

Use this explore how content interacts and the types of links between content.

### To do:
1. Add shading spheres based off internal/external and emotional/utility
1. Add compass to show what
    - Who is the label
    - Where: for now all is EMBL-EBI (maybe this needs to be an eventual filter?)
1. Drop user type legend

### Legend:
* Size: Reflects page views
* Colour blots: show user types
* Solid lines: parent-child relationships, colour indicates parent group
* Dashed lines: tangental but important relationships (page exits)
* Polygons with slash: where page view data is not available

### Features:
* Clicking on a content node allows you to explore its corresponding Core Content Description (this is not implemented in the BlockBuilder version).
* Pan and zoom with the mouse
* Hover over a node to see a count of its child nodes
* Drag to rearrange nodes
* This version uses the <a href="https://github.com/upphiminn/d3.ForceBundle">Javascript Force Edge Bundling for d3.js</a> and offers general functional improvement over v0.2

### Change log
- v0.5: Updates the visualisation format to be more concise, focus on putting into use
- v0.4: First version that will leverage the matured Core Content Specifications
- original: <a href='http://bl.ocks.org/khawkins98/fa6292523b1680ecbb15'>Adaptive-content-model V0.2</a>
