import { useState, useCallback } from 'react';
import { Send, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

import type { PlanningQuestion } from '@/features/ai-chat/types';
import {
  QUESTION_TYPE,
  CUSTOM_OPTION_VALUE,
} from '@/features/ai-chat/constants';

type PlanningQnABoxProps = {
  questions: PlanningQuestion[];
  onSubmit: (formattedAnswer: string) => void;
  onCancel: () => void;
  isSending?: boolean;
};

export const PlanningQnABox = ({
  questions,
  onSubmit,
  onCancel,
  isSending,
}: PlanningQnABoxProps) => {
  // answers keyed by question index
  const [answers, setAnswers] = useState<Record<number, string | string[]>>(
    {},
  );
  // custom text inputs for "Other" option on select questions
  const [customTexts, setCustomTexts] = useState<Record<number, string>>({});

  const setAnswer = useCallback(
    (index: number, value: string | string[]) => {
      setAnswers((prev) => ({ ...prev, [index]: value }));
    },
    [],
  );

  const setCustomText = useCallback(
    (index: number, value: string) => {
      setCustomTexts((prev) => ({ ...prev, [index]: value }));
    },
    [],
  );

  const isAllAnswered = questions.every((q, i) => {
    const answer = answers[i];
    if (answer === undefined || answer === null) return false;
    if (Array.isArray(answer)) {
      if (answer.length === 0) return false;
      // If __custom__ is selected, require the custom text to be filled in
      if (answer.includes(CUSTOM_OPTION_VALUE)) return (customTexts[i] ?? '').trim().length > 0;
      return true;
    }
    if (answer === CUSTOM_OPTION_VALUE) return (customTexts[i] ?? '').trim().length > 0;
    return typeof answer === 'string' && answer.trim().length > 0;
  });

  const formatAnswers = (): string => {
    return questions
      .map((q, i) => {
        const answer = answers[i];
        const customText = customTexts[i] ?? '';

        // Resolve a single value to its label, falling back to the value itself
        const resolveLabel = (v: string): string => {
          if (v === CUSTOM_OPTION_VALUE) return customText;
          return q.options?.find((o) => o.value === v)?.label ?? v;
        };

        let answerText: string;
        if (Array.isArray(answer)) {
          answerText = answer.map(resolveLabel).join('\n- ');
        } else {
          answerText = resolveLabel(answer ?? '');
        }

        return `${q.prompt}\n- ${answerText}`;
      })
      .join('\n\n');
  };

  const handleSubmit = () => {
    if (!isAllAnswered || isSending) return;
    onSubmit(formatAnswers());
  };

  return (
    <div className="border-border bg-card mx-2 mb-2 rounded-lg border shadow-sm">
      {/* Header */}
      <div className="border-border flex items-center justify-between border-b px-3 py-2">
        <span className="text-foreground text-xs font-semibold">
          Planning Questions
        </span>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Questions */}
      <div className="max-h-64 space-y-3 overflow-y-auto p-3">
        {questions.map((question, qIndex) => (
          <QuestionField
            key={qIndex}
            index={qIndex}
            question={question}
            answer={answers[qIndex]}
            customText={customTexts[qIndex] ?? ''}
            onAnswer={setAnswer}
            onCustomTextChange={setCustomText}
          />
        ))}
      </div>

      {/* Submit */}
      <div className="border-border border-t px-3 py-2">
        <Button
          onClick={handleSubmit}
          disabled={!isAllAnswered || isSending}
          size="sm"
          className="btn-create w-full gap-2"
        >
          <Send className="h-3.5 w-3.5" />
          {isSending ? 'Sending...' : 'Submit Answers'}
        </Button>
      </div>
    </div>
  );
};

// --- Individual question renderer ---

type QuestionFieldProps = {
  index: number;
  question: PlanningQuestion;
  answer: string | string[] | undefined;
  customText: string;
  onAnswer: (index: number, value: string | string[]) => void;
  onCustomTextChange: (index: number, value: string) => void;
};

