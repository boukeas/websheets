'use strict';


/***
    Initialization:
    - all content is made invisible
    - css files are loaded (after the DOM content has been loaded)
    - additional js files are loaded (after the DOM content has been loaded)
    - websheet processing is initialized  (when the readyState is reached)
***/

// make all content invisible, to avoid Flash of Unstyled Content.
// visibiltiy will be restored when all processing is finished
document.documentElement.style.display = 'none';

// helper function to insert a script file into the document's head
// http://www.javascriptkit.com/javatutors/loadjavascriptcss.shtml
function loadjs(filename) {
    let script = document.createElement('script');
    script.setAttribute('type','text/javascript');
    script.setAttribute('src', filename);
    document.head.appendChild(script);
}

// helper function to insert a link to a css file into the document's head
// http://www.javascriptkit.com/javatutors/loadjavascriptcss.shtml
function loadcss(filename) {
    let link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type','text/css');
    link.setAttribute('href',filename);
    document.head.appendChild(link);
}

// load necessary css and js files after the DOM content has been loaded
document.addEventListener("DOMContentLoaded", function() {
    loadcss('css/fonts.css');
    loadcss('css/prettify.css');
    loadcss('css/websheets.css');
    loadjs('js/whitespace.js');
    loadjs('js/prettify.js');
});

// start processing when the readyState has been reached
document.addEventListener('readystatechange', function() {
    if (document.readyState == 'complete') process();
});



/***
    Language handling: Websheets use a predefined set of verbal constants.
    Here, we provide mappings of these constants into different languages.
    The specific mapping that will actually be used depends on the lang
    attribute of the html element.
***/

let languages = {
    'en': {
        'answer': 'Answer',
        'check': 'Check Answer',
        'hint': 'Hint',
        'question': 'Question',
        'section': 'Section',
        'step': 'Step',
        'solution': 'Solution'},
    'el': {
        'answer': 'Απάντηση',
        'check': 'Έλεγχος Απάντησης',
        'hint': 'Υπόδειξη',
        'question': 'Ερώτηση',
        'section': 'Ενότητα',
        'step': 'Βήμα',
        'solution': 'Λύση'}
}, languageMap;



/***
    Processing:
    - select a language map
    - handle auto-numbering and collapsible headings in steps
    - handle the header, sections, section headings and navigation
    - handle asides, questions, hints and generic groups
    - handle code and explanations
***/

// high-level processing function: it is called when the readyState is reached
// and it delegates processing to functions that handle specific tasks
function process() {

    // in case you need (at some point) some sort of loading process indicator
    // let progress = document.createElement('div');
    // progress.id = 'progress';
    // progress.innerHTML = '<p>loading websheet</p><div id="indicator"></div>';
    // document.body.insertBefore(progress, document.body.firstChild);

    // select a language map, using the lang attribute of the <html> element
    let language = document.documentElement.lang;
    languageMap = language in languages ? languages[language] : languages['en'];

    // handle linenums, whitespace and indentation in code blocks
    processCode();
    // prettify code blocks
    PR.prettyPrint();
    // handle code marked as inserted, deleted or highlighted
    processCodeMarkings();

    // retrieve all steps
    let steps = document.querySelectorAll('div.step');
    // enumerate steps
    enumerate(steps, 1, 'counter');
    // handle auto-numbering and collapsible headings in steps
    processSteps(steps);

    // retrieve all sections
    let sections = document.querySelectorAll('section');
    // enumerate sections
    enumerate(sections, 1, 'counter');
    // handles the header, sections and section headings
    processSections(sections);
    // add navigation buttons to sections
    processNavigation(sections);

    // determine section and step visibility
    let params = getUrlParams();
    processVisible(steps, sections, params);

    // group asides
    processGroup(':not(aside)', 'aside', 'sidenote');
    processAsides();
    // determine where to place sidenotes (to the margin or inline)
    if (params.marginnotes) document.body.classList.add('marginnotes');

    // group generic elements and add buttons for interactivity
    processGroup(':not(.generic)', '.generic', 'generic', true);

    // group hints and add buttons for interactivity
    processGroup(':not(.hint)', '.hint', 'hint', true);

    // group code explanations and link explanations to segments of code
    processGroup('pre.prettyprint', '.explanation', 'sidenote', false, 'code');
    processExplanations();

    // group questions, add buttons for interactivity and install checking mechanism
    processGroup(':not(.question)', '.question', 'question', true);
    processQuestions();

    // place footer in container (for formatting purposes)
    processFooter();

    // ta-daaam!
    document.documentElement.style.display = 'block';
    document.documentElement.classList.add('visible');
}


