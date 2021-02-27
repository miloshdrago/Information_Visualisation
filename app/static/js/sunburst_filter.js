// // class SunBurstFilter{
// //     constructor(element_selector){



// //         this.svg = d3.select(element_selector)
// //         .append("svg")
// //         .attr("viewBox", "0 0 400 400")
// //     }
// //     load_data(){

// //     }
// // }


// // tag_tree = null;
// // d3.json('/data?g=tag_graph').then(function (d) {
// //     //console.log(d);
// //     tag_tree = d3.hierarchy(d);
// //     tag_tree.sum((d) => d.values.length)
// //     tag_tree.each(() => console.log('test'))
// //     //console.log(tag_tree);

// // });

var sb_height = 300,
    sb_width = 300;

var radius = (Math.min(sb_height, sb_width) / 3) - 50; //- 10
var format = d3.format(",d")

let color_sun = null
let arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius(d => d.y0 * radius)
    .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))


var root = null,
    parent = null,
    label = null,
    parent_label = null;

var tag_filter = null,
    current_level = 0;

const svg_sun = d3.select('#svg-sunburst').append("svg")
    .attr("viewBox", [0, 0, sb_height, sb_width])
    .style("font", "10px sans-serif");

const g = svg_sun.append("g")
    .attr("transform", `translate(${sb_height / 2},${sb_width / 2})`);

d3.json('/data?g=tag_filter').then(function (data) {
    tag_filter = data;
    Object.keys(tag_filter).forEach((d) => tag_filter[d] = new Set(tag_filter[d]))
})

d3.json('/data?g=tag_graph').then(function (data) {
    root = partition(data);
    root.each(d => d.current = d);
    color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, root.children.length + 1))

    const path = g.append("g")
        .selectAll("path")
        .data(root.descendants().slice(1))
        .join("path")
        .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
        .attr("fill-opacity", d => arcVisible(d.current) ? 0.7 : 0)
        .attr("d", d => arc(d.current))
        .style("pointer-events", (d) => arcVisible(d.current) ? "all" : "none")
        .on('mouseover', arcOver)
        .on('mouseout', arcOut);

    // path.filter(d => d.children)
    //     .style("cursor", "pointer")
    //     .on("click", clicked);

    path
        .style("cursor", "pointer")
        .on("click", clicked);

    path.append("title")
        .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

    parent = g.append("circle")
        .datum(root)
        .attr("r", radius)
        .attr("fill", "#555")
        .attr("fill-opacity", 0.1)
        .style("pointer-events", "all")
        .on('mouseover', function () { d3.select(this).attr('fill-opacity', 0.7) })
        .on('mouseout', function () { d3.select(this).attr('fill-opacity', 0.1) })
        .on("click", clicked);

    parent_label = g.append("text")
        .datum(root)
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
        .style("fill", 'white')
        .attr("dy", "0.35em")
        .text(d => d.data.name);


    label = g.append("g")
        .style("pointer-events", "none")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
        .selectAll("text")
        .data(root.descendants().slice(1))
        .join("text")
        .attr("dy", "0.35em")
        .attr("fill-opacity", d => +labelVisible(d.current))
        .attr("transform", d => labelTransform(d.current))
        .text(d => d.data.name);

})


function clicked(p) {

    parent.datum(p.parent || root);
    parent_label.datum(p || root);


    const path = g.selectAll("path");

    root.each(d => d.target = {
        x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth)
    });

    const t = g.transition().duration(750);

    // Transition the data on all arcs, even the ones that aren’t visible,
    // so that if this transition is interrupted, entering arcs will start
    // the next transition from the desired position.
    path.transition(t)
        .tween("data", d => {
            const i = d3.interpolate(d.current, d.target);
            return t => d.current = i(t);
        })
        .filter(function (d) {
            return +this.getAttribute("fill-opacity") || arcVisible(d.target);
        })
        .attr("fill-opacity", d => arcVisible(d.target) ? 0.7 : 0)
        .attrTween("d", d => () => arc(d.current))
        .on('end', () => path.style("pointer-events", (d) => arcVisible(d.current) ? "all" : "none"))

    label.filter(function (d) {
        return +this.getAttribute("fill-opacity") || labelVisible(d.target);
    }).transition(t)
        .attr("fill-opacity", d => +labelVisible(d.target))
        .attrTween("transform", d => () => labelTransform(d.current));

    parent_label.text(d => d.data.name);

    // } else {

    // }

    // Update Graph Code
    // p = p.parent || root
    // console.log(p.data.name)

    if (p.data.name == 'root'){
        node_work = node_master
        nodes.style('fill', default_node_color)
    } else {
        tag = p.data.name;
        node_work = node_master.filter((d) => tag_filter[p.data.name].has(d['sub']));
        nodes.style('fill', default_node_color)
        nodes.filter((d) => tag_filter[tag].has(d['sub'])).style('fill', 'deeppink');
    }
    node_set = new Set(node_work.map((d) => d.sub))
    updateSentiment(link_sent_state);
}

function arcVisible(d) {
    return d.y1 <= 2 && d.y0 >= 1 && d.x1 > d.x0;
}

function labelVisible(d) {
    return d.y1 <= 2 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
}

function labelTransform(d) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
}

partition = data => {
    const root = d3.hierarchy(data)
        .sum((d) => d.values.length)
        .sort((a, b) => b.value - a.value);
    return d3.partition()
        .size([2 * Math.PI, root.height + 1])
        (root);
}

function setCatHighlights(tag, arc_element){
    cat_color = arc_element.attr('fill')
    $('#search-layer').empty();
    query_elements = nodes.filter((d) => tag_filter[tag].has(d['sub']))
    cloneElements(query_elements, '#search-layer', function (d) {
        d.style('fill', "DEEPPINK")
        d.style('opacity', 0.8)
        d.transition('expand')
            .duration(350)
            .attr('r', 12)

        d.transition('contract')
            .duration(350)
            .delay(500)
            .attr('r', (f) => nodeScale(search_node_scale * f[node_size_type]))
    })
}

function arcOver(d) {
    arc_element = d3.select(this)
    arc_element.attr("fill-opacity", 1)
    setCatHighlights(d.data.name, arc_element)
}

function arcOut(d) {
    $('#search-layer').empty();
    d3.select(this).attr("fill-opacity", 0.7)
}