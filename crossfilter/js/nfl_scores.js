d3.csv("/crossfilter/data/nfl_scores.csv", function(error, games){
	
	//formatters
	var formatNumber = d3.format(",d");

	//nest operator

	//format the data
	games.forEach( function(d, i) {
		d.index = i;
		d.year = +d.year;
		d.pts_w = +d.pts_w;
		d.pts_l = +d.pts_l;
		d.yds_w = +d.yds_w;
		d.yds_l = +d.yds_l;
		d.pts_t = d.pts_w + d.pts_l;
		d.yds_t = d.yds_w + d.yds_l;
		switch (d.week) {
			case "WildCard":
				d.week = 20;
				break;
			case "Division":
				d.week = 21;
				break;
			case "ConfChamp":
				d.week = 22;
				break;
			case "SuperBowl":
				d.week = 23;
				break;
			default:
				d.week = +d.week;	
		};
	});

	//create crossfilter
	var game = crossfilter(games),
			all = game.groupAll(),

			year = game.dimension(function(d) { return d.year; }),
			years = year.group(function (d) {return Math.floor(d/5)*5; }),

			week = game.dimension(function(d) { return d.week; }),
			weeks = week.group(),
			//weekDomain = weeks.all().map(function(d) { return d.key; }),

			yard = game.dimension(function(d) {return d.yds_t; }),
			yards = yard.group(function(d) { return Math.floor(d/25)*25; }),

			point = game.dimension(function(d) { return d.pts_t }),
			points = point.group(function(d) { return Math.floor(d/5)*5 });

	var charts = [

		//week chart
		barChart()
				.dimension(week)
				.group(weeks)
			//.x(d3.scale.ordinal()
			//	.domain(weekDomain)
			//	.rangeBands([0, 21*10])),
			.x(d3.scale.linear()
				.domain([1, 24])
				.rangeRound([0, 23 * 10])),

		//point chart
		barChart()
				.dimension(point)
				.group(points)
			.x(d3.scale.linear()
				.domain([0, 120])
				.rangeRound([0, 24 * 10])),

		//yard chart
		barChart()
				.dimension(yard)
				.group(yards)
			.x(d3.scale.linear()
				.domain([0, 1200])
				.rangeRound([0, 48 * 10])),

		//year chart
		barChart()
				.dimension(year)
				.group(years)
			.x(d3.scale.linear()
				.domain([1940, 2014])
				.rangeRound([0, 25 * 10]))
			
	];

	// Assume that charts[] is ordered the same as in DOM
	var chart = d3.selectAll(".chart")
		.data(charts)
		.each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });

	//TODO
	//render list

	//render total
	d3.selectAll("#total")
		.text(formatNumber(game.size()));
	
	renderAll();

	//renders specified
	function render(method) {
		d3.select(this).call(method);
	}

	//When brush moves, re-render
	function renderAll() {
		chart.each(render);
		// list.each(render);
		d3.select("#active").text(formatNumber(all.value()));
		var yardAvg = yards.all()
				.map(function(d){return d.key*d.value;})
				.reduce(function(a,b){return a+b;})
			/ all.value();
		yardAvg = ((isNaN(yardAvg) || !isFinite(yardAvg)) ? '-' : d3.round(yardAvg));
    d3.select("#yard-avg").text(yardAvg);
		var ptAvg = points.all()
				.map(function(d){return d.key*d.value;})
				.reduce(function(a,b){return a+b;})
			/ all.value();
		ptAvg = ((isNaN(ptAvg) || !isFinite(ptAvg)) ? '-' : d3.round(ptAvg));
    d3.select("#point-avg").text(ptAvg);
	}

	window.filter = function(filters) {
		filters.forEach(function(d, i) { charts[i].filter(d); });
		renderAll();
	};

	window.reset = function(i) {
		charts[i].filter(null);
		renderAll();
	};

	//TODO
	//game list
