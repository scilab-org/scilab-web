import { useState, useEffect, useMemo, useRef } from 'react';
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
  Decimation,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Download, FileSpreadsheet, AlertCircle } from 'lucide-react';

import { BTN } from '@/lib/button-styles';
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
  Decimation,
);

// Maximum data points to render in a chart to keep the browser responsive
const MAX_CHART_POINTS = 500;

// Parse a cell value to number, handling $, commas, k/m/b suffixes
const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const cleaned = value
    .trim()
    .replace(/[$,]/g, '')
    .replace(/[^\d.kmb-]/gi, '');
  const multipliers: Record<string, number> = {
    k: 1_000,
    m: 1_000_000,
    b: 1_000_000_000,
  };
  const lastChar = cleaned.slice(-1).toLowerCase();
  if (multipliers[lastChar]) {
    const n = parseFloat(cleaned.slice(0, -1));
    return isNaN(n) ? null : n * multipliers[lastChar];
  }
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
};

// Evenly sample arrays down to maxPoints elements
const sampleEvenly = (
  labels: string[],
  values: number[],
  maxPoints: number,
): { labels: string[]; values: number[] } => {
  const total = labels.length;
  if (total <= maxPoints) return { labels, values };
  const step = total / maxPoints;
  const sl: string[] = [];
  const sv: number[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.min(Math.round(i * step), total - 1);
    sl.push(labels[idx]);
    sv.push(values[idx]);
  }
  return { labels: sl, values: sv };
};

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
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [labelColumnIndex, setLabelColumnIndex] = useState<number>(0);
  const [valueColumnIndex, setValueColumnIndex] = useState<number>(1);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  // Load and parse data file (Excel or CSV)
  useEffect(() => {
    const loadDataFile = async () => {
      try {
        setLoading(true);
        setLoadError(null);

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
        setLoadError(
          err instanceof Error ? err.message : 'Failed to load data file',
        );
      } finally {
        setLoading(false);
      }
    };

    loadDataFile();
  }, [fileUrl]);

  // Detect which columns contain numeric data (>= 50% of non-empty rows parse as number)
  const numericColumnIndices = useMemo(() => {
    if (!rawData) return new Set<number>();
    const numeric = new Set<number>();
    for (let col = 0; col < rawData.headers.length; col++) {
      let numericCount = 0;
      let nonEmptyCount = 0;
      for (const row of rawData.rows) {
        const cell = row[col];
        if (cell === null || cell === undefined || cell === '') continue;
        nonEmptyCount++;
        if (parseNumericValue(cell) !== null) numericCount++;
      }
      if (nonEmptyCount > 0 && numericCount / nonEmptyCount >= 0.5) {
        numeric.add(col);
      }
    }
    return numeric;
  }, [rawData]);

  // If current valueColumnIndex is no longer a numeric column, reset to first numeric one
  useEffect(() => {
    if (numericColumnIndices.size === 0) return;
    if (!numericColumnIndices.has(valueColumnIndex)) {
      setValueColumnIndex(numericColumnIndices.values().next().value ?? 0);
    }
  }, [numericColumnIndices, valueColumnIndex]);

  const { chartData, chartDataError, isSampled, originalCount } =
    useMemo(() => {
      if (!rawData) {
        return {
          chartData: null,
          chartDataError: null,
          isSampled: false,
          originalCount: 0,
        };
      }

      try {
        const allLabels: string[] = [];
        const allValues: number[] = [];

        for (let i = 0; i < rawData.rows.length; i++) {
          const row = rawData.rows[i];
          if (!row || row.length === 0) continue;

          const label = String(row[labelColumnIndex] ?? `Row ${i + 1}`);
          const value = parseNumericValue(row[valueColumnIndex]);

          if (value !== null) {
            allLabels.push(label);
            allValues.push(value);
          }
        }

        if (allLabels.length === 0 || allValues.length === 0) {
          throw new Error(
            'No valid numeric data found in selected value column',
          );
        }

        const originalCount = allLabels.length;
        const sampled = sampleEvenly(allLabels, allValues, MAX_CHART_POINTS);

        return {
          chartData: sampled,
          chartDataError: null,
          isSampled: originalCount > MAX_CHART_POINTS,
          originalCount,
        };
      } catch (err) {
        console.error('Error processing chart data:', err);
        return {
          chartData: null,
          chartDataError:
            err instanceof Error ? err.message : 'Failed to process chart data',
          isSampled: false,
          originalCount: 0,
        };
      }
    }, [rawData, labelColumnIndex, valueColumnIndex]);

  const displayError = loadError ?? chartDataError;

  const chartJsData = useMemo(() => {
    if (!chartData) return null;

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
  }, [chartData, chartType]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      plugins: {
        decimation: {
          enabled: chartType === 'line',
          algorithm: 'lttb' as const,
          samples: MAX_CHART_POINTS,
          threshold: MAX_CHART_POINTS,
        },
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
                ticks: {
                  autoSkip: true,
                  maxTicksLimit: 12,
                },
              },
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  autoSkip: true,
                  maxRotation: 45,
                  minRotation: 30,
                  maxTicksLimit: 14,
                },
              },
            }
          : undefined,
    }),
    [chartType, fileName],
  );

  const chartElement = useMemo(() => {
    if (!chartJsData) return null;

    switch (chartType) {
      case 'bar':
        return <Bar ref={chartRef} data={chartJsData} options={chartOptions} />;
      case 'line':
        return (
          <Line ref={chartRef} data={chartJsData} options={chartOptions} />
        );
      case 'pie':
        return <Pie ref={chartRef} data={chartJsData} options={chartOptions} />;
      default:
        return null;
    }
  }, [chartJsData, chartOptions, chartType]);

  const chartContainerStyle = useMemo(() => {
    if (chartType === 'pie') {
      return {
        width: '100%',
        maxWidth: '840px',
        height: '640px',
      };
    }

    return {
      width: '100%',
      height: '560px',
      maxWidth: '100%',
    };
  }, [chartType]);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClose();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="bg-card max-h-[95vh] w-full max-w-[96vw] overflow-y-auto rounded-lg shadow-xl 2xl:max-w-400">
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
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className={BTN.CANCEL}
          >
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
                disabled={loading || !!loadError}
              >
                Bar Chart
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
                disabled={loading || !!loadError}
              >
                Line Chart
              </Button>
              <Button
                variant={chartType === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('pie')}
                disabled={loading || !!loadError}
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
                  disabled={loading || !!loadError}
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
                  disabled={loading || !!loadError}
                >
                  {rawData.headers.map((header, index) =>
                    numericColumnIndices.has(index) ? (
                      <option key={index} value={index}>
                        {header}
                      </option>
                    ) : null,
                  )}
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

          {displayError && (
            <div className="bg-destructive/10 border-destructive/20 flex h-96 items-center justify-center rounded-lg border">
              <div className="text-center">
                <AlertCircle className="text-destructive mx-auto mb-3 h-12 w-12" />
                <h3 className="text-foreground mb-2 text-lg font-semibold">
                  Error Loading Chart
                </h3>
                <p className="text-muted-foreground text-sm">{displayError}</p>
                <p className="text-muted-foreground mt-2 text-xs">
                  Please ensure the file has at least 2 columns with valid data
                </p>
              </div>
            </div>
          )}

          {!loading && !displayError && chartData && (
            <div className="space-y-4">
              {/* Chart Display */}
              <div className="bg-muted/30 rounded-lg p-6">
                <div className="mx-auto" style={chartContainerStyle}>
                  {chartElement}
                </div>
              </div>

              {/* Data Info */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="text-muted-foreground flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span>
                      Data Points:{' '}
                      <strong className="text-foreground">
                        {isSampled
                          ? `${MAX_CHART_POINTS.toLocaleString()} / ${originalCount.toLocaleString()}`
                          : chartData.labels.length.toLocaleString()}
                      </strong>
                      {isSampled && (
                        <span className="text-warning bg-warning/10 ml-2 rounded px-1.5 py-0.5 text-xs font-medium text-amber-600">
                          sampled
                        </span>
                      )}
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
                    className={`flex items-center gap-2 ${BTN.EDIT}`}
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
