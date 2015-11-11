var xScale = null,
    fundsScale = null,
    priceScale = null;

var area = null,
    line = null,
    cs = null,
    ch = null;

var candlestickComponent = function () {
    var isUpDay = function(d) {
        return d.close > d.open;
    };

    var isDownDay = function (d) {
        return d.open > d.close;
    };

    var line = d3.svg.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; });

    var highLowLines = function (bars) {
        var paths = bars.selectAll('.high-low-line').data(function (d) { return [d]; });
        paths.enter().append('path');
        paths.classed('high-low-line', true)
            .attr('d', function (d) {
                return line([
                    { x: xScale(d.day), y: priceScale(d.high) },
                    { x: xScale(d.day), y: priceScale(d.low) }
                ]);
            });
    };

    var rectangles = function (bars) {
        var rectangleWidth = 2;
        var rect = bars.selectAll('rect').data(function (d) { return [d]; });
        rect.enter().append('rect');
        rect.attr('x', function (d) { return xScale(d.day) - rectangleWidth; })
            .attr('y', function (d) { return priceScale(isUpDay(d) ? d.close : d.open); })
            .attr('width', rectangleWidth * 2)
            .attr('height', function (d) { return Math.abs(priceScale(d.open) - priceScale(d.close)) });
    };

    return function (selection) {
        var series, bars;
        selection.each(function (data) {
            series = d3.select(this).selectAll('.candlestick-series').data([data]);
            series.enter().append('g').classed('candlestick-series', true);
            bars = series.selectAll('.bar').data(data, function (d) { return d.day; });
            bars.enter().append('g').classed('bar', true);
            bars.classed({'up-day': isUpDay, 'down-day': isDownDay});
            highLowLines(bars);
            rectangles(bars);
            bars.exit().remove();
        });
    }
};

var crosshairsComponent = function () {
    var target = null,
        series = null,
        highlight = null,
        frozen = false;

    var root = null,
        lineH = null,
        lineV = null,
        circle = null,
        calloutH = null,
        calloutV = null;

    var crosshairs = function () {
        root = target.append('g')
            .attr('class', 'crosshairs')
            .attr('display', 'none');
        lineH = root.append("line")
            .attr('x1', xScale.range()[0])
            .attr('x2', xScale.range()[1]);
        lineV = root.append("line")
            .attr('y1', fundsScale.range()[0])
            .attr('y2', fundsScale.range()[1]);
        circle = root.append("circle")
            .attr('r', 6);
        calloutH = root.append("text")
            .attr('x', xScale.range()[1]);
        calloutV = root.append("text")
            .attr('y', '1em');
    };

    function mousemove() {
        if (!frozen) {
            var xMouse = xScale.invert(d3.mouse(this)[0]);
            var nearest = findNearest(xMouse);
            if (nearest !== null) {
                if (nearest !== highlight) {
                    highlight = nearest;
                    var x = xScale(highlight.day);
                    var y = fundsScale(highlight.funds);
                    lineH.attr('y1', y).attr('y2', y);
                    lineV.attr('x1', x).attr('x2', x);
                    circle.attr('cx', x).attr('cy', y);
                    calloutH.attr('y', y - 3).text(highlight.funds);
                    calloutV.attr('x', x - 3).text(highlight.day);
                    root.attr('display', 'inherit');
                    setHighlightText(highlight);
                }
            } else {
                setHighlightText(null);
            }
        }
    }

    function mouseout() {
        if (!frozen) {
            highlight = null;
            root.attr('display', 'none');
            setHighlightText(null);
        }
    }

    function click() {
        frozen = !frozen;
        root.classed('frozen', frozen);
    }

    function findNearest(xMouse) {
        var nearest = null;
        var dx = Number.MAX_VALUE;
        series.forEach(function(data) {
            var xDiff = Math.abs(xMouse - data.day);
            if (xDiff < dx) {
                dx = xDiff;
                nearest = data;
            }
        });
        return nearest;
    }

    crosshairs.clear = function() {
        root.attr('display', 'none');
        frozen = false;
        root.classed('frozen', false);
        highlight = null;
        setHighlightText(null);
    };

    crosshairs.target = function (value) {
        target = value;
        target.on('mousemove.crosshairs', mousemove);
        target.on('mouseout.crosshairs', mouseout);
        target.on('click.crosshairs', click);
        return crosshairs;
    };

    crosshairs.series = function (value) {
        series = value;
        return crosshairs;
    };

    return crosshairs;
};

