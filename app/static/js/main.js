base_url = `http://${document.domain}:${location.port}`

// // Establish Connection
// var socket = io.connect(base_url);
// socket.on('connect', function() {
//     console.log('Websocket connected!');
// });


// document.getElementById("posSentButton").addEventListener("click", function() {
//     updateSentiment("pos")
// }, false);

// document.getElementById("negSentButton").addEventListener("click", function() {
//     updateSentiment("neg")
// }, false);


$(document).ready(function () {
    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
        let arrow = d3.select('#left-collapse-arrow')
        if (d3.select('#sidebar').classed('active')){
            arrow.classed('arrow-right', true)
            arrow.classed('arrow-left', false)
        } else {
            arrow.classed('arrow-left', true)
            arrow.classed('arrow-right', false)
        }
    });

    $('#rightbarCollapse').on('click', function () {
        $('#rightbar').toggleClass('active');
        let arrow = d3.select('#right-collapse-arrow')
        if (d3.select('#rightbar').classed('active')){
            arrow.classed('arrow-right', false)
            arrow.classed('arrow-left', true)
        } else {
            arrow.classed('arrow-left', false)
            arrow.classed('arrow-right', true)
        }
    });

    // Draw Scent
    date_scent = new LineScent('#range-slider');
    scent_data = d3.csv(`${base_url}/data?g=volume_hist`, function(d){
        return {'positive':Number(d.positive), 'negative':Number(d.negative)}
    });
    scent_data.then(function(data){
        date_scent.load_data(data);
        date_scent.draw();
    })









});
