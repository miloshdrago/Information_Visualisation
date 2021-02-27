var base_url = `http://${document.domain}:${location.port}`;

var margin = { top: 0, right: 0, bottom: 0, left: 0 },
    width = $("#svg-div").parent().width() - margin.left - margin.right,
    height = $("#svg-div").parent().height() - margin.top - margin.bottom;


var nodeScale = d3.scaleSqrt();

var svg = d3.select('#svg-div')
    .append('svg')
    .attr('viewbox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .classed('svg-content', true);

var transform = d3.zoomIdentity.translate(100, 50).scale(0.8)
// var zoom = d3.zoom().on("zoom", handleZoom);

var zoom = d3.zoom()
    .scaleExtent([0.2, 10])
    .duration(500)
    .on("zoom", function () {
        svg.selectAll('circle')
            .attr('transform', d3.event.transform);
        // tooltip.attr('transform', d3.event.transform);
        // style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
    });

svg.call(zoom)

var xScale = null;
var yScale = null;
var default_circle_radius = "4px";


var the_data = null;
//Read the data
loaded_data = d3.csv(`${base_url}/data?g=sub_points`)
loaded_data.then(function (data) {
    the_data = data;
    xScale = d3.scaleLinear()
        .domain(d3.extent(data, (d) => Number(d.x)))
        .range([0, width])

    yScale = d3.scaleLinear()
        .domain(d3.extent(data, (d) => Number(d.y)))
        .range([0, height])

    // Initial Spots
    svg.append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`)

    nodes = svg.selectAll("circle")
        .data(data)

    nodes.enter()
        .append("circle")
        .attr("cx", function (d) { return xScale(d.x); })
        .attr("cy", function (d) { return yScale(d.y); })
        .style("fill", "rgb(172, 220, 114)")
        .attr("r", "0px")
        .attr("opacity", 0)
        .style('cursor', 'pointer')
        .on('mouseover', nodeMouseOver)
        .on('mousemove', nodeMouseMove)
        .on('mouseout', nodeMouseOut)
        .transition()
        .duration(300)
        .delay((d, i) => (i%10)*100)
        .attr("opacity", 0.8)
        .attr("r", "4px");

    svg.call(zoom.transform, transform);
        

})

function nodeMouseMove(){
    // Implement positioning code
    tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px")
}


function nodeMouseOver(d){
    tooltip.style("visibility", "visible")
        .html(() => {
            const content = `<strong>Subreddit:</strong> <span>${d.sub}</span>`
            return content;
        })
    d3.select(this)
    .style('opacity', 1)
    .transition()
    .duration(100)
    .attr('r', '6px')
    
};

function nodeMouseOut(){
    d3.select(this)
    .transition()
    .duration(100)
    .style('opacity', 0.8)
    .attr('r', default_circle_radius)
    tooltip.style("visibility", "hidden")
}

tooltip = d3.select("body").append("div")
  .attr("class", "svg-tooltip")
    .style("position", "absolute")
    .style('top', '50%')
    .style('left', '50%')
    .style("visibility", "hidden")
    .text("");