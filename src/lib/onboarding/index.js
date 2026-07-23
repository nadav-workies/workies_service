// Central re-export hub for onboarding modules — Spec v1.2 Section 34
export { ONBOARDING_TEMPLATE, getQuizForStage } from "../onboardingTemplate";
export { calculateQuizScore, isPassed } from "./scoring";
export {
  STAGE_STATUS_CONFIG,
  TRACK_STATUS_CONFIG,
  CATEGORY_LABELS,
  TASK_STATUS_CONFIG,
  REVIEW_TYPE_CONFIG,
  KPI_READINESS_STATUS_CONFIG,
  LEARNING_ITEM_STATUS_CONFIG,
  CLARIFICATION_STATUS_CONFIG,
  DAY_TYPE_CONFIG,
  LEARNING_ITEM_TYPE_CONFIG,
} from "./statuses";
export {
  KPI_DEFINITIONS,
  KPI_SIMULATION_TASKS,
  KPI_UNDERSTANDING_TOPICS,
  KPI_CONTRIBUTION_TYPES,
  READINESS_SCORE_WEIGHTS,
} from "./kpis";