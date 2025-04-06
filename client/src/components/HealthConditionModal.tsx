import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Condition, ConditionQuestion } from "@/types";

interface HealthConditionModalProps {
  condition: Condition;
  onClose: () => void;
  onSubmit: (answers: Record<string, string>) => void;
}

/**
 * Health Condition Modal Component
 * 
 * This component implements a Q&A flow for health conditions where each answer
 * determines the next question to show, closely following the original eligibility.js
 * implementation from the Python application.
 */
const HealthConditionModal = ({
  condition,
  onClose,
  onSubmit,
}: HealthConditionModalProps) => {
  // Track the current question being shown
  const [currentQuestionId, setCurrentQuestionId] = useState<string>("");
  // Store answers provided by the user
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Track the final result ID when we reach an endpoint
  const [finalResultId, setFinalResultId] = useState<string | null>(null);
  // Keep a history of questions to allow going back
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
  const { toast } = useToast();

  // Initialize with the first question when the condition loads
  useEffect(() => {
    if (condition && condition.questions && condition.questions.length > 0) {
      const firstQuestionId = condition.questions[0]?.id || "";
      setCurrentQuestionId(firstQuestionId);
      setQuestionHistory([firstQuestionId]);
    }
  }, [condition]);

  // Get the current question object
  const currentQuestion = condition.questions.find(
    (q) => q.id === currentQuestionId
  );

  // Handle when a user selects an answer
  const handleAnswer = (value: string) => {
    // Store the answer
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionId]: value,
    }));

    if (!currentQuestion) return;

    // Find the answer object that matches the selected value
    const answer = currentQuestion.answers.find((a) => a.value === value);
    if (!answer) return;

    const nextQuestionId = answer.nextQuestionId;

    // Check if this answer leads to a final result
    if (nextQuestionId.startsWith("final")) {
      setFinalResultId(nextQuestionId);
    } else {
      // Move to the next question
      setCurrentQuestionId(nextQuestionId);
      setQuestionHistory(prev => [...prev, nextQuestionId]);
    }
  };

  // Go back to the previous question
  const handleBack = () => {
    if (questionHistory.length <= 1) return;
    
    // Remove the current question from history
    const newHistory = [...questionHistory];
    newHistory.pop();
    
    // Set the current question to the previous one
    const previousQuestionId = newHistory[newHistory.length - 1];
    setCurrentQuestionId(previousQuestionId);
    setQuestionHistory(newHistory);
    
    // Clear the final result if we're going back
    setFinalResultId(null);
  };

  // Submit the collected answers
  const handleSubmit = () => {
    // Make sure we have at least one answer
    if (Object.keys(answers).length === 0) {
      toast({
        title: "Incomplete Information",
        description: "Please answer at least one question about this condition.",
        variant: "destructive",
      });
      return;
    }

    // Include the final result ID if we have one
    const finalAnswers = finalResultId 
      ? { ...answers, _finalResultId: finalResultId }
      : answers;

    onSubmit(finalAnswers);
    onClose();
  };

  // Render the appropriate input for each question type
  const renderQuestionInput = (question: ConditionQuestion) => {
    switch (question.questionType) {
      case "yesNo":
        return (
          <div>
            <RadioGroup
              value={answers[question.id] || ""}
              onValueChange={handleAnswer}
              className="mt-2 space-y-2"
            >
              {question.answers.map(answer => (
                <div key={answer.value} className="flex items-center">
                  <RadioGroupItem value={answer.value} id={`${question.id}-${answer.value}`} />
                  <Label htmlFor={`${question.id}-${answer.value}`} className="ml-3">{answer.value}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      
      case "date":
        return (
          <div>
            <Select 
              value={answers[question.id] || ""} 
              onValueChange={handleAnswer}
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select a timeframe" />
              </SelectTrigger>
              <SelectContent>
                {question.answers.map(answer => (
                  <SelectItem key={answer.value} value={answer.value}>
                    {answer.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      default:
        // For text and any other question type, use a select
        return (
          <div>
            <Select 
              value={answers[question.id] || ""} 
              onValueChange={handleAnswer}
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select an answer" />
              </SelectTrigger>
              <SelectContent>
                {question.answers.map(answer => (
                  <SelectItem key={answer.value} value={answer.value}>
                    {answer.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {condition.name}
          </DialogTitle>
          <DialogDescription>
            Please provide additional information about this condition to determine eligibility.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="mt-4 space-y-6">
          {currentQuestion && (
            <div>
              <Label className="block text-lg font-medium">
                {currentQuestion.questionText}
              </Label>
              {renderQuestionInput(currentQuestion)}
            </div>
          )}
          
          {/* Display previous answers */}
          {Object.keys(answers).length > 1 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Previous Answers:</h4>
              <div className="space-y-1">
                {Object.entries(answers)
                  .filter(([id]) => id !== currentQuestionId)
                  .map(([id, value]) => {
                    const q = condition.questions.find(q => q.id === id);
                    return q ? (
                      <div key={id} className="text-sm text-gray-600">
                        <span className="font-medium">{q.questionText}:</span> {value}
                      </div>
                    ) : null;
                  })}
              </div>
            </div>
          )}

          {/* Show notification if we've reached a final result */}
          {finalResultId && (
            <div className="text-sm bg-blue-50 p-3 rounded-md text-blue-800 mt-4">
              We have enough information about this condition. Please click Submit to continue.
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div>
            {questionHistory.length > 1 && (
              <Button variant="outline" onClick={handleBack} type="button" size="sm">
                ← Back
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit}>
              Submit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HealthConditionModal;
