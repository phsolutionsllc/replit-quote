(function(global, React, ReactDOM) {
    const { useState, useEffect } = React;
    
    const scrollbarStyles = `
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
      }
      
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.5);
        border-radius: 3px;
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

        .modal-content {
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 90%;
        width: 800px;
        max-height: 90vh;
        position: relative;
        overflow: hidden;
      }

      .modal-body {
        max-height: calc(90vh - 250px);
        overflow-y: auto;
        padding-right: 16px;
      }
        
      .modal-close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 24px;
        z-index: 1001;
        color: #888;
      }
    `;

    function Modal({ isOpen, onClose, children }) {
      if (!isOpen) return null;
  
      return (
        <div className="modal-overlay">
          <style>{scrollbarStyles}</style>
          <div className="modal-content">
            <button 
              onClick={onClose}
              className="modal-close"
              aria-label="Close modal"
            >
              ✕
            </button>
            {children}
          </div>
        </div>
      );
    }

    function CarrierFilter() {
      const [isModalOpen, setIsModalOpen] = useState(false);
      const [locationId, setLocationId] = useState(null);
      const [fexCarriers, setFexCarriers] = useState({});
      const [termCarriers, setTermCarriers] = useState({});
      const [activeTab, setActiveTab] = useState('fex');
      const [isLoading, setIsLoading] = useState(true);
      const [hasChanges, setHasChanges] = useState(false);

      // Your existing carrier objects (TERM_CARRIERS and FEX_CARRIERS)...
      const TERM_CARRIERS = {
        'American Amicable': [
          'American Amicable (Easy Term)',
          'American Amicable (Home Certainty)',
          'American Amicable (Home Protector)',
          'American Amicable (Pioneer Security)',
          'American Amicable (Safecare Term)',
          'American Amicable (Survivor Protector)',
          'American Amicable (Term Made Simple)'
        ],
        'Americo': [
          'Americo (Continuation 10)',
          'Americo (Continuation 25)',
          'Americo (HMS)',
          'Americo (Payment Protector Continuation)',
          'Americo (Payment Protector)'
        ],
        'Foresters': [
          'Foresters (Strong Foundation)',
          'Foresters (Your Term Medical)',
          'Foresters (Your Term)'
        ],
        'Other': [
          'GTL (Turbo Term)',
          'InstaBrain (Term)',
          'John Hancock (Simple Term with Vitality 2023)',
          'Kansas City Life',
          'Mutual of Omaha (Term Life Express)',
          'National Life Group (LSW Level Term)',
          'Primerica (Term Now)',
          'Protective (Classic Choice Term)',
          'UHL (Simple Term)'
        ],
        'Quoting Only': [
          'Royal Neighbors (Jet Term)',
          'Transamerica (Trendsetter LB 2017)',
          'Transamerica (Trendsetter Super 2021)',
        ]
      };

      const FEX_CARRIERS = {
        'AIG': ['AIG (GIWL)', 'AIG (SIWL)'],
        'Aetna': [
          'Aetna (Protection Series)',
          'Aetna (Protection Series) (MT)'
        ],
        'American Amicable': [
          'American Amicable (American Guardian)',
          'American Amicable (American Legacy)',
          'American Amicable (Dignity Solutions)',
          'American Amicable (Family Choice)',
          'American Amicable (Family Legacy)',
          'American Amicable (Family Protector Family Plan)',
          'American Amicable (Family Protector Legacy Plan)',
          'American Amicable (Family Solution)',
          'American Amicable (Golden Solution)',
          'American Amicable (Innovative Choice)',
          'American Amicable (Innovative Solutions)',
          'American Amicable (Peace of Mind Family Plan)',
          'American Amicable (Peace of Mind NC)',
          'American Amicable (Peace of Mind)',
          'American Amicable (Platinum Solution Family Plan)',
          'American Amicable (Platinum Solution Legacy Plan)',
          'American Amicable (Senior Choice)'
        ],
        'American Home Life': [
          'American Home Life (GuideStar 0-44)',
          'American Home Life (GuideStar 45+)',
          'American Home Life (Patriot Series)'
        ],
        'Baltimore Life': [
          'Baltimore Life (Silver Guard)',
          'Baltimore Life (aPriority 0-49)',
          'Baltimore Life (aPriority 50+)',
          'Baltimore Life (iProvide 45-69)',
          'Baltimore Life (iProvide 70+)'
        ],
        'Bankers Fidelity': [
          'Bankers Fidelity Final Expense',
          'Bankers Fidelity Final Expense (MT)'
        ],
        'CVS': [
          'CVS (Aetna Accendo)',
          'CVS (Aetna Accendo) (MT)'
        ],
        'Occidental Life': [
          'Occidental Life (American Guardian)',
          'Occidental Life (American Legacy)',
          'Occidental Life (Dignity Solutions)',
          'Occidental Life (Family Choice)',
          'Occidental Life (Family Legacy)',
          'Occidental Life (Family Protector Family Plan)',
          'Occidental Life (Family Protector Legacy Plan)',
          'Occidental Life (Family Solution)',
          'Occidental Life (Golden Solution)',
          'Occidental Life (Innovative Choice)',
          'Occidental Life (Innovative Solutions)',
          'Occidental Life (Peace of Mind Family Plan)',
          'Occidental Life (Peace of Mind NC)',
          'Occidental Life (Peace of Mind)',
          'Occidental Life (Platinum Solution Family Plan)',
          'Occidental Life (Platinum Solution Legacy Plan)',
          'Occidental Life (Senior Choice)'
        ],
        'Royal Arcanum': [
          'Royal Arcanum (Graded Benefit)',
          'Royal Arcanum (SIWL)',
          'Royal Arcanum (Whole Life)'
        ],
        'Royal Neighbors': [
          'Royal Neighbors (Ensured Legacy)',
          'Royal Neighbors (Jet Whole Life)'
        ],
        'Transamerica': [
          'Transamerica (Express)',
          'Transamerica (Solutions)'
        ],
        'Other': [
          'Aflac (Final Expense)',
          'Americo',
          'Better Life',
          'Catholic Financial (Graded Whole Life)',
          'Christian Fidelity',
          'Cica Life (Superior Choice)',
          'Cincinnati Equitable',
          'Elco (Silver Eagle)',
          'Family Benefit Life',
          'Fidelity Life (RAPIDecision Guaranteed Issue)',
          'First Guaranty',
          'Foresters (PlanRight)',
          'GPM',
          'Gerber',
          'Guarantee Trust Life',
          'Illinois Mutual (Path Protector Plus)',
          'KSKJ',
          'LCBA (Loyal Christian Benefit Association)',
          'Lafayette Life',
          'Liberty Bankers',
          'Lifeshield',
          'Lincoln Heritage',
          'Mutual of Omaha (Living Promise)',
          'Oxford',
          'Pekin (Final Expense)',
          'Polish Falcons',
          'SBLI (Living Legacy)',
          'Security National (Loyalty Plan)',
          'Senior Life (Platinum Protection)',
          'Sentinel',
          'Standard Life',
          'Trinity Life',
          'UHL'
        ],
        'Quoting Only': [
          'Mountain Life',
        ]
      };

      useEffect(() => {
        // get locationID from URL
        const params = new URLSearchParams(window.location.search);
        const urlLocId = params.get('locationID') || '';
      
        // get locationID from hidden field
        const hiddenField = document.getElementById('locationID');
        const hiddenLocId = hiddenField ? hiddenField.value : '';
      
        // pick whichever is longer
        const finalLocId = urlLocId.length > hiddenLocId.length ? urlLocId : hiddenLocId;
      
        console.log('[CarrierFilter] urlLocId=', urlLocId, 'hiddenLocId=', hiddenLocId, 'finalLocId=', finalLocId);
      
        if (finalLocId) {
          setLocationId(finalLocId);
          loadPreferences(finalLocId);
        } else {
          // fallback to defaults if neither is set
          setFexCarriers(createDefaultPreferences(FEX_CARRIERS));
          setTermCarriers(createDefaultPreferences(TERM_CARRIERS));
          setIsLoading(false);
        }
      }, []);

      const createDefaultPreferences = (carriers) => {
        const defaults = {};
        Object.entries(carriers).forEach(([parent, carrierList]) => {
          carrierList.forEach(carrier => {
            defaults[carrier] = true;
          });
        });
        return defaults;
      };

      const loadPreferences = async (locId) => {
        console.log('[CarrierFilter] loadPreferences called with locId=', locId);
        try {
          const response = await fetch(`/api/carrier-preferences/${locId}`);
          if (response.ok) {
            const data = await response.json();
            setFexCarriers(data.fexPreferences || createDefaultPreferences(FEX_CARRIERS));
            setTermCarriers(data.termPreferences || createDefaultPreferences(TERM_CARRIERS));
          } else {
            setFexCarriers(createDefaultPreferences(FEX_CARRIERS));
            setTermCarriers(createDefaultPreferences(TERM_CARRIERS));
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
          setFexCarriers(createDefaultPreferences(FEX_CARRIERS));
          setTermCarriers(createDefaultPreferences(TERM_CARRIERS));
        } finally {
          setIsLoading(false);
        }
      };

      const savePreferences = async () => {
        if (!locationId) return;
        
        try {
          await fetch(`/api/carrier-preferences/${locationId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fexPreferences: fexCarriers,
              termPreferences: termCarriers
            })
          });
          setHasChanges(false);
          // Close the modal immediately after saving preferences
          setIsModalOpen(false);
          // Optional: reload or preserve locationID param:
          // window.location.search = `?locationID=${locationId}`;
        } catch (error) {
          console.error('Error saving preferences:', error);
        }
      };

      const toggleCarrier = (carrier, isTermCarrier) => {
        setHasChanges(true);
        if (isTermCarrier) {
          setTermCarriers(prev => ({
            ...prev,
            [carrier]: !prev[carrier]
          }));
        } else {
          setFexCarriers(prev => ({
            ...prev,
            [carrier]: !prev[carrier]
          }));
        }
      };

      const toggleParentCarrier = (parent, carriers, isTermCarrier) => {
        setHasChanges(true);
        const currentPreferences = isTermCarrier ? termCarriers : fexCarriers;
        const allChecked = carriers.every(carrier => currentPreferences[carrier]);
        const newValue = !allChecked;
        
        if (isTermCarrier) {
          const newPreferences = { ...termCarriers };
          carriers.forEach(carrier => {
            newPreferences[carrier] = newValue;
          });
          setTermCarriers(newPreferences);
        } else {
          const newPreferences = { ...fexCarriers };
          carriers.forEach(carrier => {
            newPreferences[carrier] = newValue;
          });
          setFexCarriers(newPreferences);
        }
      };

      const renderCarrierGroup = (carriers, isTermCarrier) => {
        const currentPreferences = isTermCarrier ? termCarriers : fexCarriers;
        
        return Object.entries(carriers).map(([parent, carrierList]) => (
          <div key={parent} className="border-b pb-2 mb-4">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={carrierList.every(carrier => currentPreferences[carrier])}
                onChange={() => toggleParentCarrier(parent, carrierList, isTermCarrier)}
                className="w-4 h-4 mr-2"
              />
              <span className="font-medium">{parent}</span>
            </div>
            <div className="ml-6 space-y-1">
              {carrierList.map(carrier => (
                <div key={carrier} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={currentPreferences[carrier] || false}
                    onChange={() => toggleCarrier(carrier, isTermCarrier)}
                    className="w-4 h-4 mr-2"
                  />
                  <span className="text-sm">{carrier.replace(`${parent} `, '')}</span>
                </div>
              ))}
            </div>
          </div>
        ));
      };

      if (isLoading) {
        return (
          <button className="custom-button" disabled>
            Loading...
          </button>
        );
      }

      return (
        <>
          <button 
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="custom-button bg-blue-600 text-white hover:bg-blue-700"
          >
            Customize Carriers
          </button>

          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <div>
              <h2 className="text-2xl font-bold mb-4">Customize Carriers</h2>
              <div className="flex justify-center space-x-4 mb-6">
                <button
                  onClick={() => setActiveTab('fex')}
                  className={`px-4 py-2 rounded ${activeTab === 'fex' ? 'bg-blue-600 text-white' : 'text-blue-600 border border-blue-600'}`}
                >
                  FEX Carriers
                </button>
                <button
                  onClick={() => setActiveTab('term')}
                  className={`px-4 py-2 rounded ${activeTab === 'term' ? 'bg-blue-600 text-white' : 'text-blue-600 border border-blue-600'}`}
                >
                  Term Carriers
                </button>
              </div>
              
              <div className="modal-body custom-scrollbar">
                {activeTab === 'fex' && renderCarrierGroup(FEX_CARRIERS, false)}
                {activeTab === 'term' && renderCarrierGroup(TERM_CARRIERS, true)}
              </div>

              <div className="pt-4 flex justify-end space-x-4 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={savePreferences}
                  disabled={!hasChanges}
                  className={`px-4 py-2 rounded text-white ${hasChanges ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'}`}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </Modal>
        </>
      );
    }
        
  
    // Render the component
    const carrierFilterRoot = document.getElementById('carrierFilterRoot');
    if (carrierFilterRoot) {
      ReactDOM.render(<CarrierFilter />, carrierFilterRoot);
    }
  
  })(window, React, ReactDOM);