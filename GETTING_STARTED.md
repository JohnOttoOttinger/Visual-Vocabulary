# FT Visual Vocabulary - Getting Started Guide

Welcome to the Financial Times Visual Vocabulary! This guide will help you use and edit these D3.js data visualization templates.

## What You Have

The FT Visual Vocabulary is a collection of **50+ professional data visualization templates** including:

### Chart Categories

**Basic Charts:**
- Bar charts (standard, grouped, stacked, diverging)
- Column charts (standard, grouped, stacked, timeline)
- Line charts (single, multi-line, dual-axis)
- Area charts
- Scatter plots

**Advanced Visualizations:**
- Sankey diagrams
- Treemaps
- Bump charts
- Slope graphs
- Waterfall charts
- Calendar heat maps
- Box plots
- Histograms

**Specialized:**
- Small multiples (area, bars, columns, lines)
- Geographic maps (US choropleth, UK constituencies)
- Timeline variations
- Lollipop charts
- Bubble charts
- Dot plots

## Quick Start

### 1. Running the Templates Locally

The server is already running! Open your browser and navigate to:

```
http://localhost:8080
```

You should see the main index page with links to all chart types.

### 2. Viewing Individual Charts

To see a specific chart, navigate to:
```
http://localhost:8080/[chart-name]/
```

For example:
- `http://localhost:8080/bar/` - Bar chart
- `http://localhost:8080/line/` - Line chart
- `http://localhost:8080/scatterplot/` - Scatter plot
- `http://localhost:8080/sankey/` - Sankey diagram
- `http://localhost:8080/treemap/` - Treemap

### 3. To Stop the Server

When you're done, stop the Python server with:
```bash
# Find and kill the server process
lsof -ti:8080 | xargs kill
```

### 4. To Start the Server Again

```bash
cd /Users/Ottinger/visual-vocabulary
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

## Understanding the Structure

### Each Chart Folder Contains:

```
chart-name/
├── index.html              # Main HTML file
├── data.csv               # Sample data file
├── [chart-name].js        # D3.js visualization logic
├── drawFrame.js           # Frame and layout logic
├── styles.js              # Visual styling configuration
├── d3.min.js              # D3.js library
├── frameGlobalStyles.css  # CSS styles
└── saveSvgAsPng.js        # Export functionality
```

## How to Edit Templates

### Step 1: Choose Your Chart Type

Browse the available charts at `http://localhost:8080` or look through the folders.

### Step 2: Copy the Template

```bash
# Create a copy for your project
cp -r /Users/Ottinger/visual-vocabulary/bar ~/my-bar-chart
cd ~/my-bar-chart
```

### Step 3: Edit Your Data

**Option A: Edit the CSV file**

Open `data.csv` in any text editor:

```csv
name,value
Oranges,6
Apples,8
Pears,4
```

**Option B: Use your own data**

Just maintain the same column structure that the chart expects.

### Step 4: Customize the Visualization

**Edit `styles.js` to change appearance:**

```javascript
// Chart dimensions
const sharedConfig = {
    essential: {
        graphic_data_id: 'data.csv',
        yMin: 0,
        yMax: 10,
        xAxisAlign: 'bottom',
        // ... more configuration
    }
};
```

**Edit `[chart-name].js` for the D3.js logic:**

This file contains the main D3.js code. You can modify:
- Data parsing
- Scale configurations
- Visual encodings
- Interactivity
- Annotations

### Step 5: Preview Your Changes

1. Save your files
2. Refresh your browser (the server auto-serves updated files)
3. See your changes instantly

## Exporting Your Visualization

### For Static Images

1. Open the chart in your browser
2. Use the browser's built-in screenshot tool, OR
3. Use the included SVG Crowbar functionality (check the original README)

### For Further Refinement

FT designers typically:
1. Export the SVG from the browser
2. Open in Adobe Illustrator
3. Add annotations, styling, and final touches

## Common Customizations

### Changing Colors

Edit the color scheme in `styles.js`:

```javascript
essential: {
    colour_palette: ['#ff0000', '#00ff00', '#0000ff']
}
```

### Adjusting Dimensions

Modify chart size in `styles.js`:

```javascript
essential: {
    graphic_data_id: 'data.csv',
    width: 800,
    height: 600
}
```

