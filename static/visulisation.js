var showUserDots = false,
    showExternalAspirational = true;

var svg = d3.select('#visulisation').select("svg")
          .call(d3.zoom()
          .scaleExtent([.8,3])
          .on("zoom", function () {
            svg.attr("transform", d3.event.transform)
          }))
          .append('g')
        ;


var width = $('#visulisation').parent().width(),
    height = $('#visulisation').parent().height()-50,
    minHeight = 800;

  if (height < minHeight) {
    height = minHeight;
  }

  var centerHeight = height/2,
      radius = height/2.1;

    // width = +svg.attr("width"),
    // height = +svg.attr("height");

$('#visulisation svg').width(width);
$('#visulisation svg').height(height);

function rand1toN(N){
  return Math.floor( Math.random() * N );
}

svg.selectAll('g').call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));


var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().distance(0).iterations(1)
    // .force("link", d3.forceLink()
    .id(function(d) { return d.title; }))
    // .distance( function(d) {
    //   if (d.title.indexOf('bindingCircleLayer') >= 0 ) { return 10; }
    //   return 1;
    // }).strength(0.1));
    .force("charge", d3.forceManyBody().strength(function(d){
      if (d.title.indexOf('orbit') >= 0 ) { return 50; }
      return -1000;
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
        graph.nodes[i].fy = centerHeight;
      }

    }
  }

  function generateBindingCircles () {
    // to construct our orbits, we generate "invisible" (unthemed) data points
    var orbits = 3; // the number of rings
    var defaultObritSize = (radius-20)/(orbits/2); // the radius of each orbit
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
          bindingCirleNode.fy = (height/2.6) + (defaultObritSize * orbitStep) * Math.sin((degreeChunk*i) * Math.PI/180);

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
        var newLinkTitle = parentPageTitle + ' -> ' + childPageTitle;

        // don't pair yourself
        if (childPageTitle == parentPageTitle) {
          return;
        }

        // console.log('match found between:',childPageTitle, parentPageTitle, path, graph.nodes[i]['constituent-pages'], direction);

        // a match, but if we have already made this link, just make the bond stronger
        graph.links.forEach(function(e){
         if (e['title'] == newLinkTitle) {
          e['value'] += 0.1;
          return;
         }
        });

        // first time, so make a new link...
        var newLink = new Object();
          newLink.title = newLinkTitle;
          newLink.direction = direction;
          if (direction == 'paths-in') {
            newLink.source = graph.nodes[i]['title'];
            newLink.target = childPageTitle;
          } else if (direction == 'paths-out') {
            newLink.source = childPageTitle;
            newLink.target = graph.nodes[i]['title'];
          }
          newLink.value = 0.2;

          if (newLinkTitle.indexOf('Quadrant') > 0) {
            // anchor links are stronger ..
            newLink.value = 1;
          }

        graph.links.push(newLink);

      }

    }

  }

  console.table(graph.nodes);

  for (var i = 0; i < graph.nodes.length; i++) {
    var pathsIn = graph.nodes[i]['paths-in'].split(', ');
    // evaluate each path INTO the page
    for (var j = 0; j < pathsIn.length; j++) {
      findConstituentPage(pathsIn[j],graph.nodes[i]['title'],'paths-in');
    }
    var pathsOut = graph.nodes[i]['paths-out'].split(', ');
    // evaluate each path FROM the page
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

    return 40;

    var massOfUrls = node['constituent-pages'].split(', ').length + 1;
    return (massOfUrls +10) * 3;
  }

  // place a do on our circle's edge
  // 0deg is north

  var circleOffset = 20; // how many degreees we want to "tilt" the labels
  function circleArcX(degree) {
    var defaultObritSize = radius; // the radius
    var quadrants = 12; // the number of slices for each orbit
    var degreeChunk = 360/quadrants;
    return (width/2) + (defaultObritSize) * Math.cos((degreeChunk*(((degree+circleOffset)-degreeChunk)/degreeChunk)) * Math.PI/180);
  }
  function circleArcY(degree) {
    var defaultObritSize = radius; // the radius
    var quadrants = 12; // the number of slices for each orbit
    var degreeChunk = 360/quadrants;
    return (centerHeight) + (defaultObritSize) * Math.sin((degreeChunk*(((degree+circleOffset)-degreeChunk)/degreeChunk)) * Math.PI/180);
  }

  // add the compass
  var compassCircle = svg.append("g")
                          .attr("class", "compass")
                          .append("circle")
                          .attr("cx", width/2)
                          .attr("cy", centerHeight)
                          .attr("r", radius)
                          .style("stroke-width", "1")
                          .style("stroke", "#CCC")
                          .style("fill", "none");

  var compassLabelServices = svg.append("g")
                          .attr("class", "compass-labels")
                          .append("text")
                          .attr("x", circleArcX(0))
                          .attr("y", circleArcY(0))
                          .attr("text-anchor","middle")
                          .text( function (d) { return "Services"; })
                          ;

  var compassLabelResearch = svg.append("g")
                          .attr("class", "compass-labels")
                          .append("text")
                          .attr("x", circleArcX(60))
                          .attr("y", circleArcY(60))
                          .attr("text-anchor","middle")
                          .text( function (d) { return "Research"; })
                          ;

  var compassLabelImpact = svg.append("g")
                          .attr("class", "compass-labels")
                          .append("text")
                          .attr("x", circleArcX(140))
                          .attr("y", circleArcY(140))
                          .attr("text-anchor","middle")
                          .text( function (d) { return "Impact "; })
                          ;

  var compassLabelIndustry = svg.append("g")
                          .attr("class", "compass-labels")
                          .append("text")
                          .attr("x", circleArcX(100))
                          .attr("y", circleArcY(100))
                          .attr("text-anchor","middle")
                          .text( function (d) { return "Industry"; })
                          ;

  var compassLabelOrganisational = svg.append("g")
                          .attr("class", "compass-labels")
                          .append("text")
                          .attr("x", circleArcX(220))
                          .attr("y", circleArcY(220))
                          .attr("text-anchor","middle")
                          .text( function (d) { return "Organisational"; })
                          ;

  var compassLabelTraining = svg.append("g")
                          .attr("class", "compass-labels")
                          .append("text")
                          .attr("x", circleArcX(280))
                          .attr("y", circleArcY(280))
                          .attr("text-anchor","middle")
                          .text( function (d) { return "Training"; })
                          ;


  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("svg:path")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
      .attr("marker-end", "url(#end)")
      .attr("marker-start", "url(#start)")
      .attr("class", function(d) { if (d.title.indexOf('orbit') >= 0) { return 'orbit'; } return d['direction']; });

  // make the nodes.
  var node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("g").attr("class", "node-group");

    // infobox
    node.on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)


    // invoke dragability
    // node.call(d3.drag()
    //       .on("start", dragstarted)
    //       .on("drag", dragged)
    //       .on("end", dragended));

    // node.append("circle")
    //   .attr("r", function(d) { return calculateNodeMass(d); })
    //   //d['distance-from-core']
    //   .attr("fill", function(d) { return 'green'; });

    // the node dots to show each user group
    node.html(function(d) {
      var output = '';
      if (d.audience) {
        var audienceMembers = d.audience.split(',');
        var radius = calculateNodeMass(d);
        // add one under circle to mask arrows
        output += '<circle r="20" class="white-background"></circle>';
        if (showUserDots) {
          for (var i = 0; i < audienceMembers.length; i++) {
            audienceMembers[i] = audienceMembers[i].replace(/[\W_]+/g," ").trim().toLowerCase().replace(/[\W_]+/g,"-"); // cleanup label to text class
            output += '<circle transform="translate()" r="' + 5 + '" class="' + audienceMembers[i] + '"></circle>';
          }
        }

        if (showExternalAspirational) {
          // infoBox += '<span class="block secondary-background text-right white-color" style="width:'+d['outside']+'0%">'+d['outside']+'&nbsp;</span>';
          // infoBox += '<span class="block secondary-background text-right white-color" style="width:'+d['emotional']+'0%">'+d['emotional']+'&nbsp;</span>';

          // external vs internal
          output += '<circle transform="translate()" r="'+((d['outside'])*2.25)+'" class="external-aspiration" style="Xopacity:.'+ ((d['outside'])*10) + '" stroke-dasharray=30,'+ (d['outside']-2) + '></circle>';

          // utility vs emotional
          output += '<circle transform="translate()" r="'+((d['emotional'])*2)+'" class="emotional" style="Xopacity:.'+ ((d['emotional'])*10) + '"></circle>';

        }

        // add text labels
        output += '<text class="label" style="text-anchor: middle;">' + d.title + '</text>';

        // var label = svg.append("g")
        //     .attr("class", "labels")
        //   .selectAll("circle")
        //   .data(graph.nodes)
        //   .enter().append("text")
        //     .text(function(d) { return d.title; })
        //     .attr("class", function(d) { if (d.title.indexOf('orbit') >= 0) { return 'orbit'; } return 'node'; })
        //     .style("text-anchor", "middle");

        output = '<g class="inner">' + output + '</g>';
      }

      return output;
    });



  // var label = svg.append("g")
  //     .attr("class", "labels")
  //   .selectAll("circle")
  //   .data(graph.nodes)
  //   .enter().append("text")
  //     .text(function(d) { return d.title; })
  //     .attr("class", function(d) { if (d.title.indexOf('orbit') >= 0) { return 'orbit'; } return 'node'; })
  //     .style("text-anchor", "middle");


  // marker arrows
  // via http://bl.ocks.org/d3noob/5141278
  // build the arrow.
  svg.append("svg:defs").selectAll("marker")
      .data(["end"])      // Different link/path types can be defined here
    .enter().append("svg:marker")    // This section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 42)
      .attr("refY", -2.5)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
    .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

  svg.append("svg:defs").selectAll("marker")
      .data(["start"])      // Different link/path types can be defined here
    .enter().append("svg:marker")    // This section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", -48)
      .attr("refY", -3.5)
      .attr("markerWidth", 7)
      .attr("markerHeight", 7)
      .attr("orient", "auto")
    .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

  node.append("title")
      .text(function(d) { return d.title; });


  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

  function ticked() {
    node
      .attr("transform",function(d) { return "translate(" + d.x + "," + d.y +")" });
      // .attr("x", function(d) { return d.x })
      // .attr("y", function(d) { return d.y });

    link.attr("d", function(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy)*2;
      return "M" +
        d.source.x + "," +
        d.source.y + "A" +
        dr + "," + dr + " 0 0,1 " +
        d.target.x + "," +
        d.target.y;
    });

    // link
    //     // .attr("x1", function(d) { return enforceOrbits(d.source.x,d.source.y,d.source['distance-from-core'], 'x'); })
    //     // .attr("y1", function(d) { return enforceOrbits(d.source.x,d.source.y,d.source['distance-from-core'], 'y'); })
    //     // .attr("x2", function(d) { return enforceOrbits(d.target.x,d.target.y,d.target['distance-from-core'], 'x'); })
    //     // .attr("y2", function(d) { return enforceOrbits(d.target.x,d.target.y,d.target['distance-from-core'], 'y'); });
    //     .attr("x1", function(d) { return d.source.x; })
    //     .attr("y1", function(d) { return d.source.y; })
    //     .attr("x2", function(d) { return d.target.x; })
    //     .attr("y2", function(d) { return d.target.y; });

    // label
    //   .attr("x", function(d) { return d.x; })
    //   .attr("y", function(d) { return d.y; });
  }

  // zoom and drag

  // var  transform = d3.zoomIdentity;
  // svg.call(d3.zoom()
  //     .scaleExtent([1,3])
  //     .on("zoom", zoomed));
  //
  // function zoomed() {
  //   link.attr("transform", d3.event.transform);
  //   // d3.select('#visulisation').select('svg').selectAll('.inner').attr("transform", d3.event.transform);
  // }

  // link.call(d3.drag()
  //    .on("drag", draggedContainer));
  // function draggedContainer(d) {
  //   d.fx = d3.event.x;
  //   d.fy = d3.event.y;
  // }

});

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;

  d3.select('.compass').attr("transform",function(d) { return "translate(" + d3.event.x + "," + d3.event.y +")" });

}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

