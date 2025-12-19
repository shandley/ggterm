/**
 * Performance Optimizations
 *
 * Tools for handling large datasets efficiently:
 * - Level-of-detail rendering
 * - Data sampling (systematic, random, reservoir)
 * - Automatic binning (hexbin, rectangular)
 * - Canvas diffing for incremental updates
 */

export {
  DataSampler,
  createSampler,
  systematicSample,
  randomSample,
  reservoirSample,
  stratifiedSample,
  lttbSample,
  autoSample,
  type SamplingOptions,
  type SamplingMethod,
} from './sampling'

export {
  LevelOfDetail,
  createLOD,
  DEFAULT_LOD_LEVELS,
  type LODLevel,
  type LODOptions,
} from './level-of-detail'

export {
  Binner,
  createBinner,
  hexbin,
  rectbin,
  type BinOptions,
  type Bin,
  type HexBin,
} from './binning'

export {
  CanvasDiff,
  createCanvasDiff,
  quickDiff,
  type DiffResult,
  type DiffOptions,
} from './canvas-diff'