### Adding Titles and Labels

Update text elements in `index.html` or configure in `styles.js`.

## Integration with Your Projects

### Option 1: Standalone Use

Keep the templates as-is and use them to create individual visualizations.

### Option 2: Integrate with React

You can adapt these D3.js patterns into React components:

```javascript
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Use the D3 code from the FT template
// Wrap it in a React component with useEffect
```

### Option 3: Use as Reference

Study the D3.js patterns and implement similar visualizations in your own style.

## Available Chart Types (Complete List)

1. **area** - Area chart
2. **bar** - Horizontal bar chart
3. **bar-diverging-stacked** - Diverging stacked bars
4. **bar-grouped** - Grouped bar chart
5. **bar-ordered** - Ordered bar chart
6. **bar-stacked** - Stacked bar chart
7. **bar-stacked-proportional** - 100% stacked bars
8. **boxplot** - Box and whisker plot
9. **bubble** - Bubble chart
10. **bullet-chart** - Bullet chart
11. **bump** - Bump chart (rank over time)
12. **calendar-heat-map** - Calendar heatmap
13. **circles-timeline** - Timeline with circles
14. **column** - Vertical column chart
15. **column-diverging-stacked** - Diverging stacked columns
16. **column-grouped** - Grouped column chart
17. **column-line-timeline** - Combined column and line
18. **column-ordered** - Ordered columns
19. **column-political** - Political chart
20. **column-stacked** - Stacked columns
21. **column-timeline** - Timeline columns
22. **dot-plot** - Dot plot
23. **dot-stacked** - Stacked dot plot
24. **histogram** - Histogram
25. **line** - Line chart
26. **line-dual-axis** - Dual-axis line chart
27. **line-interday** - Intraday line chart
28. **line-moving-average** - Moving average line
29. **lollipop-h** - Horizontal lollipop chart
30. **lollipop-v** - Vertical lollipop chart
31. **map-us-choropleth** - US choropleth map
32. **pie** - Pie chart
33. **priestley-timeline** - Priestley timeline
34. **proportional-squares** - Proportional square chart
35. **pyramid** - Population pyramid
36. **sankey** - Sankey diagram
37. **scatterplot** - Scatter plot
38. **scatterplot-line** - Scatter with trend line
39. **scatterplot-line-date** - Time-based scatter
40. **slope** - Slope chart
41. **small-multiples-area** - Multiple area charts
42. **small-multiples-bars** - Multiple bar charts
43. **small-multiples-column-category** - Multiple columns (category)
44. **small-multiples-column-timeline** - Multiple columns (time)
45. **small-multiples-multiple-line** - Multiple line charts
46. **small-multiples-single-line** - Multiple single lines
47. **Spine** - Spine chart
48. **treemap** - Treemap
49. **uk-constituency-cartogram-2017** - UK cartogram
50. **uk-constituency-map-2017** - UK constituency map
51. **waterfall** - Waterfall chart
52. **wrapper-starter** - Template wrapper
53. **xy-heatmap-cat** - Categorical heatmap
54. **xy-heatmap-quant** - Quantitative heatmap

## Tips for Success

1. **Start Simple** - Begin with basic charts before moving to complex ones
2. **Study the Code** - The D3.js patterns here are professional-grade
3. **Keep Backups** - Copy templates before modifying them
4. **Use Real Data** - Test with your actual data early
5. **Iterate** - Make small changes and test frequently

## Resources

- **D3.js Documentation**: https://d3js.org/
- **FT Visual Vocabulary**: https://github.com/ft-interactive/visual-vocabulary
- **Observable (D3 examples)**: https://observablehq.com/@d3

## Troubleshooting

### Charts Not Loading?
- Check that the server is running (`http://localhost:8080`)
- Look for JavaScript errors in browser console (F12)

### Data Not Showing?
- Verify CSV format matches expected structure
- Check file path in `styles.js`

### Styling Issues?
- Clear browser cache
- Check CSS file paths
- Verify styles.js configuration

## Next Steps

1. Browse all available charts at `http://localhost:8080`
2. Pick a chart type that fits your data
3. Copy the template and customize with your data
4. Experiment with the styling options
5. Export your final visualization

Happy visualizing! 🎨📊
