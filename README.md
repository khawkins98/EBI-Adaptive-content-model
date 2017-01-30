## About
v0.4 - This is the first version that will leverage the matured Core Content Specifications

----

Tooling to visualise EBI content relationships using D3.

Use this explore how content interacts and the types of links between content.

Legend:
* Size: Reflects page views
* Color blots: show user types
* Solid lines: parent-child relationships, color indicates parent group
* Dahsed lines: tagental but important relationships (page exits)
* Polygons with slash: where page view data is not availible


Features:
* Clicking on a content node allows you teo explore its coresponding Core Content Description (this is not implemented in the BlockBuilder version).
* Pan and zoom with the mouse
* Hover over a node to see a count of its child nodes
* Drag to rearange nodes
* This version uses the <a href="https://github.com/upphiminn/d3.ForceBundle">Javascript Force Edge Bundling for d3.js</a> and offers general functional improvement over v0.2

Previous version: <a href='http://bl.ocks.org/khawkins98/fa6292523b1680ecbb15'>Adaptive-content-model V0.2</a>
