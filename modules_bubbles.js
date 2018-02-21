var svg = d3.select("svg#modules_bubbles"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var format = d3.format(",d");


var pack = d3.pack()
    .size([width, height])
    .padding(1.5);

var url = "https://forgeapi.puppet.com:443/v3/modules?owner=camptocamp&limit=100";
d3.json(url, function(d) {
  classes = d.results;

  var root = d3.hierarchy({children: classes})
    .sum(function(d) { return Math.sqrt(d.downloads); })
    .each(function(d) {
        if (d.data.endorsement) {
            d.endorsement = d.data.endorsement;
        } else {
            d.endorsement = 'none';
        }
        d.contributors = [];
        d.id = d.data.name;
    });

  var node = svg.selectAll(".node")
    .data(pack(root).leaves())
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  node.append("circle")
      .attr("id", function(d) { return d.id; })
      .attr("r", function(d) { return d.r; })
      .style("fill", function(d) {
        switch(d.endorsement) {
          case 'approved':
            return '#53d4b0';
            break;
          case 'supported':
            return '#ffae1a';
            break;
          default:
            return '#59a1f7';
            break;
        }
      });

  node.append("clipPath")
      .attr("id", function(d) { return "clip-" + d.id; })
    .append("use")
      .attr("xlink:href", function(d) { return "#" + d.id; });

  node.append("text")
      .attr("clip-path", function(d) { return "url(#clip-" + d.id + ")"; })
    .selectAll("tspan")
    .data(function(d) {
        return [d.id];
    })
    .enter().append("tspan")
      .attr("x", 0)
      .attr("y", function(d, i, nodes) { return 13 + (i - nodes.length / 2 - 0.5) * 10; })
      .text(function(d) { return d; });

  node.append("title")
      .text(function(d) { return "module: " + d.id + "\n" + d.data.downloads.toLocaleString() + " downloads\n" + d.data.releases.length.toLocaleString() + " releases"; });

  document.getElementById('loading').style.display = 'none';

  root.each(function(d) {
      d3.json("https://api.github.com/repos/camptocamp/puppet-"+d.id+"/contributors", function(resp) {
          d.contributors = resp || [];
          d.addcontribs = true;
          updateContributors();
      });
  });

  function updateContributors() {
    node.data(pack(root).leaves())
        .filter(function(d) { return d.addcontribs })
        .append("image")
        .attr("clip-path", function(d) { return "url(#clip-" + d.id + ")"; })
        .attr("xlink:href", "octocat.svg")
        .attr("width", function(d) { return d.contributors.length * 2 })
        .attr("height", function(d) { d.addcontribs = false; return d.contributors.length * 2 })
        .attr("x", function(d) { return -d.r/2; })
        .attr("y", 2)
        .append("title")
          .text(function(d) { return d.contributors.length + " contributors:\n" + d.contributors.map(c => "  - " + c.login + "\n").join(""); })
  }
});
