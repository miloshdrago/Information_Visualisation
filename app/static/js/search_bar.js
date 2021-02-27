$(document).ready(function () {

    // Show and Hide Behaviour
    d3.select('#search-input')
        .on('mouseover', function () {
            d3.select('#search-box-wrapper')
                .transition()
                .duration(150)
                .style('top', "0px")
        })
        .on('mouseout', function () {
            if (!$(this).is(":focus")) {
                d3.select('#search-box-wrapper')
                    .transition()
                    .delay(500)
                    .duration(400)
                    .style('top', "-25px")
            }
        })
        .on('blur', function () {
            d3.select('#search-box-wrapper')
                .transition()
                .delay(1000)
                .duration(400)
                .style('top', "-25px")
        })
});  