// functions for handling specific processing tasks

function processCode() {
    let blocks = document.querySelectorAll('pre.prettyprint');
    for (let block of blocks) {
        // force linenums (for correct rendering)
        if (!block.classList.contains('linenums')) {
            block.classList.add('linenums');
            block.setAttribute('mock-linenums', '');
        }
        // remove whitespace between <pre> and <code> tags -> allows indentation
        if (block.firstChild.nodeType == 3 && is_all_ws(block.firstChild))
            block.removeChild(block.firstChild);
        if (block.lastChild.nodeType == 3 && is_all_ws(block.lastChild))
            block.removeChild(block.lastChild);
        // handle whitespace within code tags
        let segment = block.querySelector('code');
        // remove trailing whitespace between actual code and the </code> tag
        if (segment.lastChild.nodeType == 3)
            segment.lastChild.textContent = segment.lastChild.textContent.trimRight();
        if (segment.firstChild.nodeType == 3) {
            // remove leading whitespace, up to the first linebreak
            let linebreak = segment.firstChild.textContent.indexOf('\n');
            if (!linebreak || is_all_ws(segment.firstChild.textContent.substring(0, linebreak)))
                segment.firstChild.textContent = segment.firstChild.textContent.substring(linebreak+1);
            // replace no-indent shorthand for indent=0
            if (segment.hasAttribute('no-indent')) {
                segment.removeAttribute('no-indent');
                segment.setAttribute('indent', 0);
            }
            // check if current indent needs to be preserved or replaced with user preference
            if (segment.hasAttribute('indent')) {
                let indent = segment.getAttribute('indent');
                // compute indent of first line, as a reference
                // https://stackoverflow.com/questions/25823914/javascript-count-spaces-before-first-character-of-a-string
                let firstLineIndent = segment.firstChild.textContent.search(/[\S\uFEFF\xA0]/);
                if (firstLineIndent < 0) firstLineIndent = segment.firstChild.textContent.length;
                // replace leading indent with indent specified by user
                const replaced = ' '.repeat(firstLineIndent);
                const replacement = ' '.repeat(indent);
                let headingFilter = RegExp('^' + replaced, 'gm');
                for (let node of segment.childNodes) {
                    if (node.nodeType == 3)
                        node.textContent = node.textContent.replace(headingFilter, replacement);
                }
            }
        }
    }
}

function processCodeMarkings() {
    // add del, ins and mark classes to the code li's, so they are properly
    // formatted (highlighted as complete lines) by the css
    for (let del of document.querySelectorAll('pre del')) {
        del.ancestor('pre li').classList.add('del');
    }
    for (let ins of document.querySelectorAll('pre ins')) {
        let ancestor = ins.ancestor('pre li');
        ancestor.classList.add('ins');
        if (ins.classList.contains('inline'))
            ancestor.classList.add('inline');
    }
    for (let mark of document.querySelectorAll('pre mark')) {
        let ancestor = mark.ancestor('pre li');
        ancestor.classList.add('mark');
        if (mark.classList.contains('inline'))
            ancestor.classList.add('inline');
    }
}

function processSteps(steps) {
    // Prepends a 'step-heading' div to each 'div.step' element. Each
    // 'step-heading' div contains an auto-numbered 'h3' for the step and an
    // expand/collapse button for the step contents.
    //
    // When a 'step-heading' div is a member of the 'expanded' class, then the
    // step is displayed, otherwise it is collapsed.

    for (let step of steps) {
        // create the 'step-heading' div
        let headingDiv = document.createElement('div');
        headingDiv.className = 'step-heading';
        headingDiv.onclick = toggleExpanded;
        // make an auto-numbered h3 heading for the step
        let heading = document.createElement('h3');
        heading.innerHTML = languageMap['step'] + ' ' + step.getAttribute('counter');
        // make an expand/collapse button
        let button = document.createElement('button');
        button.className = 'expand-button';
        // placement of elements: h3 heading and button into the div
        headingDiv.appendChild(heading);
        headingDiv.appendChild(button);
        step.parentNode.insertBefore(headingDiv, step);
    }
}

