import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
 * implementation.
 */
const HealthConditionModal = ({
  condition,
  onClose,
  onSubmit,
}: HealthConditionModalProps) => {
  // Track the current question being shown
  const [currentQuestionId, setCurrentQuestionId] = useState<string>("");
  // Store answers provided by the user
  const [responses, setResponses] = useState<Record<string, string>>({});
  // Track the final result ID when we reach an endpoint
  const [finalResultId, setFinalResultId] = useState<string | null>(null);
  // Keep a history of questions to allow going back
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
  // For editing mode - to show a summary of responses
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewingResponses, setIsViewingResponses] = useState(false);
  const { toast } = useToast();

  // Helper function to find a question by ID in the array
  const getQuestionById = (qId: string) => {
    return condition.questions.find((q) => q.id === qId);
  };

  // Initialize with the first question or existing answers when the condition loads
  useEffect(() => {
    if (condition && condition.questions && condition.questions.length > 0) {
      // Check if we have existing answers (edit mode)
      if (condition.answers && Object.keys(condition.answers).length > 0) {
        setResponses(condition.answers);
        setIsEditMode(true);
        
        // If there's a finalResultId in the existing answers, set it
        if (condition.answers._finalResultId) {
          setFinalResultId(condition.answers._finalResultId);
        }
        
        // Initially show the response summary
        setIsViewingResponses(true);
      } else {
        // New condition - normal flow
        const firstQuestionId = condition.questions[0]?.id || "";
        setCurrentQuestionId(firstQuestionId);
        setQuestionHistory([firstQuestionId]);
      }
    }
  }, [condition]);

  // Get the current question object
  const currentQuestion = getQuestionById(currentQuestionId);

  // Store the chosen answer and determine the next question
  const handleAnswerChange = (name: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle multiple choice answer selection, similar to eligibility.js
  const handleMultipleChoiceSelect = (questionText: string, selectedOption: string) => {
    if (!currentQuestion) return;

    // Store the answer with the question text as the key
    handleAnswerChange(questionText, selectedOption);

    // Find the matching answer object to get the next question ID
    const chosen = currentQuestion.answers.find((a) => a.value === selectedOption);
    if (!chosen) {
      // No next question ID found, treat as completion
      handleConditionCompletion(null);
      return;
    }

    const nextId = chosen.nextQuestionId;

    // Check if this is a final result (starts with 'final')
    if (nextId.toLowerCase().startsWith("final")) {
      handleConditionCompletion(nextId);
    } else {
      // Move to the next question
      setCurrentQuestionId(nextId);
      setQuestionHistory(prev => [...prev, nextId]);
    }
  };

  // Go back to the previous question
  const handleBack = () => {
    if (isViewingResponses) {
      // If viewing response summary, start the Q&A flow from beginning
      const firstQuestionId = condition.questions[0]?.id || "";
      setCurrentQuestionId(firstQuestionId);
      setQuestionHistory([firstQuestionId]);
      setIsViewingResponses(false);
      return;
    }
    
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

  // Handle condition completion - look up final results if applicable
  const handleConditionCompletion = (finalId: string | null) => {
    if (finalId) {
      setFinalResultId(finalId);
    }

    // Include the final result ID if available
    const finalAnswers = finalId 
      ? { ...responses, _finalResultId: finalId }
      : responses;
  
    // No toast notification needed
  };

  // Show a success message when all questions are answered
  const handleSubmit = () => {
    // Make sure we have at least one answer
    if (Object.keys(responses).length === 0) {
      toast({
        title: "Incomplete Information",
        description: "Please answer at least one question about this condition.",
        variant: "destructive",
      });
      return;
    }

    // Include the final result ID if we have one
    const finalAnswers = finalResultId 
      ? { ...responses, _finalResultId: finalResultId }
      : responses;

    onSubmit(finalAnswers);
    onClose();
  };

  // Render the appropriate input for each question type
  const renderQuestion = (question: ConditionQuestion) => {
    switch (question.questionType) {
      case "yesNo":
        return (
          <div className="flex flex-col space-y-2">
            <RadioGroup
              value={responses[question.questionText] || ""}
              onValueChange={(value) => handleMultipleChoiceSelect(question.questionText, value)}
              className="flex flex-col space-y-2"
            >
              {["Yes", "No"].map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                  <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      
      case "date":
      case "text":
      default:
        // For all other question types, render answer options as buttons
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            {question.answers.map((ans) => (
              <Button
                key={ans.value}
                variant="outline"
                onClick={() => handleMultipleChoiceSelect(question.questionText, ans.value)}
                className={`px-4 py-2 ${
                  responses[question.questionText] === ans.value ? "bg-blue-50 border-blue-300" : ""
                }`}
              >
                {ans.value}
              </Button>
            ))}
          </div>
        );
    }
  };
  
  // Render a summary of existing responses
  const renderResponseSummary = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800">
          Current Responses
        </h3>
        <div className="space-y-2 bg-gray-50 p-4 rounded-md">
          {Object.entries(responses).map(([question, answer]) => {
            // Skip metadata
            if (question.startsWith('_')) return null;
            
            return (
              <div key={question} className="border-b border-gray-200 pb-2 mb-2 last:border-b-0 last:mb-0 last:pb-0">
                <p className="text-sm font-medium text-gray-700">{question}</p>
                <p className="text-base text-gray-900">{answer}</p>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between">
          <Button 
            variant="outline"
            onClick={() => setIsViewingResponses(false)}
            className="mt-2"
          >
            Edit Responses
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            className="mt-2"
          >
            Save Without Changes
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {condition.name}
            <span className="absolute -z-10 inset-x-0 bottom-0 h-[8px] bg-gradient-to-r from-blue-100 to-purple-100 opacity-50 blur-sm"></span>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isEditMode ? "Edit your responses for this condition." : "Please provide information about this condition."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isViewingResponses ? (
            renderResponseSummary()
          ) : currentQuestion ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">
                {currentQuestion.questionText}
              </h3>
              {renderQuestion(currentQuestion)}
            </div>
          ) : finalResultId ? (
            <p className="text-sm text-gray-700">All questions completed.</p>
          ) : (
            <p className="text-sm text-gray-700">Loading questions...</p>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          {!isViewingResponses && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={questionHistory.length <= 1 && !isViewingResponses}
              className="mr-auto"
            >
              Back
            </Button>
          )}
          
          {!isViewingResponses && (
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={Object.keys(responses).length === 0}
            >
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HealthConditionModal;
