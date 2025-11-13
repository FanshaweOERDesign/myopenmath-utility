export class VariableDialog extends HTMLElement {
  constructor(variables = {}) {
    super();
    this.variables = variables; // Set initial variables
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        #dialog {
          position: relatative;
          top: 0;
          left: 0;
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          z-index: 1000;
        }
        #close-button {
          cursor: pointer;
          color: red;
        }
      </style>
      <div id="dialog">
        <h2>Insert Variable</h2>
        <div id="variables-list"></div>
        <div id="variable-input" style="display:none;">
          <label for="variable-name">Variable Name:</label>
          <input type="text" id="variable-name" />
          <label for="variable-value">Variable Value:</label>
          <div style="display: flex; gap: 8px; align-items: center;">
          <input type="text" id="variable-value" placeholder="e.g. 2*x + y or random(1,5)" />
          <select id="insert-variable">
      <option disabled selected>Insert variable…</option>
    ${Object.entries(this.variables).map(([key, value]) => `<option value="${key}">${key}</option>`).join('')}
  </select>
</div>
          <button id="add-variable-button">&check;</button>
        </div>
        <button id="new-variable-button">New Variable</button>
        <button id="close-button">Cancel</button>
      </div>
    `;
    
    this.variablesList = this.shadowRoot.querySelector('#variables-list');
    this.closeButton = this.shadowRoot.querySelector('#close-button');
    this.dialogContainer = this.shadowRoot.querySelector('#dialog');
    this.position = [this.dialogContainer.offsetLeft, this.dialogContainer.offsetTop];
    this.onClose = () => { };
    this.closeButton.addEventListener('click', () => this.close());
    this.variablesList.innerHTML = '';
    Object.entries(this.variables).forEach(([key,value]) => {
      
      const variableItem = document.createElement('div');
      variableItem.textContent = `${key}: ${value}`;
      variableItem.addEventListener('click', () => {
        // insert the variable into the question editor
        const event = new CustomEvent('variable-insert', {
          bubbles: true,
          detail: { variable: {name: key, value: value} }
        });
        this.dispatchEvent(event);
        this.close();
      });
      variableItem.style.cursor = 'pointer';
      variableItem.style.padding = '4px';
      this.variablesList.appendChild(variableItem);

    });

    const insertSelect = this.shadowRoot.querySelector('#insert-variable');
    const valueInput = this.shadowRoot.querySelector('#variable-value');

    insertSelect.addEventListener('change', () => {
      const selected = insertSelect.value;
      const current = valueInput.value;
      valueInput.value = current + `{{${selected}}}`;
      valueInput.focus();
      insertSelect.selectedIndex = 0; // reset the dropdown
      // trigger the input event to update the value
      valueInput.dispatchEvent(new Event('input'));
    });

    const newVariableButton = this.shadowRoot.querySelector('#new-variable-button');
    newVariableButton.addEventListener('click', () => {
      const variableInput = this.shadowRoot.querySelector('#variable-input');
      variableInput.style.display = 'flex';
      variableInput.style.flexDirection = 'column';
      variableInput.style.marginTop = '8px';
      variableInput.style.gap = '8px';
      variableInput.style.alignItems = 'center';
      const variableNameEl = this.shadowRoot.querySelector('#variable-name');
      let variableName = variableNameEl.value.trim();
      const variableValueEl = this.shadowRoot.querySelector('#variable-value');
      let variableValue = variableValueEl.value.trim();
      variableNameEl.addEventListener('input', () => {
        variableName = variableNameEl.value.trim();
      });
      variableValueEl.addEventListener('input', () => {
        variableValue = variableValueEl.value.trim();
      });


      this.shadowRoot.querySelector('#add-variable-button').addEventListener('click', () => {
        if (variableName && variableValue) {
          if (!/^[a-zA-Z]$/.test(variableName[0]) || !/^[a-zA-Z0-9_]+$/.test(variableName)) {
            alert('Variable name must start with a letter and can only contain letters, numbers, and underscores.');
            variableNameEl.focus();
            variableNameEl.select();
            return;
          }
          this.variables[variableName] = variableValue; // add the new variable
          const newVariableItem = document.createElement('div');
          newVariableItem.textContent = `${variableName}: ${variableValue}`;
          this.variablesList.appendChild(newVariableItem);

          // insert the variable into the question editor
          const event = new CustomEvent('variable-insert', {
            bubbles: true,
            detail: { variable: { name: variableName, value: variableValue } }
          });
          this.dispatchEvent(event);
          this.close();
        } else {
          alert('Please enter both variable name and value.');
        }
      });
    });
  }

  close() {
    this.onClose();
    this.remove();
  }
}

customElements.define('variable-dialog', VariableDialog);