function processSections(sections) {
    // Replaces the document's <h1> with the following structure:
    //
    // <div class='header-container'>
    //     <header>
    //         <h1>...</h1>
    //     </header>
    // </div>
    //
    // The <h1> MUST exist. The <header> is created, if it does not exist,
    // otherwise the <h1> is appended to its children.
    //
    // All sections are grouped into a 'page' div.
    //
    // For each section, a 'section-heading' div is then inserted in the <header>.
    // Each 'section-heading' div contains the section title (drawn from the
    // 'h2' section heading, if it exists) and an auto-numbered 'h4' sub-title.

    // retrieve h1
    let heading1 = document.querySelector('h1');
    // retrieve or create header
    let header = document.querySelector('header');
    if (!header) header = document.createElement('header');
    // create the container and place the header in it
    let headerContainer = document.createElement('div');
    headerContainer.className = 'header-container fixed';
    // headerContainer.className = 'header-container';
    headerContainer.appendChild(header);
    // place the container in h1's place
    heading1.parentNode.insertBefore(headerContainer, heading1);
    header.appendChild(heading1);
    // create the 'page' div (to hold the sections)
    let page = document.createElement('div');
    page.className = 'page';
    sections[0].parentNode.insertBefore(page, sections[0]);
    // for each section
    for (let section of sections) {
        // retrieve the section's heading
        let heading = section.firstChild.nextSelectedSibling('h2');
        // create the 'section-heading' div and insert it in the <header>
        let headingDiv = document.createElement('div');
        headingDiv.className = 'section-heading';
        header.appendChild(headingDiv);
        // maintain a link between the section and its heading
        section.heading = headingDiv;
        // create the subheading with the section's number and insert it
        let subheading = document.createElement(heading ? 'h4' : 'h2');
        subheading.innerHTML = languageMap['section'] + ' ' + section.getAttribute('counter');
        headingDiv.appendChild(subheading);
        // now insert the section heading into the div, if it exists
        if (heading) {
            section.title = heading.textContent;
            headingDiv.appendChild(heading);
        } else {
            section.title = subheading.textContent;
        }
        // hide the section by default
        section.hide();
        section.heading.hide();
        // append the section to the page
        page.appendChild(section);
    }
}

function processNavigation(sections) {
    // Adds a 'nav' element to the end of each section, which contains the
    // 'prev-' and 'next-button' that lead to the previous and next section

    link(sections);
    for (let section of sections) {
        // create a 'nav' element for the prev/next navigation buttons
        let buttons = document.createElement('nav');
        // create the "previous" button
        let prev = document.createElement('button');
        prev.className = 'nav-button prev-button';
        if (section.prev) {
            prev.innerHTML = section.prev.title
        } else {
            prev.disabled = true;
        }
        // click event
        prev.onclick = prevClickHandler;
        // create the "next" button
        let next = document.createElement('button');
        next.className = 'nav-button next-button';
        if (section.next) {
            next.innerHTML = section.next.title;
        } else {
            next.disabled = true;
        }
        // click event
        next.onclick = nextClickHandler;
        // add buttons to the 'nav-buttons' div
        buttons.appendChild(prev);
        buttons.appendChild(next);
        // add the 'nav' element to the current section
        section.appendChild(buttons);
    }
}

