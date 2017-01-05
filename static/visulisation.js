// About:
// This combines the basic D3 Force view with a newer "ForceBundle" graph.
// We first invoke the D3 Force to arange the nodes, and then ForceBundle to
// make it all pretty.

// info on force graphing
// http://bl.ocks.org/sathomas/1ca23ee9588580d768aa
// to do: experiment with specific force links: http://bl.ocks.org/sathomas/774d02a21dc1c714def8
// force layout settings https://github.com/mbostock/d3/wiki/Force-Layout#friction

// set the vis size
var width = window.innerWidth,
    height = window.innerHeight - $('header').height();

// global settings
var widthPageNodes = 0.3,
    widthContenteNodes = 0.1;

// set the colors we wish to use
var color = d3.scale.ordinal()
    .range(colorbrewer.Paired[9]);
    // Showcase of colorbrewer pallets: http://bl.ocks.org/mhkeller/10504471

// set up the basic force direction graph
var force = d3.layout.force()
    .linkDistance(function(node) {
      return 30;
      // return ((Math.abs(node.value) * Math.abs(node.value)) * 3) + 100;
    })
    .gravity(0.015)
    .charge(function(node) {
      // console.log(Math.abs(node.radius));
      // return '-10';
       return '-' + ( ((Math.abs(node.radius) * Math.abs(node.radius)) * 3) + 90 );
    })
    .linkStrength(function(node) {
       return ( node.value + .5 ) * .5;
    })
    // .alpha(-.1)
    // .friction(.5)
    .size([width, height]);

// Append the SVG contianter for the vis
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);
var svgInner = svg.append("g");

//-------------------
// add SVG filters
// filters go in defs element
var defs = svg.append("defs");

// blur filter
var filterBlur = defs.append("filter")
     .attr("id", "blur")
     .append("feGaussianBlur")
     .attr("stdDeviation", 1);

// create filter with id #drop-shadow
var filterShadow = defs.append("filter")
   .attr("id", "drop-shadow")
   .attr("height", "130%"); // height=130% so that the shadow is not clipped

// SourceAlpha refers to opacity of graphic that this filter will be applied to
// convolve that with a Gaussian with standard deviation 3 and store result
// in blur
filterShadow.append("feGaussianBlur")
   .attr("in", "SourceAlpha")
   .attr("stdDeviation", 2)
   .attr("result", "blur");

// translate output of Gaussian blur to the right and downwards with 2px
// store result in offsetBlur
filterShadow.append("feOffset")
   .attr("in", "blur")
   .attr("dx", 0)
   .attr("dy", 0)
   .attr("result", "offsetBlur");

 // overlay original SourceGraphic over translated blurred opacity by using
 // feMerge filter. Order of specifying inputs is important!
 var feMerge = filterShadow.append("feMerge");
 feMerge.append("feMergeNode")
     .attr("in", "offsetBlur");
 feMerge.append("feMergeNode")
     .attr("in", "SourceGraphic");

//-------------------
// Intro animation
// for this animation we area masking the content while it loads
// boxBack blocks, while boxTop provides a visual
var boxBack = svg.append("rect")
              .attr('class','boxBack')
              .attr("x", 0)
               .attr("y", 0)
              .attr("width", width)
              .attr("height", height)
              .style("fill", function(d) {  return '#70BDBD' });

boxBack.transition()
              .duration(1200)
              // .style("opacity", function(d) {  return '0' })
              .delay(1500)
              .attr("x", width + 10)
              // .remove();

var boxTop = svg.append("rect")
              .attr('class','boxTop')
              .attr("x", width + 100)
              .attr("y", 100)
              .attr("width", 50)
              .attr("height", height - 200)
              .style("fill", function(d) {  return 'rgba(255,255,255,.3)' });


boxTop.transition()
              .duration(1000)
              .delay(100)
              .each(animateIntro);

