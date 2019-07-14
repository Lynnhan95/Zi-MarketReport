
d3.csv('./data/zhviLevelYoY.csv', function(error, data) {
    // format parser
    var parseDate = d3.timeParse("%m/%d/%Y")
    var formatDate = d3.timeFormat("%B %Y")
    var formatYear = d3.timeFormat("%Y")
    // create dropdowns and labels
    var selected1 ="United States"

    var viewOption = ["ZHVI", "ZHVI Tiers", "ZHVI YoY"]
    var selected2 = {
        'median': {column: 'median'}
    }
    d3.select("#label1 span").text("Select Region").attr("class","label")
    d3.select("#label2 span").text("Select View").attr("class","label")
    var allGroup = d3.map(data, function(d){return(d.metro)}).keys()
    d3.select("#selectButton")
    .selectAll('myOptions')
       .data(allGroup)
    .enter()
      .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; })
    d3.select("#selectButton2")
    .selectAll('myOptions')
    .data(viewOption)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; })
    //data processing
    data.forEach(function (d) {
        d.year = parseDate(d.year);
        d.median = +d.median;
        d.top = +d.top;
        d.bottom = +d.bottom;
    });
    data.sort(function(a, b) {
        return a.date - b.date;
    });
    //once a dropdown being selected
    function checked1(){
        selected1 = $(this).val()
        finalize(selected1, selected2)
       $(".regionName").html(selected1)
       getLatest(nested)
       $(".latestVal").html("$" + d3.format(",")(latestVal))
        return selected1,latestVal
    }
    function checked2(){
        var option2= $(this).val()
        if(option2 == "ZHVI"){
            selected2 = {
                'median': {column: 'median'}
            }
            finalize(selected1,selected2)
        }else if(option2 == "ZHVI Tiers"){
            selected2 = {
                'median': {column: 'median'},
                'top' : {column: 'top'},
                'bottom': {column:'bottom'}
            }
            finalize(selected1,selected2)
        }else if(option2 == "ZHVI YoY"){
            selected2 = {
                'median': {column: 'median-YoY'},
                'top': {column: 'top-YoY'},
                'bottom': {column: 'bottom-YoY'}
            }
            finalize(selected1,selected2)
        }
        return selected2
    }
    $('#selectButton').select2().on("select2:select", checked1)
    $('#selectButton2').select2().on("select2:select", checked2)
    $('#selectButton2').select2({
        minimumResultsForSearch: -1
    });
    //create chart according to dropdown selection
    var chart = null
    function finalize(selected1, selected2){
        chart = makeLineChart(data.filter(function(d){return d.metro==selected1}), 'year', selected2, {xAxis: 'Years', yAxis: 'Amount'});
        chart.bind(returnCanvas());
        chart.render();
        return chart
    }
    function initialize(){
        chart = makeLineChart(data.filter(function(d){return d.metro=="United States"}), 'year', {
            'median': {column: 'median'}
        }, {xAxis: 'Years', yAxis: 'Amount'});
        chart.bind(returnCanvas());
        chart.render();
        return chart
    }
    initialize()

