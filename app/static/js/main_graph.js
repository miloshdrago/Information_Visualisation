var base_url = `http://${document.domain}:${location.port}`;

let color_neut_line = '#aaa'

let color_neg = '#f03333',
    color_neut = '#666',
    color_pos = '#7a99c5';

// Default Settings //
// Objects
var link_limit = 3000;
var node_limit = 2000;

// Styling
var default_node_color = "rgb(172, 220, 114)";
var highlight_node_color_primary = 'red';
var highlight_node_color_secondary = '#7a99c5';

var default_circle_min_radius = 1.75;
var default_circle_max_radius = 10;

var default_node_opacity = 0.8;

const line_width_max = 2,
    line_width_min = 0.05;

const min_line_opac = 0.1,
    max_line_opac = 0.7;

var search_node_scale = 1;


// Sentiment Colors
// Interpolate red and blue

// End Settings //

// Set functions //



var clicked_node = null;
var node_labels = false;

// Filter and Info State-Variable
var link_sent_state = "both"
var link_highlight_type = 'both'
var node_size_type = 'total_in'

// Link State to Color Map
getLinkColor = { '1': color_pos, 'both': color_neut_line, '-1': color_neg }


// Margins
var margin = { top: 0, right: 0, bottom: 0, left: 0 },
    width = $("#svg-div").parent().width() - margin.left - margin.right,
    height = $("#svg-div").parent().height() - margin.top - margin.bottom;

// Scaling
var xScale = null;
var yScale = null;
var nodeScale = d3.scaleSqrt().range([default_circle_min_radius, default_circle_max_radius]);
var lineScale = d3.scalePow().range([line_width_min, line_width_max]);
var opacScale = d3.scaleLog().range([min_line_opac, max_line_opac]);

var data_load_callbacks = []

var svg = d3.select('#svg-div')
    .append('svg')
    .attr('viewbox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMinYMin slice')
    // .attr('preserveAspectRatio', 'xMinYMin meet')
    .classed('svg-content', true)
    .append('g')
    .attr('id', 'main-graph')

var background_area = svg
    .insert("g", ":first-child")
    .append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('opacity', 0)

background_area.on('click', () => {
    clicked_node = null;
    d3.selectAll("#highlight-layer .link").style("pointer-events", "none");
    node_tooltip.style("visibility", "hidden")
    nodeOutFunction();
    $('#text-layer').empty(); // May adjust this
})

// Pan and Zoom
var transform = d3.zoomIdentity.translate(100, 50).scale(0.8)
var zoom = d3.zoom()
    .scaleExtent([0.2, 10])
    .on("zoom", function () {
        svg
            .attr('transform', d3.event.transform)
        //     // nameFunction()
        //     // console.log("insidezoom")
        //     // console.log(d3.zoomIdentity.scale(this));
        //     // console.log(d3.zoomTransform(element).k)
        //     console.log(zoom)


    });

// function nameFunction() {
//     d3.selectAll('.node')
//     .enter()
//     .append("text")
//     .attr("x", (d) => xScale(d.x))
//     .attr("y", (d) => yScale(d.y))
//         }
d3.select('#svg-div').call(zoom)

// Force Graph
var simulation = null;

// var simulation = d3.forceSimulation()
//     // .force("charge", d3.forceManyBody().strength(-30000))
//     .force("link", d3.forceLink().id(function (d) { return d.sub; }).distance(40))
//     // .force("x", d3.forceX(width / 2))
//     // .force("y", d3.forceY(height / 2))
//     .force('collision', d3.forceCollide().radius(4))
//     .on("tick", ticked);


// SVG Layers
var link_layer = svg
    .append('g')
    .attr('class', 'layer')
    .attr('id', 'link-layer');

var node_layer = svg
    .append('g')
    .attr('class', 'layer')
    .attr('id', 'node-layer');

var highlight_layer = svg
    .append('g')
    .attr('class', 'layer')
    .attr('id', 'highlight-layer');

