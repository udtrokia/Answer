/* Colors */
const COLORS = [
  'rgb(127, 201, 127)', 'rgb(190, 174, 212)', 'rgb(253, 192, 134)',
  'rgb(255, 255, 153)', 'rgb(120, 108, 176)', 'rgb(240, 2, 127)'
]

/* csv */
function csv(handler, options) {
  d3.csv("data.csv", (err, data) => {
    let groupData = {};
    let lunchData = {};
    let eduData = {};
    let courseData = {};
    data.map(e => {
      let re = e['race/ethnicity'];
      if (!groupData[re]) { groupData[re] = [] }
      groupData[re].push(e);

      let lunch = e['lunch'];
      if (!lunchData[lunch]) { lunchData[lunch] = []}
      lunchData[lunch].push(e);

      let edu = e['parental level of education'];
      if (!eduData[edu]) { eduData[edu] = []}
      eduData[edu].push(e);

      let course = e['test preparation course'];
      if (!courseData[course]) { courseData[course] = []}
      courseData[course].push(e);
    });

    let dataset = {
      groupData,
      lunchData,
      eduData,
      courseData
    };

    if (options.type == 'axis') {
      if (options.multi) {
      	handler(dataset[options.data]);
      } else {
	let mode = Object.keys(dataset[options.data])[0];
	handler(dataset[options.data][mode]);
      }
    } else {
      handler(dataset[options.data], options.chart, options.data);
    }
  });
}


/* Pie */
class Pie {
  static _pre() {
    let width = 360;
    let height = 250;
    let radius = Math.min(width, height) / 2;
    
    var svg = d3.select("#pie")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform",
	"translate(" + width / 2 + "," + height / 2 + ")"
      );
    
    let color = d3.scaleOrdinal()
      .range(["#98abc5", "#8a89a6", "#7b6888"])

    let arc = d3.arc()
      .outerRadius(radius - 10)
      .innerRadius(radius - 75)
      .padAngle(0.03)

    let labelArc = d3.arc()
      .outerRadius(radius - 40)
      .innerRadius(radius - 40);

    let pie = d3.pie()
      .sort(null)
      .value(function(d) { return d; });
    
    let ret = {
      svg, pie, arc, labelArc, color
    };

    return ret;
  }

  static draw(data, chart, dataMode) {
    let raw = data;
    let options = Object.keys(data);
    
    let {
      svg, pie, arc, labelArc, color
    } = Pie._pre();

    var g = svg.selectAll(".arc")
      .data(pie(
	options.map(e => data[e].length)
      ))
      .enter().append("g")
      .attr("class", "arc");

    g.append("path")
      .attr("d", arc)
      .style("fill", function(d, i) {
	return COLORS[i]
      })
      .on("mouseover", (d, i) => {
     	document.querySelector('#axis').innerHTML = '';
     	Axis[chart](data[options[i]]);
      })
      .on("mouseout", (d, i) => {
	if (chart === 'box') {
	  document.querySelector('#axis').innerHTML = '';
	  csv(Axis.line, { type: 'axis', data: dataMode, multi: true });
	}
      })

    g.append("text")
      .attr("transform", function(d) {
	return "translate(" + labelArc.centroid(d) + ")";
      })
      .attr("dy", ".35em")
      .text(function(d, i) {
	let t = options[i];
	if (t.match(/group/)) {
	  t = t.split(' ')[1];
	}
	return t;
      })
  }
}

class Axis {
  static _averange(data) {
    let mt = 0;
    let rt = 0;
    let wt = 0;

    data.map(e => {
      mt += + e['math score'];
      rt += + e['reading score'];
      wt += + e['writing score'];
    });
    
    let m = mt / data.length;
    let r = rt / data.length;
    let w = wt / data.length;
    
    return [ m, r, w ];
  }
  
  static _pre(data, line) {
    let margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = 480 - margin.left - margin.right,
      height = 250 - margin.top - margin.bottom;

    let svg = d3.select("#axis")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", 
        "translate(" + margin.left + "," + margin.top + ")"
      );

    let x = d3.scaleBand()
      .range([0, width])
      .padding(0.1);
    let y = d3.scaleLinear()
      .range([height, 0]);

    let scores = Axis._averange(data);
    
    x.domain(['math', 'reading', 'writing']);
    if (!line) {
      y.domain([d3.min(scores) - 5, d3.max(scores) + 5]);
    } else {
      y.domain([58, 78]);
    }

    svg.append("g").call(d3.axisLeft(y));
    svg.append("g").attr("transform",
      "translate(0," + height + ")"
    ).call(d3.axisBottom(x));

