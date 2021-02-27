var monthSlider = document.getElementById('range-slider');

function getDate(num) {
    return new Date(Math.round(num));
}

const step_size = 24 * 60 * 60 * 1000;

var range = {
    'min': start_date.getTime(),
    'max': end_date.getTime()
}

const diffTime = Math.abs(end_date - start_date);
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

noUiSlider.create(monthSlider, {
    start: [range.min + step_size, range.max - step_size],
    step: step_size,
    range: range,
    tooltips: true,
    behaviour: 'drag',
    connect: true,
    animate: true,
    animationDuration: 600,
});

// Remove the shortcut active class when manually setting a range.
monthSlider.noUiSlider.on('start', function () {
    $('.shortcuts li').removeClass('active');
});

monthSlider.noUiSlider.on('update', function (values, handle) {

    let the_date = getSliderDates()[handle]
    the_date = the_date.toDateString()
    // Set the tooltip values.
    $('.noUi-handle[data-handle="' + handle + '"]').find('.noUi-tooltip').html(`<strong>${the_date}</strong>`);

});

monthSlider.noUiSlider.on('end', function (values, handle) {
    let [start, end] = getSliderDates()
    start = start.toISOString().slice(0,10)
    end = end.toISOString().slice(0,10)
    d3.csv(`/links?start_date=${start}&end_date=${end}`).then(function (data_link) {
        link_master = data_link;
        buildLinkData(link_master);
        link_master.sort(linkSort)
        link_work = link_master;
        updateSentiment(link_sent_state);
    })
})

test = null
function getSliderDates() {
    let [start, end] = monthSlider.noUiSlider.get();
    start = new Date(Math.round(start));
    end = new Date(Math.round(end))
    start_date = start;
    end_date = end;
    total_days = (end_date - start_date) / (1000 * 60 *60 *24);
    return [start, end]
}