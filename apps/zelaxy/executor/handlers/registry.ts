/**
 * Handler registry for the Zelaxy executor.
 * Returns all block handlers in priority order; GenericBlockHandler must be last
 * as it is a catch-all fallback.
 */

import {
  AgentBlockHandler,
  ApiBlockHandler,
  ConditionBlockHandler,
  EvaluatorBlockHandler,
  FunctionBlockHandler,
  GenericBlockHandler,
  LoopBlockHandler,
  ParallelBlockHandler,
  ResponseBlockHandler,
  RouterBlockHandler,
  SwitchBlockHandler,
  TriggerBlockHandler,
  WorkflowBlockHandler,
} from '@/executor/handlers'
import { CredentialBlockHandler } from '@/executor/handlers/credential/credential-handler'
import { HumanInTheLoopBlockHandler } from '@/executor/handlers/human-in-the-loop/human-in-the-loop-handler'
import { TranslateBlockHandler } from '@/executor/handlers/translate/translate-handler'
import { VariablesBlockHandler } from '@/executor/handlers/variables/variables-handler'
import { WaitBlockHandler } from '@/executor/handlers/wait/wait-handler'
import { ZelaxyArenaBlockHandler } from '@/executor/handlers/zelaxy-arena/zelaxy-arena-handler'
import type { PathTracker } from '@/executor/path/path'
import type { InputResolver } from '@/executor/resolver/resolver'
import type { BlockHandler } from '@/executor/types'

export interface HandlerRegistryDeps {
  pathTracker: PathTracker
  resolver: InputResolver
}

export function createBlockHandlers(deps: HandlerRegistryDeps): BlockHandler[] {
  const { pathTracker, resolver } = deps
  return [
    new TriggerBlockHandler(),
    new FunctionBlockHandler(),
    new ApiBlockHandler(),
    new ConditionBlockHandler(pathTracker, resolver),
    new RouterBlockHandler(pathTracker),
    new SwitchBlockHandler(pathTracker, resolver),
    new ResponseBlockHandler(),
    new HumanInTheLoopBlockHandler(),
    new AgentBlockHandler(),
    new ZelaxyArenaBlockHandler(),
    new VariablesBlockHandler(),
    new WorkflowBlockHandler(),
    new WaitBlockHandler(),
    new EvaluatorBlockHandler(),
    new TranslateBlockHandler(),
    new CredentialBlockHandler(),
    new LoopBlockHandler(resolver, pathTracker),
    new ParallelBlockHandler(resolver, pathTracker),
    // GenericBlockHandler must always be last (catch-all)
    new GenericBlockHandler(),
  ]
}
