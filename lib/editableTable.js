import { VariableDialog } from './variableDialog.js';

export class EditableTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._data = [];
    this._colWidths = []; // Track column widths
    this.variables = {};
    this.callback = () => { };
  }

  set data(newData) {
    this._data = newData;
    this._colWidths = new Array(newData[0]?.length || 0).fill(120); // Default width
    this.render();
  }

  get data() {
    return this._data;
  }

  onTableUpdate(callback) {
    if (typeof callback === 'function') {
      this.callback = callback;
    } else {
      console.error('onCellEdit must be a function');
    }
  }

  handleCellEdit(row, col, newValue) {
    this._data[row][col] = newValue;
    this.dispatchEvent(new CustomEvent('cell-edit', {
      detail: { row, col, newValue },
      bubbles: true,
      composed: true
    }));
    //this.render();
  }

  render() {
    const colStyles = this._colWidths.map(w => `width: ${w}px;`).join('');
    const ths = this.shadowRoot.querySelectorAll('th');
    ths.forEach((th, i) => {
      const width = th?.offsetWidth;
      if (width) this._colWidths[i] = width;
    });
    this.shadowRoot.innerHTML = `
        <style>
  table {
    border-collapse: collapse;
    table-layout: auto;
  }
  th, td {
    border: 1px solid #ccc;
    padding: 5px;
    position: relative;
    overflow: hidden;
  }
  .resizer {
    position: absolute;
    right: 0;
    top: 0;
    width: 5px;
    height: 100%;
    cursor: col-resize;
    user-select: none;
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
              ${this._data[0]
        ? this._data[0].map((_, i) =>
          `<th contenteditable="true" style="width: ${this._colWidths[i]}px">
                         Col ${i + 1}
                         <div class="resizer" data-col="${i}"></div>
                       </th>`
        ).join('')
        : ''
      }
            </tr>
          </thead>
          <tbody>
            ${this._data.map((row, rowIndex) => `
              <tr>
                ${row.map((cell, colIndex) => `
                  <td style="width: ${this._colWidths[colIndex]}px" contenteditable="true" data-row="${rowIndex}" data-col="${colIndex}">
                    ${this.formatCellContent(cell)}
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

    const shadow = this.shadowRoot;

    shadow.querySelectorAll('td').forEach(td => {
      td.addEventListener('mousedown', (e) => this.saveCellSelection(e, td));
      td.addEventListener('keyup', (e) => this.saveCellSelection(e, td));
      td.addEventListener('input', () => {
        const row = +td.dataset.row;
        const col = +td.dataset.col;
        const newValue = td.textContent;
        this.handleCellEdit(row, col, newValue);
      });

      td.addEventListener('contextmenu', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const existingMenu = document.getElementById('table-context-menu');
        if (existingMenu) existingMenu.remove();

        const row = +td.dataset.row;
        const col = +td.dataset.col;
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

        const addRowBtn = document.createElement('button');
        addRowBtn.textContent = 'Add Row';
        addRowBtn.onclick = () => {
          this._data.splice(row + 1, 0, new Array(this._data[0].length).fill(''));
          this.render();
        };
        const deleteRowBtn = document.createElement('button');
        deleteRowBtn.textContent = 'Delete Row';
        deleteRowBtn.onclick = () => {
          this._data.splice(row, 1);
          this.render();
        };
        const addColBtn = document.createElement('button');
        addColBtn.textContent = 'Add Column';
        addColBtn.onclick = () => {
          this._data.forEach(r => r.splice(col + 1, 0, ''));
          this._colWidths.splice(col + 1, 0, 120);
          this.render();
        };
        const deleteColBtn = document.createElement('button');
        deleteColBtn.textContent = 'Delete Column';
        deleteColBtn.onclick = () => {
          this._data.forEach(r => r.splice(col, 1));
          this._colWidths.splice(col, 1);
          this.render();
        };
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
          variableDialog.id = 'variable-dialog';

          this.shadowRoot.appendChild(variableDialog);
        };

        [addRowBtn, deleteRowBtn, addColBtn, deleteColBtn, insertVariableBtn].forEach(btn => menu.appendChild(btn));
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
          variableElement.attributes['data-variable'] = variable.name;
          //this.activeCell.appendChild(variableElement);
          // Use the saved range directly 
          if (this.savedCellRange) {
            console.log('Inserting variable at saved range:', this.savedCellRange);
            this.savedCellRange.deleteContents();
            this.savedCellRange.insertNode(variableElement);
            
        
          } else if (this.activeCell) {
            console.log('Inserting variable at active cell:', this.activeCell);
            this.activeCell.appendChild(variableElement);

          } else {
            console.warn('No saved range or active cell to insert variable.');
          }
          
          this._data[row][col] = td.textContent; // Update data with new content
          //this.handleCellEdit(row, col, this.activeCell.textContent);
          const variableDialog = this.shadowRoot.querySelector('#variable-dialog');
          if (variableDialog) {
            variableDialog.onClose?.();
            // this.shadowRoot.removeChild(variableDialog);
          }

          document.body.removeChild(menu);
        });


        document.addEventListener('click', () => menu.remove(), { once: true });

      });
    });

    // Resizer logic
    shadow.querySelectorAll('th').forEach((th, i) => {
      const resizer = th.querySelector('.resizer');
      if (!resizer) return;

      let startX, startWidth;

      resizer.addEventListener('mousedown', (e) => {
        startX = e.pageX;
        startWidth = th.offsetWidth;

        const onMouseMove = (e) => {
          const dx = e.pageX - startX;
          const newWidth = Math.max(startWidth + dx, 40);

          // Apply new width directly to the header and all cells in that column
          th.style.width = newWidth + 'px';
          this.shadowRoot.querySelectorAll(`td:nth-child(${i + 1})`).forEach(cell => {
            cell.style.width = newWidth + 'px';
          });
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });

    this.callback(this._data);
  }

  saveCellSelection(event, td) {
    const selection = this.shadowRoot.getSelection?.() || document.getSelection();
    if (!selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    const container = range.startContainer;

    if (td.contains(container) || container === td) {
      this.savedCellRange = range.cloneRange();
      this.activeCell = td; // Save which cell is active for fallback
    }
  }

  formatCellContent(cellContent) {
    let content = cellContent.trim();
    // need to handle this more flexibly with regex
    content = content.replace(/{{\s*([^}]+?)\s*}}/g, (_, variableName) => {
      const safeName = variableName.trim();
      return `<span class="variable" data-variable="${safeName}" contenteditable="false">{{${safeName}}}</span>`;
    });

    return content;
  }
}

customElements.define('editable-table', EditableTable);

