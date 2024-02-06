function finalProject() {

  let dataFilePath = 'data.csv';
  let jsonFilePath = 'graph_data.json';
  let geoJsonFilePath = 'india_state.geojson';

  visualization0(dataFilePath, jsonFilePath, geoJsonFilePath);
}

let visualization0=function(dataPath, jsonPath, geoJsonFilePath) {

  // preprocess data
  d3.csv(dataPath).then(function(data) {
    console.log(data);
    visualization1(data);

    const geoJsonPromise = d3.json(geoJsonFilePath);
    geoJsonPromise.then(function(geoJsonData) {
      console.log(geoJsonData);
      visualization3(data, geoJsonData);
    })
  })

  const jsonPromise = d3.json(jsonPath);
  jsonPromise.then(function(jsonData) {
    console.log(jsonData)
    visualization2(jsonData);
  });
}

let visualization1=function(data) {

  const hoursInADay = 24;

  // Aggregate flight counts
  const flightsByDepHour = d3.rollup(
    data,
    group => group.length,
    d => d.dep_hour
  );

  const flightsByArrHour = d3.rollup(
    data,
    group => group.length,
    d => d.arr_hour
  );
  
  // Get hours 0-23
  const hours = Array.from(flightsByDepHour.keys());
  
  // Groups flight data together
  const flightData = hours.map(hour => ({
    hour: hour,
    departureFlights: flightsByDepHour.get(hour) || 0,
    arrivalFlights: flightsByArrHour.get(hour) || 0
  }));

  // Puts hours in ascending order
  flightData.sort((a, b) => a.hour - b.hour);
  
  // Define margins and dimensions
  const margin = { top: 30, right: 30, bottom: 70, left: 70 };
  const width = 700 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  const padding = 5000;
  
  // Define SVG
  const svg = d3.select("#vis1_plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
      
  // Define background gradient
  const gradient = svg.append("linearGradient")
    .attr("id", "background-gradient")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", width)
    .attr("y2", 0);
      
  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "lightblue");
      
  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "darkblue");
      
  svg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "url(#background-gradient)");
  
  // Define x-axis scale
  const x = d3.scaleBand()
    .domain(Array.from(Array(hoursInADay).keys()).map(hour => hour.toString()))
    .range([0, width]);
  
  // Define y-axis scale
  const y = d3.scaleLinear()
    .domain([0, d3.max(flightData, d => d.departureFlights + d.arrivalFlights)])
    .range([height, 0]);

  // Define line scale
  const lineScale = d3.scaleLinear()
    .domain([0, d3.max(flightData, d => d.departureFlights + d.arrivalFlights) + padding])
    .range([height, 0]);
  
  // Define line
  const line = d3.line()
    .x(d => x(d.hour) + x.bandwidth() / 2)
    .y(d => lineScale(d.departureFlights + d.arrivalFlights))
    .curve(d3.curveMonotoneX);
      
  // Define the time format
  const timeFormat = d3.timeFormat("%I:%M %p");
      
  // Format the x-axis tick labels
  const xAxis = d3.axisBottom(x).tickFormat(hour => timeFormat(new Date(`2023-06-11 ${hour}:00:00`)).replace(/^0+/, ''));
  
  // Append x-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-45)");
  
  // Append y-axis
  svg.append("g").call(d3.axisLeft(y));

  // Append x-axis axis label
  svg.append("text")
    .attr("class", "x-axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 5)
    .attr("text-anchor", "middle")
    .style("fill", "black")
    .text("Time");

  // Append y-axis axis label
  svg.append("text")
    .attr("class", "y-axis-label")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .style("fill", "black")
    .text("Number of Flights");

  // Define tooltip
  const tooltip = d3.select("#vis1_plot")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
  
  // Append departure bars
  svg.selectAll(".departure-bar")
    .data(flightData)
    .enter()
    .append("rect")
    .attr("class", "departure-bar")
    .attr("x", d => x(d.hour))
    .attr("y", height)
    .attr("width", x.bandwidth())
    .attr("height", 0) // 0 so that it shows that cool transition when you refresh page
    .style("opacity", 0)
    .attr("fill", "orange")
    .style("display", "none")
    .on("mouseover", (event, d) => {

      const showDeparture = departureCheckbox.property("checked");
      const showArrival = arrivalCheckbox.property("checked");

      if (!showArrival && showDeparture) {
        d3.select(event.currentTarget)
          .style("fill", "darkorange")
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip
          .html(`Flights: ${d.departureFlights}`)
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 28 + "px");
      }
    })
    .on("mouseout", (event) => {
      d3.select(event.currentTarget)
      .style("fill", "orange")
      tooltip
        .transition()
        .duration(500)
        .style("opacity", 0);
    });

  // Append arrival bars
  svg.selectAll(".arrival-bar")
    .data(flightData)
    .enter()
    .append("rect")
    .attr("class", "arrival-bar")
    .attr("x", d => x(d.hour))
    .attr("y", height)
    .attr("width", x.bandwidth())
    .attr("height", 0) // 0 so that it shows that cool transition when you refresh page
    .style("opacity", 0)
    .attr("fill", "green")
    .style("display", "none")
    .on("mouseover", (event, d) => {

      const showDeparture = departureCheckbox.property("checked");
      const showArrival = arrivalCheckbox.property("checked");
      
      if (!showDeparture && showArrival) {
        d3.select(event.currentTarget)
          .style("fill", "darkgreen")
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip
          .html(`Flights: ${d.arrivalFlights}`)
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 28 + "px");
      }
    })
    .on("mouseout", (event) => {

      d3.select(event.currentTarget)
        .style("fill", "green")
      tooltip
        .transition()
        .duration(500)
        .style("opacity", 0);
    });

  // Append checkboxes
  const checkboxDiv = d3.select("#vis1_plot")
    .append("div")
    .attr("class", "checkboxes");

  const departureCheckbox = checkboxDiv.append("label")
    .text("Departure")
    .append("input")
    .attr("type", "checkbox")
    .attr("name", "departureCheckbox")
    .property("checked", true);

  const arrivalCheckbox = checkboxDiv.append("label")
    .text("Arrival")
    .append("input")
    .attr("type", "checkbox")
    .attr("name", "arrivalCheckbox")
    .property("checked", true);
      
  checkboxDiv.selectAll("input")
    .on("change", updatePlot);

  // Append line
  svg.append("path")
    .datum(flightData)
    .attr("class", "total-flights-line")
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .style("opacity", 0);

  // Append line label
  const lastFlight = flightData[flightData.length - 1];
  svg.append("text")
    .attr("class", "total-label")
    .attr("x", width - 10)
    .attr("y", lineScale(lastFlight.departureFlights + lastFlight.arrivalFlights) - 30)
    .attr("text-anchor", "end")
    .style("fill", "white")
    .style("font-size", "12px")
    .style("opacity", 0)
    .text("Total");
  
  // Function to update plot based on selection
  function updatePlot() {

    const showDeparture = departureCheckbox.property("checked");
    const showArrival = arrivalCheckbox.property("checked");
  
    const transition = svg.transition().duration(500);

    if (showDeparture) {
      svg
        .selectAll(".departure-bar")
        .transition(transition)
        .attr("y", d => y(d.departureFlights))
        .attr("height", d => height - y(d.departureFlights))
        .style("display", "block")
        .style("opacity", 1);
    } else {
      svg
        .selectAll(".departure-bar")
        .transition(transition)
        .attr("y", height)
        .attr("height", 0)
        .style("opacity", 0)
        .transition()
        .style("display", "none");
    }
  
    if (showArrival) {
      svg
        .selectAll(".arrival-bar")
        .transition(transition)
        .attr("y", d => y(d.arrivalFlights))
        .attr("height", d => height - y(d.arrivalFlights))
        .style("display", "block")
        .style("opacity", 1);
    } else {
      svg
        .selectAll(".arrival-bar")
        .transition(transition)
        .attr("y", height)
        .attr("height", 0)
        .style("opacity", 0)
        .transition()
        .style("display", "none");
    }
  
    if (showDeparture && showArrival) {
      svg
        .select(".total-flights-line")
        .transition(transition)
        .delay(500)
        .style("opacity", 1);

      svg
        .select(".total-label")
        .transition(transition)
        .delay(500)
        .style("opacity", 1);
  
      svg
        .selectAll(".departure-bar")
        .transition(transition)
        .style("opacity", 0.5);
  
      svg
        .selectAll(".arrival-bar")
        .transition(transition)
        .style("opacity", 0.5);
    } else {
      // Show line and accompanied label only when both options are selected
      svg
        .select(".total-flights-line")
        .transition(transition)
        .style("opacity", 0);

        svg
        .select(".total-label")
        .transition(transition)
        .style("opacity", 0);
    }

    // Append chart title
    svg.append("text")
      .attr("class", "chart-title")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .text("Total Number of Flights by Hour in 2022");
  }
      
  updatePlot();
};