/*
	function gameList(div) {
		div.each(function() {
			var year = d3.select(this).selectAll(".date")
				.data(year.top(40), function(d) { return d.key; });

			year.enter().append("div")
					.attr("class", "date")
				.append("div")
					.attr("class", "day")
					.text(function(d) { return d.values[0].year; });

			year.exit().remove();
		}
	}
*/
	//bar chart methods. Copy and pasted from example
	  function barChart() {
	    if (!barChart.id) barChart.id = 0;

	    var margin = {top: 10, right: 10, bottom: 20, left: 10},
	        x,
	        y = d3.scale.linear().range([100, 0]),
	        id = barChart.id++,
	        axis = d3.svg.axis().orient("bottom"),
	        brush = d3.svg.brush(),
	        brushDirty,
	        dimension,
	        group,
	        round;

	    function chart(div) {
	      var width = x.range()[1],
	          height = y.range()[0];

	      y.domain([0, group.top(1)[0].value]);

	      div.each(function() {
	        var div = d3.select(this),
	            g = div.select("g");

	        // Create the skeletal chart.
	        if (g.empty()) {
	          div.select(".title").append("a")
	              .attr("href", "javascript:reset(" + id + ")")
	              .attr("class", "reset")
	              .text("reset")
	              .style("display", "none");

	          g = div.append("svg")
	              .attr("width", width + margin.left + margin.right)
	              .attr("height", height + margin.top + margin.bottom)
	            .append("g")
	              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	          g.append("clipPath")
	              .attr("id", "clip-" + id)
	            .append("rect")
	              .attr("width", width)
	              .attr("height", height);

	          g.selectAll(".bar")
	              .data(["background", "foreground"])
	            .enter().append("path")
	              .attr("class", function(d) { return d + " bar"; })
	              .datum(group.all());

	          g.selectAll(".foreground.bar")
	              .attr("clip-path", "url(#clip-" + id + ")");

	          g.append("g")
	              .attr("class", "axis")
	              .attr("transform", "translate(0," + height + ")")
	              .call(axis);

	          // Initialize the brush component with pretty resize handles.
	          var gBrush = g.append("g").attr("class", "brush").call(brush);
	          gBrush.selectAll("rect").attr("height", height);
	          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
	        }

	        // Only redraw the brush if set externally.
	        if (brushDirty) {
	          brushDirty = false;
	          g.selectAll(".brush").call(brush);
	          div.select(".title a").style("display", brush.empty() ? "none" : null);
	          if (brush.empty()) {
	            g.selectAll("#clip-" + id + " rect")
	                .attr("x", 0)
	                .attr("width", width);
	          } else {
	            var extent = brush.extent();
	            g.selectAll("#clip-" + id + " rect")
	                .attr("x", x(extent[0]))
	                .attr("width", x(extent[1]) - x(extent[0]));
	          }
	        }

	        g.selectAll(".bar").attr("d", barPath);
	      });

	      function barPath(groups) {
	        var path = [],
	            i = -1,
	            n = groups.length,
	            d;
	        while (++i < n) {
	          d = groups[i];
	          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
	        }
	        return path.join("");
	      }

	      function resizePath(d) {
	        var e = +(d == "e"),
	            x = e ? 1 : -1,
	            y = height / 3;
	        return "M" + (.5 * x) + "," + y
	            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
	            + "V" + (2 * y - 6)
	            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
	            + "Z"
	            + "M" + (2.5 * x) + "," + (y + 8)
	            + "V" + (2 * y - 8)
	            + "M" + (4.5 * x) + "," + (y + 8)
	            + "V" + (2 * y - 8);
	      }
	    }

	    brush.on("brushstart.chart", function() {
	      var div = d3.select(this.parentNode.parentNode.parentNode);
	      div.select(".title a").style("display", null);
	    });

	    brush.on("brush.chart", function() {
	      var g = d3.select(this.parentNode),
	          extent = brush.extent();
	      if (round) g.select(".brush")
	          .call(brush.extent(extent = extent.map(round)))
	        .selectAll(".resize")
	          .style("display", null);
	      g.select("#clip-" + id + " rect")
	          .attr("x", x(extent[0]))
	          .attr("width", x(extent[1]) - x(extent[0]));
	      dimension.filterRange(extent);
	    });

	    brush.on("brushend.chart", function() {
	      if (brush.empty()) {
	        var div = d3.select(this.parentNode.parentNode.parentNode);
	        div.select(".title a").style("display", "none");
	        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
	        dimension.filterAll();
	      }
	    });

	    chart.margin = function(_) {
	      if (!arguments.length) return margin;
	      margin = _;
	      return chart;
	    };

	    chart.x = function(_) {
	      if (!arguments.length) return x;
	      x = _;
	      axis.scale(x);
	      brush.x(x);
	      return chart;
	    };

	    chart.y = function(_) {
	      if (!arguments.length) return y;
	      y = _;
	      return chart;
	    };

	    chart.dimension = function(_) {
	      if (!arguments.length) return dimension;
	      dimension = _;
	      return chart;
	    };

	    chart.filter = function(_) {
	      if (_) {
	        brush.extent(_);
	        dimension.filterRange(_);
	      } else {
	        brush.clear();
	        dimension.filterAll();
	      }
	      brushDirty = true;
	      return chart;
	    };

	    chart.group = function(_) {
	      if (!arguments.length) return group;
	      group = _;
	      return chart;
	    };

	    chart.round = function(_) {
	      if (!arguments.length) return round;
	      round = _;
	      return chart;
	    };

	    return d3.rebind(chart, brush, "on");
	  }

});
