import { createContext, useContext, useEffect } from "react";

export const QuestionEvidenceContext = createContext<{
  stage: string;
  record: (keys: readonly string[]) => void;
}>({ stage: "", record: () => {} });

/** Records only mounted, answerable controls, independently of their labels. */
export function useQuestionEvidence(keys: readonly string[], enabled = true) {
  const { stage, record } = useContext(QuestionEvidenceContext);
  const signature = keys.join("|");
  useEffect(() => {
    if (enabled && stage && signature) record(signature.split("|"));
  }, [enabled, stage, record, signature]);
}

export function AskedQuestions({ keys, enabled = true }: { keys: readonly string[]; enabled?: boolean }) {
  useQuestionEvidence(keys, enabled);
  return null;
}