let visualization2=function(jsonData) {

  // Define margins and dimensions
  let width = 1000;
  let height = 500;
  let margin = { top: 50, bottom: 50, left: 50, right: 50 };
  const padding = 50;
  
  // Define SVG
  const svg = d3.select("#vis2_plot")
    .append("svg")
    .attr("width", width - margin.right - margin.left)
    .attr("height", height - margin.top - margin.bottom)
    .attr("viewBox", `0 0 ${width} ${height}`);
  
  // Create force simulation
  const simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(d => d.id))
    .force("charge", d3.forceManyBody().strength(-100))
    .force("center", d3.forceCenter(width / 2, height / 2));
  
  // Append links
  const links = svg.append("g")
    .selectAll("line")
    .data(jsonData.links)
    .enter()
    .append("line")
    .style("stroke", "gray")
    .style("stroke-width", d => d.value / 5000)
    .attr("class", "link")
    .on("mouseover", handleLinksMouseOver)
    .on("mouseout", handleLinksMouseOut);

  // Define tooltip
  const tooltip = d3.select("#vis2_plot")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Links tooltip functions
  function handleLinksMouseOver(event, d) {
    d3.select(this)
      .style("stroke", "red");

    tooltip.transition().duration(200).style("opacity", .9);

    tooltip.html("Flights: " + d.value)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 20) + "px");
  }
  
  function handleLinksMouseOut(event, d) {
    d3.select(this)
      .style("stroke", "gray")
      .style("stroke-width", d => d.value / 5000);

    tooltip.transition().duration(500).style("opacity", 0);
  }

  // Define a dictionary to store city population data
  // I did not have time to webscrape so I hard-coded the data instead
  // Data is from https://a-z-animals.com/blog/discover-the-most-populated-cities-in-india/
  const populationData = {
    Mumbai: 12691836,
    Delhi: 10927986,
    Bangalore: 8443675,
    Hyderabad: 6800970,
    Chennai: 4646732,
    Kolkata: 4631392,
  };
      
  // Append nodes
  const nodes = svg.append("g")
    .selectAll("circle")
    .data(jsonData.nodes)
    .enter()
    .append("circle")
    .attr("r", d => Math.sqrt(populationData[d.city]) / 250)
    .style("fill", "skyblue")
    .attr("class", "node")
    .on("mouseover", handleNodesMouseOver)
    .on("mouseout", handleNodesMouseOut);
  
  // Nodes Tooltip functions
  function handleNodesMouseOver(event, d) {

    d3.select(this).style("fill", "red");

    tooltip.transition().duration(200).style("opacity", .9);

    tooltip.html("Population: " + populationData[d.city])
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 20) + "px");
  }
  
  function handleNodesMouseOut(event, d) {

    d3.select(this).style("fill", "skyblue");

    tooltip.transition().duration(500).style("opacity", 0);
  }
  
  // Append labels to nodes
  const labels = svg.append("g")
    .selectAll("text")
    .data(jsonData.nodes)
    .enter()
    .append("text")
    .text(d => d.city)
    .style("font-size", "6px")
    .style("pointer-events", "none")
    .attr("dx", -13)
    .attr("dy", 0);
  
  // Create graph
  simulation.nodes(jsonData.nodes).on("tick", () => {
    links
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    nodes
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    labels
      .attr("x", d => d.x + 10)
      .attr("y", d => d.y);
  });
  
  // Update simulation links
  simulation.force("link").links(jsonData.links);
  
  // Create zoom effect
  let zoom = d3.zoom()
    .scaleExtent([1, 5])
    .on('zoom', function(event) {
      svg.selectAll("g")
        .attr('transform', event.transform);
      svg.selectAll("line")
        .attr('transform', event.transform);
      nodes.attr('transform', event.transform);
      labels.attr('transform', event.transform);
    });

  svg.call(zoom);

  // Append chart title
  const title = svg.append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .text("Traffic Flow of Flights in 2022");
}