const QuestionField = ({
  index,
  question,
  answer,
  customText,
  onAnswer,
  onCustomTextChange,
}: QuestionFieldProps) => {
  return (
    <div className="space-y-1.5">
      <label className="text-foreground block text-xs font-medium">
        {question.prompt}
      </label>

      {question.type === QUESTION_TYPE.TEXT && (
        <TextAnswer
          value={(answer as string) ?? ''}
          onChange={(v) => onAnswer(index, v)}
        />
      )}

      {question.type === QUESTION_TYPE.SINGLE_SELECT && (
        <SingleSelectAnswer
          options={question.options ?? []}
          value={(answer as string) ?? ''}
          allowCustom={question.allowCustom}
          customText={customText}
          onChange={(v) => onAnswer(index, v)}
          onCustomTextChange={(v) => onCustomTextChange(index, v)}
        />
      )}

      {question.type === QUESTION_TYPE.MULTI_SELECT && (
        <MultiSelectAnswer
          options={question.options ?? []}
          value={(answer as string[]) ?? []}
          allowCustom={question.allowCustom}
          customText={customText}
          onChange={(v) => onAnswer(index, v)}
          onCustomTextChange={(v) => onCustomTextChange(index, v)}
        />
      )}
    </div>
  );
};

// --- Text input ---

const TextAnswer = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    rows={2}
    className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-md border px-2.5 py-1.5 text-xs outline-none focus:ring-1"
    placeholder="Type your answer..."
  />
);

// --- Single select (radio) ---

const SingleSelectAnswer = ({
  options,
  value,
  allowCustom,
  customText,
  onChange,
  onCustomTextChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  allowCustom: boolean;
  customText: string;
  onChange: (v: string) => void;
  onCustomTextChange: (v: string) => void;
}) => {
  const isCustomSelected = value === CUSTOM_OPTION_VALUE;

  return (
    <div className="space-y-1">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            'border-border flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors',
            value === opt.value
              ? 'border-primary bg-primary/5 text-foreground'
              : 'hover:bg-muted/50 text-muted-foreground',
          )}
        >
          <input
            type="radio"
            name={`q-single-${options[0]?.value}`}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="accent-primary h-3 w-3"
          />
          {opt.label}
        </label>
      ))}
      {allowCustom && (
        <div className="space-y-1">
          <label
            className={cn(
              'border-border flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors',
              isCustomSelected
                ? 'border-primary bg-primary/5 text-foreground'
                : 'hover:bg-muted/50 text-muted-foreground',
            )}
          >
            <input
              type="radio"
              name={`q-single-${options[0]?.value}`}
              value={CUSTOM_OPTION_VALUE}
              checked={isCustomSelected}
              onChange={() => onChange(CUSTOM_OPTION_VALUE)}
              className="accent-primary h-3 w-3"
            />
            Other
          </label>
          {isCustomSelected && (
            <input
              type="text"
              value={customText}
              onChange={(e) => onCustomTextChange(e.target.value)}
              className="border-input bg-background text-foreground focus:ring-ring w-full rounded-md border px-2.5 py-1.5 text-xs outline-none focus:ring-1"
              placeholder="Type your answer..."
              autoFocus
            />
          )}
        </div>
      )}
    </div>
  );
};

// --- Multi select (checkbox) ---

const MultiSelectAnswer = ({
  options,
  value,
  allowCustom,
  customText,
  onChange,
  onCustomTextChange,
}: {
  options: { label: string; value: string }[];
  value: string[];
  allowCustom: boolean;
  customText: string;
  onChange: (v: string[]) => void;
  onCustomTextChange: (v: string) => void;
}) => {
  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const hasCustom = value.includes(CUSTOM_OPTION_VALUE);

  return (
    <div className="space-y-1">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            'border-border flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors',
            value.includes(opt.value)
              ? 'border-primary bg-primary/5 text-foreground'
              : 'hover:bg-muted/50 text-muted-foreground',
          )}
        >
          <input
            type="checkbox"
            value={opt.value}
            checked={value.includes(opt.value)}
            onChange={() => toggleOption(opt.value)}
            className="accent-primary h-3 w-3"
          />
          {opt.label}
        </label>
      ))}
      {allowCustom && (
        <div className="space-y-1">
          <label
            className={cn(
              'border-border flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors',
              hasCustom
                ? 'border-primary bg-primary/5 text-foreground'
                : 'hover:bg-muted/50 text-muted-foreground',
            )}
          >
            <input
              type="checkbox"
              checked={hasCustom}
              onChange={() => toggleOption(CUSTOM_OPTION_VALUE)}
              className="accent-primary h-3 w-3"
            />
            Other
          </label>
          {hasCustom && (
            <input
              type="text"
              value={customText}
              onChange={(e) => onCustomTextChange(e.target.value)}
              className="border-input bg-background text-foreground focus:ring-ring w-full rounded-md border px-2.5 py-1.5 text-xs outline-none focus:ring-1"
              placeholder="Type your answer..."
              autoFocus
            />
          )}
        </div>
      )}
    </div>
  );
};
