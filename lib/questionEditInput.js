import './editableTable.js';
import { VariableDialog } from './variableDialog.js';

class QuestionEditInput extends HTMLElement {
    constructor() {
        super();
        this.questionVariables = {};
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
      <style>
        #input-field {
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 60%;
          min-height: 20vh;
          padding: 8px;
          box-sizing: border-box;
          flex: 1;
        }

        .text-display {
          width: 60%;
          min-height: 20vh;
          padding: 8px;
          box-sizing: border-box;
          border: 1px solid #ccc;
          border-radius: 4px;
          }

        #input-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          align-items: center;
          justify-content: center;
        }

      </style>
      <div id="input-container">
      <div id="input-field" contenteditable="true"></div>
      <button id="generate-question-button">Generate Question</button>
      <button id="save-button" style="display: none;">Save</button>
      <textarea id="common-control" class="text-display" style="display: none;"></textarea>
      <textarea id="MOM-question-text" class="text-display" style="display: none;"></textarea>
      </div>
    `;
        this._onKeyUp = (e) => {
            if (e.key === 'Escape') {
                const existingMenu = document.querySelector('.context-menu');
                const existingVariableDialog = document.querySelector('variable-dialog');
                if (existingMenu) existingMenu.remove();
                if (existingVariableDialog) existingVariableDialog.remove();
            } else {
                this.saveSelection(e);
            }
        };
        this.input = this.shadowRoot.querySelector('#input-field');
        this.input.innerHTML = '<br />';
        this._onMouseDown = this.saveSelection.bind(this);
        this.input.addEventListener('mousedown', this._onMouseDown);
        this.input.addEventListener('keyup', this._onKeyUp);

        this.input.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const existingMenu = document.querySelector('.context-menu');
            const existingVariableDialog = document.querySelector('variable-dialog');
            if (existingMenu) {
                existingMenu.remove();
            }
            if (existingVariableDialog) {
                existingVariableDialog.remove();
            }
            const cMenu = document.createElement('div');
            cMenu.classList.add('context-menu');
            cMenu.style.position = 'absolute';
            cMenu.style.left = `${event.pageX}px`;
            cMenu.style.top = `${event.pageY}px`;
            cMenu.style.zIndex = '1000';
            cMenu.style.backgroundColor = 'white';
            cMenu.style.border = '1px solid #ccc';
            cMenu.style.borderRadius = '4px';
            cMenu.style.padding = '8px';
            cMenu.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
            cMenu.style.display = 'flex';
            cMenu.style.flexDirection = 'column';
            cMenu.style.alignItems = 'center';
            cMenu.style.justifyContent = 'center';
            cMenu.style.width = '150px';
            cMenu.style.height = 'auto';
            cMenu.style.gap = '8px';
            const menuAddTableBtn = document.createElement('button');
            menuAddTableBtn.textContent = 'Add Table';
            menuAddTableBtn.style.width = '100%';
            cMenu.appendChild(menuAddTableBtn);
            document.body.appendChild(cMenu);
            menuAddTableBtn.addEventListener('click', () => {
                const questionEditor = event.target.closest('question-edit-input').shadowRoot.querySelector('#input-field');
                const newTable = document.createElement('editable-table');
                newTable.variables = this.questionVariables; // Pass the question variables to the table
                newTable.data = [['Column 1', 'Column 2', 'Column 3'], ['Row 1 Cell 1', 'Row 1 Cell 2', 'Row 1 Cell 3'], ['Row 2 Cell 1', 'Row 2 Cell 2', 'Row 2 Cell 3']];
                newTable.onTableUpdate((data) => {
                    // attach the adapter to MOM Common Control language
                    //alert('Table updated: ' + JSON.stringify(data));
                });

                questionEditor.appendChild(newTable);

                document.body.removeChild(cMenu);
                //set cursor to new line after the table
                const br = document.createElement('br');
                questionEditor.appendChild(br);
                const range = document.createRange();
                const selection = window.getSelection();
                range.setStartAfter(br);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                //questionEditor.removeChild(cMenu);
            });
            const menuAddVariableBtn = document.createElement('button');
            menuAddVariableBtn.textContent = 'Insert Variable';
            menuAddVariableBtn.style.width = '100%';
            cMenu.appendChild(menuAddVariableBtn);
            menuAddVariableBtn.addEventListener('click', () => {

                const variableDialog = new VariableDialog(this.questionVariables);
                variableDialog.id = 'variable-dialog';
                const questionEditor = event.target.closest('question-edit-input').shadowRoot.querySelector('#input-field');
                variableDialog.setAttribute('data-ui-element', '');
                this.shadowRoot.appendChild(variableDialog);
                document.body.removeChild(cMenu);
                variableDialog.onClose = () => {
                    //document.body.removeChild(cMenu);
                }
                variableDialog.addEventListener('variable-selected', (e) => {
                    const variable = e.detail.variable;
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode(document.createTextNode(`{{${variable.name}}}`));
                    }
                    this.input.removeChild(variableDialog);
                });
                variableDialog.style.position = 'absolute';
                variableDialog.style.left = `${event.pageX}px`;
                variableDialog.style.top = `${event.pageY}px`;

            });
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.style.width = '100%';
            cancelBtn.style.color = '#f44336';
            cMenu.appendChild(cancelBtn);
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(cMenu);
            });
        });

        this.shadowRoot.addEventListener('variable-insert', (event) => {
            const variable = event.detail.variable;
            const variableElement = document.createElement('span');
            variableElement.textContent = `{{${variable.name}}}`;
            variableElement.style.backgroundColor = 'lightblue';
            variableElement.style.padding = '2px 4px';
            variableElement.style.borderRadius = '4px';
            variableElement.contentEditable = 'false';

            // Use the saved range directly
            if (this.savedRange) {
                console.log('Inserting variable at saved range:', this.savedRange);
                const range = this.savedRange.cloneRange();
                range.deleteContents();           // Remove any selected text (if any)
                range.insertNode(variableElement);// Insert the new node at caret position

                // Move the caret immediately after the inserted node
                range.setStartAfter(variableElement);
                range.collapse(true);

                const selection = this.shadowRoot.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // Fallback: append to end
                this.input.appendChild(variableElement);
            }

            // // Remove dialog if it exists
            const variableDialog = this.shadowRoot.querySelector('#variable-dialog');
            if (variableDialog) {
                variableDialog.onClose?.();
                this.shadowRoot.removeChild(variableDialog);
            }
        });

        this.generateQuestionButton = this.shadowRoot.querySelector('#generate-question-button');
        this.commonControl = this.shadowRoot.querySelector('#common-control');
        this.questionText = this.shadowRoot.querySelector('#MOM-question-text');

        this.generateQuestionButton.addEventListener('click', () => {
            this.commonControl.style.display = 'block';
            this.questionText.style.display = 'block';
            this.questionText.value = this.input.innerText.replace(/{{\s*([\w]+)\s*}}/g, (_, varName) => `$${varName}`);
            let commonControlText = "";
            Object.entries(this.questionVariables).forEach(([key, value]) => {
                let formattedValue = value.replace(/{{\s*([\w]+)\s*}}/g, (_, varName) => `$${varName}`);
                formattedValue = formattedValue.replaceAll('random(', 'rand(');
                commonControlText += `$${key} = ${formattedValue};\n`;
            });
            this.commonControl.value = commonControlText;
        });
        
    }

    connectedCallback() {
        this.input.addEventListener('input', () => {
            this.dispatchEvent(new CustomEvent('question-edit', {
                detail: { value: this.input.value },
                bubbles: true,
                composed: true
            }));
        });
    }

    saveSelection(event) {
        if (event.target.closest('[data-ui-element]')) return;
        const selection = this.shadowRoot.getSelection();
        if (!selection.rangeCount) return;
        console.log('Saving selection:', selection);

        const range = selection.getRangeAt(0);
        this.savedRange = range.cloneRange();
        console.log('Saved range unconditionally:', this.savedRange);
    }


    // _onMouseUp(event) {
    //     this.saveSelection();
    // }




    destroy() {
        document.removeEventListener('mousedown', this._onMouseDown);
        document.removeEventListener('keyup', this._onKeyUp);
        const existingMenu = document.querySelector('.context-menu');
        const existingVariableDialog = document.querySelector('variable-dialog');
        if (existingMenu) {
            existingMenu.remove();
        }
        if (existingVariableDialog) {
            existingVariableDialog.remove();
        }
    }
}

customElements.define('question-edit-input', QuestionEditInput);