(function(global, React, ReactDOM) {
  const { useState, useEffect } = React;

  /********************************************************************
   * Helper to find a question by ID in an array
   ********************************************************************/
  function getQuestionById(questions, qId) {
    return questions.find((q) => q.id === qId);
  }

  function EligibilityChecker() {
    const [rulesData, setRulesData] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [conditionQueue, setConditionQueue] = useState([]);
    const [currentCondition, setCurrentCondition] = useState(null);
    const [conditionsProcessing, setConditionsProcessing] = useState({});
    const [toast, setToast] = useState({ show: false, message: "" });
    const [completedConditions, setCompletedConditions] = useState({});
    const [selectedDatabaseType, setSelectedDatabaseType] = useState("TERM");

    // On mount, rehydrate from window.completedConditions if present
    useEffect(() => {
      if (window.completedConditions && Object.keys(window.completedConditions).length > 0) {
        console.log("[mount] Rehydrating local from window.completedConditions:", window.completedConditions);
        setCompletedConditions(window.completedConditions);
      }
    }, []);

    // Listen for changes to #quote-type (TERM/FEX)
    useEffect(() => {
      const quoteTypeSelect = document.getElementById("quote-type");
      if (quoteTypeSelect) {
        const updateQuoteType = () => {
          setSelectedDatabaseType(quoteTypeSelect.value.toUpperCase());
          console.log("[EligibilityChecker] Quote type updated to:", quoteTypeSelect.value.toUpperCase());
        };
        updateQuoteType(); // set initial value
        quoteTypeSelect.addEventListener("change", updateQuoteType);
        return () => quoteTypeSelect.removeEventListener("change", updateQuoteType);
      }
    }, []);

    // On selectedDatabaseType change, fetch the correct JSON (Term vs. FEX)
    useEffect(() => {
      if (!selectedDatabaseType) return;

      // For example: /static/js/termrules313.json or /static/js/fexrules313.json
      const coverage = selectedDatabaseType === "TERM" ? "term" : "fex";
      const filePath =
        coverage === "term"
          ? "/static/js/termsheet.json"
          : "/static/js/fexsheet.json";

      console.log("[useEffect:fetch] Attempting to fetch", filePath, "for coverage:", coverage);
      fetch(filePath)
        .then((response) => {
          console.log("[fetch]", filePath, "status:", response.status);
          return response.json();
        })
        .then((data) => {
          console.log("[fetch] Loaded rules data:", data);
          if (!data) {
            console.warn("[fetch]", filePath, "is empty or invalid");
            setRulesData({});
            return;
          }

          // If coverage = term => rulesData = data.Term.Conditions
          if (selectedDatabaseType === "TERM") {
            if (data.Term && data.Term.Conditions) {
              setRulesData(data.Term.Conditions);
            } else {
              setRulesData({});
            }
          } else {
            // coverage = FEX
            if (data.FEX && data.FEX.Conditions) {
              setRulesData(data.FEX.Conditions);
            } else {
              setRulesData({});
            }
          }
        })
        .catch((err) => {
          console.error("[fetch] Error loading", filePath, ":", err);
          setRulesData({});
        });
    }, [selectedDatabaseType]);

    // Keep completedConditions in sync with window
    useEffect(() => {
      window.completedConditions = completedConditions;
      console.log("[useEffect] completedConditions updated globally:", window.completedConditions);
    }, [completedConditions]);

    // If no current condition but we have a queue, pop next condition
    useEffect(() => {
      if (!currentCondition && conditionQueue.length > 0) {
        const nextCondition = conditionQueue[0];
        setConditionQueue((prevQueue) => prevQueue.slice(1));
        startQuestionFlow(nextCondition);
      }
    }, [currentCondition, conditionQueue]);

    // Merge new keys from completedConditions into selectedItems
    useEffect(() => {
      const mergedSet = new Set([...selectedItems, ...Object.keys(completedConditions)]);
      if (mergedSet.size !== selectedItems.length) {
        setSelectedItems([...mergedSet]);
      }
    }, [completedConditions]);

    // getAllConditionNames => just keys of rulesData
    function getAllConditionNames(rulesDataObj) {
      return Object.keys(rulesDataObj || {});
    }

    function fetchSuggestions(query) {
      if (!query) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      if (!rulesData) return;
      const allConditionNames = getAllConditionNames(rulesData);
      const results = allConditionNames.filter((name) =>
        name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }

    function handleInputChange(e) {
      const query = e.target.value;
      setSearchQuery(query);
      if (rulesData) {
        fetchSuggestions(query);
      }
    }

    function handleSuggestionClick(suggestion) {
      if (!selectedItems.includes(suggestion)) {
        setSelectedItems([...selectedItems, suggestion]);
        setConditionQueue([...conditionQueue, suggestion]);
        showToast(`Condition/Medication "${suggestion}" added successfully.`);
      }
      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
    }

    function handleRemoveItem(item) {
      setSelectedItems((prev) => prev.filter((s) => s !== item));
      setConditionQueue((prev) => prev.filter((c) => c !== item));
      setCompletedConditions((prev) => {
        const newObj = { ...prev };
        delete newObj[item];
        return newObj;
      });
      if (item === currentCondition) {
        setCurrentCondition(null);
        setConditionsProcessing((prev) => {
          const newState = { ...prev };
          delete newState[item];
          return newState;
        });
      }
    }

    // startQuestionFlow => load the Condition's questions/finalResults into conditionsProcessing
    function startQuestionFlow(condition) {
      setCurrentCondition(condition);
      if (!rulesData) return;

      const condObj = rulesData[condition];
      if (!condObj) {
        // fallback if not found
        setConditionsProcessing((prev) => ({
          ...prev,
          [condition]: {
            questions: [],
            finalResults: [],
            currentQuestionId: null,
            responses: {},
          },
        }));
        return;
      }

      console.log("[startQuestionFlow] condition:", condition, "condObj:", condObj);

      const rawQuestions = condObj.questions || [];
      const finalResults = condObj.finalResults || [];

      setConditionsProcessing((prev) => ({
        ...prev,
        [condition]: {
          questions: rawQuestions,
          finalResults,
          currentQuestionId: rawQuestions.length > 0 ? rawQuestions[0].id : null,
          responses: {},
        },
      }));
    }

    // handleAnswerChange => store the chosen answer in state
    function handleAnswerChange(condition, syntheticEvent) {
      const { name, value } = syntheticEvent.target;
      setConditionsProcessing((prev) => ({
        ...prev,
        [condition]: {
          ...prev[condition],
          responses: {
            ...prev[condition].responses,
            [name]: value,
          },
        },
      }));
    }

    // handleMultipleChoiceSelect => record the user's choice, then figure out the next question or final
    function handleMultipleChoiceSelect(condition, question, selectedOption) {
      // Store the answer
      const syntheticEvent = {
        target: { name: question.questionText, value: selectedOption },
      };
      handleAnswerChange(condition, syntheticEvent);

      // find the matching answer object
      const chosen = question.answers.find((a) => a.value === selectedOption);
      if (!chosen) {
        // no nextQuestionId => condition complete
        handleConditionCompletion(condition, null);
        return;
      }
      const nextId = chosen.nextQuestionId;

      // If nextQuestionId starts with 'final', we jump to final results
      if (nextId.toLowerCase().startsWith("final")) {
        handleConditionCompletion(condition, nextId);
      } else {
        // go to next question
        setConditionsProcessing((prev) => {
          const newState = { ...prev };
          newState[condition] = {
            ...newState[condition],
            currentQuestionId: nextId,
          };
          return newState;
        });
      }
    }

    // handleConditionCompletion => look up final underwriting array from condObj.finalResults
    function handleConditionCompletion(condition, finalId) {
      const cState = conditionsProcessing[condition];
      if (!cState) return;

      let underwriting = [];
      if (finalId) {
        // find the finalResults entry for finalId
        const foundFR = cState.finalResults.find((f) => f.id === finalId);
        if (foundFR && foundFR.underwriting) {
          underwriting = foundFR.underwriting;
        }
      }

      // Store final results in completedConditions
      setCompletedConditions((prev) => ({
        ...prev,
        [condition]: {
          responses: cState.responses,
          carriersResult: underwriting,
        },
      }));

      // Clear Q&A state
      setConditionsProcessing((prev) => {
        const newState = { ...prev };
        delete newState[condition];
        return newState;
      });
      setCurrentCondition(null);
    }

    function handleQuoteSearch(e) {
      e.preventDefault();
      console.log("[handleQuoteSearch] Completed conditions for quote evaluation:", completedConditions);
      // Possibly display or forward these final results somewhere
    }

    function showToast(message) {
      setToast({ show: true, message });
      setTimeout(() => setToast({ show: false, message: "" }), 3000);
    }

    // We'll adapt our rendering based on question.questionType
    function renderQuestion(condition, question) {
      const conditionState = conditionsProcessing[condition];
      if (!conditionState) return null;

      // For yesNo, date, multiple_choice, etc.:
      if (question.questionType === "yesNo") {
        return (
          <div className="flex justify-center gap-4">
            {["Yes", "No"].map((option) => (
              <button
                key={option}
                type="button"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={(e) => {
                  e.preventDefault();
                  handleMultipleChoiceSelect(condition, question, option);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        );
      } else if (question.questionType === "date") {
        // This is not a text input date; your JSON says user picks Over/Under, etc.
        // If your JSON truly wants an actual date input, we can do so. 
        // But from the snippet, it looks like the user might pick from the question's answers array anyway.
        // So let's treat it the same as multiple-choice if the JSON has answers.
        // Or if you do want a custom date field, you'd handle it similarly to your old DateQuestion.

        // If you want to replicate the old date picking approach, you can do so:
        // (But your new JSON suggests you have something like { value: 'Under 10 years ago' } for the answers.)
        return (
          <div>
            {question.answers.map((ans) => (
              <button
                key={ans.value}
                type="button"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 m-2"
                onClick={(e) => {
                  e.preventDefault();
                  handleMultipleChoiceSelect(condition, question, ans.value);
                }}
              >
                {ans.value}
              </button>
            ))}
          </div>
        );
      } else {
        // fallback for multiple_choice or other question types
        return (
          <div>
            {question.answers.map((ans) => (
              <button
                key={ans.value}
                type="button"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 m-2"
                onClick={(e) => {
                  e.preventDefault();
                  handleMultipleChoiceSelect(condition, question, ans.value);
                }}
              >
                {ans.value}
              </button>
            ))}
          </div>
        );
      }
    }

    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Eligibility Checker</h1>

        {toast.show && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
            {toast.message}
          </div>
        )}

        <form onSubmit={handleQuoteSearch}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Search Conditions/Medications"
            className="w-full border border-gray-300 rounded px-4 py-2 mb-4 shadow-sm"
          />
        </form>

        {showSuggestions && (
          <ul className="border border-gray-300 rounded shadow-md">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}

        {/* Selected condition chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
            >
              <span>{item}</span>
              <button
                onClick={() => handleRemoveItem(item)}
                className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        {/* Render any active questions */}
        {selectedItems.map((item) => {
          const cState = conditionsProcessing[item];
          if (!cState) return null;

          const currentQ = getQuestionById(cState.questions, cState.currentQuestionId);
          if (!currentQ) return null;

          return (
            <div key={item} className="p-4 border rounded mb-4 bg-white shadow">
              <h3 className="text-xl font-semibold mb-2">{item}</h3>
              <p className="mb-2">{currentQ.questionText || currentQ.text}</p>
              {renderQuestion(item, currentQ)}
            </div>
          );
        })}
      </div>
    );
  }

  ReactDOM.render(<EligibilityChecker />, document.getElementById("eligibilityChecker"));
})(window, React, ReactDOM);