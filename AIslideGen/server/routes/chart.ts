import express from "express";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import PptxGenJS from "pptxgenjs";

const router = express.Router();

// Initialize Chart.js canvas renderer
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: 800,
  height: 500,
  backgroundColour: "white",
});

interface ChartAnalysisRequest {
  headers: string[];
  rows: any[][];
  columnTypes: ("number" | "string" | "date")[];
  fileName: string;
}

interface ChartRecommendation {
  chartType: "ColumnClustered" | "Line" | "Pie" | "XYScatter" | "Area" | "BarClustered";
  title: string;
  xColumn: number;
  yColumns: number[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  reasoning: string;
  confidence: number; // 0-1
}

/**
 * POST /api/chart/analyze
 * Analyze data and recommend the best chart type
 */
router.post("/analyze", async (req, res) => {
  try {
    const { headers, rows, columnTypes, fileName }: ChartAnalysisRequest = req.body;

    // Validate input
    if (!headers || !rows || !columnTypes) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (headers.length === 0 || rows.length === 0) {
      return res.status(400).json({ error: "Empty data provided" });
    }

    // TODO: Call your AI service (OpenAI, Anthropic, etc.) to analyze the data
    // For now, we'll use a simple rule-based approach
    const recommendation = analyzeDataForChart(headers, rows, columnTypes, fileName);

    return res.json({
      success: true,
      recommendation,
    });
  } catch (error: any) {
    console.error("Error analyzing chart data:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze data" });
  }
});

/**
 * Simple rule-based chart recommendation
 * TODO: Replace with AI-powered analysis
 */
function analyzeDataForChart(
  headers: string[],
  rows: any[][],
  columnTypes: ("number" | "string" | "date")[],
  fileName: string
): ChartRecommendation {
  const numCols = headers.length;

  // Find numeric columns
  const numericColumns: number[] = [];
  const dateColumns: number[] = [];
  const stringColumns: number[] = [];

  columnTypes.forEach((type, idx) => {
    if (type === "number") numericColumns.push(idx);
    else if (type === "date") dateColumns.push(idx);
    else stringColumns.push(idx);
  });

  // Strategy 1: Time series data (date + numbers)
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    return {
      chartType: "Line",
      title: `${headers[numericColumns[0]]} Over Time`,
      xColumn: dateColumns[0],
      yColumns: numericColumns.slice(0, 3), // Up to 3 series
      xAxisLabel: headers[dateColumns[0]],
      yAxisLabel: numericColumns.map(i => headers[i]).join(", "),
      reasoning: "Detected time series data - line chart shows trends effectively",
      confidence: 0.9,
    };
  }

  // Strategy 2: Categorical data with one numeric column (pie chart)
  if (stringColumns.length === 1 && numericColumns.length === 1 && rows.length <= 10) {
    return {
      chartType: "Pie",
      title: `${headers[numericColumns[0]]} by ${headers[stringColumns[0]]}`,
      xColumn: stringColumns[0],
      yColumns: [numericColumns[0]],
      reasoning: "Small categorical dataset - pie chart shows proportions clearly",
      confidence: 0.85,
    };
  }

  // Strategy 3: Categories vs metrics (column chart)
  if (stringColumns.length > 0 && numericColumns.length > 0) {
    return {
      chartType: "ColumnClustered",
      title: `${numericColumns.map(i => headers[i]).join(" vs ")} by ${headers[stringColumns[0]]}`,
      xColumn: stringColumns[0],
      yColumns: numericColumns.slice(0, 3),
      xAxisLabel: headers[stringColumns[0]],
      yAxisLabel: numericColumns.map(i => headers[i]).join(", "),
      reasoning: "Categorical data with metrics - column chart enables easy comparison",
      confidence: 0.8,
    };
  }

  // Strategy 4: Two numeric columns (scatter plot)
  if (numericColumns.length >= 2) {
    return {
      chartType: "XYScatter",
      title: `${headers[numericColumns[1]]} vs ${headers[numericColumns[0]]}`,
      xColumn: numericColumns[0],
      yColumns: [numericColumns[1]],
      xAxisLabel: headers[numericColumns[0]],
      yAxisLabel: headers[numericColumns[1]],
      reasoning: "Two numeric variables - scatter plot reveals correlations",
      confidence: 0.75,
    };
  }

  // Default fallback
  return {
    chartType: "ColumnClustered",
    title: `${fileName.replace(/\.(xlsx|xls|csv)$/i, "")} Data`,
    xColumn: 0,
    yColumns: numericColumns.length > 0 ? [numericColumns[0]] : [1],
    reasoning: "Generic data structure - column chart provides clear visualization",
    confidence: 0.5,
  };
}

/**
 * POST /api/chart/analyze-with-ai
 * Use AI to analyze data and recommend chart (TODO: implement with your AI provider)
 */