function processVisible(steps, sections, params) {
    // Checks the 'section' and 'step' parameters in the query string and
    // determines:  1. Which section will be displayed
    //              2. Which steps will be expanded
    //
    // If both valid step and section are provided, the section is ignored, as
    // it is computed from the step.
    //
    // @param steps     The collection of steps.
    // @param sections  The collection of sections.
    // @param params    The parameters from the query string.

    let step, sectionCounter;
    if (params.step == undefined) {
        // no step in query string: expand all steps
        expandAllSteps();
    } else if (params.step < 0 || params.step > steps.length) {
        // illegal step in query string: expand all steps and issue warning
        expandAllSteps();
        console.warn('invalid step parameter in query string, all steps expanded');
    } else if (params.step > 0) {
        // legal step in query string: expand step and compute section index
        step = steps[params.step - 1];
        step.previousSibling.classList.add('expanded');
        sectionCounter = step.ancestor('section').getAttribute('counter');
    }

    if (sectionCounter == undefined) {
        if (params.section == undefined) {
            // no section in query string: default to 1
            sectionCounter = 1;
        } else if (params.section < 1 || params.section > sections.length) {
            // illegal section in query string: default to 1 and issue warning
            sectionCounter = 1;
            console.warn('invalid section parameter in query string');
        } else {
            sectionCounter = params.section;
        }
    } else {
        if (params.section != undefined) {
            // when both a section and a step is provided, ignore the section
            console.warn('ingoring section parameter in query string');
        }
    }

    // display a single section
    let visible = sections[sectionCounter - 1];
    visible.show();
    visible.heading.show();
}

function processAsides() {
     // Moves each paragraph followed by a sidenote container into a container

    let containers = document.querySelectorAll('p + div.sidenote-container');
    for (let container of containers) {
        let block = node_before(container);
        container.insertBefore(block, container.firstChild);
    }
}

function processExplanations() {
    // Retrieves all .explanation elements that follow code blocks and groups
    // them into 'explanation-group' divs. It then retrieves all <a> elements
    // inside the code blocks and links them to the corresponding  explanations.

    // retrieve code explanation containers
    let containers = document.querySelectorAll('pre.prettyprint + div.code-container');
    for (let container of containers) {
        // this is the block of code to which the explanations pertain
        let block = node_before(container);
        // find all code segments in the block which link to an explanation
        let explained = block.querySelectorAll("a");
        // find the first explanation (excluding orphans)
        let explanation = container.firstChild.firstChild;
        while (explanation && explanation.hasAttribute('orphan'))
            explanation = explanation.nextSibling;
        for (let segment of explained) {
            // link segment to explanation (via object properties)
            segment.linked = explanation;
            explanation.linked = segment;
            // attach event listeners to segments and explanations
            explanation.onmouseover = highlightExplanation;
            explanation.onmouseout = unhighlightExplanation;
            segment.onmouseover = highlightSegment;
            segment.onmouseout = unhighlightSegment;
            // move to next explanation (excluding orphans)
            explanation = explanation.nextSibling;
            while (explanation && explanation.hasAttribute('orphan'))
                explanation = explanation.nextSibling;
        }
        container.insertBefore(block, container.firstChild);
    }
}

function processQuestions() {
    // Adds feedback buttons to closed-form questions and installs the feedback
    // mechanism.

    // retrieve all closed form questions
    let questions = document.querySelectorAll("div.question-single, div.question-multiple");
    let questionCounter = 1;
    for (let question of questions) {
        // create a feedback button for the question
        let feedbackButton = document.createElement('button');
        feedbackButton.className = 'feedback-button';
        feedbackButton.innerHTML = languageMap['check'];
        // actions depending on the type of question (single or multiple choice)
        let inputType, changeHandler;
        if (question.classList.contains('question-single')) {
            // determine type of input button: radio
            inputType = 'radio';
            // onclick event handler
            // following line: comment for feedback buttons on the side
            feedbackButton.onclick = singleFeedbackHandler;
            // function to handle changes in answers
            changeHandler = singleChangeHandler;
            // disable feedback button (until an answer is selected)
            feedbackButton.disabled = true;
        } else if (question.classList.contains('question-multiple')) {
            // determine type of input button: checkbox
            inputType = 'checkbox';
            // onclick event handler
            // following line: comment for feedback buttons on the side
            feedbackButton.onclick = multipleFeedbackHandler;
            // function to handle changes in answers
            changeHandler = multipleChangeHandler;
            // enable feedback button (because all answers might be uncheckable)
            feedbackButton.disabled = false;
        }
        // create a fieldset to place all answers in
        let fieldset = document.createElement('fieldset');
        // retrieve answers (labels) to the question
        let answers = question.querySelectorAll("label");
        let answerCounter = 1;
        for (let answer of answers) {
            // create radio button for answer, if not already present
            if (first_child(answer).nodeType != 1 || first_child(answer).nodeName != 'INPUT') {
                let radiobutton = document.createElement('input');
                radiobutton.name = 'question-' + questionCounter;
                radiobutton.type = inputType;
                answer.insertBefore(radiobutton, answer.firstChild);
            }
            // make sure the answer isn't checked
            answer.querySelector('input').checked = false;
            // link segment to feedback and button
            answer.feedback = answer.querySelector('.feedback');
            if (answer.feedback) answer.feedback.hide();
            // following 2 lines: for feedback buttons on the side
            // answer.appendChild(feedbackButton.cloneNode(true));
            // answer.lastChild.onclick = feedbackButtonClickHandler;
            answer.button = feedbackButton;
            // onchange event handler
            answer.onchange = changeHandler;
            // move answer into fieldset
            fieldset.appendChild(answer);
        }
        //
        question.appendChild(fieldset);
        // following line: comment for feedback buttons on the side
        question.appendChild(feedbackButton);
        questionCounter++;
    }
}