    return { width, height, margin, x, y, svg, scores };
  }  

  static bar(data) {
    let { width, height, margin, x, y, svg, scores} = Axis._pre(data);
    let options = ['math', 'reading', 'writing'];
    
    svg.selectAll(".bar")
      .data(scores)
      .enter().append("rect")
      .style("fill", "steelblue")
      .attr("class", "bar")
      .attr("x", function(d, i) {
    	return x(options[i]);
      })
      .attr("width", x.bandwidth())
      .attr("y", function(d, i) {
    	return y(scores[i]);
      })
      .attr("height", function(d, i) {
    	return height - y(scores[i]);
      })
    
    svg.selectAll('.text')
      .data(scores)
      .enter()
      .append('text')
      .attr("x", function(d,i){ return x(options[i])})
      .attr("y",function(d, i){ return y(scores[i])})
      .text(function(d, i){ return Math.floor(scores[i])})
      .attr("transform", `translate(${x.bandwidth() / 4 + margin.right}, -10)`);
  }

  static line(data) {
    let { width, height, margin, x, y, svg, scores } = Axis._pre(Object.values(data)[0], true);
    let options = ['math', 'reading', 'writing'];    
    
    Object.values(data).map((e, i) => {
      scores = Axis._averange(e);
      let valueline = d3.line()
	.x(function(d, i) { return x(options[i]) })
	.y(function(d, i) { return y(scores[i]) });
      
      svg.append("path")
	.data([scores])
	.attr('class', 'line')
	.attr("d", valueline)
	.style('stroke', COLORS[i])
	.attr("transform", `translate(${x.bandwidth() / 3 + margin.right}, 0)`)

      svg.selectAll('.text')
	.data(scores)
	.enter()
	.append('text')
	.attr("x", function(d,i){ return x(options[i])})
	.attr("y",function(d, i){ return y(scores[i])})
	.text(function(d, i){ return Math.floor(scores[i])})
	.attr("transform", `translate(${x.bandwidth() / 4 + margin.right}, -10)`);
    })
  }

  static box(data) {
    let { height, width, margin, x, y, svg, scores} = Axis._pre(data);
    let options = ['math', 'reading', 'writing'];
    
    width = 20;
    options.map((d, i) => {
      let current = scores[i]
      let range = [current - 2, current, current + 2];
      
      let q1 = d3.quantile(range, .15)
      let median = d3.quantile(range, .5)
      let q3 = d3.quantile(range, .5)
      let interQuantileRange = q3 - q1
      let min = q1 - 1.5 * interQuantileRange
      let max = q1 + 1.5 * interQuantileRange
      
      svg
	.append("line")
	.attr("x1", x(d))
	.attr("x2", x(d))
	.attr("y1", y(min) )
	.attr("y2", y(max) )
	.attr("stroke", "black")
	.attr("transform", `translate(${x.bandwidth() / 3 + margin.right}, 0)`)

      svg
	.append("rect")
	.attr("x", x(d) - width/2)
	.attr("y", y(q3) )
	.attr("height", (y(q1)-y(q3)) )
	.attr("width", width )
	.attr("stroke", "black")
	.style("fill", "#69b3a2")
	.attr("transform", `translate(${x.bandwidth() / 3 + margin.right}, 0)`)

      svg
	.selectAll("toto")
	.data([min, median, max])
	.enter()
	.append("line")
	.attr("x1", x(d)-width/2)
	.attr("x2", x(d)+width/2)
	.attr("y1", function(d){ return(y(d))} )
	.attr("y2", function(d){ return(y(d))} )
	.attr("stroke", "black")
	.attr("transform", `translate(${x.bandwidth() / 3 + margin.right}, 0)`)

      svg.selectAll('.text')
	.data(scores)
	.enter()
	.append('text')
	.attr("x", function(d,i){ return x(options[i])})
	.attr("y",function(d, i){ return y(scores[i])})
	.text(function(d, i){ return Math.floor(scores[i])})
	.attr("transform", `translate(${x.bandwidth() / 4 + margin.right}, -20)`);
    })
  }
}

function magic(dataMode, chartMode) {
  if (dataMode == 'groupData') {
    csv(Axis.bar, {
      type: 'axis',
      data: dataMode,
    });    
  } else {    
    csv(Axis.line, {
      type: 'axis',
      data: dataMode,
      multi: true
    });
  }

  csv(Pie.draw, {
    type: 'pie',
    data: dataMode,
    chart: chartMode,
  });  
}

/* Global */
!(function() {
  magic('groupData', 'bar');

  const tt = document.querySelector("#title");
  const sel = document.querySelector("#sel");
  sel.onchange = () => {
    document.querySelector("#pie").innerHTML = '';
    document.querySelector("#axis").innerHTML = '';

    if (sel.value === 'score') {
      tt.innerHTML = 'Student Score';
    } else {
      tt.innerHTML = sel.value + ' ' + 'on Student Score';
    }
    
    switch(sel.value) {
      case 'score':
	magic('groupData', 'bar');
	break;
      case 'lunch':
	magic('lunchData', 'box');
	break;
      case 'parental level of education':
	magic('eduData', 'box');
	break;
      case 'test preparation course':
	magic('courseData', 'box');
	break;
      default:
	magic('lunchData', 'box');
	break;
    }
  }
})();