// draw line chart function
function makeLineChart(dataset, xName, yObjs, axisLables) {
    var chartObj = {};
    function transition(path) {
        path.transition().duration(1000).attrTween("stroke-dasharray", tweenDash);
    }
    function tweenDash() {
        var l = this.getTotalLength(), i = d3.interpolateString("0," + l, l + "," + l);
        return function (t) { return i(t); };
    }
    function selfColor(y){
        if(y == "top"){return "#08C24E"}else if(y == "median"){return "#006AFF"}else if(y == "bottom"){return "#001751"}else{return null}
    }
    // chartObj configuration
    chartObj.xAxisLable = axisLables.xAxis;
    chartObj.yAxisLable = axisLables.yAxis;
    //dealt with null data
    for(var key in dataset){
        var obj = dataset[key]
        for(var key2 in obj){
            if(obj[key2]=="" || obj[key2]=="0"){obj[key2] = null}
        }
    }
    chartObj.data = dataset
    chartObj.size = {width:800, height:700}
    chartObj.margin = {top: 15, right: 60, bottom: 130, left: 75};
    chartObj.width = chartObj.size.width - chartObj.margin.left - chartObj.margin.right;
    chartObj.height = chartObj.size.height - chartObj.margin.top - chartObj.margin.bottom;
    chartObj.xFunct = function(d){ return d[xName]};

// for each yObjs argument, create a yFunction
    function getYFn(column) {
        return function (d) {
            return d[column];
        };
    }
    chartObj.yFuncts = [];
    for (var y  in yObjs) {
        yObjs[y].name = y;
        yObjs[y].yFunct = getYFn(yObjs[y].column);
        chartObj.yFuncts.push(yObjs[y].yFunct);
    }

// formatter functions for the axes
    chartObj.xFormatter = d3.format(".0f")
    chartObj.bisectYear = d3.bisector(chartObj.xFunct).left; //can be overridden in definition

// axis configuration
    chartObj.chartPadding = {x:30}
    chartObj.xScale = d3.scaleTime().range([0, chartObj.width]).domain(d3.extent(chartObj.data, chartObj.xFunct)); //< Can be overridden in definition
    chartObj.max = function (fn) {
            return d3.max(chartObj.data, fn);
    };
    var maxY = d3.max(chartObj.yFuncts.map(chartObj.max));
    function getMinY(arr){
        let minY = null
        for(let i=0; i<arr.length; i++){
            let object = arr[i]
            for(let key in object){let current = parseFloat(object[key])
                if(current< minY){minY = current}
            }
        }
        return minY
    }

    if(maxY > 700000){
        tickCount = 8
        maxDomain = Math.ceil(maxY/ 100000) * 100000
        chartObj.yScale = d3.scaleLinear().range([chartObj.height, 0]).domain([0, maxDomain]);
    }else if(maxY >10){
        tickCount = 4
        maxDomain = Math.ceil(maxY/ 100000) * 100000
        chartObj.yScale = d3.scaleLinear().range([chartObj.height, 0]).domain([0, maxDomain]);

    }else if(maxY < 10){
        maxDomain = Math.ceil(maxY*15)/15
        minDomain = Math.floor(getMinY(chartObj.data)*15)/15
        chartObj.yScale = d3.scaleLinear().range([chartObj.height, 0]).domain([minDomain , maxDomain ]);
    }
    chartObj.formatAsYear = d3.format("");

// build line building functions
    function getYScaleFn(yObj) {
        if(chartObj.yScale){
            return function (d) {
                return chartObj.yScale(yObjs[yObj].yFunct(d));
            };
        }
    }
    for (var yObj in yObjs) {
        yObjs[yObj].line = d3.line().defined(
            function(d){  
                if(yObjs[y].yFunct(d) !== null){console.log(yObjs[y].yFunct(d));return yObjs[y].yFunct(d) }
                else{console.log(yObjs[y].yFunct(d));}
            }
        )
        .x(function (d) {return chartObj.xScale(chartObj.xFunct(d));})
        .y(getYScaleFn(yObj)).curve(d3.curveCardinal)
    }  
    chartObj.svg;

// resize on window size change
    chartObj.update_svg_size = function () {     
        chartObj.width = parseInt(chartObj.chartDiv.style("width"), 10) - (chartObj.margin.left + chartObj.margin.right);
        chartObj.height = parseInt(chartObj.chartDiv.style("height"), 10) - (chartObj.margin.top + chartObj.margin.bottom);
        chartObj.xAxis = d3.axisTop().scale(chartObj.xScale).tickFormat(formatYear).tickPadding(-30).tickSize(-5).ticks(8); //< Can be overridden in definition
        if(maxY > 10){
            chartObj.yAxis = d3.axisLeft().scale(chartObj.yScale).tickFormat(function(d) { return "$" + parseInt(d / 1000) + "K"; }).tickPadding(10).tickSizeInner(-chartObj.width).ticks(tickCount); //< Can be overridden in definition
        }else{
            chartObj.yAxis = d3.axisLeft().scale(chartObj.yScale).tickFormat(function(d) { return d3.format(",.0%")(d)}).tickPadding(10).tickSizeInner(-chartObj.width).ticks(tickCount); //< Can be overridden in definition
        }
        /* update the range of the scale with new width/height */
        chartObj.xScale.range([chartObj.chartPadding.x, chartObj.width - chartObj.chartPadding.x]);
        if(chartObj.yScale){
            chartObj.yScale.range([chartObj.height, 0]);
        }
        if (!chartObj.svg) {return false;}
        chartObj.svg.select('.x.axis').attr("transform", "translate(0," + chartObj.height + ")").call(chartObj.xAxis);
        chartObj.svg.select('.x.axis .label').attr("x", chartObj.width / 2);
        chartObj.svg.select('.y.axis .tick line').attr("x2", chartObj.width)
        chartObj.svg.select('.y.axis').call(chartObj.yAxis);
        /* force d3 to recalculate and update the line */
        for (var yObj in yObjs) {
            yObjs[yObj].line = d3.line().defined(
                function(d){  
                    if(yObjs[y].yFunct(d) !== null){console.log(yObjs[y].yFunct(d));return yObjs[y].yFunct(d) }
                    else{console.log(yObjs[y].yFunct(d));}
                }
            )
            .x(function (d) {return chartObj.xScale(chartObj.xFunct(d));})
            .y(getYScaleFn(yObj)).curve(d3.curveCardinal)
        }  
        for (var y  in yObjs) {
            yObjs[y].path.attr("d", yObjs[y].line).call(transition)
        }
        d3.selectAll(".focus.line").attr("y2", chartObj.height);
        d3.selectAll(".y.axis .tick line").attr("x2", chartObj.width)
        chartObj.chartDiv.select('svg').attr("width", chartObj.width + (chartObj.margin.left + chartObj.margin.right)).attr("height", chartObj.height + (chartObj.margin.top + chartObj.margin.bottom));                
        chartObj.svg.select(".overlay").attr("width", chartObj.width).attr("height", chartObj.height);
        return chartObj;
    };

    chartObj.bind = function (selector) {
        chartObj.mainDiv = d3.select(selector);
        // Add all the divs to make it centered and responsive
        d3.select(".inner-wrapper").remove()
        chartObj.mainDiv.append("div").attr("class", "inner-wrapper").append("div").attr("class", "outer-box").append("div").attr("class", "inner-box");
        chartSelector = selector + " .inner-box";
        chartObj.chartDiv = d3.select(chartSelector);
        d3.select(window).on('resize.' + chartSelector, chartObj.update_svg_size);
        chartObj.update_svg_size();
        return chartObj;
    };

// Render the chart
    chartObj.render = function () {
        //Create SVG element
        d3.select('.chart-area').remove()
        chartObj.svg = chartObj.chartDiv.append("svg").attr("class", "chart-area").attr("width", chartObj.width + (chartObj.margin.left + chartObj.margin.right)).attr("height", chartObj.height + (chartObj.margin.top + chartObj.margin.bottom)).append("g").attr("transform", "translate(" + chartObj.margin.left + "," + chartObj.margin.top + ")");
        // Draw Axis
        chartObj.svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + chartObj.height + ")").call(chartObj.xAxis).append("text").attr("class", "label").attr("x", chartObj.width / 2).attr("y", 30).style("text-anchor", "middle").text(chartObj.xAxisLable)
        if(chartObj.yScale){
            chartObj.svg.append("g").attr("class", "y axis").transition().delay(200).call(chartObj.yAxis)
        }
        d3.select(".y").append("text").attr("class", "label").attr("transform", "rotate(-90)").attr("y", -42).attr("x", -chartObj.height / 2).attr("dy", ".71em").style("text-anchor", "middle").text(chartObj.yAxisLable)
        for (var yObj in yObjs) {
            yObjs[yObj].line = d3.line().defined(
                function(d){  
                    if(yObjs[y].yFunct(d) !== null){return yObjs[y].yFunct(d) }
                    else{}
                }
            )
            .x(function (d) {return chartObj.xScale(chartObj.xFunct(d));})
            .y(getYScaleFn(yObj)).curve(d3.curveCardinal)
        }    
        // Draw Lines
        if(chartObj.yScale){
            for (var y  in yObjs) {
                yObjs[y].path = chartObj.svg.append("path").datum(chartObj.data).attr("class", "line").attr("d", yObjs[y].line).style("stroke", selfColor(y)).attr("data-series", y).call(transition).on("mouseover", function () {
                }).on("mouseout", function () {
                    focus.transition().delay(700).style("display", "none");
                }).on("mousemove", mousemove);
            }
        }
        //Draw focus(rect/ circle/ focus line)
        if(chartObj.yScale){
            var focus = chartObj.svg.append("g").attr("class", "focus").attr("display","none")
        }
        // Focus line
        if(chartObj.yScale){
            focus.append("line").attr("class", "focus line").attr("y1", 0).attr("y2", chartObj.height);
            var count = 0
            for(let y in yObjs){
                count++
            }
            for (let y  in yObjs) {
                var rectSize = null
                var rectPos = null
                var title = null
                if(count == 1){rectSize = {width:240, height:120};rectPos = {x:8, y:10};title = {y:-90}}
                else if(count == 3){rectSize = {width:240, height:185};rectPos = {x:8, y:-5}}
                if(y == "median"){
                    yObjs[y].tooltip1 = focus.append("g").attr("class","toptooltip")
                    yObjs[y].tooltip1.append("rect").attr("class","tooltip").attr("x", rectPos.x).attr("y",rectPos.y).attr("width", rectSize.width).attr("height", rectSize.height)
                    focus.append("defs")
                    .append("filter")
                    .attr("id","shadow")
                    .append("feDropShadow")
                    .attr("dx","1")
                    .attr("dy","1")
                    .attr("stdDeviation","0.5")
                    .attr("flood-opacity","0.5")
                    var tspanArea = yObjs[y].tooltip1.append("text").attr("x", 9).attr("dy", ".35em").attr("class","text")
                    tspanArea.append("tspan").attr("class", "box1")
                }else{
                    yObjs[y].tooltip1 = focus.append("g");
                    d3.selectAll(".text").append("tspan").attr("class", "box2")
                    d3.selectAll(".text").append("tspan").attr("class", "box3")
                }
                d3.selectAll(".text").append("tspan").attr("class", "box0")
                yObjs[y].tooltip2 = focus.append("g")
                yObjs[y].tooltip2.append("circle").attr("r", 4).attr("fill",selfColor(y)).attr("class",y+"-circle")
            }
            // overlay rect to capture hover
            chartObj.svg.append("rect").attr("class", "overlay").attr("width", chartObj.width).attr("height", chartObj.height)
            .on("mouseover", function () {focus.style("display", "none");})
            .on("mouseout", function () {focus.style("display", "none");})
            .on("mousemove", mousemove);
            return chartObj;
        }
  
        function mousemove() {
            function formatCurrency(num){ 
                if(num == null){return null}
                if(maxY > 10){return "$" + d3.format(",")(num); 
                }else{return d3.format(",.1%")(num)}
            }
            focus.style("display", "block");
            var x0 = chartObj.xScale.invert(d3.mouse(this)[0]), i = chartObj.bisectYear(dataset, x0, 1), d0 = chartObj.data[i - 1], d1 = chartObj.data[i];
            try {
                var d = x0 - chartObj.xFunct(d0) > chartObj.xFunct(d1) - x0 ? d1 : d0;
            } catch (e) { return;}

            tooltipHeight = chartObj.height;
            var arr = [];
            var xPostion = d3.mouse(this)[0]
            var yPosition = d3.mouse(this)[1]
            if(chartObj.yScale){
                for (var y  in yObjs) {
                    var translateSize = {x:chartObj.xScale(chartObj.xFunct(d)), y: chartObj.yScale(yObjs[y].yFunct(d))}
                    if(xPostion > 400){translateSize.x = translateSize.x - 258
                    }else{translateSize.x = translateSize.x}
                    if(yPosition < 200){translateSize.y = translateSize.y + 100}
                    else{translateSize.y = translateSize.y + 50}
                    yObjs[y].tooltip1.attr("transform", "translate(" + translateSize.x + "," + (translateSize.y -100)+ ")");
                    yObjs[y].tooltip2.attr("transform", "translate(" + chartObj.xScale(chartObj.xFunct(d)) + "," + chartObj.yScale(yObjs[y].yFunct(d)) + ")");
                    arr.push(yObjs[y].yFunct(d))
                    tooltipHeight = Math.min(tooltipHeight, chartObj.yScale(yObjs[y].yFunct(d)));
                }
            }

            var titlePos = null
            if(count ==1){titlePos = {y1:70}}else if(count ==3){titlePos = {y1:20}}
            if(arr[0] == null && arr[1] == null && arr[2] == null){
                d3.select(".toptooltip").attr("display","none")
                d3.selectAll(".focus circle").attr("display","none")
                focus.select(".focus.line").attr("display","none")
            }else{
                d3.select(".toptooltip").attr("display","block")
                d3.selectAll(".focus circle").attr("display","block")
                focus.select(".focus.line").attr("display","block")
                if(arr[0] == null){d3.selectAll(".median-circle").attr("display","none")}else{d3.selectAll(".median-circle").attr("display","block")}
                if(arr[1] == null){d3.selectAll(".top-circle").attr("display","none")}else{d3.selectAll(".top-circle").attr("display","block")}
                if(arr[2] == null){d3.selectAll(".bottom-circle").attr("display","none")}else{d3.selectAll(".top-circle").attr("display","block")}
            }

            d3.select(".toptooltip").select(".box0").attr("x", 40).attr("y",titlePos.y1).text(formatDate(chartObj.xFormatter(chartObj.xFunct(d))) ).append("tspan").text("Zillow Home Value Index").attr("class","tooltipTitle").attr("x",40).attr("y", 45)
            if(count ==3){
                d3.select(".toptooltip").select(".box1").attr("x", 40).attr("y",120).text(formatCurrency(arr[0])).append("tspan").text("Middle Third:").attr("class","tooltipSubtitle").attr("x",40).attr("y",110)
            }else if(count ==1){
                d3.select(".toptooltip").select(".box1").attr("x", 40).attr("y",90).text(formatCurrency(arr[0])).append("tspan").attr("class","singleVal")   
            }
            d3.select(".toptooltip").select(".box2").attr("x", 40).attr("y",90).text(formatCurrency(arr[1])).append("tspan").text("Top Third:").attr("class","tooltipSubtitle").attr("x",40).attr("y",75)
            d3.select(".toptooltip").select(".box3").attr("x", 40).attr("y",160).text(formatCurrency(arr[2])).append("tspan").text("Bottom Third:").attr("class","tooltipSubtitle").attr("x",40).attr("y",145)
            focus.select(".focus.line").attr("transform", "translate(" + chartObj.xScale(chartObj.xFunct(d)) + ")").attr("y1", tooltipHeight);
        }
    };
    return chartObj;
}

