(function() {
  var margin = { top: 30, left: 50, right: 30, bottom: 30},
  height = 500 - margin.top - margin.bottom,
  width = 700 - margin.left - margin.right;

  var svg = d3.select("#graphic")
        .append("svg")
        .attr("height", height + margin.top + margin.bottom)
        .attr("width", width + margin.left + margin.right)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  /*** MISCELLANEOUS STUFF ***/
  var parseDate = d3.timeParse("%Y-%m-%d");
  var months = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
  var barColor = "#2b8cbe";
  var lineColor = "#74a9cf";
  var TenThouStepsColor = "#045a8d";
  var highlightColor = "grey";

  /*** SCALES ***/
  var lineGraphX = d3.scaleTime().range([0, width]);
  var lineGraphY = d3.scaleLinear().range([height, 0]);

  var barGraphX = d3.scaleBand().range([0, width]).padding(0.05);
  var healthyBarGraphY = d3.scaleLinear().range([height, 0]);
  var averageBarGraphY = d3.scaleLinear().range([height, 0]);

  /*** LOADING DATA ***/
  d3.queue()
    .defer(d3.csv, "data/steps_by_day.csv", function(d) {
      d.date = parseDate(d.date);
      d.steps = +d.steps;
      if (d.steps < 25000) {
        return d;
      }
    })
    .await(ready)

  /*** FUNCTION TO CALL WHEN DATA IS LOADED ***/
  function ready(error, datapoints) {
    month_counts = [];
    for (i = 0; i < 12; i++) {
      month_counts.push({"month": months[i], "healthyCount": 0, "count":0.0, "total":0.0});
    }

    for (i = 0; i<datapoints.length; i++) {
      month_num = datapoints[i].date.getMonth();
      month_counts[month_num].count++;
      month_counts[month_num].total += datapoints[i].steps;
      if (datapoints[i].steps >= 10000) {
        month_counts[month_num].healthyCount++;
      }
    }

    for (i = 0; i < 12; i++) {
      month_counts[i].average = (month_counts[i].total / month_counts[i].count);
    }

    console.log(month_counts);

    /*** SHAPE FUNCTIONS ***/
    var line = d3.line()
      .x(function(d) { return lineGraphX(d.date); })
      .y(function(d) { return lineGraphY(d.steps); }).curve(d3.curveMonotoneX);

    /*** SETTING SCALES' DOMAINS ***/
    lineGraphX.domain(d3.extent(datapoints, function(d) { return d.date; }));
    lineGraphY.domain([0, d3.max(datapoints, function(d) { return d.steps; })]);

    barGraphX.domain(month_counts.map(function(d) { return d.month; }));
    healthyBarGraphY.domain([0, d3.max(month_counts, function(d) { return d.healthyCount; })]);
    averageBarGraphY.domain([0, d3.max(month_counts, function(d) { return d.average; })]);

    /*** BAR GRAPH BARS, ZERO HEIGHT ***/
    svg.selectAll(".monthBar")
      .data(month_counts).enter().append("rect")
      .attr("class", "monthBar")
      .attr("id", function(d, i) { return months[i]})
      .attr("x", function(d) { return barGraphX(d.month); })
      .attr("y", height)
      .attr("width", barGraphX.bandwidth())
      .attr("height", 0)
      .attr("fill", barColor)
      .attr("opacity", 0);

    /*** LINE GRAPH AXES ***/
    svg.append("g")
      .attr("class", "axis axisX")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(lineGraphX));

    svg.append("g")
      .attr("class", "axis axisY")
      .call(d3.axisLeft(lineGraphY))
      .append("text")
      .attr("id", "yLabel")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .style("text-anchor", "end")
      .text("# Of Steps");

    /*** LINE GRAPH LINE ***/
    svg.append("g").attr("id","lineGraphContainer").append("path")
      .attr("id", "lineGraphPath")
      .attr("d", line(datapoints))
      .attr("fill", "none")
      .attr("stroke", lineColor)
      .attr("stroke-width", "1px")
      .attr("opacity", 1);


    /*** LINE GRAPH HIGHLIGHT RECTANGLES ***/
    svg.append("rect").attr("id", "JapanHighlight")
      .attr("x", lineGraphX(parseDate("2015-05-05")))
      .attr("y", 0)
      .attr("width", lineGraphX(parseDate("2015-06-05")) - lineGraphX(parseDate("2015-05-10")))
      .attr("height", height)
      .attr("fill", highlightColor)
      .attr("opacity", 0);

    svg.append("rect").attr("id", "WinterBreakHighlght")
      .attr("x", lineGraphX(parseDate("2015-12-15")))
      .attr("y", 0)
      .attr("width", lineGraphX(parseDate("2016-01-25")) - lineGraphX(parseDate("2015-12-15")))
      .attr("height", height)
      .attr("fill", highlightColor)
      .attr("opacity", 0);

    /*** LINE GRAPH 10,000 STEP LINE ***/
    svg.append("line").attr("id", "StepsLine")
      .attr("x1", 0)
      .attr("y1", lineGraphY(9998))
      .attr("x2", 0)
      .attr("y2", lineGraphY(9998))
      .attr("stroke", TenThouStepsColor)
      .attr("stroke-width", "4px")
      .attr("opacity", 0);


    /************** SLIDE TRANSITION FUNCTIONS **************/
    /*** SLIDE 1 ***/
    d3.select("#slide-1").on('slidein', function() {});
    d3.select("#slide-1").on('slideout', function() {});

    /*** SLIDE 2 -- JAPAN HIGHLIGHT ***/
    d3.select("#slide-2").on('slidein', function() {
      svg.select("#JapanHighlight")
        .transition().duration(1000)
        .attr("opacity", .4);
    });
    d3.select("#slide-2").on('slideout', function() {
      svg.select("#JapanHighlight")
        .transition().duration(1000)
        .attr("opacity", 0);
    });

    /*** SLIDE 3 -- WINTER BREAK HIGHLIGHT ***/
    d3.select("#slide-3").on('slidein', function() {
      svg.select("#WinterBreakHighlght")
        .transition().duration(1000)
        .attr("opacity", .4);
    });

    d3.select("#slide-3").on('slideout', function() {
      svg.select("#WinterBreakHighlght")
        .transition().duration(1000)
        .attr("opacity", 0);
    });

    /*** SLIDE 4 -- 10000 STEPS ***/
    d3.select("#slide-4").on('slidein', function() {
      svg.select("#StepsLine")
        .transition().duration(1000)
        .attr("x2", width)
        .attr("opacity", 1);
      svg.select("#lineGraphPath")
        .transition().duration(1000)
        .attr("opacity", 1);

      svg.selectAll(".monthBar")
        .transition()
        .duration(1000)
        .attr("y", height)
        .attr("height", 0)
        .attr("opacity", 0);

      svg.select(".axisX")
        .transition().duration(1000)
        .call(d3.axisBottom(lineGraphX));
      svg.select(".axisY")
        .transition().duration(1000)
        .call(d3.axisLeft(lineGraphY));
      svg.select("#yLabel")
        .text("# Of Steps");
    });

    d3.select("#slide-4").on('slideout', function() {
      svg.select("#StepsLine")
        .transition().duration(1000)
        .attr("x2", 0)
        .attr("opacity", 0);
    });

    /*** SLIDE 5 -- FADE OUT LINE GRAPH BRING IN BAR GRAPH ***/
    d3.select("#slide-5").on('slidein', function() {
      svg.select("#lineGraphPath")
        .transition().duration(1000)
        .attr("opacity", 0);

      svg.selectAll(".monthBar")
        .transition().duration(1000)
        .attr("height", function(d) { return height -  healthyBarGraphY(d.healthyCount); })
        .attr("y", function(d) { return healthyBarGraphY(d.healthyCount) })
        .attr("opacity", 1);

      svg.select(".axisX")
        .transition().duration(1000)
        .call(d3.axisBottom(barGraphX));
      svg.select(".axisY")
        .transition().duration(1000)
        .call(d3.axisLeft(healthyBarGraphY));
      svg.select("#yLabel")
        .text("# Times I Hit 10,000 Steps")

    });
    d3.select("#slide-5").on('slideout', function() {});

    /*** SLIDE 6 -- HIGHLIGHT SUMMER ***/
    d3.select("#slide-6").on('slidein', function() {
      svg.select(".axisY")
        .transition().duration(1000)
        .call(d3.axisLeft(healthyBarGraphY));
      svg.select("#yLabel")
        .text("# Times I Hit 10,000 Steps");

      var t0 = svg.transition().duration(1000);
      t0.selectAll(".monthBar")
        .attr("height", function(d) { return height -  healthyBarGraphY(d.healthyCount); })
        .attr("y", function(d) { return healthyBarGraphY(d.healthyCount) })
        .attr("opacity", .2);

      t1 = t0.transition().duration(500);
      t1.selectAll("#June, #July, #Aug")
        .attr("opacity", 1);
    });
    d3.select("#slide-6").on('slideout', function() {
    });

    /*** SLIDE 7 -- SWITCH TO AVERAGE BAR GRAPH ***/
    d3.select("#slide-7").on('slidein', function() {
      svg.select(".axisY")
        .transition().duration(1000)
        .call(d3.axisLeft(averageBarGraphY));
      svg.select("#yLabel")
        .text("Average # Of Steps");

      svg.selectAll(".monthBar")
        .transition().duration(1000)
        .attr("opacity", 1)
        .attr("height", function(d) { return height - averageBarGraphY(d.average)})
        .attr("y", function(d) { return averageBarGraphY(d.average); });

    });
    d3.select("#slide-7").on('slideout', function() {});
    d3.select("#slide-8").on('slidein', function() {});
    d3.select("#slide-8").on('slideout', function() {});
    d3.select("#slide-9").on('slidein', function() {});
    d3.select("#slide-9").on('slideout', function() {});
    d3.select("#slide-10").on('slidein', function() {});
    d3.select("#slide-10").on('slideout', function() {});

  };
})();