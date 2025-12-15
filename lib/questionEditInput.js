import './editableTable.js';

import { VariableDialog } from './variableDialog.js';
import './t-acctTable.js';

class QuestionEditInput extends HTMLElement {
    constructor() {
        super();
        this.questionVariables = {};
        this.tables = {};
        this.tableIdx = 0;
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

        button {
          margin-top: 12px;
          padding: 8px 16px;
          font-size: 1em;
          border: none;
          border-radius: 4px;
          background-color: #4CAF50;
          color: white;
          cursor: pointer;
        }
        button:hover {
          background-color: #45a049;
        }

      </style>
      <div id="input-container">
      <div id="input-field" contenteditable="true"></div>
      <button id="generate-question-button">Generate Question</button>
      <button id="save-button" style="display: none;">Save</button>
      <div id="output-container" style="display: none; width: 100%; margin-top: 12px;">
      <label for="common-control">MOM Common Control:</label>
      <textarea id="common-control" class="text-display"></textarea>
      <button id="copy-common-control-button">Copy Common Control to Clipboard</button>
      <label for="MOM-question-text">MOM Question Text:</label>
      <textarea id="MOM-question-text" class="text-display"></textarea>
      <button id="copy-question-text-button">Copy Question Text to Clipboard</button>
      </div>
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
                newTable.id = `editable_table_${this.tableIdx++}`;
                this.tables[newTable.id] = newTable;
                newTable.variables = this.questionVariables; // Pass the question variables to the table
                newTable.data = [['Column 1', 'Column 2', 'Column 3'], ['Row 1 Cell 1', 'Row 1 Cell 2', 'Row 1 Cell 3'], ['Row 2 Cell 1', 'Row 2 Cell 2', 'Row 2 Cell 3']];
                newTable.onTableUpdate((data) => {
                    // attach the adapter to MOM Common Control language
                    // or just use the data when question is generated
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
            // const menuAddTAcctTableBtn = document.createElement('button');
            // menuAddTAcctTableBtn.textContent = 'Add TAcct Table';
            // menuAddTAcctTableBtn.style.width = '100%';
            // cMenu.appendChild(menuAddTAcctTableBtn);
            // menuAddTAcctTableBtn.addEventListener('click', () => {
            //     const questionEditor = event.target.closest('question-edit-input').shadowRoot.querySelector('#input-field');
            //     const newTable = document.createElement('t-acct-table');
            //     newTable.id = `t_acct_table_${this.tableIdx++}`;
            //     this.tables[newTable.id] = newTable;
            //     newTable.variables = this.questionVariables; // Pass the question variables to the table
            //     newTable.data = [['Title', ''], ['Row 1', 'Value 1'], ['Total', '']];
            //     newTable.onTableUpdate((data) => {
            //         // attach the adapter to MOM Common Control language
            //         // or just use the data when question is generated
            //         //alert('TAcct Table updated: ' + JSON.stringify(data));
            //     });

            //     questionEditor.appendChild(newTable);

            //     document.body.removeChild(cMenu);
            //     //set cursor to new line after the table
            //     const br = document.createElement('br');
            //     questionEditor.appendChild(br);
            //     const range = document.createRange();
            //     const selection = window.getSelection();
            //     range.setStartAfter(br);
            //     range.collapse(true);
            //     selection.removeAllRanges();
            //     selection.addRange(range);
            // });
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
                        //need to check that the selection is within the input field
                        const rangeContainer = selection.getRangeAt(0).commonAncestorContainer;
                        if (!questionEditor.contains(rangeContainer) || rangeContainer !== questionEditor) {
                            console.log('Selection is outside input field, appending variable at end.');
                            questionEditor.appendChild(document.createTextNode(`{{${variable.name}}}`));
                            return;
                        }
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
                const rangeContainer = range.commonAncestorContainer;
                if (!this.input.contains(rangeContainer) || rangeContainer !== this.input) {
                    console.log('Saved range is outside input field, appending variable at end.');
                    this.input.appendChild(variableElement);
                    return;
                }
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
        this.outputContainer = this.shadowRoot.querySelector('#output-container');

        this.commonControl.addEventListener('click', () => {
            this.commonControl.select();
        });

        this.questionText.addEventListener('click', () => {
            this.questionText.select();
        });

        this.copyCommonControlButton = this.shadowRoot.querySelector('#copy-common-control-button');
        this.copyQuestionTextButton = this.shadowRoot.querySelector('#copy-question-text-button');

        const copyText = async (text) => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try {
                    await navigator.clipboard.writeText(text);
                    alert('Copied to clipboard: ' + text);
                } catch (err) {
                    alert('Failed to copy: ' + err);
                }
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('Copied to clipboard!');
            }
        };

        this.copyCommonControlButton.addEventListener('click', async () => {
            await copyText(this.commonControl.value);
        });

        this.copyQuestionTextButton.addEventListener('click', async () => {
            await copyText(this.questionText.value);
        });

        this.generateQuestionButton.addEventListener('click', () => {
            let questionHTML = this.input.innerHTML;
            this.outputContainer.style.display = 'flex';
            this.outputContainer.style.flexDirection = 'column';
            this.outputContainer.style.gap = '12px';
            this.outputContainer.style.alignItems = 'center';

            // replace editable-table elements with variable names based on their ids
            Object.values(this.tables).forEach(table => {
                console.log('Processing table for question text:', table);
                const tableId = table.id;
                const tableVarName = `$${tableId}`;
                const tableRegex = new RegExp(`<editable-table[^>]*id=["']${tableId}["'][^>]*>[\\s\\S]*?<\\/editable-table>`, 'g');
                questionHTML = questionHTML.replace(tableRegex, tableVarName);
            });
            const parser = new DOMParser();
            const doc = parser.parseFromString(questionHTML, 'text/html');
            let questionTextString = "<p>";

            for (const child of doc.body.childNodes) {
                const text = child.textContent.replace(/{{\s*([\w]+)\s*}}/g, (_, varName) => `$${varName}`);
                console.log("Child tagName:", child.tagName);
                questionTextString += text;
                //check next child to see if it's a block element
                const nextSibling = child.nextSibling;
                if (nextSibling) {
                    const blockElements = ['DIV', 'P', 'TABLE', 'UL', 'OL', 'PRE', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
                    if (blockElements.includes(nextSibling.tagName)) {
                        questionTextString += "</p>\n<p>";
                    }
                } else {
                    questionTextString += "</p>";
                }
            }
            this.questionText.value = questionTextString;
            //this.questionText.value = doc.body.textContent.replace(/{{\s*([\w]+)\s*}}/g, (_, varName) => `$${varName}`);
            let commonControlText = "$abstolerance = .01\n$scoremethod = \"acct\"\n$hidetips = true\n$noshuffle = \"all\"\nloadlibrary(\"acct\")";
            Object.entries(this.questionVariables).forEach(([key, value]) => {
                let formattedValue = value.replace(/{{\s*([\w]+)\s*}}/g, (_, varName) => `$${varName}`);
                formattedValue = formattedValue.replaceAll('random(', 'rand(');
                commonControlText += `\n$${key} = ${formattedValue};`;
            });
            Object.values(this.tables).forEach(table => {
                const tableId = table.id;
                const tableVarName = `$${tableId}`;
                // create the MOM data arrays
                commonControlText += `\n$headers_${tableId} = array(`;
                table.data[0].forEach((header, idx) => {
                    commonControlText += `"${header.replace(/"/g, '\\"')}"`;
                    if (idx < table.data[0].length - 1) commonControlText += ", ";
                });
                commonControlText += ");";
                commonControlText += `\n$coltypes_${tableId} = array(`;
                table.data[0].forEach((header, idx) => {
                    // determine column type based on string or numeric data (string can't be evaluated)
                    commonControlText += `${table.getColumnType(idx)}`;
                    if (idx < table.data[0].length - 1) commonControlText += ", ";
                });
                commonControlText += ");";
                //create columns from data rows
                const columns = {};
                for (let colIdx = 0; colIdx < table.data[0].length; colIdx++) {
                    const varName = `${tableId}_col${colIdx + 1}`;
                    columns[varName] = [];
                    for (let rowIdx = 1; rowIdx < table.data.length; rowIdx++) {
                        columns[varName].push(table.data[rowIdx][colIdx]);
                    }
                }
                let columnArrayStr = 'array(';
                Object.entries(columns).forEach(([varName, values], idx, arr) => {
                    columnArrayStr += '$' + varName + (idx < arr.length - 1 ? ', ' : '');
                    commonControlText += `\n$${varName} = array(`;
                    values.forEach((val, vIdx) => {
                        let valText = val.replace(/{{\s*([\w]+)\s*}}/g, (_, vName) => `$${vName}`);
                        // only add quotes if not a number or PHP style variable
                        if (isNaN(valText) && !valText.startsWith('$') && !/^["'].*["']$/.test(valText)) {
                            valText = `"${valText.replace(/"/g, '\\"')}"`;
                        }
                        commonControlText += `${valText.trim()}`;
                        if (vIdx < values.length - 1) commonControlText += ", ";
                    });
                    commonControlText += ")";
                });
                columnArrayStr += ')';
                commonControlText += `\n${tableVarName} = makeaccttable3($headers_${tableId}, $coltypes_${tableId}, array(), ${columnArrayStr}, 0, $anstypes, $answer, $showanswer, $displayformat, $answerformat, $answerboxsize, $opts);`;
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