//append footer to canvas/ g2
var nested = d3.nest().key(function(d){return d.metro}).entries(data)
function getLatest(nested){
    var nestedLength = null
    for(let i=0; i<nested.length; i++){
        if(nested[i].key == selected1){
            nestedLength = nested[i].values.length
            latestVal = nested[i].values[nestedLength-1]["median"]
        }
    }
}
getLatest(nested)
titlediv = d3.select('.title')
footerdiv = d3.select('.footer')

const title = titlediv
                     .attr("class","title")
var headline = title.append("div")
                    .attr("class","headline")
var subtitle = title.append("div")
                    .attr("class","subtitle") 
var titleMargin = {top : 25}
title.attr("width",750)
     .attr("height",70)

const footer = footerdiv
                     .attr("class","footer")
var titleMargin = {top : 25}
footer.attr("width",750)
     .attr("height",40)
d3.json("./data/content.json", function(data) {
    var html1 = "<b>" + data[0].content + "</b>"
    headline.html(html1)
    var html2 = data[1].content + '<span class="regionName">'+selected1+'</span>' + data[2].content + '<span class="latestVal">'+"$"+ d3.format(",")(latestVal)+'</span>'
    subtitle.html(html2)

  var htmlFooter = "<b>" +data[3].content+ "</b>" + "<span>" + data[4].content +"</span>" 
  footer.html(htmlFooter)
});

function returnCanvas() {return ".canvas"}


    
});