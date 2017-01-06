var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.title; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

d3.json("data.json", function(error, graph) {
  if (error) throw error;


  // We programatically generate the links 
  // by pairing the inward/outward paths to constituent pages
  graph.links.pop(); // empty any test data
  function findConstituentPage(pathIn,childPageTitle) {
    if (pathIn.indexOf('www.ebi.ac.uk') >= 0) {
      pathIn = pathIn.slice(('www.ebi.ac.uk').length);
    }

    for (var i = 0; i < graph.nodes.length; i++) {
      // is there a pairing?
      if (graph.nodes[i]['constituent-pages'].indexOf(pathIn) >= 0) {
        var parentPageTitle = graph.nodes[i]['title'];
        var newLinkTitle = childPageTitle + ' -> ' + parentPageTitle;

        // don't pair yourself
        if (childPageTitle == parentPageTitle) {
          return;
        }

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
            newLink.source = childPageTitle;
            newLink.target = graph.nodes[i]['title'];
            newLink.value = 0.2;

          graph.links.push(newLink);
        }

      }

    }

  }

  for (var i = 0; i < graph.nodes.length; i++) {
    var pathsIn = graph.nodes[i]['paths-in'].split(', ');
    // evaluate each path from the page
    for (var j = 0; j < pathsIn.length; j++) {
      findConstituentPage(pathsIn[j],graph.nodes[i]['title']);
    }
  }


  console.table(graph.links);

  function calculateNodeMass(node) {
    var massOfUrls = node['constituent-pages'].split(', ').length + 1;
    return massOfUrls * 2;
  }

  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

  var node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
      .attr("r", function(d) { return calculateNodeMass(d); })
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
      .text(function(d) { return d.title; });

  node.append("title")
      .text(function(d) { return d.title; });


  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

  function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    
    label
        .attr("x", function(d) { return d.x+10; })
        .attr("y", function(d) { return d.y+5; });
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
