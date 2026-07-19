import { create } from 'zustand'
import type { NormalizedBlockOutput } from '@/executor/types'

/**
 * A single block's captured output from a prior in-browser run. Keyed by the logical block id.
 * Only the OUTPUT is retained (not subblock config) — this is exactly what "run from here" must
 * restore for upstream blocks so downstream references (`{{block.field}}`) resolve without re-running
 * the whole workflow.
 */
export interface RunSnapshotBlockState {
  output: NormalizedBlockOutput
}

/**
 * The last completed run's output snapshot for one workflow. Held in memory only (no DB, no
 * persistence): it is a convenience for the current editing session's "run from here" feature and is
 * intentionally discarded on reload.
 */
export interface RunSnapshot {
  blockStates: Record<string, RunSnapshotBlockState>
  executedBlocks: string[]
  updatedAt: number
}

/** Handler the workflow page registers so leaf UI (per-block action bars) can trigger a run. */
export type RunFromBlockHandler = (blockId: string) => void | Promise<void>

interface RunSnapshotStoreState {
  /** Last-run output snapshot per workflow id. */
  snapshots: Record<string, RunSnapshot>
  /** The active "run from here" handler, registered by the workflow page's execution hook owner. */
  runFromBlockHandler: RunFromBlockHandler | null

  setSnapshot: (workflowId: string, snapshot: Omit<RunSnapshot, 'updatedAt'>) => void
  getSnapshot: (workflowId: string) => RunSnapshot | undefined
  hasSnapshot: (workflowId: string) => boolean
  clearSnapshot: (workflowId: string) => void

  registerRunFromBlockHandler: (handler: RunFromBlockHandler | null) => void
}

export const useRunSnapshotStore = create<RunSnapshotStoreState>((set, get) => ({
  snapshots: {},
  runFromBlockHandler: null,

  setSnapshot: (workflowId, snapshot) => {
    set((state) => ({
      snapshots: {
        ...state.snapshots,
        [workflowId]: { ...snapshot, updatedAt: Date.now() },
      },
    }))
  },

  getSnapshot: (workflowId) => get().snapshots[workflowId],

  hasSnapshot: (workflowId) => {
    const snap = get().snapshots[workflowId]
    return !!snap && Object.keys(snap.blockStates).length > 0
  },

  clearSnapshot: (workflowId) => {
    set((state) => {
      if (!(workflowId in state.snapshots)) return state
      const next = { ...state.snapshots }
      delete next[workflowId]
      return { snapshots: next }
    })
  },

  registerRunFromBlockHandler: (handler) => {
    set({ runFromBlockHandler: handler })
  },
}))