function animateIntro() {
    var target = d3.select(this);
    target = target.transition()
        .attr("y", 0)
        .attr("height", height)
        .attr("x", 0)
        .attr("width",300)
      .transition()
        .attr("y", 0)
        .attr("height", height)
        .style("fill", function(d) {  return 'rgba(255,255,255,1)' })
        .attr("width",width)
        .attr("x", width);
        // .remove();
        // .each("end", repeat);

    // target.transition()
    //           .attr("x",820)
    //           .style("fill", function(d) {  return 'rgba(255,255,255,.0)' })
    //           .duration(1000)
    //           .attr("width",100)
    //           .delay(1000);
}

// render controls to filter components
// function infoBoxControls() {
//   return '<form>\
//             <div class="row">\
//               <div class="small-12 columns">\
//                 <select name="select">\
//                   <option value="null" selected>Highlight nodes with...</option> \
//                   <option value="value2">Value 2</option>\
//                   <option value="value3">Value 3</option>\
//                 </select>\
//               </div>\
//             </div>\
//           </form>';
// }

// make things dragable
var drag = d3.behavior.drag()
    .on("drag", function() {
        var coordinates = [0, 0];
        coordinates = d3.mouse(document.body);
        // coordinates = d3.mouse(this); //relative to origin
        var x = coordinates[0];
        var y = coordinates[1];
        // console.log(x,y,this);
        d3.select(this).attr("style", function() {
            return "top: " + y + "px; left: " + x + "px;";
        })
    });

// Append the info
d3.select("#info-container").style("z-index", "10").call(drag);;
var info = d3.select("#info-container")
  .append("div")
  .attr('class','info')
  // .style("position", "absolute")
  // .style("visibility", "hidden")
  .html('Hover over a node for more information.');


// Load Page data
// We won't directly process this into the d3 visulisation,
// rather we will use it as data to show to the user and filter on.
var pageData = $.getJSON( "data-pages.json", function() {
  // console.log( "success" );
})
  .done(function() {
    // console.log( "second success" );
  })
  .fail(function() {
    console.log( "data-pages.json error" );
  })
  .always(function() {
    // console.log( "complete" );
  });

// process the page data, maybe?
pageData.complete(function() {
  // console.log( pageData.responseJSON.nodes );
});