var text_layer = svg
    .append('g')
    .attr('class', 'layer')
    .attr('id', 'text-layer');

var search_layer = svg
    .append('g')
    .attr('class', 'layer')
    .attr('id', 'search-layer');

var subview_layer = svg
    .append('g')
    .attr('class', 'layer')
    .attr('id', 'subview-layer');


var adjlist = [];
var link_master = null;
var node_master = null;
var link_work = null;
var node_work = null;
var node_set = null;
var nodeById = d3.map();

// Load and Draw Data
function loadAndDraw(nodeURL, linkURL) {

    d3.csv(nodeURL).then(function (data_node) {
        d3.csv(linkURL).then(function (data_link) {
            let index = 0;
            link_master = data_link // Limit number of links
            node_master = data_node;

            // Calculate relevant node information
            buildNodeData(node_master);

            // Build node-link relationships
            buildLinkData(link_master);
            link_master.sort(linkSort)

            node_work = node_master
            node_set = new Set(node_work.map((d) => d.sub))
            link_work = link_master
            link_trunc = link_work.slice(0, link_limit)

            subreddits = node_master.map((d) => d['sub'])

            // Set Domain Scales
            xScale = d3.scaleLinear()
                .domain(d3.extent(node_work, (d) => Number(d.x)))
                .range([0, width])

            yScale = d3.scaleLinear()
                .domain(d3.extent(node_work, (d) => Number(d.y)))
                .range([0, height])

            nodeScale.domain(d3.extent(node_master, (d) => Number(d.total_out)))
            lineScale.domain(d3.extent(link_master, (d) => Number(d.n)))
            opacScale.domain(d3.extent(link_master, (d) => Number(d.n)))

            // Draw Nodes
            nodes = node_layer.selectAll('.node')
                .data(node_work, keyNodes)
                .enter()
                .append("circle")
                .attr("cx", (d) => xScale(d.x))
                .attr("cy", (d) => yScale(d.y))
                .attr("class", "node")
                .attr("r", 0)
                .style("fill", default_node_color)
                .style("opacity", default_node_opacity)
                .on('mouseover', nodeOverFunction)
                .on('mousemove', () => tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"))
                .on('mouseout', nodeOutFunction)
                .on('click', function (d) { // Select Behaviour
                    if (clicked_node == null) {
                        clicked_node = this;
                    } else {
                        clearHighlights()
                        clicked_node = this;
                        setHighlights(d, this)
                    }
                    updateNodeTooltip(d);
                    d3.selectAll("#highlight-layer .link").style("pointer-events", "all");
                    drawNames();
                })
                .sort(function (a, b) { // Draw smaller nodes above
                    return b.total_out - a.total_out
                })

            // Animate Nodes
            nodes.transition('first_draw')
                .duration(300)
                .delay((d, i) => (i % 10) * 100)
                .attr("r", (d) => nodeScale(d.total_out));

            // simulation = d3.forceSimulation(nodes)
            //     .velocityDecay(0.2)
            //     .force('charge', d3.forceManyBody().strength(5))
            //     .force('center', d3.forceCenter(width / 2, height / 2))
            //     .force('collision', d3.forceCollide().radius(function (d) {
            //         return nodeScale(d.total_out)
            //     }))
            //     .on('tick', ticked);

            // Draw Links
            links = link_layer.selectAll('.link')
                .data(link_trunc, keyLinks)
                .enter()
                .append("line")
                .attr('class', 'link')
                .style("stroke", "#aaa")
                .style("stroke-width", (d) => lineScale(d.n))
                .style('opacity', 1)
                .style('visibility', 'hidden')
                .attr("x1", (d) => xScale(d.source.x))
                .attr("y1", (d) => yScale(d.source.y))
                .attr("x2", (d) => xScale(d.target.x))
                .attr("y2", (d) => yScale(d.target.y));

            // Animate Links
            links
                .transition()
                .delay((d, i) => (i % 10) * 100 + 1000)
                .duration(0)
                .style('visibility', 'visible');



            // links.attr("d", function (d) {
            //     var dx = xScale(d.target.x) - xScale(d.source.x),
            //         dy = yScale(d.target.y) - yScale(d.source.y),
            //         dr = Math.sqrt(dx * dx + dy * dy);
            //     return "M" + xScale(d.source.x) + "," + yScale(d.source.y) + "A" + dr + "," + dr + " 0 0,1 "
            //         + xScale(d.target.x) + "," + yScale(d.target.y);
            // });

            setAdj(link_trunc);
            setSearch(node_work);

            data_load_callbacks.forEach((d) => d());

            // d3.select('#svg-div').attr('transform', transform);
            // svg.attr('transform', transform);
            // d3.zoomIdentity = transform;
        });
    })

}
function setAdj(link_ary) {
    adjlist = []
    link_ary.forEach(function (d) {
        adjlist[d.source.index + "-" + d.target.index] = true;
    });
}


function updateNodeData(node_data, link_data) {
    nodes = node_layer.selectAll('.node');
    node_data.forEach(function (node) {
        node.in_pos = 0;
        node.out_pos = 0;
        node.in_neg = 0;
        node.out_neg = 0;
        node.adj_src = [];
        node.adj_trgt = [];
    })
    link_data.forEach(function (link) {
        if (link.sentiment == "1") {
            link.source.out_pos += link.n
        } else {
            link.source.out_neg += link.n
        }
        if (link.sentiment == "1") {
            link.target.in_pos += link.n
        } else {
            link.target.in_neg += link.n
        }
        link.source.adj_src.push(link);
        link.target.adj_trgt.push(link);
    })
    nodes = nodes.data(node_data, keyNodes)
}

// Initialize graph
loadAndDraw('/nodes', '/links');


// Build the data fields
function buildNodeData(node_ary) {
    let index = 0;
    node_ary.forEach(function (node) {
        node.in_pos = 0;
        node.out_pos = 0;
        node.in_neg = 0;
        node.out_neg = 0;
        node.adj_src = [];
        node.adj_trgt = [];
        node.tags = new Set()
        node.index = index;
        index++;
        Object.defineProperty(node, 'total_in', {
            get: function () { return this.in_pos + this.in_neg }
        });
        Object.defineProperty(node, 'total_out', {
            get: function () { return this.out_pos + this.out_neg }
        })
        nodeById.set(node.sub, node);
    });
}

// Attach node data to link data
function buildLinkData(link_ary) {
    link_ary.forEach(function (link) {
        link.source = nodeById.get(link.source);
        link.target = nodeById.get(link.target);
        link.n = Number(link.n)

        if (link.sentiment == "1") {
            link.source.out_pos += link.n
        } else {
            link.source.out_neg += link.n
        }
        // node = nodeById.get(link.target);
        if (link.sentiment == "1") {
            link.target.in_pos += link.n
        } else {
            link.target.in_neg += link.n
        }
        link.source.adj_src.push(link);
        link.target.adj_trgt.push(link);
    });
}

function keyLinks(d) {
    return `${d.source.sub}-${d.target.sub}`
}

function keyNodes(d) {
    return d['sub']
}

function filterNodes() {

}

function filterLinks() {

}

// Force Behaviour (Not Implemented)
function ticked() {
    nodes.attr('cx', function (d) {
        return xScale(d.x)
    })
        .attr('cy', function (d) {
            return yScale(d.y)
        })
    // link.attr("x1", function (d) { return d.source.x; })
    //     .attr("y1", function (d) { return d.source.y; })
    //     .attr("x2", function (d) { return d.target.x; })
    //     .attr("y2", function (d) { return d.target.y; });


    // node.attr("cx", function (d) { return d.x; })
    //     .attr("cy", function (d) { return d.y; });
}



// Hover Functionalities
function nodeOverFunction(d) {
    tooltip.style("visibility", "visible")
        .html(() => {
            const content = `<strong>Subreddit:</strong> <span>${d.sub}</span>`
            return content;
        })

    if (clicked_node == null) {
        setHighlights(d, this)
    }
    node_tooltip.style("visibility", "visible")
    if (clicked_node == null) {
        updateNodeTooltip(d)
    }

    if (clicked_node == null) {
        setHighlights(d, this)
    }

    selected_node = this.cloneNode()
    d3.select(selected_node)
        .attr('id', 'current-node')
        .style('fill', "DarkRed")
    highlight_layer.node().appendChild(selected_node)
};

// When cursor leaves a node
function nodeOutFunction() {
    tooltip.style("visibility", "hidden")
    if (clicked_node == null) {
        clearHighlights();
        node_tooltip.style("visibility", "hidden")
    }
    highlight_layer.select('#current-node').remove()
}
function highlightedLinkOver(d) {
    d3.select(this).style('stroke', 'yellow');
    link_tooltip.style("visibility", "visible")
        .html(() => {
            const content = `<strong>Source:</strong> <span>${d.source.sub}</span><br><strong>Target:</strong> <span>${d.target.sub}</span><br><strong>Amount: ${d.n}</strong>`

            return content;
        })
}

function updateNodeTooltip(d) {
    node_tooltip.select("#node-tooltip-title").html(() => {
        const title = `<strong>${d.sub}</strong>`
        return title
    })
    node_tooltip.select("#node-tooltip-numbers").html(() => {
        let stat_content = `<table cellpadding="4" border="1" style="width:100%">
                                <tr>
                                <th colspan="4" align="center"><strong>Total</strong></th>
                                <th colspan="4" align="center"><strong>Daily Average</strong></th> 
                                </tr>
                                <tr>
                                <td>+ Out:</td>
                                <td>${d.out_pos}</td>
                                <td>+ In:</td>
                                <td>${d.in_pos}</td>
                                <td>+ Out:</td>
                                <td>${(d.out_pos / total_days).toFixed(1)}</td>
                                <td>+ In:</td>
                                <td>${(d.in_pos / total_days).toFixed(1)}</td>
                                </tr>
                                <tr>
                                <td>- Out:</td>
                                <td>${d.out_neg}</td>
                                <td>- In:</td>
                                <td>${d.in_neg}</td>
                                <td>- Out:</td>
                                <td>${(d.out_neg / total_days).toFixed(1)}</td>
                                <td>- In:</td>
                                <td>${(d.in_neg / total_days).toFixed(1)}</td>
                                </tr>
                            </table>`;
        return stat_content
    })
    // node_tooltip.select("#node-tooltip-ranks").html(() => {
    //     let rank_content = `<table cellpadding="4" border="1" style="width:100%">
    //     <tr>
    //     <th colspan="2" align="center"><strong>Most Linked</strong></th>
    //     <th colspan="2" align="center"><strong>Most Referenced From</strong></th> 
    //     </tr>
    //     <tr>`
    //     let row_data = []

    //     for (const e of d.adj_src.slice(0,3)) {
    //         e.source.sub, e.n

    //     }
    //     for (const e of d.adj_trgt.slice(0,3)) {
    //         console.log(element);
    //     }

    //     return rank_content
    // })
}

// Highlighting Functionality -> Can refactor
function setHighlights(d) {
    let index = null
    if (clicked_node == null) {
        index = d.index;
    } else {
        index = d3.select(clicked_node).datum().index;
    }

    let high_map = { 'in': 'target', 'out': 'source' }


    links = link_layer
        .selectAll('.link')
    nodes = node_layer
        .selectAll('.node')
    if (link_highlight_type == "both") {
        highlight_links = links
            .filter(function (d) {
                return d.source.index == index || d.target.index == index;
            });

        highlight_nodes = nodes
            .filter((d) => neigh(index, d.index) || neigh(d.index, index));
    } else {
        highlight_links = links
            .filter(function (d) {
                return d[high_map[link_highlight_type]].index == index;
            });
        if (link_highlight_type == 'in') {
            highlight_nodes = nodes
                .filter((d) => neigh(d.index, index));
        } else {
            highlight_nodes = nodes
                .filter((d) => neigh(index, d.index));
        }
    }

    // Insert Elements into Highlight Layer
    cloneElements(highlight_links, '#highlight-layer', function (d) {
        d.style('stroke-width', function (f) {
            return Number(d3.select(this).style('stroke-width')) + 0.2
        })
            .style('stroke', getLinkColor[link_sent_state])
            .on('mouseover', highlightedLinkOver)
            .on('mousemove', () => link_tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"))
            .on('mouseout', function () { link_tooltip.style('visibility', 'hidden'); d3.select(this).style("stroke", "#aaa") })
    })

    cloneElements(highlight_nodes, '#highlight-layer');

    highlight_layer.selectAll('.node')
        .style('fill', highlight_node_color_primary)

    link_layer.style('opacity', 0.1)
    node_layer.style('opacity', 0.5)
}

function clearHighlights() {
    $('#highlight-layer').empty();
    node_layer.style('opacity', 1);
    link_layer.style('opacity', 1);
}

tooltip = d3.select(".wrapper").append("div")
    .attr("class", "svg-tooltip mouse-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .text("");

node_tooltip = d3.select("#node-tooltip")
// .append('div')
// .attr('class', 'node-tooltip-wrapper')
// .style("position", "relative")

// .append("div")
// .attr("class", "mouse-tooltip node-tooltip")
// .attr('id', "node-tooltip")
// // .style("position", "absolute")
// .style("visibility", "visible")
// .text("");

// node_tooltip.html(() => {
//     let row1 = "<div class='row' id='tooltip-title'> <div>";
//     row1 += 
//     "<div class='row' id='tooltip-numbers'> <div>"
//     "<div class='row' id='tooltip-ranks'> <div>"


//     return
// })


link_tooltip = d3.select(".wrapper").append("div")
    .attr("class", "mouse-tooltip")
    .attr("id", "link-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .text("");

// Determine if two nodes are neighbors
function neigh(a, b) {
    return a == b || adjlist[a + "-" + b];
}

function drawNames() {
    $('#text-layer').empty();
    highlight_layer.selectAll('.node')
        .each(function (d) {
            text_layer.append('text').datum(d)
                .attr('x', (d) => xScale(d.x))
                .attr('y', (d) => yScale(d.y + 15))
                .attr('fill', 'white')
                // .attr('text-anchor', 'middle')
                .attr('font-size', '0.3rem')
                .text((d) => d.sub)
        })
}



// Drag Behaviour (Not Necessary Currently)
// drag = simulation => {

//     function dragstarted(d) {
//         if (!d3.event.active) simulation.alphaTarget(0.3).restart();
//         d.fx = d.x;
//         d.fy = d.y;
//     }

//     function dragged(d) {
//         d.fx = d3.event.x;
//         d.fy = d3.event.y;
//     }

//     function dragended(d) {
//         if (!d3.event.active) simulation.alphaTarget(0);
//         d.fx = null;
//         d.fy = null;
//     }

//     return d3.drag()
//         .on("start", dragstarted)
//         .on("drag", dragged)
//         .on("end", dragended);
// }


// Update Graph Elements -> Needs to be implemented
function updateLinks(link_data) {

}

function updateNodes(s, nodeURL) {


}


function updateGraph(node_data, link_data) {
    // Node Update
    if (node_data) {
        nodes = node_layer
            .selectAll('.node')
            .data(node_data, keyNodes)

        nodes.exit() // Remove old data
            .transition('remove')
            .duration(400)
            .delay((d, i) => (i % 10) * 50)
            .attr('r', 0)
            .remove()

        nodes
            .enter()
            .append("circle")
            .attr("cx", (d) => xScale(d.x))
            .attr("cy", (d) => yScale(d.y))
            .attr("class", "node")
            .attr("r", 0)
            .style("fill", default_node_color)
            .style("opacity", default_node_opacity)
            .on('mouseover', nodeOverFunction)
            .on('mousemove', () => tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"))
            .on('mouseout', nodeOutFunction)
            .on('click', function (d) { // Select Behaviour
                if (clicked_node == null) {
                    clicked_node = this;
                } else {
                    clearHighlights()
                    clicked_node = this;
                    setHighlights(d, this)
                }
                updateNodeTooltip(d);
                d3.selectAll("#highlight-layer .link").style("pointer-events", "all");
                drawNames();
            })
            .sort(function (a, b) { // Draw smaller nodes above
                return b.total_out - a.total_out
            })

        nodes = node_layer
            .selectAll('.node')

        // nodes.transition('add')
        //     .duration(300)
        //     .delay((d, i) => (i % 10) * 100)
        //     .attr("r", (d) => nodeScale(d[node_size_type]));

        // Animate Nodes

    }


    // Link Update
    links = link_layer
        .selectAll('.link')
        .data(link_data, keyLinks) // Bind new data

    links.exit() // Remove old data
        .transition('remove')
        .duration(0)
        .delay((d, i) => (i % 10) * 50)
        .remove()


    // Rework This Animation
    links.transition('update')
        .delay(500)
        .duration(510)
        .style("stroke-width", (d) => lineScale(d.n))
        .style('stroke', function () {
            return getLinkColor[link_sent_state]
        })

    links
        .enter() // Append new lines
        .append("line")
        .attr('class', 'link')
        .style("stroke", "#aaa")
        .style('visibility', 'hidden')
        .style("stroke-width", (d) => lineScale(d.n))
        .attr("x1", (d) => xScale(d.source.x))
        .attr("y1", (d) => yScale(d.source.y))
        .attr("x2", (d) => xScale(d.target.x))
        .attr("y2", (d) => yScale(d.target.y))
        .merge(links) // Merge with existing lines and update data
        .transition('draw')
        .delay((d, i) => (i % 10) * 50 + 500)
        .duration(200)
        .style('stroke', function () {
            return getLinkColor[link_sent_state]
        })
        .style('visibility', 'visible')

    // links
    //     .transition()
    //     .delay((d, i) => (i % 10) * 100 + 1000)
    //     .duration(0)
    //     .style('visibility', 'visible');

    // links
    //     .transition()
    //     .delay((d, i) => (i % 10) * 100 + 1000)
    //     .duration(200)
    //     .style("stroke-width", (d) => lineScale(d.n))
}


// May be adjusted to new filter workflow
function updateSentiment(s) {
    if (s == "1") {
        link_work = link_master.filter(function (d) {
            return d.sentiment == "1"
        })
    } else if (s == "-1") {
        link_work = link_master.filter(function (d) {
            return d.sentiment == "-1"
        })
    } else {
        link_work = link_master;
    }

    link_work = link_work.filter((d) => node_set.has(d.source.sub))// || node_set.has(d.target.sub))
    link_work = link_work.sort(linkSort)
    link_work_trunc = link_work.slice(0, link_limit)
    setAdj(link_work_trunc)

    // value_map = { 'pos': "1", 'both': "both", 'neg': '-1' }
    link_sent_state = s;
    

    // This is a temporary fix
    temp_filter = new Set();
    link_work.forEach(function(d){
        temp_filter.add(d.source.sub)
        temp_filter.add(d.target.sub)
    });
    node_work_temp = node_master.filter((d) => temp_filter.has(d['sub']))
    updateNodeData(node_work_temp, link_work);
    updateGraph(node_work_temp, link_work_trunc);
    updateNodeSize();
    if (clicked_node) {
        clearHighlights()
        setHighlights()
    }
}

function drawLinkedTooltips() {

}

function linkSort(a, b) {
    return b.n - a.n
}

// Performance testing
var t0 = null,
    t1 = null,
    t2 = null,
    t3 = null;

function test_performance() {
    let t0 = null;
    let t1 = null;
    let t2 = null;
    let t3 = null
    t0 = performance.now()
    nodeURL = "/sentiment_nodes?s=" + "pos"
    linkURL = "/sentiment_links?s=" + "pos"
    d3.csv(nodeURL).then(function (data_node) {
        d3.csv(linkURL).then(function (data_link) {
            t1 = performance.now()
            t2 = performance.now()
            link_master.filter(function (d) {
                return d.sentiment = "1"
            })
            t3 = performance.now()
            console.log([t3 - t2, t1 - t0])
        })
    })
}


// Clone a D3 selection to another node
// Callback passes a d3 selection
function cloneElements(selection, target_selector, callback = null) {
    let target = $(target_selector);
    let elements = [];
    let data = [];

    selection.each(function (d) {
        new_node = $(this)[0].cloneNode()
        elements.push(new_node);
        data.push(d);
    })
    elements = d3.selectAll(elements).data(data)

    // let elements = d3.selectAll(selection.nodes().map((d) => d.cloneNode().setAttribute('data-d3', d.data())))
    if (callback != null) {
        callback(elements)
    }
    elements = elements.nodes()
    elements.forEach((d) => target.append(d))
}

// Get name of all nodes
function getNodeList(ary) {
    return ary.map((d) => d['sub'])
}

// Set Typeahead Behaviour
// Need to call this if drawn nodes change
function setSearch(ary) {
    subreddits = getNodeList(ary)
    subs_suggestions = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: subreddits
    });

    // Initializing the typeahead
    $('.typeahead').typeahead({
        hint: true,
        highlight: true, /* Enable substring highlighting */
        minLength: 2, /* Specify minimum characters required for showing result */
        // limit: 4
    },
        {
            name: 'subs',
            source: subs_suggestions
        });
    $('.typeahead').bind('typeahead:select', function (ev, suggestion) {
        console.log('Selection: ' + suggestion);
        highlightSearchNodes([suggestion]);
    });
    // d3.select('#search-input').on('change', function () {
    //     highlightSearchNodes([suggestion]);

    //     if (search_timeout){
    //         setTimeout(highlightSearchNodes, 1000, [suggestion])
    //     }
    // })

}
var search_timeout = false;
var subs_suggestions = null;


function highlightSearchNodes(data) {
    // Takes a list of subreddit names

    $('#search-layer').empty();
    let subs = new Set()
    data.forEach((d) => subs.add(d))
    query_elements = nodes.filter((d) => subs.has(d['sub']))
    cloneElements(query_elements, '#search-layer', function (d) {
        d.style('fill', 'blue')
        d.style('opacity', 0.5)
        d.transition('expand')
            .duration(350)
            .attr('r', 12)

        d.transition('contract')
            .duration(350)
            .delay(500)
            .attr('r', (f) => nodeScale(search_node_scale * f[node_size_type]))
    })
}

// Highlight ndoes on search input
$('#search-input').on('input', function () {
    let csearch = $(this).val();
    subs_suggestions.search(csearch, highlightSearchNodes.bind(this))
})

function clearSearchHighlights() {
    highlight_layer.selectAll('.search.node').remove()
}

function updateNodeSize() {
    node_layer.selectAll('.node')
        .transition('base_nodes')
        .duration(400)
        .delay((d, i) => (i % 5) * 100)
        .attr("r", (d) => nodeScale(d[node_size_type]));
    highlight_layer.selectAll('.node')
        .transition('highlight_nodes')
        .duration(400)
        .delay((d, i) => (i % 5) * 100)
        .attr("r", (d) => nodeScale(d[node_size_type]));
}




// function nameFunction() {
//     text = text_layer.selectAll("text")
//         .data(node_work)
//         .enter()
//         .append("text")
//         .text(function (d) {
//             console.log(d.sub);
//             return d.sub;

//         })
//         .attr("dx", (d) => xScale(d.x))
//         .attr("dy", (d) => yScale(d.y))
//         .style("font-family", "Arial")
//         .style("font-size", 4);
// }


