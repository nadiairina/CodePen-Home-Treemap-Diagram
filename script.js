const url = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/kickstarter-funding-data.json';
// Category custom names for the legend
const categoryNames = {
  "Product Design": "Design Projects",
  "Tabletop Games": "Board Games",
  "Gaming Hardware": "Gaming Equipment",
  "Video Games": "Video Game Titles",
  "Sound": "Audio Equipment",
  "Television": "TV Shows",
  "Narrative Film": "Movies",
  "Web": "Web Development",
  "Hardware": "Electronics"
};
// Category abbreviations for tile display
const categoryAbbr = {
  "Product Design": "Design",
  "Tabletop Games": "Games",
  "Gaming Hardware": "Gaming",
  "Video Games": "Video",
  "Sound": "Sound",
  "Television": "TV",
  "Narrative Film": "Film",
  "Web": "Web",
  "Hardware": "HW"
};
// Create color scale
const colorScale = d3.scaleOrdinal()
  .range([
    '#3b82f6', // blue
    '#f97316', // orange
    '#10b981', // emerald
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f59e0b', // amber
    '#06b6d4', // cyan
    '#ef4444', // red
    '#84cc16'  // lime
  ]);
// Show tooltip
function showTooltip(event, d) {
  const tooltip = d3.select('#tooltip');
  
  tooltip
    .style('opacity', 1)
    .style('left', (event.pageX + 10) + 'px')
    .style('top', (event.pageY - 28) + 'px')
    .attr('data-value', d.data.value);
    
  tooltip.html(`
    <div><strong>${d.data.name}</strong></div>
    <div>Category: ${d.data.category}</div>
    <div><strong>$${d3.format(',')(d.data.value)}</strong></div>
  `);
}
// Hide tooltip
function hideTooltip() {
  d3.select('#tooltip').style('opacity', 0);
}
// Fetch and process data
d3.json(url).then(data => {
  // Get dimensions from container
  const containerWidth = document.getElementById('treemap-container').clientWidth;
  const containerHeight = document.getElementById('treemap-container').clientHeight;
  
  // Create SVG
  const svg = d3.select('#treemap')
    .attr('width', containerWidth)
    .attr('height', containerHeight);
  
  // Create treemap layout
  const treemap = d3.treemap()
    .size([containerWidth, containerHeight])
    .paddingOuter(3)
    .paddingInner(2)
    .paddingTop(15)
    .round(true);
  
  // Process data
  const root = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);
  
  // Generate layout
  treemap(root);
  
  // Create tiles
  const tiles = svg.selectAll('.tile')
    .data(root.leaves())
    .enter()
    .append('g')
    .attr('class', 'tile')
    .attr('transform', d => `translate(${d.x0}, ${d.y0})`);
  
  // Add rectangles
  tiles.append('rect')
    .attr('width', d => Math.max(0, d.x1 - d.x0))
    .attr('height', d => Math.max(0, d.y1 - d.y0))
    .attr('fill', d => colorScale(d.data.category))
    .attr('stroke', 'white')
    .attr('stroke-width', 1)
    .attr('data-name', d => d.data.name)
    .attr('data-category', d => d.data.category)
    .attr('data-value', d => d.data.value)
    .attr('rx', 2)
    .on('mouseover', showTooltip)
    .on('mouseout', hideTooltip);
  
  // Add category labels
  tiles.append('text')
    .attr('class', 'category-label')
    .attr('x', 4)
    .attr('y', 10)
    .text(d => categoryAbbr[d.data.category] || d.data.category);
  
  // Add name labels with text wrapping
  tiles.append('text')
    .attr('class', 'name-label')
    .attr('x', 4)
    .attr('y', 22)
    .each(function(d) {
      const node = d3.select(this);
      const rectWidth = Math.max(0, d.x1 - d.x0) - 8;
      const rectHeight = Math.max(0, d.y1 - d.y0) - 30;
      
      // Skip text if tile is too small
      if (rectWidth < 30 || rectHeight < 20) return;
      
      const name = d.data.name;
      
      // Handle long names
      if (name.length > 10) {
        const words = name.split(/\s+/);
        let lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
          if (currentLine.length + words[i].length + 1 <= 15) {
            currentLine += " " + words[i];
          } else {
            lines.push(currentLine);
            currentLine = words[i];
          }
        }
        lines.push(currentLine);
        
        // Limit to 2 lines
        if (lines.length > 2) {
          lines = lines.slice(0, 2);
          lines[1] += "...";
        }
        
        // Add each line
        lines.forEach((line, i) => {
          node.append('tspan')
            .attr('x', 4)
            .attr('dy', i === 0 ? 0 : 12)
            .text(line);
        });
      } else {
        node.text(name);
      }
    });
  
  // Create legend
  const categories = root.children.map(d => d.data.name);
  const legend = d3.select('#legend');
  
  categories.forEach(category => {
    const item = legend.append('div')
      .attr('class', 'legend-item');
    
    item.append('div')
      .attr('class', 'legend-box')
      .style('background-color', colorScale(category));
    
    item.append('div')
      .attr('class', 'legend-label')
      .text(categoryNames[category] || category);
  });
  
  // Make responsive
  function resizeTreemap() {
    const newWidth = document.getElementById('treemap-container').clientWidth;
    const newHeight = document.getElementById('treemap-container').clientHeight;
    
    svg.attr('width', newWidth).attr('height', newHeight);
    treemap.size([newWidth, newHeight]);
    treemap(root);
    
    // Update tiles
    svg.selectAll('.tile')
      .attr('transform', d => `translate(${d.x0}, ${d.y0})`);
    
    svg.selectAll('rect')
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('height', d => Math.max(0, d.y1 - d.y0));
  }
  
  window.addEventListener('resize', resizeTreemap);
}).catch(error => {
  console.error('Error loading data:', error);
  document.getElementById('treemap-container').innerHTML = 
    `<div style="color: red; text-align: center; padding: 20px;">
      Error loading data: ${error.message}
    </div>`;
});
