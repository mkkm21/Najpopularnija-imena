// Podešavanje dimenzija i margina grafika
const margin = {top: 70, right: 250, bottom: 50, left: 50},
    width = 700 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// Dodavanje svg objekta u body sekciju stranice
const svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          `translate(${margin.left}, ${margin.top})`);

// Parsiranje podataka
d3.csv("https://raw.githubusercontent.com/mkkm21/podaci/main/podaci").then( function(data) {


  // List of groups = header of the csv files
  const keys = data.columns.slice(1)

  // color palette
  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(d3.schemeSet2);

  //stack the data?
  const stackedData = d3.stack()
    .keys(keys)
    (data)


  // Dodavanje x ose
  const x = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.year; }))
    .range([ 0, width ]);
  const xAxis = svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).ticks(5))

  // Dodavanje naziva na x osi
  svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height+40 )
      .text("Godina");

  // Dodavanje naziva na y osi
  svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", 0)
      .attr("y", -20 )
      .text("Br. rođenih")
      .attr("text-anchor", "start")

  // Dodavanje y ose
  const y = d3.scaleLinear()
    .domain([0, 200000])
    .range([ height, 0 ]);
  svg.append("g")
    .call(d3.axisLeft(y).ticks(5))


  // Dodavanje clipPath: van ove oblasti neće biti nacrtano
  const clip = svg.append("defs").append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("width", width )
      .attr("height", height )
      .attr("x", 0)
      .attr("y", 0);

  // Dodavanje brushing-a
  const brush = d3.brushX()                 // Dodavanje brush opcije koristeći d3.brush funkciju
      .extent( [ [0,0], [width,height] ] ) // inicijalizacija brush oblasti: početak od 0,0 i kraj do širine, visine: to znači da je selektovana cela površina grafika
      .on("end", updateChart) // Svaki put kad je brush selekcija izmenjena, upotrebi 'updateChart' funkciju

  // Kreiraj "scatter" promenljivu: Gde su zajedno nalaze i kružići i brush
  const areaChart = svg.append('g')
    .attr("clip-path", "url(#clip)")

  // Pravljenje površine
  const area = d3.area()
    .x(function(d) { return x(d.data.year); })
    .y0(function(d) { return y(d[0]); })
    .y1(function(d) { return y(d[1]); })

  // Prikaz površina
  areaChart
    .selectAll("mylayers")
    .data(stackedData)
    .join("path")
      .attr("class", function(d) { return "myArea " + d.key })
      .style("fill", function(d) { return color(d.key); })
      .attr("d", area)

  // Dodavanje brushing-a
  areaChart
    .append("g")
      .attr("class", "brush")
      .call(brush);

  let idleTimeout
  function idled() { idleTimeout = null; }

  // Funkcija koja osvežava prikaz grafika nakon zadatih granica
  function updateChart(event,d) {

    extent = event.selection

    // Ako nije selektovano, vrati se u početne koordinate. Suprotno, osveži domen x ose.
    if(!extent){
      if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // Omogućava da sačekamo malo.
      x.domain(d3.extent(data, function(d) { return d.year; }))
    }else{
      x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
      areaChart.select(".brush").call(brush.move, null) // Ovo omogućava uklanjanje sivog brush-a čim je selektovan deo grafika.
    }

    // Osvežava osu i položaj na površini
    xAxis.transition().duration(1000).call(d3.axisBottom(x).ticks(5))
    areaChart
      .selectAll("path")
      .transition().duration(1000)
      .attr("d", area)
    }


    // Ponašanje grafika kad se pređe mišem preko neke grupe
    const highlight = function(event,d){
      // smanjuje jačinu boje ostalih grupa
      d3.selectAll(".myArea").style("opacity", .1)
      // prikaz grupe nad kojom je miš trenutno
      d3.select("."+d).style("opacity", 1)
    }

    // Prikaz kad se miš pomeri, vraća u normalan režim
    const noHighlight = function(event,d){
      d3.selectAll(".myArea").style("opacity", 1)
    }


    // Dodaj po jednu tačku za svako ime u legendi.
    const size = 20
    svg.selectAll("myrect")
      .data(keys)
      .join("rect")
        .attr("x", 400)
        .attr("y", function(d,i){ return 10 + i*(size+5)}) // Prva tačka se pojavljuje na 100. Razmak između svake tačke iznosi 25.
        .attr("width", size)
        .attr("height", size)
        .style("fill", function(d){ return color(d)})
        .on("mouseover", highlight)
        .on("mouseleave", noHighlight)

    // Dodaj po jednu tačku za svako ime u legendi
    svg.selectAll("mylabels")
      .data(keys)
      .join("text")
        .attr("x", 400 + size*1.2)
        .attr("y", function(d,i){ return 10 + i*(size+5) + (size/2)}) // Prva tačka se pojavljuje na 100. Razmak između svake tačke iznosi 25.
        .style("fill", function(d){ return color(d)})
        .text(function(d){ return d})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .on("mouseover", highlight)
        .on("mouseleave", noHighlight)

})