function buildPage() {
    // Calculate total funds
    var totalFunds = 0;
    companies.forEach(function(company) {
        totalFunds += company.funds
    });

    // Build the header
    var overview = d3.select('.overview');
    var summary = overview.append('div').attr('class', 'header').text(teamName);
    summary.append('span').attr('class', 'right').text('£' + totalFunds);
    overview.append('hr');

    // Add each company
    var maxFunds = d3.max(companies, function(d) {return d.funds;});
    companies.forEach(function(company) {
        var index = companies.indexOf(company);
        var width = company.funds / maxFunds * 100;
        var comp = overview.append('div')
            .attr('class', 'company')
            .attr('onClick', 'updateChart(' + index + ');');
        comp.append('div')
            .attr('class', 'name')
            .text(company.name);
        comp.append('div')
            .attr('class', 'bar')
            .style('width', '75%')
            .append('div')
            .attr('class', 'inner')
            .style('width', width + '%');
        comp.append('div')
            .attr('class', 'value')
            .text('£' + company.funds);
    });

    // Calculate chart dimensions
    var fullWidth = 900, fullHeight = 250;
    var margin = { left: 10, right: 10, top: 0, bottom: 20 };
    var plotWidth = fullWidth - margin.left - margin.right;
    var plotHeight = fullHeight - margin.top - margin.bottom;

    // Set up scales
    var extent = calculateExtent();
    xScale = d3.scale.linear().range([0, plotWidth]).domain([extent.minX, extent.maxX]);
    fundsScale = d3.scale.linear().range([plotHeight, 0]).domain([extent.minFunds, extent.maxFunds]);
    priceScale = d3.scale.linear().range([plotHeight, plotHeight * 0.4]).domain([extent.minPrice, extent.maxPrice]);

    // Build the header
    var details = d3.select('.details');
    var header = details.append('div').attr('class', 'header');
    header.append('span').attr('class', 'company-name').text('Company');
    header.append('span').attr('class', 'company-value right').text('0');
    header.append('hr');

    // Build the chart
    var chart = details.append('div').attr('class', 'chart');
    var svg = chart.append('svg').attr('width', fullWidth).attr('height', fullHeight);
    var plot = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    var xAxis = d3.svg.axis().scale(xScale).orient('bottom');
    plot.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + plotHeight + ')').call(xAxis);
    chart.append('div').attr('class', 'highlight');

    // Set up placeholder data
    var initialData = [];
    for (var day = extent.minX; day <= extent.maxX; ++day) {
        initialData.push({'day': day, 'funds': 0, 'open': 0, 'high': 0, 'low': 0, 'close': 0});
    }

    // Add chart
    area = d3.svg.area()
        .x(function(d) { return xScale(d.day); })
        .y0(plotHeight)
        .y1(function(d) { return fundsScale(d.funds); });
    line = d3.svg.line()
        .x(function(d) { return xScale(d.day); })
        .y(function(d) { return fundsScale(d.funds); });
    plot.append('path').datum(initialData).attr('class', 'chart-area').attr('d', area);
    plot.append('path').datum(initialData).attr('class', 'chart-line').attr('d', line);

    // Add candlesticks
    cs = candlestickComponent();
    plot.append('g').attr('class', 'candlestick').datum(initialData).call(cs);

    // Add crosshairs
    ch = crosshairsComponent().target(plot).series(initialData);
    var overlay = d3.svg.area().x(function (d) { return xScale(d.day); }).y0(0).y1(plotHeight);
    plot.append('path').attr('class', 'overlay').attr('d', overlay(initialData)).call(ch);
}

function updateChart(index) {
    var company = companies[index];
    d3.select('.company-name').text(company.name);
    d3.select('.company-value').text('£' + company.funds);
    d3.select('.chart-area').datum(company.data).transition().attr('d', area);
    d3.select('.chart-line').datum(company.data).transition().attr('d', line);
    d3.select('.candlestick').datum(company.data).call(cs);
    ch.series(company.data).clear();
}

function calculateExtent() {
    var minX = d3.min(companies, function(company) { return d3.min(company.data, function(d) { return d.day; }); });
    var maxX = d3.max(companies, function(company) { return d3.max(company.data, function(d) { return d.day; }); });
    var minFunds = d3.min(companies, function(company) { return d3.min(company.data, function(d) { return d.funds; }); });
    var maxFunds = d3.max(companies, function(company) { return d3.max(company.data, function(d) { return d.funds; }); });
    var minPrice = d3.min(companies, function(company) { return d3.min(company.data, function(d) { return d.low; }); });
    var maxPrice = d3.max(companies, function(company) { return d3.max(company.data, function(d) { return d.high; }); });
    return {
        minX: minX,
        maxX: maxX,
        minFunds: Math.min(0, minFunds * 0.9),
        maxFunds: maxFunds * 1.1,
        minPrice: minPrice * 0.9,
        maxPrice: maxPrice * 1.1
    };
}

function setHighlightText(data) {
    if (data) {
        var day = 'day ' + data.day;
        var ohlc = 'open ' + data.open + ' high ' + data.high + ' low ' + data.low + ' close ' + data.close;
        var funds = 'funds ' + data.funds;
        d3.select('.highlight').text(day + ' | ' + ohlc + ' | ' + funds);
    } else {
        var highlightText = 'click to see price details';
        d3.select('.highlight').text(highlightText);
    }
}