function processFooter() {
    // place footer within a container
    let container = document.createElement('div');
    container.className = 'footer-container';
    let footer = document.querySelector('footer');
    footer.parentNode.insertBefore(container, footer);
    container.appendChild(footer);
}

function processGroup(preselector, selector, groupName, buttons=false, containerName=groupName) {
    // handles groups (such as explanations, questions and sidenotes)
    //
    // Locates groups of consequtive elements and groups them into a div.
    // Optionally places the group div into a container div (so that buttons,
    // etc. can later be added).
    //
    // @param preselector   A selector used to match the element *right before* the
    //                      first element of the group.
    // @param selector      A selector used to match the consequtive elements of
    //                      the group.
    // @param groupName     The name of the group div (actual name will be
    //                      groupName + '-group').
    // @param containerName The name of the container div (actual name will be
    //                      containerName + '-container'). If not provided, it
    //                      defaults to the name of the group. If null, no
    //                      container is generated.

    // use preselector to find the first element for each group of elements
    let firsts;
    if (preselector)
        firsts = document.querySelectorAll(preselector + ' + ' + selector);
    else
        firsts = document.querySelectorAll(selector);
    if (containerName) {
        for (let first of firsts) {
            // move all sibling elements into a group div
            let group = groupSelected(first, selector, groupName + '-group');
            // create a container to hold the group and place it
            let container = document.createElement('div');
            container.classList.add(containerName + '-container');
            container.classList.add('group-container');
            group.parentNode.insertBefore(container, group);
            container.appendChild(group);
            // create buttons, if so requested
            if (buttons) addGroupButtons(container, containerName);
        }
    } else {
        for (let first of firsts) {
            // move all sibling elements into a group div
            groupSelected(first, selector, groupName + '-group');
        }
    }
}


/***
    Event handlers and related functions
***/

//// event handlers for navigation buttons

function prevClickHandler() {
    // hides the current section and reveals the previous one
    let section = this.ancestor('section');
    section.hide();
    section.heading.hide();
    section.prev.show();
    section.prev.heading.show();
    // window.scrollBy(0, section.prev.heading.getBoundingClientRect().top);
    window.scrollTo(0,0);
}

function nextClickHandler() {
    // hides the current section and reveals the next one
    let section = this.ancestor('section');
    section.hide();
    section.heading.hide();
    section.next.show();
    section.next.heading.show();
    window.scrollTo(0,0);
}

//// event handler for group buttons

function buttonDeactivate(btn) {
    // deactivate button
    btn.classList.remove('active');
    btn.element.hide();
    btn.parentNode.active = null;
}

function buttonActivate(btn) {
    // check for other currently active element and deactivate
    if (btn.parentNode.active) buttonDeactivate(btn.parentNode.active);
    // activate button
    btn.classList.add('active');
    btn.element.show();
    btn.parentNode.active = btn;
}

function groupButtonClickHandler() {
    if (this.classList.contains('active')) {
        // clicked on active element » deactivate
        buttonDeactivate(this);
    } else {
        // clicked on inactive element » activate
        buttonActivate(this);
    }
}

