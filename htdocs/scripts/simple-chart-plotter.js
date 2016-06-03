var Plotter = function(args) {
	var that = this;
	var format = d3.time.format("%m/%d/%Y");
    var margin = {top: 20, right: 80, bottom: 60, left: 100},
		width = 1060 - margin.left - margin.right,
		height = 600 - margin.top - margin.bottom;

	var svg = d3.select("body").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	    .append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.attr("font-family", "Verdana");

    // add the tooltip area to the webpage
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    function getScale(type, h, w) {
        if (type == "Date") {
            return d3.time.scale().range([h, w]);
        } else if (type == "Label") {
            return d3.scale.ordinal().rangeRoundBands([h, w], .1);
        } else {
            return d3.scale.linear().range([h, w]);
        }
    }

    function parseObject(type, number) {
        if (type == "Date") {
            return format(new Date(number));
        } else {
            return number;
        }
    }

    // setup x
    var xValue = function(d) { return d.x; }, // data -> value
        xScale = function(type) { return getScale(type, 0, width); },
        xAxis = function(scale) { return d3.svg.axis().scale(scale).orient("bottom"); };
    /** Cannot setup scale yet due to time format **/

    // setup y
    var yValue = function(d) { return d.y; }, // data -> value
        yScale = function(type) { return getScale(type, height, 0); },
        yAxis = function(scale) { return d3.svg.axis().scale(scale).orient("left"); };

    // setup fill color
    var cValue = function(d) { return d.color;},
        color = d3.scale.category10();


    // If this were jQuery I would use:
    //$.ajax("/jax/analytics2People/job/" + id, function(theJsonResponse) {
        // TODO: Do something with theJsonResponse
    //});

	this.singleAxisLineChart = function(jsonPath) {
		d3.json(jsonPath, function(error, jsonObj) {
		    if (error) throw error;

		    var xType = jsonObj.x_axis.type,
		        yType = jsonObj.y_axis.type;

		    var xScaleInstance = xScale(xType),
		        yScaleInstance = yScale(yType);

            var line = d3.svg.line().x(function(d) { return xScaleInstance(d.x); })
                                    .y(function(d) { return yScaleInstance(d.y); });

            xScaleInstance.domain(d3.extent(jsonObj.data, xValue));
            yScaleInstance.domain(d3.extent(jsonObj.data, yValue));

            svg.append("g").attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis(xScaleInstance))
                .append("text").attr("x",width).attr("y",0 - margin.bottom/2)
                .style("text-anchor", "end")
                .text(jsonObj.x_axis.title);

            svg.append("g").attr("class", "y axis")
                .call(yAxis(yScaleInstance))
                .append("text").attr("transform", "rotate(-90)").attr("y", margin.left/3).attr("x",0)
                .style("text-anchor", "end")
                .text(jsonObj.y_axis.title);

            svg.append("path").datum(jsonObj.data)
                .attr("class", "line").attr("d", line);
		});
	}

	this.circlePercentageChart = function(radius, arcWidth, percentComplete) {
		var innerRad = radius - (arcWidth - 2);
		var outerRad = radius + (arcWidth - 2);
		var completedInRadian = percentComplete * 360 * (Math.PI/180);
		var arc = d3.svg.arc().innerRadius(innerRad).outerRadius(outerRad).startAngle(0).endAngle(completedInRadian);

		svg.attr("width", radius * 2).attr("height", radius * 2).append("path").attr("d", arc).attr("fill", "blue");
	}

	// TODO: We'll want to add the dualAxisLineChart method here.
	
	// TODO: We'll want to add the scatterXYChart method here.
	this.scatterXYChart = function(jsonPath) {
        d3.json(jsonPath, function(error, jsonObj) {
            if (error) throw error;

            var xType = jsonObj.x_axis.type,
                yType = jsonObj.y_axis.type;

            var xScaleInstance = xScale(xType),
		        yScaleInstance = yScale(yType);

            var xMap = function(d) { return xScaleInstance(xValue(d)); },
                yMap = function(d) { return yScaleInstance(yValue(d)); };

            /** Convert string to number for plotting **/
            jsonObj.data.forEach(function(d) {
                if (xType == "Number") {
                    d.x = +d.x;
                }
                if (yType == "Number") {
                    d.y = +d.y;
                }
            });

            xScaleInstance.domain([d3.min(jsonObj.data, xValue), d3.max(jsonObj.data, xValue)+1]);
            yScaleInstance.domain([d3.min(jsonObj.data, yValue)*0.8, d3.max(jsonObj.data, yValue)+1]);

            // Plot axes
            svg.append("g").attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis(xScaleInstance))
                .append("text").attr("x",width).attr("y",0 - margin.bottom/2)
                .style("text-anchor", "end")
                .text(jsonObj.x_axis.title);

            svg.append("g").attr("class", "y axis")
                .call(yAxis(yScaleInstance))
                .append("text").attr("transform", "rotate(-90)").attr("y", margin.left/3).attr("x",0)
                .style("text-anchor", "end")
                .text(jsonObj.y_axis.title);

            // draw dots
            svg.selectAll(".dot").data(jsonObj.data)
                .enter().append("circle")
                .attr("class", "dot")
                .attr("r", 3.5)
                .attr("cx", xMap)
                .attr("cy", yMap)
                .style("fill", function(d) { return color(cValue(d));})
                .on("mouseover", function(d) {
                      tooltip.transition()
                           .duration(200)
                           .style("opacity", .9);
                      tooltip.html(d.color + "<br/> (" + parseObject(xType, d.x)
            	        + ", " + parseObject(yType, d.y) + ")")
                           .style("left", (d3.event.pageX + 5) + "px")
                           .style("top", (d3.event.pageY - 28) + "px");
                })
                .on("mouseout", function(d) {
                      tooltip.transition()
                           .duration(500)
                           .style("opacity", 0);
                });
            // draw legend
            var legend = svg.selectAll(".legend").data(color.domain())
                  .enter().append("g").attr("class", "legend")
                  .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

            // draw legend colored rectangles
            legend.append("rect").attr("x", width - 18)
                .attr("width", 18).attr("height", 18)
                .style("fill", color);

            // draw legend text
            legend.append("text")
                .attr("x", width - 24).attr("y", 9).attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function(d) { return d;})
        });
    }
	
	// TODO: We'll want to add the bar chart, and/or heat map (if we have time)
	this.barChart = function(jsonPath) {
        d3.json(jsonPath, function(error, jsonObj) {
            if (error) throw error;

            var xType = jsonObj.x_axis.type,
		        yType = jsonObj.y_axis.type;

		    var xScaleInstance = xScale(xType),
		        yScaleInstance = yScale(yType);

            /** Convert string to number for plotting **/
            jsonObj.data.forEach(function(d) {
                if (xType == "Percentage") {
                    d.x_string = d3.format(",.4%")(d.x);
                }
                if (yType == "Percentage") {
                    d.y_string = +d.y*100 + "%";
                }
            });

            if (yType == "Label") {
                // bar chart by y axis
                jsonObj.data = jsonObj.data.sort(sortByXAxisDescending);
            } else {
                jsonObj.data = jsonObj.data.sort(sortByYAxisDescending);
            }

		    xScaleInstance.domain([0, d3.max(jsonObj.data, function(d) { return d.x; })]);
            yScaleInstance.domain(jsonObj.data.map(function(d) { return d.y; }));

            if (xType == "Label") {
                svg.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + height + ")")
                      .call(xAxis(xScaleInstance));
            }

            if (yType == "Label") {
              svg.append("g")
                  .attr("class", "y axis")
                  .call(yAxis(yScaleInstance));
            }

            svg.selectAll(".bar")
                  .data(jsonObj.data)
                .enter().append("rect")
                  .attr("class", "bar")
                  .attr("x", function(d) { return 0; })
                  .attr("width", function(d) { return xScaleInstance(d.x); })
                  .attr("y", function(d) { return yScaleInstance(d.y); })
                  .attr("height", yScaleInstance.rangeBand());

            svg.selectAll(".bartext")
                .data(jsonObj.data)
                .enter()
                .append("text")
                .attr("class", "bartext")
                .attr("text-anchor", "middle")
                .attr("y", function(d) { return yScaleInstance(d.y) + yScaleInstance.rangeBand()/2 + 5;})
                .attr("x", function(d) { return xScaleInstance(d.x) + 40; })
                .text(function(d) { return d.x_string; });

            // now add titles to the axes
            svg.append("text")
                .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
                .attr("x", -height/2).attr("y", -80)
                .attr("transform", "rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
                .text(jsonObj.y_axis.title);

            svg.append("text")
                .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
                .attr("x", width/2).attr("y", height+50)  // centre below axis
                .text(jsonObj.x_axis.title);
        });
	}

	function sortByXAxisDescending(a, b) {
        return a.x - b.x;
    }

    function sortByYAxisDescending(a, b) {
        return a.y - b.y;
    }
};