// simple reusable function to format content
function wrapInHtmlTag(content,tag) {
  if (tag == 'label') {
    return '<div><span class="ebi-color label uppercase">' + content + '</span></div>';
  }
  return '<' + tag + '>' + content + '</' + tag + '>';
}

function commasToBreaks(content) {
  function replacement(str, p1, offset, s) {
    return '<br/>';
  }
  var pattern = /, /g;
  content = content.replace(pattern, replacement);
  // remove any notations about orbit urls...
  content = content.split('/orbit')[0];
  return content;
}

// Create Event Handlers for mouse
function handleMouseOver(d, i) {  // Add interactivity
  // activate hover
  d3.select(this).classed("active", true);

  // Show the data record
  var infoBox =  wrapInHtmlTag(d.title,'h4');
      infoBox += wrapInHtmlTag(d['content'],'p');
      infoBox += '<p><a href="' + d['record-url'] + '" class="readmore" target="_blank">View the core content record</a> ';
      infoBox += '<a href="' + d['analytics-url'] + '" class="readmore" target="_blank">View the analytics report</a></p>';
      infoBox += wrapInHtmlTag('constituent pages','label');
      infoBox += wrapInHtmlTag(commasToBreaks(d['constituent-pages']),'p');
      infoBox += wrapInHtmlTag('goals','label');
      infoBox += wrapInHtmlTag(commasToBreaks(d['goals']),'p');
      infoBox += wrapInHtmlTag('audience','label');
      infoBox += wrapInHtmlTag(commasToBreaks(d['audience']),'p');
      infoBox += wrapInHtmlTag('paths-in','label');
      infoBox += wrapInHtmlTag(commasToBreaks(d['paths-in']),'p');
      infoBox += wrapInHtmlTag('paths-out','label');
      infoBox += wrapInHtmlTag(commasToBreaks(d['paths-out']),'p');
      infoBox += wrapInHtmlTag('inside to outside','label');
      infoBox += '<span class="block secondary-background text-right white-color" style="width:'+d['outside']+'0%">'+d['outside']+'&nbsp;</span>';
      infoBox += wrapInHtmlTag('rational vs emotional','label');
      infoBox += '<span class="block secondary-background text-right white-color" style="width:'+d['emotional']+'0%">'+d['emotional']+'&nbsp;</span>';
      // infoBox += wrapInHtmlTag(commasToBreaks(),'p');

  $('#infobreakout').html(infoBox);
  $('#infobreakout-reveal').foundation('open'); // show reveal
}

function handleMouseOut(d, i) {
  // deactivate hover
  d3.select(this).classed("active", false);
}
