/*This is still a work in progress component for T-Account 
style tables with variable insertion support*/

import { EditableTable } from "./editableTable.js";"./editableTable";
import { VariableDialog } from "./variableDialog.js";


export class TAcctTable extends EditableTable {
  constructor() {
    super();
  }

  set data(newData) {
    // Force two columns, and ensure at least 2 rows (title + 1 data + total)
    if (!Array.isArray(newData) || newData.length < 3) {
      throw new Error("TAcctTable requires at least a title row, one data row, and a total row.");
    }
    // Only use first two columns of each row
    this._data = newData.map(row => [row[0], row[1]]);
    this._colWidths = [120, 120];
    this._colTypes = [true, true];
    this.render();
  }

  get data() {
    return this._data;
  }

  render() {
    // Only two columns, special structure
    const [titleRow, ...bodyRows] = this._data;
    const totalRow = bodyRows[bodyRows.length - 1];
    const dataRows = bodyRows.slice(0, -1);
    this.shadowRoot.innerHTML = `
      <style>
        table {
          border-collapse: separate;
          border-spacing: 0;
          width: 100%;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 5px;
          text-align: center;
        }
        th.title-row {
          font-weight: bold;
          font-size: 1.1em;
          border-bottom: 4px double #333;
          border-right: none;
          border-left: none;
          background: #f8f8f8;
        }
        td {
          border-top: none;
        }
        td + td {
          border-left: 2px solid #333;
        }
        tr.total-row td {
          border-top: 2px double #888;
          font-weight: bold;
          background: #f4f4f4;
        }
        .variable {
          background-color: lightblue;
          padding: 2px 4px;
          border-radius: 4px;
          cursor: pointer;
        }
      </style>
      <table>
        <thead>
          <tr>
            <th class="title-row" colspan="2" contenteditable="true" data-row="0" data-col="0">${titleRow[0]}</th>
          </tr>
        </thead>
        <tbody>
          ${dataRows.map((row, rowIndex) => `
            <tr>
              <td contenteditable="true" data-row="${rowIndex + 1}" data-col="0">${this.formatCellContent(row[0])}</td>
              <td contenteditable="true" data-row="${rowIndex + 1}" data-col="1">${this.formatCellContent(row[1])}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td contenteditable="false" data-row="${this._data.length - 1}" data-col="0">${this.formatCellContent(totalRow[0])}</td>
            <td contenteditable="false" data-row="${this._data.length - 1}" data-col="1">${this.formatCellContent(totalRow[1])}</td>
          </tr>
        </tbody>
      </table>
    `;

    // Add event listeners for editing only non-total rows
    this.shadowRoot.querySelectorAll('td[contenteditable="true"]').forEach(td => {
      td.addEventListener('input', () => {
        const row = +td.dataset.row;
        const col = +td.dataset.col;
        const newValue = this.extractPlainTextFromCell(td);
        this._data[row][col] = newValue;
        this.handleCellEdit(row, col, newValue);
      });
      td.addEventListener('mousedown', (e) => this.saveCellSelection(e, td));
      td.addEventListener('keyup', (e) => this.saveCellSelection(e, td));
      td.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        // Only allow variable insertion
        const menu = document.createElement('div');
        menu.id = 'table-context-menu';
        Object.assign(menu.style, {
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          padding: '5px',
          zIndex: 9999
        });
        const insertVariableBtn = document.createElement('button');
        insertVariableBtn.textContent = 'Insert Variable';
        insertVariableBtn.onclick = () => {
          const variableDialog = new VariableDialog(this.variables);
          variableDialog.id = 'variable-dialog';
          variableDialog.setAttribute('data-ui-element', '');
          variableDialog.onClose = () => {
            this.shadowRoot.removeChild(variableDialog);
          };
          variableDialog.style.position = 'absolute';
          variableDialog.style.left = `${e.pageX}px`;
          variableDialog.style.top = `${e.pageY}px`;
          variableDialog.style.zIndex = '1000';
          this.shadowRoot.appendChild(variableDialog);
        };
        menu.appendChild(insertVariableBtn);
        document.body.appendChild(menu);
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        this.shadowRoot.addEventListener('variable-insert', (event) => {
          const variable = event.detail.variable;
          const variableElement = document.createElement('span');
          variableElement.classList.add('variable');
          variableElement.textContent = `{{${variable.name}}}`;
          variableElement.style.cursor = 'pointer';
          variableElement.style.backgroundColor = 'lightblue';
          variableElement.style.padding = '2px 4px';
          variableElement.contentEditable = 'false';
          variableElement.style.borderRadius = '4px';
          variableElement.setAttribute('data-variable', variable.name);
          if (this.savedCellRange) {
            this.savedCellRange.deleteContents();
            this.savedCellRange.insertNode(variableElement);
            this._data[+td.dataset.row][+td.dataset.col] = this.extractPlainTextFromCell(td);
            this.handleCellEdit(+td.dataset.row, +td.dataset.col, this._data[+td.dataset.row][+td.dataset.col]);
          } else if (this.activeCell) {
            this.activeCell.appendChild(variableElement);
          }
          const variableDialog = this.shadowRoot.querySelector('#variable-dialog');
          if (variableDialog) variableDialog.onClose?.();
          document.body.removeChild(menu);
        });
        document.addEventListener('click', () => menu.remove(), { once: true });
      });
    });
    this.callback(this._data);
  }
}

customElements.define("t-acct-table", TAcctTable);