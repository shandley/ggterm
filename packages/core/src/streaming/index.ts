/**
 * Streaming Data Support
 *
 * Provides real-time data streaming capabilities for ggterm plots:
 * - Incremental data updates with .push()
 * - Time-windowed rendering (sliding window)
 * - Rolling aggregations (mean, sum, min, max)
 * - Efficient buffer management
 */

export {
  StreamingPlot,
  createStreamingPlot,
  createTimeSeriesPlot,
  type StreamingPlotOptions,
  type StreamingPlotState,
} from './streaming-plot'

export {
  DataWindow,
  createDataWindow,
  type WindowOptions,
  type WindowStats,
} from './data-window'

export {
  RollingAggregator,
  createRollingAggregator,
  createMultiAggregator,
  ExponentialMovingAverage,
  type AggregationType,
  type RollingOptions,
} from './rolling-aggregator'

export {
  DataBuffer,
  createDataBuffer,
  type BufferOptions,
} from './data-buffer'