// Load the data
// http://khawkins98.github.io/EBI-Adaptive-content-model/data.json
// d3.json("content-model.json", function(error, graph) {
d3.json("data.json", function(error, graph) {
  if (error) console.log(error,graph);

  var nodes = graph.nodes,
      links = [],
      bilinks = [];


  // Utility method to find property by value
  // We use this to see if we've already created a parent page
  function getParentPagePosition(value,target) {
    for (var i = 0; i < target.length; i++) {
      if (target[i].title == value) {
        // increment number of connections
        target[i].radius++;

        // return the pointer to the match
        return i;
      }
    }

    return 0;
  }

  // Process loaded JSON
  // Set defaults and create parent pages
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].radius = nodes[i].radius || 1; // 1 = page node
    nodes[i].group  = nodes[i].group || 2; // 2 = content node

    // make new page objects from referenced items
    if (nodes[i]['parent-pages'] != undefined) {
      var pages = nodes[i]['parent-pages'].split(', ');
      for (var i2 = 0; i2 < pages.length; i2++) {

        // Does a parent page already exsist?
        var parentPagePosition = getParentPagePosition(pages[i2],nodes,'title');
        if (parentPagePosition == 0) {
          // construct a new node
          var newNode = new Object();
          newNode.title = pages[i2];
          newNode.radius = 1; // start at 1 and later we'll increment for every new link
          newNode.group = 1; // 1 = page
          // newNode.index = nodes.length + 1;
          // newNode.px = Math.floor(Math.random() * 70);
          // newNode.py = Math.floor(Math.random() * 70);
          // newNode.x = Math.floor(Math.random() * 70);
          // newNode.y = Math.floor(Math.random() * 70);
          // newNode.weight = 0;

          // Get affiliated data from data-pages.json object
          var pagesToCrawl = pageData.responseJSON.nodes;
          for (var i3 = 0; i3 < pagesToCrawl.length; i3++) {
              // console.log(pagesToCrawl[i3]);
            if (pagesToCrawl[i3]['page-url'] === newNode.title) {
              newNode.pageUrl = pagesToCrawl[i3]['page-url'];
              newNode.goals = pagesToCrawl[i3]['goals'];
              newNode.users = pagesToCrawl[i3]['users'];
              newNode.role = pagesToCrawl[i3]['role'];
              newNode.priority = pagesToCrawl[i3]['priority'];

              // has an anchored placement been requested?
              if (pagesToCrawl[i3]['position-horizontal'].length > 0) {
                newNode.fixed = true;
                newNode.y = height * (pagesToCrawl[i3]['position-vertical'] / 100);
                newNode.x = width * (pagesToCrawl[i3]['position-horizontal'] / 100);
              }
            }

          }

          // add new node to master list
          nodes.push(newNode);

          parentPagePosition = nodes.length - 1;
        }

        // make a link between the parent page item and the child content item
        var newLink = new Object();
        newLink.value = widthContenteNodes;
        newLink.source = parentPagePosition;
        newLink.target = i;

        graph.links.push(newLink);
      }
    }

  }

  // Create parent page hirearchy
  for (var i = 0; i < nodes.length; i++) {

    // make new page nodes by tallying referenced items
    if (nodes[i].group == 1) {

      var parentPages = nodes[i].title.split('/');
      var pageToSearchFor = '';
      var deepestMatch = 0; // track the best match
      for (var i2 = 1; i2 < parentPages.length; i2++) {
        pageToSearchFor = pageToSearchFor + '/' + parentPages[i2];
        if (pageToSearchFor != nodes[i].title) { // don't link to self
          deepestMatch = getParentPagePosition(pageToSearchFor,nodes,'title');
          // console.log(nodes[i].title,pageToSearchFor,parentPagePosition);
        }
      }

      // make affiliated link
      if (deepestMatch != 0) {
        var newLink = new Object();
        newLink.value = widthPageNodes;
        newLink.source = deepestMatch;
        newLink.target = i;
        graph.links.push(newLink);
      }

    }
  }


  // Create parent page hirearchy
  for (var i = 0; i < nodes.length; i++) {

      var parentPages = nodes[i].title.split('/');

      // Link top level page (/research, /training...) to www.ebi.ac.uk
      if (parentPages.length == 2) {
        // where is www.ebi.ac.uk?
        deepestMatch = getParentPagePosition('/www.ebi.ac.uk',nodes,'title');
        // console.log(deepestMatch);

        // console.log(parentPages);
        var newLink = new Object();
        newLink.value = 0.5;
        newLink.source = deepestMatch;
        newLink.target = i;

        graph.links.push(newLink);

      }


  }




  // Setup the force direction graph
  force
      .nodes(nodes)
      .links(graph.links);
      // .start();

  // Position certain points
  // Assign variables to the position of each item in the array.
  // It is equal to the "Row" column from the google doc minus 1 (1 = 0)
  // https://docs.google.com/spreadsheets/d/1yikAVpZo4nXy7TZkHP7bDHCCOKs_mGsLUH-BwReFsK0/edit#gid=0
  // var nodeEMBL = 21,
  //     nodeRESEARCH = 2,
  //     nodeServices = 1,
  //     nodeTraining = 3,
  //     nodeNews = 7,
  //     nodeAbout = 4,
  //     nodeIntranet = 27,
  //     nodeELIXIR = 6,
  //     nodeSources = 55,
  //     nodePeople = 47,
  //     nodeExits = 56,
  //     nodeIndustry = 5;

      // console.log(nodes);

  // nodes[0].fixed = true; //front
  // nodes[0].x = width*.5;
  // nodes[0].y = height*.25;
  // console.log(nodes[0].name);

  // console.log(nodes);


  // Start the force graph
  force.start();

  // Add basic SVG containers and allow them to be drug about
  var node = svgInner.selectAll(".node")
    .data(nodes)
    .enter().append("g")
    // .attr("d.x", 250)
    // .attr("d.y", 250)
    .attr("class", "node")
    .call(force.drag);

  // The basic D3 Force lines,
  // they'll act as a little "loading" animation
  var link = svgInner.selectAll(".link")
    .data(graph.links)
    .enter().append("line")
      .style("stroke", function(d) { return color(d.source.group); })
      .attr("class", function(d) {  return "link-"+(d.value) * 100 })
      .style("stroke-width", function(d) { return "0.1"; });

    node
      .append('text')
      .attr("dx", function(d) { return 8 + d.radius * 1.4; })
      // .attr("dx", function(d) { return ((d.radius * 2.5) + 4); })
      .attr("class", function(d) {  return "group-"+(d.group) })
      .style("fill", function(d) {  return 'rgba(0,0,0,.9)' })
      .attr("charge", -500)
      .attr("dy", ".35em")
      .text(function(d) { return (d.title).replace(/^(.*[\\\/])/g,''); }); //Keep only the name after the trailing slash

  // For force bundling can't work directly from the data,
  // so we must generate a new marker ID object from the original data
  var graphLinksNew = new Array(graph.links.length);
  for (i=0;i<graph.links.length;i++) {
    graphLinksNew[i] = { 'source' : graph.links[i].source.index,
                         'target' : graph.links[i].target.index
                       };
  }

  // Render the ForceBundling visulisation
  function invokeForceBundling() {

    // invoke forcebundling only once
    var forceBundleInstantiation = d3.ForceEdgeBundling().step_size(0.5).nodes(nodes).edges(graphLinksNew);
    var results = forceBundleInstantiation();

    // Purge the old geometry
    d3.selectAll("line").remove();
    d3.selectAll("path").remove();
    d3.selectAll("polygon").remove();

    // Unfortunately, ForceBundle does not retain the metada
    // about the "value" of the line, so we
    // use the target IDs to lookuo the thickness of the line
    // from the original Force data
    function findConnectionInfo(sourceID,targetID) {
      for(var i = 0; i < graph.links.length; i++){
        if (graph.links[i].source.index == sourceID && graph.links[i].target.index == targetID) {
          // Increment the number of nodes this is connected to.
          // Note: The target is where the content is referencing a source page.
          // graph.links[i].target.radius++;
          // console.log(graph.links[i]);

          // make the connection
          return graph.links[i];
        }
      }
    }

    // calculate the lines
    var d3line = d3.svg.line()
      .x(function(d){return d.x;})
      .y(function(d){return d.y;})
      .interpolate("linear");

    //plot the data
    for (var i = 0; i < results.length; i++) {
      var parentNode = results[i][results[i].length-1];
      var parentConnection = findConnectionInfo(results[i][0].index,results[i][results[i].length-1].index);

      // svg.append("defs").selectAll("marker")
      //     .data(["suit", "licensing", "resolved"])
      //   .enter().append("marker")
      //     .attr("id", function(d) { return d; })
      //     .attr("viewBox", "0 -5 10 10")
      //     .attr("refX", 25)
      //     .attr("refY", 0)
      //     .attr("markerWidth", 6)
      //     .attr("markerHeight", 6)
      //     .attr("orient", "auto")
      //   .append("path")
      //     .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
      //     .style("stroke", "#4679BD")
      //     .style("opacity", "0.6");

      // svg.insertBefore("path",svg).attr("d", d3line(results[i]))
      // var sourceNodeRoles = (parentConnection.source['role'] || '').split(',');
      // var targetNodeRoles = (parentConnection.target['role'] || '').split(',');
      // console.log(sourceNodeRoles,targetNodeRoles);

        // console.log('brand',hexToRgb(color('green')));
        // console.log('nav',hexToRgb(color('nav')));
        // console.log('info',hexToRgb(color('info')));

      var widthAdjust = .5;

      // draw the line pairing
      function drawLinePair(role,matchSource,matchTarget,lineColor) {

        // how much of the line should we draw?
        // if both matches aren't true then only first or second half of line
        var lineToDraw = results[i].slice(0),
            halfLength = Math.ceil(results[i].length / 2);    
        if (matchSource === false) {
          // lineToDraw.splice(0,halfLength);
          lineColor = '0,0,0,.1';
          widthAdjust = 0.5;
        } else if (matchTarget === false) {
          // lineToDraw.splice(halfLength,results[i].length);
          // if there's no matching target, then draw a faded line at a thinner width.
          lineColor = '0,0,0,.1';
          widthAdjust = 0.5;
          // return; //exit
        } 

        widthAdjust = (widthAdjust + 1) * widthAdjust; // increase width of each layered line

        // console.log(role,matchSource,matchTarget,lineColor);


        svgInner.insert("path",':first-child').attr("d", d3line(lineToDraw))
          .style("stroke-width", function(d) {  return (parentConnection.value / 2) + widthAdjust })
          // .style("stroke", function() { return 'rgba('+hexToRgb(color(nodes[parentNode.index].group))+',.85)'; })
          .style("stroke", function() { return 'rgba('+lineColor+')'; })
          .attr("class", function(d) {  return "link-"+(parentConnection.value) * 100 })
          .attr("data-parentnode", function(d) { return parentNode.index; })
          // .style("marker-end",  "url(#suit)")
          .style("fill", "none");
          // .style('stroke-opacity',0.4);
      }

      // see if either end of line has a property,
      // and if so, does both ends have the property
      function doesLinePairHaveProperties(allRolesOfPairing, propertyToCheck,lineColor) {
        if (allRolesOfPairing.indexOf(propertyToCheck) >= 0) {
          drawLinePair(propertyToCheck,(parentConnection.source['role'] || '').indexOf(propertyToCheck) >= 0,(parentConnection.target['role'] || '').indexOf(propertyToCheck) >= 0,lineColor);
        }
      }

      // check if each pair has brand/nav/info roles, and draw corresponding line
      var allRolesOfPairing = (parentConnection.source['role'] || '') + ' ' + (parentConnection.target['role'] || '');
      doesLinePairHaveProperties(allRolesOfPairing,'info', '0,0,0');
      doesLinePairHaveProperties(allRolesOfPairing,'info',  '255,255,255,1'); // edge
      // if no info connection, maybe a nav?
      widthAdjust = .5; // reset width
      doesLinePairHaveProperties(allRolesOfPairing,'nav',  '50,50,50,1');
      doesLinePairHaveProperties(allRolesOfPairing,'nav',  '255,255,255,1'); // edge
      doesLinePairHaveProperties(allRolesOfPairing,'brand','40,152,157,1');
      // doesLinePairHaveProperties(allRolesOfPairing,'brand',  '255,255,255', 2.5); // edge

    }

    node.append('svg:polygon')
      .attr('points', function(d)  { return scaleMarker(d); })
      .style("fill", function(d)   { if (d.traffic === null) { return 'url(#diagonal-stripe-1)'; } return 'rgba(255,255,255,1)';  })
      // .style("stroke", function(d) { return 'rgba('+hexToRgb(color(d.group))+',.95)';})
      .style("stroke", function(d) { return 'rgba(0,0,0,.95)';})
      // .attr('stroke', function(d,i) { return color(i)})
      .on("mouseover", function(d){  connectionHighlight(d); nodeHighlightSiblings(d['parent-pages'] || d.title); return info.style("visibility", "visible").html('<h4>'+d.title
        + '</h4>Connections: ' + d.radius
        + '<p>Goals: ' + createInteractiveInfo(d.goals,'goals') + '</p>'
        + '<p>Users: ' + createInteractiveInfo(d.users,'users') + '</p>'
        + '<p>Role: ' + createInteractiveInfo(d.role,'role') + '</p>'
        + '<p>Priority: ' + d.priority + '</p>'
        + '<p>Parent pages: ' + d['parent-pages'] + '</p>'
        );
      })
      .on("mousedown", function(d){ svg.on('.zoom', null ); })
      .on("mouseup", function(d){ zoomEnable(); })
      // .on("mousemove", function(){  return info.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px"); })
      .on("mouseout", function(d){  nodeHighlightReset(); connectionHighlightReset(); });
      // .on("mouseout", function(d){  nodeHighlightReset(); connectionHighlightReset(d); return info.style("visibility", "hidden"); });

  }

  // Set up zoom support
  function zoomEnable() {
    var zoom = d3.behavior.zoom()
          .scaleExtent([1, 8])
          .on("zoom", function() {
            svgInner.attr("transform", "translate(" + d3.event.translate + ")" +
                                      "scale(" + d3.event.scale + ")");

            // darken the background as we zoom in or out
            var backgoundRGBVal = Math.round(255 / d3.event.scale);
            document.body.style.backgroundColor = 'rgb(' + backgoundRGBVal + ',' + backgoundRGBVal + ',' + backgoundRGBVal + ')';

          });
    svg.call(zoom);
  }

  zoomEnable();

  // tick tick, the engine that plots the D3 Force layout
  force.on("tick", tickFunction);

  var tickCount = 0; // cap the number of tick runs

  function tickFunction() {
    tickCount++;
    if (tickCount > 110) {
      force.stop();
      tickCount = 100; // so we can restart after a marker is moved
      invokeForceBundling(); // draw the new ForceBundle data
    }

    // invokeForceBundling();
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  }

  /* BEGIN
   * Utility functions...
   */

  // Scale the SVG marker according to it's importance
  function scaleMarker (d) {
    d = d || 1;
    // var pointScale = ( (d.radius + 9) * Math.log(d.radius/.2 + 1) ) / 150;

    // weight
    var pointScale = ( (d.radius + 8) * Math.log(d.radius/.2 + 1) ) / 250;
    if (pointScale < 0.12) {
      pointScale = 0.12;
    }
    console.log(pointScale);

    // traffic
    // if (d.traffic === null) {
    //   var pointScale = .1;
    // } else {
    //   var pointScale = Math.sqrt(Math.sqrt(d.traffic) * 1.5) / 50;
    // }
    // pointScale = pointScale/ 10;


    var toReturn = '';

    var markerArray = '-28.1,-16.2 0,-32.4 28.1,-16.2 28.1,16.2 0,32.4 -28.1,16.2'.split(' '); //embl style poloygon

    for (x=0;x<markerArray.length;x++) {
      var tempMarkerPoint = markerArray[x].split(',');
      toReturn += tempMarkerPoint[0] * pointScale;
      toReturn += ',';
      toReturn += tempMarkerPoint[1] * pointScale;
      toReturn += ' ';
    }

    return toReturn;
  }

  // Highlight nodes with a common parent page
  // some good context on filtering in D3: http://www.coppelia.io/2014/07/an-a-to-z-of-extra-features-for-the-d3-force-layout/
  function nodeHighlightSiblings(toSearchFor) {
    // var nodesToHighlight = d3.selectAll(".node");
    // nodesToHighlight.style("opacity", "0"); // fade all

    // var selected = nodesToHighlight.filter(function (d, i) {
    //   if (d['parent-pages']) {
    //     var linkedPages = d['parent-pages'].split(', '); // for content nodes
    //   } else {
    //     var linkedPages = Array(); // for page nodes
    //     linkedPages.push(d.pageUrl);
    //   }
    //   // exit if the page placeholder has no metadata
    //   if (linkedPages[0] === undefined) {
    //     return false;
    //   }
    //   // if the node has a matching url
    //   for (var i = 0; i < linkedPages.length; i++) {
    //     // console.log(linkedPages[i],toSearchFor);
    //     var toSearchForArray = toSearchFor.split(', ');
    //     if (toSearchForArray.indexOf(linkedPages[i]) >= 0) return true;
    //   }
    // });

    // filter the nodes
    // selected.style("opacity", "1");
  }

  // Highlight nodes with a common user
  function nodeHighlightUsers(toSearchFor) {
    var nodesToHighlight = d3.selectAll(".node");
    nodesToHighlight.style("opacity", "0"); // fade all

    console.log('run');

    var selected = nodesToHighlight.filter(function (d, i) {
      // if (d['parent-pages']) {
      //   var linkedPages = d['parent-pages'].split(', '); // for content nodes
      // } else {
      //   var linkedPages = Array(); // for page nodes
      //   linkedPages.push(d.pageUrl);
      // }
      // // exit if the page placeholder has no metadata
      // if (linkedPages[0] === undefined) {
      //   return false;
      // }
      // // if the node has a matching url
      // for (var i = 0; i < linkedPages.length; i++) {
      //   // console.log(linkedPages[i],toSearchFor);
      //   var toSearchForArray = toSearchFor.split(', ');
      //   if (toSearchForArray.indexOf(linkedPages[i]) >= 0) return true;
      // }
    });

    // filter the nodes
    selected.style("opacity", "1");
  }
  // make all nodes visible
  function nodeHighlightReset() {
    evaluateNodeVisibility('reset');
    // Sync with global filters
    evaluateNodeVisibility();
  }

  // Highlight the connected nodes on hover of a node
  function connectionHighlight(d) {

    //Create an array logging what is connected to what
    var linkedByIndex = {};
    for (i = 0; i < graph.nodes.length; i++) {
      linkedByIndex[i + "," + i] = 1;
    };
    graph.links.forEach(function (d) {
      linkedByIndex[d.source.index + "," + d.target.index] = 1;
    });
    //This function looks up whether a pair are neighbours
    function neighboring(a, b) {
      return linkedByIndex[a.index + "," + b.index];
    }

    //Reduce the opacity of all but the neighbouring nodes
    node.style("opacity", function (o) {
      return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
    });
    // d3.selectAll('path').style("opacity",1);
    d3.selectAll('path').style("opacity", function () {
      var o = new Array();
      o.index = $(this).attr("data-parentnode");
      return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
    });

    // Sync with global filters
    evaluateNodeVisibility();
  }

  // Reset the highlight on mouse out
  function connectionHighlightReset() {
    d3.selectAll('path').style("opacity",1);


    // var tempLines = d3.selectAll("path")[0];
    // for ( y = 0; y < tempLines.length; y++ ) {
    //   d3.select(tempLines[y]).transition().style("opacity", 1);
    // }
  }

  // shade the spheres according to some metric/goal
  function coloriseSphere() {

    // for now, we fake it to select on of 10...
    switch( Math.floor((Math.random() * 10) + 1) ) {
      case 1:
        return 'rgba(213, 60, 60,.8)';
      case 2:
        return 'rgba(100, 60, 60,.8)';
      // case 3:
      //   return 'rgba(48, 171, 48,.8)';
      default:
        return 'rgba(255,255,255,.9)';
    }
  }

  // $('svg').mousedown( function(){
  //   closeConnectionTable();
  // });

  // function renderConnectionTable(d) {
  //   // $('.node-information').fadeIn();

  //   var requestedContentModel = d.title.trim();
  //   history.pushState(null, null, '#'+requestedContentModel);

  //   // Fetch the associated core content description in a really crude fashion :P
  //   // $.get('/content_model_viewer/index.html').then(function(responseData) {
  //   //   // $('.node-information').html('');
  //   //   $('.node-information').html('<div class="close">X</div>' + responseData); // add a "close" button
  //   //   $('.node-information .close').click( function(){
  //   //     closeConnectionTable();
  //   //   });
  //   // });

  // }

  // function closeConnectionTable() {
  //   if ($('.node-information').css('opacity') == 1) {
  //     $('.node-information').fadeOut();
  //   }
  // }

  function hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? parseInt(result[1], 16) + "," + parseInt(result[2], 16) + "," + parseInt(result[3], 16) : null;
  }

  // generate markup for info dialog
  function createInteractiveInfo(d,linkClass) {
    if (d == undefined) { return 'None known'; }
    var rolesArray = d.split(', '),
        output = '';

    for (var i = 0; i < rolesArray.length; i++) {
      output += '<a href="#" class="node-filter ' + linkClass + ' ' + rolesArray[i] + '">' + rolesArray[i] + '</a> <br/>';
      // console.log(rolesArray[i]);
    }
    return output;
  }

  // Crawl through paramaters and asses what should be visible, and what not...
  function evaluateNodeVisibility(event) {
    event = event || 'null'; // default

    // user wants a reset...
    if (event == 'reset') {
      console.log('making all nodes visible');
      d3.selectAll('.node').style('opacity', 1);
      d3.selectAll('path').style('opacity', 1);
      return true;
    }

    // compare each attribute against a desired value
    function attributeContains(valuesPresent,valueComparison) {
      if (valuesPresent == undefined) {
        return false;
      }

      // console.log(valuesPresent);
      // split each tag into an item
      var valuesPresentArray = valuesPresent.split(', ');
      // if we find a match, highlight the node
      for (var i = 0; i < valuesPresentArray.length; i++) {
        // not exact comparison, so 'nav' == 'navigation'
        // console.log(valuesPresentArray[i].indexOf(valueComparison),valuesPresentArray[i],valueComparison);
        if (valuesPresentArray[i].indexOf(valueComparison) >= 0) {
          console.log('passes: ' + valuesPresentArray[i]);
          return true;
        }
      }

      // if no matches, fail
      // console.log('fail, will faid');
      return false;
    }

    // process each filter
    $.each($('#info-container select'), function( key, value ) {

      // console.log(this);

      // Get the active value and associated target property
      var targetValue    = $("option:selected", this).attr("value"),
          targetProperty = $(this).attr("data-target-property");
      // console.log('Looking for nodes with value: ' + targetValue + ', in property: ' + targetProperty);
      // console.log(event);

      if (targetValue != 'null') {
        node.style('opacity', function (o) {
          if (this.style.opacity != 0.1) { // we don't want to conditionally bring back nodes, only filter them out
            // return attributeContains(o[targetProperty],targetValue) ? 1 : 0.1;
            if (attributeContains(o[targetProperty],targetValue)) {
              d3.select(this).classed("highlight", true);
              // d3.select(this).select("polygon").attr("filter", "url(#drop-shadow)");
              return 1;
            } else {
              d3.select(this).classed("highlight", false);
              // d3.select(this).select("polygon").attr("filter", null);
              // console.log(d3.select(this).classed("faded", true));
                // .classed("my-selector", true);
              return 0.1;
            }
          } else {
            // console.log('Node is already faded, no need to evaluate');
            return 0.1;
          }
        });
      } else {
        // console.log(targetProperty + ' is null, so not evaluating...')
      }
    });

    // After toggling visibility of nodes, fade out de-used paths
    // var linkedByIndex = {};
    // for (i = 0; i < graph.nodes.length; i++) {
    //   linkedByIndex[i + "," + i] = 1;
    // };
    // graph.links.forEach(function (d) {
    //   linkedByIndex[d.source.index + "," + d.target.index] = 1;
    // });
    //This function looks up whether a pair are neighbours
    // function neighboring(a, b) {
    //   return linkedByIndex[a.index + "," + b.index];
    // }

    //Reduce the opacity of all but the neighbouring nodes
    var pathsToShow = {};
    graph.nodes.forEach(function (d) {
      // console.log(d,node[0][d.index]);
      if (node[0][d.index].style.opacity != 0.1) {
        pathsToShow[d.index] = 1;
        // console.log('opacity',node[0][d.index].style.opacity);
      }
      // if (o)
      // return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
    });


    // // d3.selectAll('path').style("opacity",1);
    d3.selectAll('path').style("opacity", function () {
      var o = new Array();
      o.index = $(this).attr("data-parentnode");
      if (pathsToShow[o.index] === 1) {
        return 1;
      } else {
        return 0.1;
      }
      // return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
    });


  }

  $('#info-container select').on('change', function() {
    // console.log(this);
    evaluateNodeVisibility('reset');
    evaluateNodeVisibility();
  });

});