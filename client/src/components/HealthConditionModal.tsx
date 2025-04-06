import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Condition, ConditionQuestion } from "@/types";

interface HealthConditionModalProps {
  condition: Condition;
  onClose: () => void;
  onSubmit: (answers: Record<string, string>) => void;
}

const HealthConditionModal = ({
  condition,
  onClose,
  onSubmit,
}: HealthConditionModalProps) => {
  const [currentQuestionId, setCurrentQuestionId] = useState<string>(
    condition.questions[0]?.id || ""
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const currentQuestion = condition.questions.find(
    (q) => q.id === currentQuestionId
  );

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionId]: value,
    }));

    const answer = currentQuestion?.answers.find((a) => a.value === value);
    
    if (answer?.nextQuestionId.startsWith("final")) {
      // We've reached a final result
      handleSubmit();
    } else if (answer?.nextQuestionId) {
      // Move to the next question
      setCurrentQuestionId(answer.nextQuestionId);
    }
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < condition.questions.length) {
      toast({
        title: "Incomplete Answers",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    onSubmit(answers);
  };

  const renderQuestionInput = (question: ConditionQuestion) => {
    switch (question.questionType) {
      case "date":
        return (
          <div>
            <Label className="block text-sm font-medium text-gray-700">
              {question.questionText}
            </Label>
            <Input
              type="date"
              className="mt-1 block w-full"
              value={answers[question.id] || ""}
              onChange={(e) => handleAnswer(e.target.value)}
            />
          </div>
        );
      case "yesNo":
        return (
          <div>
            <Label className="block text-sm font-medium text-gray-700">
              {question.questionText}
            </Label>
            <RadioGroup
              value={answers[question.id] || ""}
              onValueChange={handleAnswer}
              className="mt-2 space-y-2"
            >
              <div className="flex items-center">
                <RadioGroupItem value="Yes" id={`${question.id}-yes`} />
                <Label htmlFor={`${question.id}-yes`} className="ml-3">Yes</Label>
              </div>
              <div className="flex items-center">
                <RadioGroupItem value="No" id={`${question.id}-no`} />
                <Label htmlFor={`${question.id}-no`} className="ml-3">No</Label>
              </div>
            </RadioGroup>
          </div>
        );
      default:
        return (
          <div>
            <Label className="block text-sm font-medium text-gray-700">
              {question.questionText}
            </Label>
            <Input
              type="text"
              className="mt-1 block w-full"
              value={answers[question.id] || ""}
              onChange={(e) => handleAnswer(e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {condition.name} Follow-up Questions
          </DialogTitle>
          <DialogDescription>
            Please provide additional information about this condition to determine eligibility.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {currentQuestion && renderQuestionInput(currentQuestion)}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HealthConditionModal;
