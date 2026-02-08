/* global PowerPoint */

export type ChartType = "ColumnClustered" | "Line" | "Pie" | "XYScatter" | "Area" | "BarClustered";

export interface ChartConfig {
  type: ChartType;
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  xColumn: number; // Column index for X-axis
  yColumns: number[]; // Column indices for Y-axis (can be multiple series)
  headers: string[];
  rows: any[][];
}

/**
 * Create a chart by inserting a PowerPoint slide with the chart
 * @param base64Presentation - Base64-encoded PowerPoint presentation containing the chart
 */
export async function createChartImage(base64Presentation: string): Promise<void> {
  try {
    await PowerPoint.run(async (context) => {
      const presentation = context.presentation;

      // Insert the slide from the generated PowerPoint
      // Use KeepSourceFormatting to preserve the chart formatting
      presentation.insertSlidesFromBase64(base64Presentation, {
        formatting: PowerPoint.InsertSlideFormatting.keepSourceFormatting,
      });

      await context.sync();
    });
  } catch (error) {
    console.error("Error inserting chart slide:", error);
    throw new Error(`Failed to insert chart slide: ${error}`);
  }
}

/**
 * Create a formatted text box with table data in the current PowerPoint slide
 * Note: PowerPoint Office.js doesn't support creating charts programmatically,
 * and has limited table cell manipulation support, so we create a formatted text box instead
 */
export async function createChart(config: ChartConfig): Promise<void> {
  try {
    await PowerPoint.run(async (context) => {
      const slide = context.presentation.getSelectedSlides().getItemAt(0);

      // Prepare table data
      const tableData = prepareTableData(config);

      // Format data as a table string
      const tableText = formatTableAsText(tableData, config.title);

      // Add text box to slide
      const textBox = slide.shapes.addTextBox(tableText, {
        left: 50,
        top: 80,
        width: 620,
        height: Math.min(400, tableData.length * 25 + 80),
      });

      textBox.load("textFrame");
      await context.sync();

      // Style the text box
      textBox.textFrame.textRange.font.name = "Consolas";
      textBox.textFrame.textRange.font.size = 10;

      await context.sync();
    });
  } catch (error) {
    console.error("Error creating table:", error);
    throw new Error(`Failed to create table: ${error}`);
  }
}

/**
 * Format table data as a monospaced text string
 */
function formatTableAsText(tableData: any[][], title: string): string {
  // Calculate column widths
  const colWidths: number[] = [];
  for (let col = 0; col < tableData[0].length; col++) {
    let maxWidth = 0;
    for (let row = 0; row < tableData.length; row++) {
      const cellValue = String(tableData[row][col] ?? "");
      maxWidth = Math.max(maxWidth, cellValue.length);
    }
    colWidths.push(Math.max(maxWidth, 8)); // Minimum width of 8
  }

  // Build the formatted string
  let result = title + "\n" + "=".repeat(title.length) + "\n\n";

  for (let row = 0; row < tableData.length; row++) {
    const rowParts: string[] = [];
    for (let col = 0; col < tableData[row].length; col++) {
      const cellValue = String(tableData[row][col] ?? "");
      rowParts.push(cellValue.padEnd(colWidths[col], " "));
    }
    result += rowParts.join("  |  ") + "\n";

    // Add separator after header row
    if (row === 0) {
      result += colWidths.map((w) => "-".repeat(w)).join("--+--") + "\n";
    }
  }

  result += "\n(Right-click to convert to table or chart)";

  return result;
}

/**
 * Prepare table data from chart config
 */
function prepareTableData(config: ChartConfig): any[][] {
  const { xColumn, yColumns, headers, rows } = config;

  // Build data array with headers
  const data: any[][] = [];

  // Header row
  const headerRow = [headers[xColumn]];
  yColumns.forEach((colIdx) => {
    headerRow.push(headers[colIdx]);
  });
  data.push(headerRow);

  // Data rows
  rows.forEach((row) => {
    const dataRow = [row[xColumn]];
    yColumns.forEach((colIdx) => {
      dataRow.push(row[colIdx]);
    });
    data.push(dataRow);
  });

  return data;
}

/**
 * Get user-friendly chart type names
 */
export function getChartTypeName(type: ChartType): string {
  const names: Record<ChartType, string> = {
    ColumnClustered: "Column Chart",
    Line: "Line Chart",
    Pie: "Pie Chart",
    XYScatter: "Scatter Plot",
    Area: "Area Chart",
    BarClustered: "Bar Chart",
  };

  return names[type] || type;
}

/**
 * Validate chart configuration
 */
export function validateChartConfig(config: ChartConfig): { valid: boolean; error?: string } {
  if (!config.headers || config.headers.length === 0) {
    return { valid: false, error: "No headers provided" };
  }

  if (!config.rows || config.rows.length === 0) {
    return { valid: false, error: "No data rows provided" };
  }

  if (config.xColumn < 0 || config.xColumn >= config.headers.length) {
    return { valid: false, error: "Invalid X-axis column index" };
  }

  if (!config.yColumns || config.yColumns.length === 0) {
    return { valid: false, error: "No Y-axis columns specified" };
  }

  for (const yCol of config.yColumns) {
    if (yCol < 0 || yCol >= config.headers.length) {
      return { valid: false, error: `Invalid Y-axis column index: ${yCol}` };
    }
  }

  return { valid: true };
}
