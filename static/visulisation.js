var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().distance(1).iterations(3)
    // .force("link", d3.forceLink()
    .id(function(d) { return d.title; }))
    // .distance( function(d) {
    //   if (d.title.indexOf('bindingCircleLayer') >= 0 ) { return 10; } 
    //   return 1;
    // }).strength(0.1));
    .force("charge", d3.forceManyBody().strength(function(d){
      if (d.title.indexOf('orbit') >= 0 ) { return 50; } 
      return -50;
    }));
    // .force("charge", d3.forceX( function(d,i){
    //   console.log(d,i);
    //   return 300;
    // }).strength(.5))
    // .force("charge", d3.forceY( function(d,i){
    //   // console.log(d,i);
    //   return 100;
    // }).strength(.5))
    // .force("center", d3.forceCenter(width / 2, height / 2));

d3.json("data.json", function(error, graph) {
  if (error) throw error;

  function generateBindingCircleLinks () {
    for (var i = 0; i < graph.nodes.length; i++) {
      if (graph.nodes[i]['constituent-pages'] ) {
        graph.nodes[i]['constituent-pages'] += ', /orbit' + graph.nodes[i]['distance-from-core'] + 'Quadrant' + graph.nodes[i]['quadrant'];
      }
      // center the homepage item
      if (graph.nodes[i]['quadrant'] == 'sun' ) {
        graph.nodes[i].fx = width/2;
        graph.nodes[i].fy = height/2;
      }

    }
  }


  function generateBindingCircles () {
    // to make our orbits, we generate "invisible" (unthemed) data points
    var defaultObritSize = 300; // the radius
    var orbits = 2; // the number of rings
    var quadrants = 6; // the number of slices for each orbit

    for (var orbitStep = 1; orbitStep <= orbits; orbitStep++) {
      for (var i = 0; i < quadrants; i++) {
        var degreeChunk = 360/quadrants;

        var circleTitle = 'orbit'+orbitStep+'Quadrant'+i; 

        var bindingCirleNode = new Object();
          bindingCirleNode.title = circleTitle;
          bindingCirleNode['distance-from-core'] = orbitStep;
          bindingCirleNode['paths-in'] = '';
          bindingCirleNode['paths-out'] = '/'+circleTitle+'';
          bindingCirleNode['constituent-pages'] = '';
          bindingCirleNode.fx = (width/2)  + (defaultObritSize * orbitStep) * Math.cos((degreeChunk*i) * Math.PI/180);
          bindingCirleNode.fy = (height/2) + (defaultObritSize * orbitStep) * Math.sin((degreeChunk*i) * Math.PI/180);

        graph.nodes.push(bindingCirleNode);      
      }
    }

  }

  generateBindingCircleLinks();
  generateBindingCircles();

  graph.links.pop(); // empty any test data loaded from the json

  // We programatically generate the links 
  // by pairing the inward/outward paths to constituent pages
  function findConstituentPage(path,childPageTitle,direction) {
    if (path.indexOf('www.ebi.ac.uk') >= 0) {
      path = path.slice(('www.ebi.ac.uk').length);
    }

    if (path.length <= 0) {
      return;
    }

    for (var i = 0; i < graph.nodes.length; i++) {
      var pairablePages = graph.nodes[i]['constituent-pages'].split(', '); // array of possible pairs

      // is there a pairing?
      if ($.inArray(path,pairablePages) >= 0) {
        var parentPageTitle = graph.nodes[i]['title'];
        var newLinkTitle = childPageTitle + ' -> ' + parentPageTitle;

        // don't pair yourself
        if (childPageTitle == parentPageTitle) {
          return;
        }

        console.log('match found between:',childPageTitle, parentPageTitle, path, graph.nodes[i]['constituent-pages'], direction);

        // a match, but if we have already made this link, just make the bond stronger
        graph.links.forEach(function(e){
         if (e['title'] == newLinkTitle) {
          e['value'] += 0.1;
          newLinkTitle = 'abort';
         }
        });

        if (newLinkTitle != 'abort') {
          // first time, so make a new link...
          var newLink = new Object();
            newLink.title = newLinkTitle;      
            newLink.direction = direction;      
            newLink.source = childPageTitle;
            newLink.target = graph.nodes[i]['title'];
            newLink.value = 0.2;

            if (newLinkTitle.indexOf('Quadrant') > 0) {
              // anchor links are stronger ..
              newLink.value = 1;
            }

          graph.links.push(newLink);
        }

      }

    }

  }

  console.table(graph.nodes);

  for (var i = 0; i < graph.nodes.length; i++) {
    var pathsIn = graph.nodes[i]['paths-in'].split(', ');
    // evaluate each path from the page
    for (var j = 0; j < pathsIn.length; j++) {
      findConstituentPage(pathsIn[j],graph.nodes[i]['title'],'paths-in');
    }
    var pathsOut = graph.nodes[i]['paths-out'].split(', ');
    // evaluate each path from the page
    for (var j = 0; j < pathsOut.length; j++) {
      findConstituentPage(pathsOut[j],graph.nodes[i]['title'],'paths-out');
    }
  }


  console.table(graph.links);

  function calculateNodeMass(node) {
    // eventually we'll want to know the analytics traffic (or such), but for now just use size of ecosystem...
    if (node.title.indexOf('orbit') >= 0) {
      return 1;
    }

    var massOfUrls = node['constituent-pages'].split(', ').length + 1;
    return (massOfUrls +10) * 3;
  }



  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
      .attr("class", function(d) { if (d.title.indexOf('orbit') >= 0) { return 'orbit'; } return d['direction']; });

  var node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
      .attr("r", function(d) { return calculateNodeMass(d); })
      //d['distance-from-core']
      .attr("fill", function(d) { return color(d.group); })
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

  var label = svg.append("g")
      .attr("class", "labels")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("text")
      .text(function(d) { return d.title; })
      .attr("class", function(d) { if (d.title.indexOf('orbit') >= 0) { return 'orbit'; } return 'node'; })
      .style("text-anchor", "middle");

  node.append("title")
      .text(function(d) { return d.title; });


  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

  function ticked() {
    node
        .attr("cx", function(d) { return d.x })
        .attr("cy", function(d) { return d.y });

    link
        // .attr("x1", function(d) { return enforceOrbits(d.source.x,d.source.y,d.source['distance-from-core'], 'x'); })
        // .attr("y1", function(d) { return enforceOrbits(d.source.x,d.source.y,d.source['distance-from-core'], 'y'); })
        // .attr("x2", function(d) { return enforceOrbits(d.target.x,d.target.y,d.target['distance-from-core'], 'x'); })
        // .attr("y2", function(d) { return enforceOrbits(d.target.x,d.target.y,d.target['distance-from-core'], 'y'); });
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    
    label
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; });
  }
});

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}
