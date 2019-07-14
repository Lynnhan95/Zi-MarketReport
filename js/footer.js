footerdiv = d3.select('.footer')
//append footer to canvas/ g2
const footer = footerdiv.append('div')
                     .attr("class","footer")
var titleMargin = {top : 25}
footer.attr("width",750)
     .attr("height",70)


d3.json("../data/content.json", function(data) {
  var html = "<b>" +data[2].content+ "</b>" + "<span>" + data[3].content +"</span>" +
  "<br/>" + 
  "<span>" +data[4].content+ "</span>"
  footer.html(html)
    
});


