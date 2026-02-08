# Chart Import Feature Setup

This guide will help you set up the XLSX/CSV import feature with AI-powered chart recommendations.

## Step 1: Install Dependencies

```bash
npm install xlsx papaparse
npm install --save-dev @types/papaparse
```

## Step 2: Files Created

### Frontend Files:
1. **src/taskpane/utils/dataParser.ts** - Parses XLSX and CSV files
2. **src/taskpane/utils/chartHandler.ts** - Creates charts in PowerPoint
3. **src/taskpane/components/ChartPreview.tsx** - Shows chart preview before insertion

### Backend Files:
4. **server/routes/chart.ts** - API endpoint for chart analysis
5. **server/services/chartService.ts** - AI chart recommendation logic

## Step 3: How It Works

1. **User uploads XLSX/CSV file** via the + menu
2. **Data is parsed** and sent to the backend
3. **AI analyzes the data** and suggests:
   - Best chart type (bar, line, pie, scatter, etc.)
   - Which columns to use for X/Y axes
   - Chart title and labels
4. **User previews the suggestion** and can modify it
5. **Chart is inserted** into the current slide

## Step 4: Supported Chart Types

The system will intelligently choose from:
- **Column/Bar Chart** - For comparing categories
- **Line Chart** - For trends over time
- **Pie Chart** - For showing proportions
- **Scatter Plot** - For showing correlations
- **Area Chart** - For cumulative data
- **Combo Charts** - For multiple data series

## Step 5: Update ChatInput Menu

Add this option to the + dropdown menu:
```typescript
<MenuItem icon={<DataBar24Regular />} onClick={handleDataUpload}>
  Import Data Chart
</MenuItem>
```

## Step 6: Backend API Endpoint

Create `/api/chart/analyze` that:
- Receives: Raw data (rows and columns)
- Analyzes: Data types, patterns, relationships
- Returns: Chart type, configuration, and reasoning

## Example Usage

**Upload CSV:**
```csv
Month,Sales,Expenses
Jan,10000,7000
Feb,12000,7500
Mar,15000,8000
```

**AI Suggests:**
- Chart Type: Line Chart
- X-Axis: Month
- Y-Axis: Sales, Expenses (two series)
- Title: "Sales vs Expenses Over Time"
- Reasoning: "Time series data with multiple metrics - line chart shows trends clearly"

## Step 7: Testing

1. Upload sample CSV/XLSX files
2. Verify AI picks appropriate chart type
3. Check that chart renders correctly in PowerPoint
4. Test with various data shapes (wide, tall, time series, categorical)

## Future Enhancements

- Support for more chart types (waterfall, funnel, etc.)
- Custom color schemes matching slide themes
- Interactive chart editing after insertion
- Multi-chart slides (2-4 charts per slide)
- Chart animations
