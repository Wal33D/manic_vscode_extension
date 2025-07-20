// @ts-check
(function() {
  const vscode = acquireVsCodeApi();
  
  let objectiveDefinitions = [];
  let currentDefinition = null;
  let editorState = { isDatFile: false, hasObjectivesSection: false };

  // Elements
  const typeSelect = document.getElementById('objective-type');
  const parametersDiv = document.getElementById('parameters');
  const previewDiv = document.getElementById('preview');
  const insertBtn = document.getElementById('insert-btn');
  const validateBtn = document.getElementById('validate-btn');
  const messagesDiv = document.getElementById('messages');

  // Initialize
  function init() {
    // Request objective types from extension
    vscode.postMessage({ type: 'requestObjectiveTypes' });

    // Event listeners
    typeSelect.addEventListener('change', onTypeChange);
    insertBtn.addEventListener('click', onInsert);
    validateBtn.addEventListener('click', onValidate);

    // Example clicks
    document.querySelectorAll('.example').forEach(example => {
      example.addEventListener('click', () => {
        const objective = example.getAttribute('data-objective');
        if (objective) {
          insertObjective(objective);
        }
      });
    });
  }

  // Handle type selection change
  function onTypeChange() {
    const selectedType = typeSelect.value;
    currentDefinition = objectiveDefinitions.find(def => def.type === selectedType);
    
    if (currentDefinition) {
      renderParameters();
      updatePreview();
      updateButtonStates();
    } else {
      parametersDiv.innerHTML = '';
      previewDiv.textContent = '';
      updateButtonStates();
    }
  }

  // Render parameter inputs
  function renderParameters() {
    parametersDiv.innerHTML = '';
    
    currentDefinition.parameters.forEach(param => {
      const group = document.createElement('div');
      group.className = 'parameter-group';
      
      const label = document.createElement('label');
      label.textContent = param.name.charAt(0).toUpperCase() + param.name.slice(1) + ':';
      label.setAttribute('for', `param-${param.name}`);
      group.appendChild(label);
      
      if (param.type === 'enum' && param.enum) {
        const select = document.createElement('select');
        select.id = `param-${param.name}`;
        select.className = 'form-control';
        select.addEventListener('change', updatePreview);
        
        param.enum.forEach(value => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = formatBuildingName(value);
          if (value === param.default) {
            option.selected = true;
          }
          select.appendChild(option);
        });
        
        group.appendChild(select);
      } else if (param.type === 'coordinates') {
        const coordGroup = document.createElement('div');
        coordGroup.className = 'coordinate-input-group';
        
        const xInput = document.createElement('input');
        xInput.type = 'number';
        xInput.id = `param-${param.name}-x`;
        xInput.className = 'form-control';
        xInput.placeholder = 'X';
        xInput.value = '10';
        xInput.addEventListener('input', updatePreview);
        
        const separator = document.createElement('span');
        separator.textContent = ',';
        
        const yInput = document.createElement('input');
        yInput.type = 'number';
        yInput.id = `param-${param.name}-y`;
        yInput.className = 'form-control';
        yInput.placeholder = 'Y';
        yInput.value = '10';
        yInput.addEventListener('input', updatePreview);
        
        coordGroup.appendChild(xInput);
        coordGroup.appendChild(separator);
        coordGroup.appendChild(yInput);
        group.appendChild(coordGroup);
      } else {
        const input = document.createElement('input');
        input.type = param.type === 'number' ? 'number' : 'text';
        input.id = `param-${param.name}`;
        input.className = 'form-control';
        input.placeholder = param.description;
        input.value = param.default || '';
        input.addEventListener('input', updatePreview);
        
        if (param.type === 'number') {
          input.min = '0';
        }
        
        group.appendChild(input);
      }
      
      if (param.description) {
        const desc = document.createElement('div');
        desc.className = 'parameter-description';
        desc.textContent = param.description;
        group.appendChild(desc);
      }
      
      parametersDiv.appendChild(group);
    });
  }

  // Update preview
  function updatePreview() {
    if (!currentDefinition) {
      previewDiv.textContent = '';
      return;
    }
    
    let objective = currentDefinition.template;
    
    currentDefinition.parameters.forEach(param => {
      let value = '';
      
      if (param.type === 'coordinates') {
        const xInput = document.getElementById(`param-${param.name}-x`);
        const yInput = document.getElementById(`param-${param.name}-y`);
        value = `${xInput?.value || '0'},${yInput?.value || '0'}`;
      } else {
        const input = document.getElementById(`param-${param.name}`);
        value = input?.value || '';
      }
      
      objective = objective.replace(`{${param.name}}`, value);
    });
    
    previewDiv.textContent = objective;
  }

  // Insert objective
  function onInsert() {
    const objective = previewDiv.textContent;
    if (objective) {
      insertObjective(objective);
    }
  }

  function insertObjective(objective) {
    vscode.postMessage({
      type: 'insertObjective',
      objective: objective
    });
  }

  // Validate objective
  function onValidate() {
    const objective = previewDiv.textContent;
    if (objective) {
      vscode.postMessage({
        type: 'validateObjective',
        objective: objective
      });
    }
  }

  // Update button states
  function updateButtonStates() {
    const hasObjective = previewDiv.textContent.trim().length > 0;
    const canInsert = hasObjective && editorState.isDatFile;
    
    insertBtn.disabled = !canInsert;
    validateBtn.disabled = !hasObjective;
    
    if (!editorState.isDatFile) {
      showMessage('Please open a Manic Miners DAT file to insert objectives', 'warning');
    }
  }

  // Show message
  function showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    messagesDiv.innerHTML = '';
    messagesDiv.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 5000);
  }

  // Format building name
  function formatBuildingName(buildingType) {
    return buildingType
      .replace('Building', '')
      .replace('_C', '')
      .replace(/([A-Z])/g, ' $1')
      .trim();
  }

  // Handle messages from extension
  window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.type) {
      case 'objectiveTypes':
        objectiveDefinitions = message.definitions;
        populateTypeSelect();
        break;
        
      case 'editorState':
        editorState = message;
        updateButtonStates();
        break;
        
      case 'validationResult':
        if (message.isValid) {
          showMessage('Objective is valid!', 'info');
        } else {
          showMessage('Invalid objective format', 'error');
        }
        if (message.warnings && message.warnings.length > 0) {
          message.warnings.forEach(warning => {
            showMessage(warning, 'warning');
          });
        }
        break;
    }
  });

  // Populate type select
  function populateTypeSelect() {
    typeSelect.innerHTML = '<option value="">Select type...</option>';
    
    objectiveDefinitions.forEach(def => {
      const option = document.createElement('option');
      option.value = def.type;
      option.textContent = def.description;
      typeSelect.appendChild(option);
    });
  }

  // Initialize on load
  init();
})();