//// event handlers for explanations

function highlightExplanation() {
    this.classList.add('explained');
    // go up from the <a> to <code> to <li>
    this.linked.ancestor('li').classList.add('explained');
}

function unhighlightExplanation() {
    this.classList.remove('explained');
    // go up from the <a> to <code> to <li>
    this.linked.ancestor('li').classList.remove('explained');
}

function highlightSegment() {
    // go up two levels, from the <a> to <code> to <li>
    this.ancestor('li').classList.add('explained');
    this.linked.classList.add('explained');
}

function unhighlightSegment() {
    // go up two levels, from the <a> to <code> to <li>
    this.ancestor('li').classList.remove('explained');
    this.linked.classList.remove('explained');
}

// event handlers for questions

function labelHighlight(label) {
    label.classList.add('highlighted');
    if (label.feedback) label.feedback.show();
}

function labelDehighlight(label) {
    label.classList.remove('highlighted');
    if (label.feedback) label.feedback.hide();
}

function singleChangeHandler() {
    // enable feedback button (for buttons on the side, the answer's last child is the button)
    // this.lastChild.disabled = false;
    // enable feedback button
    this.ancestor('.question').querySelector('.feedback-button').disabled = false;
    // de-highlight previously highlighted answers
    let answer = this.ancestor('fieldset').querySelector('label.highlighted');
    if (answer) labelDehighlight(answer);
}

function singleFeedbackHandler() {
    // retrieve selected answer and display its associated feedback
    let answer = this.ancestor('.question').querySelector('label > input:checked').parentNode;
    labelHighlight(answer);
    // disable the feedback button
    this.disabled = true;
}

function multipleChangeHandler() {
    // enable feedback button (for buttons on the side, the answer's last child is the button)
    // this.lastChild.disabled = false;
    // enable feedback button
    this.ancestor('.question').querySelector('.feedback-button').disabled = false;
    // de-highlight single changed answer (because it has changed)
    let answer = this;
    labelDehighlight(answer);
    /*
    // de-highlight all answers (because one has changed)
    let answers = this.ancestor('fieldset').querySelectorAll('label.highlighted');
    for (let answer of answers) labelDehighlight(answer);
    */
}

function multipleFeedbackHandler() {
    // retrieve all answers and display their associated feedback
    // depending on whether they are correctly checked or not
    let answers = this.ancestor('.question').querySelectorAll('label');
    for (let answer of answers) {
        let input = answer.querySelector('input');
        if ((input.checked && answer.hasAttribute('checkable')) ||
            (!input.checked && !answer.hasAttribute('checkable')))
            answer.setAttribute('correct', '');
        else
            answer.removeAttribute('correct');
        labelHighlight(answer);
    }
    // disable the feedback button
    this.disabled = true;
}

// event handler for steps

function expandAllSteps() {
    for (let step of document.querySelectorAll('div.step-heading:not(.expanded)'))
        step.classList.add('expanded');
}

function collapseAllSteps() {
    for (let step of document.querySelectorAll('div.step-heading.expanded'))
        step.classList.remove('expanded');
}

function toggleExpanded() {
    // event handler: toggles the element's 'expanded' class membership
    this.toggleClass('expanded');
}

/***
    Handling of different kinds of buttons
***/

let buttonMap = {
    'generic': function(buttons, counters) {
        for (let button of buttons.childNodes) {
            button.innerHTML = button.element.getAttribute('text');
        }
    },

    'question': function (buttons, counters) {
        let stepNumber = buttons.ancestor('div.step').getAttribute('counter');
        let questionNumber = 1;
        for (let button of buttons.childNodes) {
            button.innerHTML = languageMap['question'] + ' ' + stepNumber + '.' + questionNumber;
            questionNumber++;
        }
    },

    'hint': function (buttons, counters) {
        for (let button of buttons.childNodes) {
            if (button.element.classList.contains('solution')) {
                if (counters['solution'] < 2)
                    button.innerHTML = languageMap['solution'];
                else
                    button.innerHTML = languageMap['solution'] + ' ' + button.counter;
            } else if (button.element.classList.contains('answer')) {
                if (counters['answer'] < 2)
                    button.innerHTML = languageMap['answer'];
                else
                    button.innerHTML = languageMap['answer'] + button.counter;
            } else {
                if (counters['hint'] < 2)
                    button.innerHTML = languageMap['hint'];
                else
                    button.innerHTML = languageMap['hint'] + ' ' + button.counter;
            }
        }
    }
}