let visualization3=function(data, geoJsonData) {

  // Filter data with only non-stop flights
  const filteredData = data.filter(row => row.stops === '0');

  // Aggregate destination counts
  const destinationCounts = d3.rollup(
    filteredData,
    v => v.length,
    d => d.destination
  );

  // Define a dictionary to store the coordinate of each city
  // (These coordinates were taken from Google)
  const cityCoordinates = [
    { city: "Mumbai", lat: 19.0760, lon: 72.8777 },
    { city: "Bangalore", lat: 12.9716, lon: 77.5946 },
    { city: "Kolkata", lat: 22.5726, lon: 88.3639 },
    { city: "Hyderabad", lat: 17.3850, lon: 78.4867 },
    { city: "Chennai", lat: 13.0827, lon: 80.2707 },
    { city: "Delhi", lat: 28.7041, lon: 77.1025 }
  ];

  // Define SVG
  const svg = d3.select("#vis3_plot")
    .append("svg")
    .attr("width", 800)
    .attr("height", 600);

  // Define map projection
  const projection = d3.geoMercator()
    .center([82, 23])
    .scale(1000)
    .translate([400, 300]);

  // Define path generator
  const path = d3.geoPath().projection(projection);

  // Draw map of India using GeoJSON data
  svg.selectAll("path")
    .data(geoJsonData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "lightgray")
    .attr("stroke", "white");

  // Define tooltip
  const tooltip = d3.select("#vis3_plot")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Append bubbles
  svg.selectAll("circle")
    .data(cityCoordinates)
    .enter()
    .append("circle")
    .attr("cx", (d) => projection([d.lon, d.lat])[0])
    .attr("cy", (d) => projection([d.lon, d.lat])[1])
    .attr("r", (d) => Math.sqrt(destinationCounts.get(d.city)) * 0.5) 
    .attr("fill", "green")
    .attr("opacity", 0.7)
    .on("mouseover", (event, d) => {

      d3.select(event.target).attr("fill", "darkgreen");

      tooltip.transition().duration(200).style("opacity", 0.9);

      tooltip.html(`Flights: ${destinationCounts.get(d.city)}`)
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px");
    })
    .on("mouseout", (event, d) => {

      d3.select(event.target).attr("fill", "green");

      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Append city names
  svg.selectAll("text")
    .data(cityCoordinates)
    .enter()
    .append("text")
    .attr("x", (d) => projection([d.lon, d.lat])[0])
    .attr("y", (d) => projection([d.lon, d.lat])[1])
    .text((d) => `${d.city}`)
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .style("font-size", "10px");
  
  // Append title
  const title = svg.append("text")
    .attr("class", "chart-title")
    .attr("x", 400)
    .attr("y", 30)
    .text("Most Popular Destinations in 2022");
}
