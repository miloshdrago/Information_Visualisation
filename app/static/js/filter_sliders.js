var sent_slider = document.getElementById('sentiment-slider');
var highlight_slider = document.getElementById('highlight-slider');
var nodesize_slider = document.getElementById('nodesize-slider');
var nodecolor_slider = document.getElementById('nodecolor-slider');

// Sentiment Slider
sent_pips = ['-', 'Both', '+']

noUiSlider.create(sent_slider, {
    start: [1],
    step: 1,
    range: {
        'min': 0,
        'max': 2
    },
    behaviour: 'tap-drag',
    animate: true,
    animationDuration: 100,
    pips: {
        mode: 'values',
        values: [0,1,2],
    }
});

$('#sentiment-slider .noUi-pips .noUi-value').each(function() {
    var index = $(this).html();
    $(this).html(sent_pips[index]);
  });

sent_slider.noUiSlider.on('update', function () {

    let handle = d3.select('#sentiment-slider .noUi-handle');

    // Set color
    let val = Number(sent_slider.noUiSlider.get())
    if (val == 0) {
        handle.style('background-color', color_neg)
    } else if (val == 1) {
        handle.style('background-color', color_neut)
    } else {
        handle.style('background-color', color_pos)
    }
})

sent_slider.noUiSlider.on('change', function () {
    let val = Number(sent_slider.noUiSlider.get())
    if (val == 0) {
        updateSentiment("-1")
        // d3.selectAll('#link-layer .link').transition('color').delay(1000).duration(500).style('stroke', color_neg)
    } else if (val == 1) {
        updateSentiment("both")
        // d3.selectAll('#link-layer .link').transition('color').delay(1000).duration(500).style('stroke', color_neut)
    } else {
        updateSentiment("1")
        // d3.selectAll('#link-layer .link').transition('color').delay(1000).duration(500).style('stroke', color_pos)
    }
})

// Highlighted Slider
highlight_pips = ['In', 'Both', 'Out']

noUiSlider.create(highlight_slider, {
    start: [1],
    step: 1,
    range: {
        'min': 0,
        'max': 2
    },
    behaviour: 'tap-drag',
    animate: true,
    animationDuration: 100,
    pips: {
        mode: 'values',
        values: [0,1,2],
    }
});

$('#highlight-slider .noUi-pips .noUi-value').each(function() {
    var index = $(this).html();
    $(this).html(highlight_pips[index]);
  });

highlight_slider.noUiSlider.on('change', function () {
    let val = Number(highlight_slider.noUiSlider.get())
    if (val == 0) {
        link_highlight_type = 'in'
    } else if (val == 1) {
        link_highlight_type = 'both'
    } else {
        link_highlight_type = 'out'
    }
    if (clicked_node != null) {
        clearHighlights();
        setHighlights();
        drawNames();
    }
})

// Node Size Slider
node_size_pips = ['In', 'Out']
noUiSlider.create(nodesize_slider, {
    start: [1],
    step: 1,
    range: {
        'min': 0,
        'max': 1
    },
    behaviour: 'tap-drag',
    animate: true,
    animationDuration: 100,
    pips: {
        mode: 'values',
        values: [0,1],
    }
});
$('#nodesize-slider .noUi-pips .noUi-value').each(function() {
    var index = $(this).html();
    $(this).html(node_size_pips[index]);
  });

nodesize_slider.noUiSlider.on('update', function () {
    let val = Number(nodesize_slider.noUiSlider.get())
    if (val == 0) {
        node_size_type = 'total_in'
        updateNodeSize()

    } else {
        node_size_type = 'total_out'
        updateNodeSize()
    }
});

// noUiSlider.create(nodecolor_slider, {
//     start: [0],
//     step: 1,
//     range: {
//         'min': 0,
//         'max': 1
//     },
//     behaviour: 'tap-drag',
//     animate: true,
//     animationDuration: 100,
// });