/** REWRITE TO MATCH: NOW HANDLES A SINGLE CONTAINER AT A TIME
 * Creates a group of buttons within a group container. The buttons correspond
 * to the elements of the group.
 *
 * Each button contains an 'element' attribute which references the button's
 * corresponding element. Each element contains a 'button' attribute which
 * references the element's corresponding button.
 *
 * For styling purposes, all created buttons belong to the 'group-button' class,
 * as well as a class of the form name + '-button'.
 *
 * When a button is active, it becomes a member of the 'active' class. Also,
 * the div element that contains the group of buttons has an 'active' attribute
 * that points to the active button.
 *
 * @param name          The name of the container class (actual name will be
                        name + '-container').
 * @param buttonTxt     The text to appear on the numbered buttons.
 */
function addGroupButtons(container, name) {
    // retrieve the group inside the container
    // the buttons will correspond to the children of this group
    let group = container.firstChild;
    hideAll(group.childNodes);
    // create div for the buttons
    let buttons = document.createElement('div');
    buttons.classList.add(name + '-group-buttons');
    // add to generic 'group-buttons' class
    buttons.classList.add('group-buttons');
    buttons.active = null;
    let buttonCounters = {};
    for (let element of group.childNodes) {
        // create button
        let button = document.createElement('button');
        button.className = 'group-button ' + name + '-button';
        buttons.appendChild(button);
        // link to element
        button.element = element;
        element.button = button;
        if (element.classList.contains('active')) {
            element.classList.remove('active');
            buttonActivate(button);
        }
        // button content: numbering according to button class
        // it is important that the class list of the group element contains
        // the most important class **first**, i.e. hint or solution
        let buttonType = element.classList[0];
        if (buttonCounters[buttonType]) {
            buttonCounters[buttonType]++;
        } else {
            buttonCounters[buttonType] = 1;
        }
        button.counter = buttonCounters[buttonType];
        // click event
        button.onclick = groupButtonClickHandler;
    }
    // place the buttons before the group
    container.insertBefore(buttons, container.firstChild);
    // use the appropriate function in the buttonMap to properly label and
    // number the group buttons
    buttonMap[name](buttons, buttonCounters);
}



/***
    Generic functions
***/

/**
 * Adds an enumeration attribute to a collection of elements
 *
 * @param elements  The collection of elements to be enumerated
 * @param start     The starting enumeration value
 * @param attribute The name of the attribute containing the enumeration value
 */
function enumerate(elements, start=0, attribute='index') {
    let value = start;
    for (let element of elements) {
        element.setAttribute(attribute, value);
        value++;
    }
}

/**
 * Adds a prev and next attribute to a collection of elements, thus linking
 * them together.
 *
 * @param elements  The collection of elements to be linked. It is assumed
 *                  that elements.length > 1.
 */
function link(elements) {
    elements[0].prev = null;
    elements[0].next = elements[1];
    for (let index=1; index < elements.length-1; index++) {
        elements[index].prev = elements[index-1];
        elements[index].next = elements[index+1];
    }
    elements[elements.length-1].prev = elements[elements.length-2];
    elements[elements.length-1].next = null;
}

/**
 * Toggles a Node's class membership. If the class is in the Node's classList,
 * then it is removed and vice versa.
 *
 * @param cls       The name of the class that is toggled.
 */
Node.prototype.toggleClass = function(cls) {
    if (this.classList.contains(cls))
        this.classList.remove(cls);
    else
        this.classList.add(cls);
}

String.prototype.trimLeft = function () {
    // adapted from:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim
    return this.replace(/^[\s\uFEFF\xA0]+/g, '');
};

String.prototype.trimRight = function () {
    // adapted from:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim
    return this.replace(/[\s\uFEFF\xA0]+$/g, '');
};

