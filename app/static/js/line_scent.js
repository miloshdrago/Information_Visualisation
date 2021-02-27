
class LineScent {
  constructor(element_selector) {
    this.element_selector = element_selector
    this.margin = { top: 0, right: 0, bottom: 0, left: 0 };
    this.width = $(element_selector).parent().width() - this.margin.left - this.margin.right;
    // this.height = $(element_selector).parent().height() - margin.top - margin.bottom;
    this.height = 40 - this.margin.top - this.margin.bottom;

    let full_width = this.width + this.margin.left + this.margin.right;
    let full_height = this.height + this.margin.top + this.margin.bottom;

    this.svg = d3.select(element_selector).insert("svg", ":first-child")
      .attr('viewbox', `0 0 ${full_width} ${full_height}`)
      .style('width', 'calc(100% + 2px)')
      .style('position', 'absolute')
      .style('z-index', 1)
      .style('top', -1)
      .style('left', -1)
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.xScale = d3.scaleLinear()
      .range([0, this.width]);
    this.yScaleNeg = d3.scaleLinear()
      .range([0, ((this.height / 2) - 1)]);
    this.yScalePos = d3.scaleLinear()
      .range([0, ((this.height / 2) -1)]);
    this.neg_line = d3.line();
    this.pos_line = d3.line();

    new ResizeObserver(this.resize.bind(this)).observe($(element_selector)[0]);
  }
  load_data(data) {
    this.data = data;
    this.xScale.domain([0, 49]);
    this.yScalePos.domain([0, d3.max(data, (d) => Number(d.positive))]);
    this.yScaleNeg.domain([0, d3.max(data, (d) => Number(d.negative))]);

    // this.pos_line
    //   .x((d, i) => this.xScale(i)) // set the x values for the line generator
    //   .y((d) => 0.5*this.height - this.yScale(d.y)) // set the y values for the line generator 
    //   .curve(d3.curveMonotoneX) // apply smoothing to the line

    this.pos_area = d3.area()
      .curve(d3.curveMonotoneX)
      .x((d, i) => this.xScale(i))
      .y0(this.height * 0.5)
      .y1((d) => 0.5 * this.height - this.yScalePos(d.positive));
    this.neg_area = d3.area()
      .curve(d3.curveMonotoneX)
      .x((d, i) => this.xScale(i))
      .y0(0.5 * this.height)
      .y1((d) => this.yScaleNeg(d.negative) + 0.5 * this.height);

    // this.neg_line
    //   .x((d, i) => this.xScale(i)) // set the x values for the line generator
    //   .y((d) => 0.5 * this.height + this.yScale(d.y)) // set the y values for the line generator 
    //   .curve(d3.curveMonotoneX) // apply smoothing to the line
  }
  draw() {
    // Top line
    let that = this;
    this.svg.html("")
    // .append("path")
    // .attr('id', 'negative-line')
    // .datum(that.data1) // 10. Binds data to the line 
    // .attr("class", "line") // Assign a class for styling 
    // .attr("d", that.pos_line) // 11. Calls the line generator 
    // .style('fill', 'none')
    // .style('stroke', 'blue')
    // .style('stroke-width', 1);

    this.svg
      .append("path")
      .datum(this.data)
      .attr('id', 'pos-fill')
      .attr('d', this.pos_area)
      .style('fill', '#7a99c5')

    this.svg
      .append("path")
      .datum(this.data)
      .attr('id', 'neg-fill')
      .attr('d', this.neg_area)
      .style('fill', '#f03333')

    // Bottom Line
    // this.svg
    //   .append("path")
    //   .attr('id', 'positive-line')
    //   .datum(that.data2) // 10. Binds data to the line 
    //   .attr("class", "line") // Assign a class for styling 
    //   .attr("d", that.neg_line) // 11. Calls the line generator 
    //   .style('fill', 'none')
    //   .style('stroke', 'red')
    //   .style('stroke-width', 1);
  }

  resize() {
    this.setScales();
    this.draw();
  }

  setScales() {
    this.width = $(this.element_selector).parent().width() - this.margin.left - this.margin.right;
    this.height = 40 - this.margin.top - this.margin.bottom;

    this.xScale.range([0, this.width])
    this.yScalePos.range([0, this.height / 2 - 1]) // input
    this.yScaleNeg.range([0, this.height / 2 - 1]) // input
    this.pos_line
      .x((d, i) => this.xScale(i)) // set the x values for the line generator
      .y((d) => 0.5 * this.height - this.yScalePos(d.positive)) // set the y values for the line generator 
      .curve(d3.curveMonotoneX) //
    this.neg_line
      .x((d, i) => this.xScale(i)) // set the x values for the line generator
      .y((d) => 0.5 * this.height + this.yScaleNeg(d.negative)) // set the y values for the line generator 
      .curve(d3.curveMonotoneX) //
  }
}