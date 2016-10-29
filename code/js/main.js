(function() {
  var margin = { top: 20, left: 75, right: 20, bottom: 20},
  height = 500 - margin.top - margin.bottom,
  width = 750 - margin.left - margin.right;

  var svg = d3.select("#graphic")
        .append("svg")
        .attr("height", height + margin.top + margin.bottom)
        .attr("width", width + margin.left + margin.right)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  /*** MISCELLANEOUS STUFF ***/
  var parseDate = d3.timeParse("%Y-%m-%d");
  var months = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
  var monthsWithoutSummer = ["Jan", "Feb", "March", "April", "May", "Sept", "Oct", "Nov", "Dec"];
  var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  var times = ["12am", "1am", "2am", "3am", "4am", "5am", "6am", "7am", "8am", "9am", "10am", "11am",
               "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm"];
  var colors = ["#fff7fb", "#ece7f2", "#d0d1e6", "#a6bddb","#74a9cf","#3690c0","#0570b0","#045a8d","#023858"]

  var isSummer = function(month) {
    return month == "June" || month == "July" || month == "Aug";
  };
  var heatmapData = [];
  for (i = 0; i < 7*24; i++) {
    heatmapData.push(i);
  }

  var gridSize = Math.floor(width / 24);
  var buckets = 9;
  var barColor = "#2b8cbe";
  var barHighlightColor = "#ec7014";
  var lineColor = "#3690c0";
  var TenThouStepsColor = "#ec7014";
  var boxHighlightColor = "#ec7014";

  /*** SCALES ***/
  var lineGraphX = d3.scaleTime().range([0, width]);
  var lineGraphY = d3.scaleLinear().range([height, 0]);

  var barGraphX = d3.scaleBand().range([0, width]).padding(0.05);
  var healthyBarGraphY = d3.scaleLinear().range([height, 0]);
  var averageBarGraphY = d3.scaleLinear().range([height, 0]);

  var colorScale = d3.scaleQuantile().range(colors);

  /*** LOADING DATA ***/
  d3.queue()
    .defer(d3.csv, "data/steps_by_day.csv", function(d) {
      d.date = parseDate(d.date);
      d.steps = +d.steps;
      if (d.steps < 25000) {
        return d;
      }
    }).defer(d3.csv, "data/summerHeatMap.csv", function(d) {
      d.hour = +d.hour;
      d.value = +d.value;
      return d;
    }).defer(d3.csv, "data/schoolHeatMap.csv", function(d) {
      d.hour = +d.hour;
      d.value = +d.value;
      return d;
    })
    .await(ready)

  /*** FUNCTION TO CALL WHEN DATA IS LOADED ***/
  function ready(error, stepsByDay, summerHeatMapData, schoolHeatMapData) {
    /*** CALCULATING MONTHLY AVERAGES AND HEALTHY DAY COUNTS ***/
    month_counts = [];
    for (i = 0; i < 12; i++) {
      month_counts.push({"month": months[i], "healthyCount": 0, "count":0.0, "total":0.0});
    }

    for (i = 0; i<stepsByDay.length; i++) {
      month_num = stepsByDay[i].date.getMonth();
      month_counts[month_num].count++;
      month_counts[month_num].total += stepsByDay[i].steps;
      if (stepsByDay[i].steps >= 10000) {
        month_counts[month_num].healthyCount++;
      }
    }

    for (i = 0; i < 12; i++) {
      month_counts[i].average = (month_counts[i].total / month_counts[i].count);
    }

    /*** SHAPE FUNCTIONS ***/
    var line = d3.line()
      .x(function(d) { return lineGraphX(d.date); })
      .y(function(d) { return lineGraphY(d.steps); }).curve(d3.curveMonotoneX);

    /*** SETTING SCALES' DOMAINS ***/
    lineGraphX.domain(d3.extent(stepsByDay, function(d) { return d.date; }));
    lineGraphY.domain([0, d3.max(stepsByDay, function(d) { return d.steps; })]);

    barGraphX.domain(months);
    healthyBarGraphY.domain([0, d3.max(month_counts, function(d) { return d.healthyCount; })]);
    averageBarGraphY.domain([0, d3.max(month_counts, function(d) { return d.average; })]);

    colorScale.domain([0, d3.max(schoolHeatMapData, function (d) { return d.value; })])
    console.log(colorScale.quantiles());
    /*** BAR GRAPH BARS, ZERO HEIGHT ***/
    svg.selectAll(".monthBar")
      .data(month_counts).enter().append("rect")
      .attr("class", function(d) { 
        return (isSummer(d.month) ? "monthBar summer" : "monthBar school");
      })
      .attr("id", function(d, i) { return months[i]})
      .attr("x", function(d) { return barGraphX(d.month); })
      .attr("y", height)
      .attr("width", barGraphX.bandwidth())
      .attr("height", 0)
      .attr("fill", barColor)
      .attr("opacity", 1);

    /*** LINE GRAPH AXES ***/
    svg.append("g")
      .attr("class", "axis axisX")
      .attr("transform", "translate(0," + height + ")")
      .attr("opacity", 1)
      .call(d3.axisBottom(lineGraphX));

    svg.append("g")
      .attr("class", "axis axisY")
      .attr("opacity", 1)
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
    svg.append("path")
      .attr("id", "lineGraphPath")
      .attr("d", line(stepsByDay))
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
      .attr("fill", boxHighlightColor)
      .attr("opacity", 0);

    svg.append("rect").attr("id", "WinterBreakHighlght")
      .attr("x", lineGraphX(parseDate("2015-12-15")))
      .attr("y", 0)
      .attr("width", lineGraphX(parseDate("2016-01-25")) - lineGraphX(parseDate("2015-12-15")))
      .attr("height", height)
      .attr("fill", boxHighlightColor)
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

    /*** HEATMAP LABELS ***/
    var heatmapContainer = svg.append("g")
      .attr("id", "heatmapContainer")
      .attr("transform", "translate(0," + ((height / 2) - ((gridSize * days.length) / 2)) + ")")
      .attr("opacity", 0);

    heatmapContainer.append("g").attr("id", "dayLabels")
      .selectAll(".dayLabel").data(days).enter().append("text")
        .text(function (d) { return d; })
        .attr("x", 0)
        .attr("y", function (d, i) { return i * gridSize; })
        .style("text-anchor", "end")
        .attr("transform", "translate(-6," + gridSize / 1.5+ ")")
        .attr("class", "dayLabel");

    heatmapContainer.append("g").attr("id", "timeLabels")
      .selectAll(".timeLabel").data(times).enter().append("text")
        .text(function(d) { return d; })
        .attr("x", function(d, i) { return i * gridSize; })
        .attr("y", 0)
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .attr("transform", "translate(" + gridSize / 2 + ", -6)")
        .attr("class", "timeLabel");

    /*** HEATMAP LEGEND ***/
    var legend = heatmapContainer.append("g")
      .attr("id", "legend")
      .attr("transform", "translate(0," + (gridSize * (days.length + 2)) + ")")
      .selectAll(".legendElement")
      .data([0].concat(colorScale.quantiles())).enter()
      .append("g").attr("class", "legendElement");

    legend.append("rect")
      .attr("x", function(d, i) { return gridSize * 2 * i; })
      .attr("y", 0)
      .attr("width", gridSize * 2)
      .attr("height", gridSize)
      .style("fill", function(d, i) { return colors[i]; });

    legend.append("text")
      .text(function(d) { return "≥ " + Math.round(d); })
      .attr("x", function(d, i) { return gridSize * 2 * i + (gridSize / 2); })
      .attr("y", -4)
      .attr("font-size", "12px");

    /*** HEATMAP CELLS ***/
    heatmapContainer.selectAll("rect.minute")
      .data(schoolHeatMapData).enter().append("rect")
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", gridSize)
      .attr("height", gridSize)
      .attr("class", "bordered minute")
      .style("fill", colors[0])
      .attr("x", function(d, i) { return (i % times.length) * gridSize; })
      .attr("y", function(d, i) { return Math.floor(i / 24) * gridSize; })

    /************** SLIDE TRANSITION FUNCTIONS **************/

    /*** SLIDE 2 -- JAPAN HIGHLIGHT ***/
    d3.select("#slide-2").on('slidein', function() {
      svg.selectAll(".axis").transition().duration(1000).attr("opacity", 1);
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
      svg.selectAll(".axis").transition().duration(1000).attr("opacity", 1);
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
      svg.selectAll(".axis").transition().duration(1000).attr("opacity", 1);
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
        .attr("height", 0);

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
      svg.selectAll(".axis").transition().duration(1000).attr("opacity", 1);
      svg.select("#lineGraphPath")
        .transition().duration(1000)
        .attr("opacity", 0);

      svg.selectAll(".monthBar")
        .transition().duration(1000)
        .attr("x", function(d) { return barGraphX(d.month); })
        .attr("width", barGraphX.bandwidth())
        .attr("height", function(d) { return height -  healthyBarGraphY(d.healthyCount); })
        .attr("y", function(d) { return healthyBarGraphY(d.healthyCount) })
        .attr("opacity", 1)
        .style("fill", barColor);

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
      svg.selectAll(".axis").transition().duration(1000).attr("opacity", 1);
      svg.select(".axisY")
        .transition().duration(1000)
        .call(d3.axisLeft(healthyBarGraphY));
      svg.select("#yLabel")
        .text("# Times I Hit 10,000 Steps");

      svg.selectAll(".monthBar.school")
        .transition().duration(1000)
        .attr("x", function(d) { return barGraphX(d.month); })
        .attr("width", barGraphX.bandwidth())
        .attr("height", function(d) { return height -  healthyBarGraphY(d.healthyCount); })
        .attr("y", function(d) { return healthyBarGraphY(d.healthyCount) })
        .attr("opacity", .2);

      svg.selectAll(".monthBar.summer")
        .transition().duration(1000)
        .attr("x", function(d) { return barGraphX(d.month); })
        .attr("width", barGraphX.bandwidth())
        .attr("height", function(d) { return height -  healthyBarGraphY(d.healthyCount); })
        .attr("y", function(d) { return healthyBarGraphY(d.healthyCount) })
        .attr("opacity", 1)
        .style("fill", barHighlightColor);
    });
    d3.select("#slide-6").on('slideout', function() {
    });

    /*** SLIDE 7 -- SWITCH TO AVERAGE BAR GRAPH ***/
    d3.select("#slide-7").on('slidein', function() {
      svg.selectAll(".axis").transition().duration(1000).attr("opacity", 1);
      barGraphX.domain(months);

      svg.select(".axisX")
        .transition().duration(1000)
        .call(d3.axisBottom(barGraphX));
      svg.select(".axisY")
        .transition().duration(1000)
        .call(d3.axisLeft(averageBarGraphY));
      svg.select("#yLabel")
        .text("Average # Of Steps");

      svg.selectAll(".monthBar")
        .transition().duration(1000)
        .attr("x", function(d) { return barGraphX(d.month); })
        .attr("width", barGraphX.bandwidth())
        .attr("height", function(d) { return height -  averageBarGraphY(d.average); })
        .attr("y", function(d) { return averageBarGraphY(d.average) })
        .attr("opacity", 1)
        .style("fill", barColor);

    });
    d3.select("#slide-7").on('slideout', function() {});
    
    /*** REMOVE SUMMER MONTHS, SLIDE MAY AND SEPTEMBER TO EACH OTHER ***/
    d3.select("#slide-8").on('slidein', function() {
      svg.select("#heatmapContainer").transition().duration(1000).attr("opacity", 0);
      svg.selectAll(".axis").transition().duration(1000).attr("opacity", 1);

      t0 = svg.transition().duration(1000);

      t0.selectAll(".monthBar.summer")
        .attr("y", height)
        .attr("height", 0);

      barGraphX.domain(monthsWithoutSummer);
      t1 = t0.transition().duration(1000);

      t1.selectAll(".monthBar.school")
        .attr("x", function(d) { return barGraphX(d.month); })
        .attr("width", barGraphX.bandwidth())
        .attr("height", function(d) { return height -  averageBarGraphY(d.average); })
        .attr("y", function(d) { return averageBarGraphY(d.average) });
      t1.select(".axisX")
        .call(d3.axisBottom(barGraphX));


    });
    d3.select("#slide-8").on('slideout', function() {});
    
    d3.select("#slide-9").on('slidein', function() {
      svg.selectAll(".axis").transition().duration(1000).attr("opacity", 0);
      svg.selectAll(".monthBar").transition().duration(1000).attr("y", height).attr("height", 0);

      svg.select("#heatmapContainer").transition().duration(1000).attr("opacity", 1);

      svg.selectAll("rect.minute")
        .data(schoolHeatMapData)
        .transition().duration(1000)
        .style("fill", function(d) { return colorScale(d.value); });

    });
    d3.select("#slide-9").on('slideout', function() {});
    d3.select("#slide-10").on('slidein', function() {
      svg.selectAll("rect.minute")
        .data(summerHeatMapData)
        .transition().duration(1000)
        .style("fill", function(d) { return colorScale(d.value); });        
    });
    d3.select("#slide-10").on('slideout', function() {});

  };
})();