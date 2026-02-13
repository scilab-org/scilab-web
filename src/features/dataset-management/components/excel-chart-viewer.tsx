import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Download, FileSpreadsheet, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

// Fixed color palette suitable for scientific papers
const SCIENTIFIC_COLORS = [
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
  '#be123c', // Rose
  '#65a30d', // Lime
  '#0d9488', // Teal
];

type ChartType = 'bar' | 'line' | 'pie';

type ExcelChartViewerProps = {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
};

type ChartData = {
  labels: string[];
  values: number[];
};

type RawData = {
  headers: string[];
  rows: any[][];
};

export const ExcelChartViewer = ({
  fileUrl,
  fileName,
  onClose,
}: ExcelChartViewerProps) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [labelColumnIndex, setLabelColumnIndex] = useState<number>(0);
  const [valueColumnIndex, setValueColumnIndex] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<any>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  // Handle click outside to close modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Helper function to parse numeric values (handles $, k, m, commas, etc.)
  const parseNumericValue = (value: any): number | null => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return null;

    // Remove common non-numeric characters
    const cleaned = value
      .trim()
      .replace(/[$,]/g, '') // Remove $ and commas
      .replace(/[^\d.kmb-]/gi, ''); // Keep digits, dot, k, m, b, minus

    // Handle k, m, b multipliers
    const multipliers: { [key: string]: number } = {
      k: 1000,
      m: 1000000,
      b: 1000000000,
    };

    const lastChar = cleaned.slice(-1).toLowerCase();
    if (multipliers[lastChar]) {
      const num = parseFloat(cleaned.slice(0, -1));
      return isNaN(num) ? null : num * multipliers[lastChar];
    }

    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  // Load and parse data file (Excel or CSV)
  useEffect(() => {
    const loadDataFile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the data file
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch data file');
        }

        const arrayBuffer = await response.arrayBuffer();

        // Parse data file using xlsx library (supports Excel and CSV)
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('No worksheets found in file');
        }

        const worksheet = workbook.Sheets[firstSheetName];

        // Convert worksheet to JSON (with header row)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as any[][];

        if (!jsonData || jsonData.length < 2) {
          throw new Error('Data file must have at least 2 rows of data');
        }

        // Extract headers and data rows
        const headers = (jsonData[0] as any[]).map((h, i) =>
          String(h || `Column ${i + 1}`),
        );
        const rows = jsonData.slice(1);

        // Store raw data
        setRawData({ headers, rows });

        // Auto-detect best columns: first column for labels, first numeric column for values
        let autoValueColIndex = 1;
        for (let colIdx = 1; colIdx < headers.length; colIdx++) {
          // Check if this column has numeric data
          const hasNumericData = rows.some(
            (row) => parseNumericValue(row[colIdx]) !== null,
          );
          if (hasNumericData) {
            autoValueColIndex = colIdx;
            break;
          }
        }

        setLabelColumnIndex(0);
        setValueColumnIndex(autoValueColIndex);
      } catch (err) {
        console.error('Error loading data file:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load data file',
        );
      } finally {
        setLoading(false);
      }
    };

    loadDataFile();
  }, [fileUrl]);

  // Process chart data whenever columns change
  useEffect(() => {
    if (!rawData) return;

    try {
      const labels: string[] = [];
      const values: number[] = [];

      // Extract data from selected columns
      for (let i = 0; i < rawData.rows.length; i++) {
        const row = rawData.rows[i];
        if (!row || row.length === 0) continue;

        // Get label from selected column
        const label = String(row[labelColumnIndex] ?? `Row ${i + 1}`);

        // Get value from selected column and parse it
        const rawValue = row[valueColumnIndex];
        const value = parseNumericValue(rawValue);

        if (value !== null) {
          labels.push(label);
          values.push(value);
        }
      }

      if (labels.length === 0 || values.length === 0) {
        throw new Error('No valid numeric data found in selected value column');
      }

      setChartData({ labels, values });
      setError(null);
    } catch (err) {
      console.error('Error processing chart data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to process chart data',
      );
      setChartData(null);
    }
  }, [rawData, labelColumnIndex, valueColumnIndex]);

  // Prepare chart data in Chart.js format
  const getChartJsData = () => {
    if (!chartData) return null;

    // For pie chart, use multiple colors; for bar/line, use single color
    const backgroundColor =
      chartType === 'pie'
        ? chartData.labels.map(
            (_, index) => SCIENTIFIC_COLORS[index % SCIENTIFIC_COLORS.length],
          )
        : SCIENTIFIC_COLORS[0];

    const borderColor =
      chartType === 'pie'
        ? chartData.labels.map(
            (_, index) => SCIENTIFIC_COLORS[index % SCIENTIFIC_COLORS.length],
          )
        : SCIENTIFIC_COLORS[0];

    return {
      labels: chartData.labels,
      datasets: [
        {
          label: 'Values',
          data: chartData.values,
          backgroundColor,
          borderColor,
          borderWidth: chartType === 'line' ? 2 : 1,
          fill: chartType === 'line' ? false : true,
          tension: chartType === 'line' ? 0.4 : 0, // Smooth line curves
        },
      ],
    };
  };

  // Chart.js options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: chartType === 'pie',
        position: 'bottom' as const,
        align: 'center' as const,
        maxHeight: 250,
        labels: {
          boxWidth: 15,
          padding: 8,
          font: {
            size: 10,
          },
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i];
                // Truncate long labels
                const truncatedLabel =
                  label.length > 30 ? label.substring(0, 30) + '...' : label;
                return {
                  text: `${truncatedLabel}: ${value}`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      title: {
        display: true,
        text: fileName,
        position: 'top' as const,
        font: {
          size: 20,
          weight: 'bold' as const,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales:
      chartType !== 'pie'
        ? {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)',
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          }
        : undefined,
  };

  // Export chart as PNG image
  const handleExportChart = () => {
    if (!chartRef.current) return;

    try {
      // Get the canvas element from the chart
      const canvas = chartRef.current.canvas;
      if (!canvas) {
        throw new Error('Chart canvas not found');
      }

      // Create a new canvas with white background
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const ctx = exportCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Draw the chart on top
      ctx.drawImage(canvas, 0, 0);

      // Convert canvas to data URL
      const url = exportCanvas.toDataURL('image/png');

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.download = `${fileName.replace(/\.[^/.]+$/, '')}-chart.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting chart:', err);
      alert('Failed to export chart');
    }
  };

  // Render the appropriate chart type
  const renderChart = () => {
    const data = getChartJsData();
    if (!data) return null;

    switch (chartType) {
      case 'bar':
        return <Bar ref={chartRef} data={data} options={chartOptions} />;
      case 'line':
        return <Line ref={chartRef} data={data} options={chartOptions} />;
      case 'pie':
        return <Pie ref={chartRef} data={data} options={chartOptions} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-card max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-lg shadow-xl">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-primary h-6 w-6" />
            <div>
              <h2 className="text-foreground text-lg font-semibold">
                Data Chart Viewer
              </h2>
              <p className="text-muted-foreground text-sm">{fileName}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Chart Type Selector */}
        <div className="border-border border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm font-medium">
              Chart Type:
            </span>
            <div className="flex gap-2">
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
                disabled={loading || !!error}
              >
                Bar Chart
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
                disabled={loading || !!error}
              >
                Line Chart
              </Button>
              <Button
                variant={chartType === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('pie')}
                disabled={loading || !!error}
              >
                Pie Chart
              </Button>
            </div>
          </div>
        </div>

        {/* Column Selection */}
        {rawData && (
          <div className="border-border bg-muted/20 border-b px-6 py-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm font-medium">
                  Label Column:
                </span>
                <select
                  value={labelColumnIndex}
                  onChange={(e) => setLabelColumnIndex(Number(e.target.value))}
                  className="border-border bg-background text-foreground rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  disabled={loading || !!error}
                >
                  {rawData.headers.map((header, index) => (
                    <option key={index} value={index}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm font-medium">
                  Value Column:
                </span>
                <select
                  value={valueColumnIndex}
                  onChange={(e) => setValueColumnIndex(Number(e.target.value))}
                  className="border-border bg-background text-foreground rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  disabled={loading || !!error}
                >
                  {rawData.headers.map((header, index) => (
                    <option key={index} value={index}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Chart Content */}
        <div className="p-6">
          {loading && (
            <div className="flex h-96 items-center justify-center">
              <div className="text-center">
                <div className="text-muted-foreground mb-2 text-sm">
                  Loading data file...
                </div>
                <div className="bg-primary h-1 w-48 animate-pulse rounded"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border-destructive/20 flex h-96 items-center justify-center rounded-lg border">
              <div className="text-center">
                <AlertCircle className="text-destructive mx-auto mb-3 h-12 w-12" />
                <h3 className="text-foreground mb-2 text-lg font-semibold">
                  Error Loading Chart
                </h3>
                <p className="text-muted-foreground text-sm">{error}</p>
                <p className="text-muted-foreground mt-2 text-xs">
                  Please ensure the file has at least 2 columns with valid data
                </p>
              </div>
            </div>
          )}

          {!loading && !error && chartData && (
            <div className="space-y-4">
              {/* Chart Display */}
              <div className="bg-muted/30 rounded-lg p-6">
                <div
                  className="mx-auto"
                  style={
                    chartType === 'pie'
                      ? { maxWidth: '700px', height: '600px' }
                      : { maxWidth: '800px', maxHeight: '500px' }
                  }
                >
                  {renderChart()}
                </div>
              </div>

              {/* Data Info */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="text-muted-foreground flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span>
                      Data Points:{' '}
                      <strong className="text-foreground">
                        {chartData.labels.length}
                      </strong>
                    </span>
                    {rawData && (
                      <>
                        <span className="text-muted-foreground">|</span>
                        <span>
                          X-Axis:{' '}
                          <strong className="text-foreground">
                            {rawData.headers[labelColumnIndex]}
                          </strong>
                        </span>
                        <span className="text-muted-foreground">|</span>
                        <span>
                          Y-Axis:{' '}
                          <strong className="text-foreground">
                            {rawData.headers[valueColumnIndex]}
                          </strong>
                        </span>
                      </>
                    )}
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleExportChart}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export as PNG
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