router.post("/analyze-with-ai", async (req, res) => {
  try {
    const { headers, rows, columnTypes, fileName }: ChartAnalysisRequest = req.body;

    // TODO: Implement AI-powered analysis
    // Example prompt for OpenAI/Anthropic:
    const prompt = `
You are a data visualization expert. Analyze this dataset and recommend the best chart type.

Headers: ${headers.join(", ")}
Column Types: ${columnTypes.join(", ")}
Row Count: ${rows.length}
Sample Rows: ${JSON.stringify(rows.slice(0, 3))}

Recommend:
1. Chart type (column, line, pie, scatter, area, or bar)
2. Which column for X-axis
3. Which columns for Y-axis (can be multiple)
4. Chart title
5. Axis labels
6. Reasoning for your choice

Return as JSON with this structure:
{
  "chartType": "Line",
  "xColumn": 0,
  "yColumns": [1, 2],
  "title": "Sales Trends",
  "xAxisLabel": "Month",
  "yAxisLabel": "Amount ($)",
  "reasoning": "Time series data works best with line charts",
  "confidence": 0.9
}
`;

    // Call your AI service here
    // const aiResponse = await yourAIService.analyze(prompt);

    // For now, fallback to rule-based
    const recommendation = analyzeDataForChart(headers, rows, columnTypes, fileName);

    return res.json({
      success: true,
      recommendation,
    });
  } catch (error: any) {
    console.error("Error with AI analysis:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze with AI" });
  }
});

/**
 * POST /api/chart/generate-image
 * Generate a PowerPoint slide with a chart
 */
router.post("/generate-image", async (req, res) => {
  try {
    const { headers, rows, columnTypes, fileName }: ChartAnalysisRequest = req.body;

    // Get chart recommendation
    const recommendation = analyzeDataForChart(headers, rows, columnTypes, fileName);

    // Prepare data for Chart.js
    const chartData = prepareChartData(headers, rows, recommendation);

    // Generate chart configuration
    const configuration = buildChartConfiguration(recommendation, chartData);

    // Render chart to image buffer
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);

    // Convert to base64 for PowerPoint
    const base64Image = imageBuffer.toString("base64");

    // Create PowerPoint presentation with the chart
    const pptx = new PptxGenJS();
    const slide = pptx.addSlide();

    // Add chart image to slide
    slide.addImage({
      data: `data:image/png;base64,${base64Image}`,
      x: 0.5,
      y: 1.0,
      w: 9.0,
      h: 5.0,
    });

    // Generate presentation as base64
    const pptxBase64 = await pptx.write({ outputType: "base64" });

    return res.json({
      success: true,
      recommendation,
      presentation: pptxBase64,
    });
  } catch (error: any) {
    console.error("Error generating chart presentation:", error);
    return res.status(500).json({ error: error.message || "Failed to generate chart" });
  }
});

/**
 * Prepare chart data in Chart.js format
 */
function prepareChartData(
  headers: string[],
  rows: any[][],
  recommendation: ChartRecommendation
): any {
  const labels = rows.map((row) => String(row[recommendation.xColumn]));
  const datasets = recommendation.yColumns.map((colIdx, idx) => {
    return {
      label: headers[colIdx],
      data: rows.map((row) => {
        const value = row[colIdx];
        return typeof value === "number" ? value : parseFloat(value) || 0;
      }),
      backgroundColor: getColorForIndex(idx, 0.6),
      borderColor: getColorForIndex(idx, 1),
      borderWidth: 2,
      fill: recommendation.chartType === "Area",
    };
  });

  return { labels, datasets };
}

/**
 * Build Chart.js configuration
 */
function buildChartConfiguration(recommendation: ChartRecommendation, chartData: any): any {
  const chartTypeMap: Record<string, string> = {
    ColumnClustered: "bar",
    Line: "line",
    Pie: "pie",
    XYScatter: "scatter",
    Area: "line",
    BarClustered: "bar",
  };

  const chartType = chartTypeMap[recommendation.chartType] || "bar";

  return {
    type: chartType,
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: recommendation.title,
          font: {
            size: 18,
            weight: "bold",
          },
        },
        legend: {
          display: recommendation.yColumns.length > 1 || recommendation.chartType === "Pie",
          position: "top",
        },
      },
      scales:
        chartType !== "pie"
          ? {
              x: {
                title: {
                  display: !!recommendation.xAxisLabel,
                  text: recommendation.xAxisLabel || "",
                },
              },
              y: {
                title: {
                  display: !!recommendation.yAxisLabel,
                  text: recommendation.yAxisLabel || "",
                },
                beginAtZero: true,
              },
            }
          : undefined,
    },
  };
}

/**
 * Get color for dataset index
 */
function getColorForIndex(index: number, alpha: number): string {
  const colors = [
    [54, 162, 235], // Blue
    [255, 99, 132], // Red
    [75, 192, 192], // Green
    [255, 206, 86], // Yellow
    [153, 102, 255], // Purple
    [255, 159, 64], // Orange
  ];

  const color = colors[index % colors.length];
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

export default router;
