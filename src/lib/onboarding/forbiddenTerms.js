// Forbidden terms checker for learner-facing content
// Use in development to detect non-personal language in onboarding content

const LEARNER_FACING_FORBIDDEN_TERMS = [
  "העובדת",
  "העובד",
  "החניכה",
  "החניך",
  "המשתמשת",
  "המשתמש",
];

export function findForbiddenLearnerTerms(text = "") {
  return LEARNER_FACING_FORBIDDEN_TERMS.filter((term) => text.includes(term));
}

export function hasForbiddenLearnerTerms(text = "") {
  return findForbiddenLearnerTerms(text).length > 0;
}