////// generic functions for locating and grouping elements

/**
 * Retrieves a Node's next sibling, provided that it matches a selector.
 * It ignores intermediate text nodes comprising entirely of whitespace.
 *
 * @param selector  The selector that the retrieved sibling should match.
 *
 * @return          The next sibling, if it matches the selector, or
 *                  null otherwise.
 */
Node.prototype.nextSelectedSibling = function(selector) {
    let element = node_after(this);
    if (element && element.matches(selector)) return element; else return null;
}

/**
 * Retrieves a Node's ancestor that matches a selector.
 *
 * @param selector  The selector that the retrieved ancestor should match.
 *
 * @return          The closest ancestor that matches the selector, or
 *                  null if none exists.
 */
Node.prototype.ancestor = function(selector) {
    let node = this;
    while (node && !node.matches(selector)) node = node.parentNode;
    return node;
}

/**
 * Starting from a specified first element, it locates and groups all its
 * consequtive sibling elements that match a selector into a group div.
 *
 * @param first     The element from which the grouping begins.
 * @param selector  The selector that all consequtive sibling elements should
 *                  match.
 * @param name      The name of the group div that holds the selected elements.
 *
 * @return          The new group div, that has already been inserted into the
 *                  DOM, in the place of the original group of elements.
 */
function groupSelected(first, selector, name) {
    // create a div to hold the elements of the group
    let container = document.createElement('div');
    container.classList.add(name);
    // add to generic 'group' class
    container.classList.add('group');
    // placement of the group div right before the first element
    first.parentNode.insertBefore(container, first);
    // find consecutive selected sibling elements and move them in the group div
    let current = first;
    while (current) {
        // add to generic 'group-element' class
        current.classList.add('group-element');
        // find next element before appending current one
        // otherwise the sibling 'connection' between them is lost
        let next = current.nextSelectedSibling(selector);
        container.appendChild(current);
        current = next;
    }
    return container;
}

////// simple generic functions for hiding or revealing elements

Node.prototype.hide = function() {
    // hide the element
    this.style.display = 'none';
}

Node.prototype.show = function(display='block') {
    // show the element
    this.style.display = display;
}

function hideAll(elements) {
    // hide all elements
    for (let element of elements) element.hide();
}

function showSingle(elements, index, display='block') {
    // show only a single element, specified by index
    hideAll(elements);
    elements[index].show(display);
}


/**
 * generic function for parsing query string
 * from: https://www.sitepoint.com/get-url-parameters-with-javascript/
 * reference: https://developer.mozilla.org/en-US/docs/Web/API/Window/location
 */

function getUrlParams(url) {
  // get query string from url (optional) or window
  var queryString = url ? url.split('?')[1] : window.location.search.slice(1);

  // we'll store the parameters here
  var obj = {};

  // if query string exists
  if (queryString) {

    // stuff after # is not part of query string, so get rid of it
    queryString = queryString.split('#')[0];

    // split our query string into its component parts
    var arr = queryString.split('&');

    for (var i=0; i<arr.length; i++) {
      // separate the keys and the values
      var a = arr[i].split('=');

      // in case params look like: list[]=thing1&list[]=thing2
      var paramNum = undefined;
      var paramName = a[0].replace(/\[\d*\]/, function(v) {
        paramNum = v.slice(1,-1);
        return '';
      });

      // set parameter value (use 'true' if empty)
      var paramValue = typeof(a[1])==='undefined' ? true : a[1];

      // (optional) keep case consistent
      paramName = paramName.toLowerCase();
      // paramValue = paramValue.toLowerCase();

      // if parameter name already exists
      if (obj[paramName]) {
        // convert value to array (if still string)
        if (typeof obj[paramName] === 'string') {
          obj[paramName] = [obj[paramName]];
        }
        // if no array index number specified...
        if (typeof paramNum === 'undefined') {
          // put the value on the end of the array
          obj[paramName].push(paramValue);
        }
        // if array index number specified...
        else {
          // put the value at that index number
          obj[paramName][paramNum] = paramValue;
        }
      }
      // if param name doesn't exist yet, set it
      else {
        obj[paramName] = paramValue;
      }
    }
  }

  return obj;
}
