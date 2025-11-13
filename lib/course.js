class Course {
    constructor({courseName, ownerid, saveLocally, JSONCourseData}) {
        this.getCourseRawTemplate().then((data) => {
            this.rawTemplateData = data;
            console.log("Raw template: ", this.rawTemplateData);
            this.questionTemplate = this.extractQuestionTemplate();
            this.questionSetItemTemplate = this.extractQuestionSetItemTemplate(data);
            this.courseTemplate = this.extractCourseTemplate(data);
            this.assessmentTemplate = this.extractAssessmentTemplate(data);
            this.saveLocally = () => {saveLocally(this.getCourseJSON())};
            if (JSONCourseData) {
                this.currentCourseData = JSON.parse(JSONCourseData);
            } else {
                this.currentCourseData = { ... this.courseTemplate };
                this.currentCourseData.course.name = courseName || "Course Name";
                this.currentCourseData.course.ownerid = ownerid || 6337954;
            }
            
            this.ready = true;
            this.saveLocally();  
        });
        this.uidGenerator = this.QuestionSetUniqueIdGenerator();
        this.questionIdx = 0;
        this.questionSetIdx = 0;
        this.assessmentIdx = 1;
    }

    async getCourseRawTemplate() {
        const response = await fetch('/lib/rawCourseTemplate.json', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        return Promise.resolve(response.json())
            .then(data => {
                return data;
            })
            .catch(error => {
                console.error('Error fetching question template:', error);
                throw error;
            });
    }

    extractQuestionTemplate(rawTemplateData) {
        const templateData = rawTemplateData || this.rawTemplateData;
        const questionTemplate = { ...templateData.questions["0"] };
        questionTemplate.questionSetId = null;
        return questionTemplate;
    }

    extractQuestionSetItemTemplate(rawTemplateData) {
        const templateData = rawTemplateData || this.rawTemplateData;
        const questionSetItemTemplate = { ...templateData.questionset["0"] };
        questionSetItemTemplate.uniqueid = null;
        questionSetItemTemplate.adddate = null;
        questionSetItemTemplate.lastmoddate = null;
        questionSetItemTemplate.qtype = null;
        questionSetItemTemplate.description = null;
        questionSetItemTemplate.control = null;
        questionSetItemTemplate.qtext = null;
        return questionSetItemTemplate;
    }

    extractCourseTemplate(rawTemplateData) {
        const templateData = rawTemplateData || this.rawTemplateData;
        const courseTemplate = { ...templateData };
        courseTemplate.questionset = {};
        courseTemplate.questions = {};
        courseTemplate.items = {};
        courseTemplate.course.name = null;
        courseTemplate.course.itemorder = {};
        return courseTemplate;
    }

    extractAssessmentTemplate(rawTemplateData) {
        const templateData = rawTemplateData || this.rawTemplateData;
        const assessmentTemplate = { ...templateData.items["1"] };
        assessmentTemplate.data.name = null;
        assessmentTemplate.data.itemorder = {};
        assessmentTemplate.data.ptsposs = 0;
        return assessmentTemplate;
    }

    getAssessments() {
        const assessments = Object.values(this.currentCourseData.items).filter(item => item.data && item.data.name !== null && item.type === "Assessment");
        return assessments.map((assessment, index) => {
            return { id: index + 1, name: assessment.data.name };
        });
    }

    QuestionSetUniqueIdGenerator() {
        function sixDigitCounter() {
            let counter = 0;
            return function () {
                counter++;
                return counter.toString().padStart(6, '0');
            };
        }
        const sixCounter = sixDigitCounter();
        return function () {
            let idNum = Date.now();
            idNum = parseInt(idNum.toString().slice(0, 10) + sixCounter(), 10);
            return idNum;
        }
    }

    resetCourse() {
        this.questionIdx = 0;
        this.questionSetIdx = 0;
        this.assessmentIdx = 1;
        this.currentCourseData = { ... this.courseTemplate };
        this.saveLocally();
    }

    addAssessment(assessmentName) {
        const assessment = JSON.parse(JSON.stringify(this.assessmentTemplate));
        assessment.data.name = assessmentName;
        this.currentCourseData.items[this.assessmentIdx] = assessment;
        this.currentCourseData.course.itemorder[this.assessmentIdx - 1] = this.assessmentIdx;
        return this.assessmentIdx++; // return the assessment ID (index)
    }

    addNewQuestion({assessmentId, questionText, description, control, qType}){

        console.log("Adding new question: ", {assessmentId, questionText, description, control, qType});

        const questionSetItem = { ...this.questionSetItemTemplate };
        const questionItem = { ...this.questionTemplate };
        questionItem.questionsetid = this.questionSetIdx;
        questionSetItem.uniqueid = this.uidGenerator();
        questionSetItem.description = description;
        questionSetItem.qtext = questionText;
        questionSetItem.control = control;
        questionSetItem.qcontrol = "";
        questionSetItem.qtype = qType;
        questionSetItem.adddate = Math.floor(Date.now() / 1000);
        questionSetItem.lastmoddate = Math.floor(Date.now() / 1000);
        this.currentCourseData.items[assessmentId].data.itemorder[this.questionIdx] = this.questionIdx;
        this.currentCourseData.items[assessmentId].data.ptsposs += 1;
        this.currentCourseData.questions[this.questionIdx] = questionItem;
        this.currentCourseData.questionset[this.questionSetIdx] = questionSetItem;
        this.questionIdx++;
        this.questionSetIdx++;
        
    }

    getCourseJSON() { 
        return JSON.stringify(this.currentCourseData); 
    }

    multiChoiceFromCSV(csvString, assessmentName) {
        function parseCsv(csvText) {
    
            const rows = [];
            let currentRow = [];
            let currentValue = '';
            let insideQuotes = false;
        
            for (let i = 0; i < csvText.length; i++) {
                const char = csvText[i];
                const nextChar = csvText[i + 1];
        
                if (char === '"') {
                    if (insideQuotes && nextChar === '"') {
                        currentValue += '"'; // escaped quote
                        i++; // skip next char
                    } else {
                        insideQuotes = !insideQuotes;
                    }
                } else if (char === ',' && !insideQuotes) {
                    currentRow.push(currentValue.trim());
                    currentValue = '';
                } else if ((char === '\n' || char === '\r') && !insideQuotes) {
                    if (currentValue || currentRow.length > 0) {
                        currentRow.push(currentValue.trim());
                        rows.push(currentRow);
                    }
                    currentRow = [];
                    currentValue = '';
                    // Handle \r\n
                    if (char === '\r' && nextChar === '\n') i++;
                } else {
                    currentValue += char;
                }
            }
        
            if (currentValue || currentRow.length > 0) {
                currentRow.push(currentValue.trim());
                rows.push(currentRow);
            }
        
            return rows;
        }
        while (!this.ready) {
            console.log("Waiting for course to be ready..."); 
            // Wait for the course to be ready
        }
        const assessmentId = this.addAssessment(assessmentName);
        const lines = parseCsv(csvString);
    
        for (let i = 1; i < lines.length; i++) {
    
            const cells = lines[i];
    
            if (cells.length < 6) {
                console.warn(`Skipping incomplete row ${i + 1}: ${lines[i]}`);
                continue;
            }
    
            if (cells[0] === "") {
                console.warn(`Skipping empty row ${i + 1}`);
                continue;
            }
    
            const mapping = {
                question: cells[2],
                A: cells[3],
                B: cells[4],
                C: cells[5],
                D: cells[6],
                correctAnswer: cells[7],
            }
    
            let qDescription = `Question ${i}`;
            let qText = `${mapping.question}`;
            let control = `$questions = array(
        "${mapping.A}",
        "${mapping.B}",
        "${mapping.C}",
        "${mapping.D}"
      );
      $answer = ${mapping.correctAnswer.charCodeAt(0) - 65};`;
    
            this.addNewQuestion({
                assessmentId: assessmentId,
                questionText: qText,
                description: qDescription,
                control: control,
                qType: "choices"
            });
        }
    }

    // TODO: Make this actually parse Respondus formatted text
    multiChoiceFromRespondusText(respondusText, assessmentName="Respondus Imported Assessment") {
        while (!this.ready) {
            console.log("Waiting for course to be ready..."); 
            // Wait for the course to be ready
        }
        const assessmentId = this.addAssessment(assessmentName);
        const questionBlocks = respondusText.split(/\n\s*\n/).filter(block => block.trim() !== '');
        questionBlocks.forEach((block, index) => {
            const lines = block.split('\n').map(line => line.trim()).filter(line => line !== '');
            if (lines.length < 3) {
                console.warn(`Skipping incomplete question block ${index + 1}`);
                return;
            }
            const removePrefix = (line) => {
                // return line after first dot or closing parenthesis
                let dotIndex = line.indexOf('.');
                dotIndex = dotIndex === -1 ? Infinity : dotIndex;
                let parenIndex = line.indexOf(')');
                parenIndex = parenIndex === -1 ? Infinity : parenIndex;
                let splitIndex = Math.min(dotIndex, parenIndex);
                return line.substring(splitIndex + 1).trim();
            }
            
            const mapping = {
                question: removePrefix(lines[0]),
                correctAnswer: lines.findIndex(line => line.startsWith('*')) - 1
            };
            
            let qDescription = `Question ${index + 1}`;
            let qText = `${mapping.question}`;
            let control = `$questions = array(`;
            for (let i = 1; i < lines.length; i++) {
                control += `\n"${removePrefix(lines[i])}",`;
            }
            control += `\n);
      $answer = ${mapping.correctAnswer};`;
      this.addNewQuestion({
                assessmentId: assessmentId,
                questionText: qText,
                description: qDescription,
                control: control,
                qType: "choices"
            });
        });
    }
}



