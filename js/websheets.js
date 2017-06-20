'use strict';

//// functions for hiding or revealing elements

function hide(element) {
    // hide the element
    element.style.display = 'none';
}

function hideAll(elements) {
    // hide all elements in the list
    for (let element of elements) hide(element);
}

function show(element, display='block') {
    // show the element
    element.style.display = display;
}

function showSingle(elements, index, display='block') {
    // show only a single element in the list, specified by index
    hideAll(elements);
    show(elements[index], display);
}


//// functions for locating and grouping elements

function nextSelectedSibling(element, selector) {
    while ((element = node_after(element)))
        if (element.matches(selector)) return element; else return null;
    return null;
}

function groupSelected(current, selector, name) {
    let next;
    // create a container div for the group
    let container = document.createElement('div');
    container.className = name;
    // placement
    current.parentNode.insertBefore(container, current);
    // find sibling elements and move them in the container div
    while (current) {
        // find next element before appending current one
        // otherwise the sibling 'connection' between them is lost
        next = nextSelectedSibling(current, selector);
        container.appendChild(current);
        current = next;
    }
    return container;
}

function addGroupButtons(name, buttonTxt) {
    let group, button, buttons, buttonCounter;
    let containers = document.querySelectorAll('.' + name + '-container');
    for (let container of containers) {
        // retrieve the group inside the container
        // the buttons will correspond to the children of this group
        group = container.firstChild;
        hideAll(group.childNodes);
        // create div for the buttons
        buttons = document.createElement('div');
        buttons.className = name + '-group-buttons';
        buttons.active = null;
        buttonCounter = 0;
        for (let element of group.childNodes) {
            // create button
            button = document.createElement('button');
            button.className = 'group-button ' + name + '-button';
            // link to element
            button.element = element;
            element.button = button;
            // button content
            buttonCounter++;
            button.innerHTML = buttonTxt + ' ' + buttonCounter;
            // click event
            button.onclick = function() {
                if (this.hasAttribute('active')) {
                    // clicked on active element » deactivate
                    this.removeAttribute('active');
                    hide(this.element);
                    this.parentNode.active = null;
                } else {
                    // clicked on inactive element » activate
                    if (this.parentNode.active) {
                        // deactivate active element
                        this.parentNode.active.removeAttribute('active');
                        hide(this.parentNode.active.element);
                    }
                    // activate this element
                    this.setAttribute('active', '');
                    show(this.element);
                    this.parentNode.active = this;
                }
            }
            buttons.appendChild(button);
        }
        // place the buttons before the group
        container.insertBefore(buttons, container.firstChild);
    }
}

function handleGroup(preselector, selector, groupName, containerName=groupName) {
    // Groups successive selected elements into a group div.
    // Optionally places the group div inside a container div.

    let group, container;
    // find the first element for each group of elements
    let firsts = document.querySelectorAll(preselector + ' + ' + selector);
    if (containerName) {
        for (let first of firsts) {
            // move all sibling elements into a group div
            group = groupSelected(first, selector, groupName + '-group');
            // create a container to hold the group
            container = document.createElement('div');
            container.className = containerName + '-container';
            group.parentNode.insertBefore(container, group);
            container.appendChild(group);
        }
    } else {
        for (let first of firsts) {
            // move all sibling elements into a group div
            groupSelected(first, selector, groupName + '-group');
        }
    }
}


//// functions to assist li numbering and navigation

function enumerate(elements, start=1) {
    // adds an explicit numerical "value" attribute to the elements
    let value = start;
    for (let element of elements) {
        element.value = value;
        element.setAttribute('value', value);
        value++;
    }
}

function link(elements) {
    // adds a prev and next attribute to all elements, thus linking them
    // assumes elements.length > 1
    elements[0].prev = null;
    elements[0].next = elements[1];
    for (let index=1; index < elements.length-1; index++) {
        elements[index].prev = elements[index-1];
        elements[index].next = elements[index+1];
    }
    elements[elements.length-1].prev = elements[elements.length-2];
    elements[elements.length-1].next = null;
}

/*
//// generally useful function...

function toggleAttribute(element, attribute) {
    if (element.hasAttribute(attribute))
        element.removeAttribute(attribute);
    else
        element.setAttribute(attribute, "");
}
*/


//// function for automatic step handling

function expandAllSteps() {
    for (let step of document.querySelectorAll('div.step-heading:not(.expanded)'))
        step.classList.add('expanded');
}

function expandStep(stepIndex) {
    if (stepIndex < 1) {
        console.warn('invalid step index: must be greater than 0');
        return;
    }
    let steps = document.querySelectorAll('div.step-heading');
    stepIndex--;
    if (stepIndex >= steps.length) {
        console.warn('invalid step index: must be less than', steps.length);
        return;
    }
    steps[stepIndex].classList.add('expanded');
}

function collapseAllSteps() {
    for (let step of document.querySelectorAll('div.step-heading.expanded'))
        step.classList.remove('expanded');
}

function handleSteps() {
    // Prepends a 'step-heading' div to each 'div.step' element.
    // Each 'step-heading' div contains an auto-numbered 'h3' and
    // an expand/collapse button for the step contents.

    //
    let headingDiv, heading, button;
    // retrieve all steps
    let steps = document.querySelectorAll('div.step');
    let stepindex = 1;
    for (let step of steps) {
        // create the 'step-heading' div
        headingDiv = document.createElement('div');
        headingDiv.className = 'step-heading';
        // make an auto-numbered h3 heading for the step
        heading = document.createElement('h3');
        heading.innerHTML = 'Βήμα ' + stepindex;
        // make an expand/collapse button
        button = document.createElement('button');
        button.className = 'expand-button';
        headingDiv.onclick = function() {
            if (this.classList.contains('expanded'))
                this.classList.remove('expanded');
            else
                this.classList.add('expanded');
        }
        // placement
        headingDiv.appendChild(heading);
        headingDiv.appendChild(button);
        step.parentNode.insertBefore(headingDiv, step);
        stepindex++;
    }
}


//// functions to create and handle navigation buttons for sections

function handleSectioning() {
    // Inserts a 'section-heading' div at the beginning of each section.
    // Each 'section-heading' div contains the section title (drawn from the
    // 'h2' section heading, if it exists) and an auto-numbered 'h4' sub-title

    let heading, headingDiv, subheading;
    let sectionIndex = 1;
    for (let section of document.querySelectorAll('section')) {
        // retrieve the section's heading
        heading = nextSelectedSibling(section.firstChild, 'h2');
        // creating the 'section-heading' div and insert it
        headingDiv = document.createElement('div');
        headingDiv.className = 'section-heading';
        section.insertBefore(headingDiv, section.firstChild);
        // create the subheading with the section's number and insert it
        subheading = document.createElement(heading ? 'h4' : 'h2');
        subheading.innerHTML = 'Ενότητα ' + sectionIndex;
        headingDiv.appendChild(subheading);
        // now insert the section heading into the div, if it exists
        if (heading) {
            section.title = heading.textContent;
            headingDiv.appendChild(heading);
        } else {
            section.title = subheading.textContent;
        }
        sectionIndex++;
    }
}

function handleNavigation(visibleSection) {
    // Adds a 'nav-button' div to the end of each section.
    // Each 'nav-button' div contains a 'prev-button' and a 'next-button'.

    let buttons, prev, next;
    // retrieve all sections
    let sections = document.querySelectorAll('section');
    link(sections);
    let sectionIndex = 0;
    for (let section of sections) {
        // create a 'nav-buttons' container for the prev/next navigation buttons
        buttons = document.createElement('div');
        buttons.className = 'nav-buttons';
        // create the "previous" button
        prev = document.createElement('button');
        prev.className = 'nav-button prev-button';
        if (section.prev) {
            prev.innerHTML = '<div>Προηγούμενη Ενότητα<br>' + section.prev.title + '</div>'
        } else {
            prev.innerHTML = '<div>Προηγούμενη Ενότητα<br>&nbsp;</div>'
            prev.disabled = true;
        }
        // click event
        prev.onclick = function() {
            // hides the current section and reveals the previous one
            // assumes the current section is two levels up the button
            section = this.ancestor('section');
            hide(section);
            show(section.prev);
            window.scrollBy(0, section.prev.getBoundingClientRect().top);
        }
        if (!section.prev) prev.disabled = true;

        // create the "next" button
        next = document.createElement('button');
        next.className = 'nav-button next-button';
        if (section.next) {
            next.innerHTML = '<div>Επόμενη Ενότητα<br>' + section.next.title + '</div>'
        } else {
            next.innerHTML = '<div>Επόμενη Ενότητα<br>&nbsp;</div>'
            next.disabled = true;
        }
        // click event
        next.onclick = function() {
            // hides the current section and reveals the next one
            // assumes the current section is two levels up the button
            section = this.ancestor('section');
            hide(section);
            show(section.next);
            window.scrollBy(0, section.next.getBoundingClientRect().top);
        }

        // add buttons to the 'nav-buttons' div
        buttons.appendChild(prev);
        buttons.appendChild(next);
        //buttons.appendChild(select);

        // add the 'nav-buttons' div to the current section
        section.appendChild(buttons);
    }

    // show only first section
    if (!visibleSection)
        visibleSection = 1;
    else if (visibleSection < 1 || visibleSection > sections.length) {
        visibleSection = 1;
        console.warn('invalid section, defaulting to', visibleSection);
    }
    showSingle(sections, visibleSection-1);
}

//// functions for code explanations

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


function handleExplanations() {
    // Retrieves all <aside> elements that follow code blocks and groups them
    // into an 'explanation-group' div.
    // It then retrieves all <a> elements inside the code segment and links them
    // to the corresponding 'aside' explanations.

    let block, explained, explanation;
    //
    let containers = document.querySelectorAll('pre.prettyprint + div.code-container');
    for (let container of containers) {
        block = node_before(container);
        // find all code segments in the block which link to an explanation
        explained = block.querySelectorAll("a");
        explanation = container.firstChild.firstChild;
        while (explanation && explanation.hasAttribute('orphan')) explanation = explanation.nextSibling;
        for (let segment of explained) {
            // link segment to explanation (via object properties)
            segment.linked = explanation;
            explanation.linked = segment;
            // attach event listeners to segments and explanations
            explanation.onmouseover = highlightExplanation;
            explanation.onmouseout = unhighlightExplanation;
            segment.onmouseover = highlightSegment;
            segment.onmouseout = unhighlightSegment;
            // move to next explanation
            explanation = explanation.nextSibling;
            while (explanation && explanation.hasAttribute('orphan'))
                explanation = explanation.nextSibling;
        }
        container.insertBefore(block, container.firstChild);
    }
}

function handleSidenotes() {

    let block;
    let containers = document.querySelectorAll('p + div.sidenote-container');
    for (let container of containers) {
        block = node_before(container);
        container.insertBefore(block, container.firstChild);
    }
}

//// functions for closed form questions and immediate feedback

function handleQuestions() {
    let feedbackButton;
    // find all closed form questions with a single answer
    let questions = document.querySelectorAll("div.question-single");
    for (let question of questions) {
        // create a feedback button
        let feedbackButton = document.createElement('button');
        feedbackButton.className = 'feedback-button';
        feedbackButton.innerHTML = 'Έλεγχος Απάντησης';
        feedbackButton.disabled = true;
        // onclick event handler
        feedbackButton.onclick = function() {
            // retrieve selected answer and display its associated feedback
            let selected = question.querySelector('input:checked').parentNode;
            selected.setAttribute('highlighted', '');
            if (selected.feedback) show(selected.feedback);
            // disable the feedback button
            this.disabled = true;
        }
        question.appendChild(feedbackButton);
        // retrieve answers (labels) to the question
        let answers = question.querySelectorAll("label");
        for (let answer of answers) {
            // make sure the answer isn't checked
            answer.querySelector('input').checked = false;
            // link segment to explanation (via object properties)
            answer.feedback = answer.querySelector('aside');
            if (answer.feedback) hide(answer.feedback);
            // onchange event handler
            answer.onchange = function() {
                // enable feedback button
                feedbackButton.disabled = false;
                // hide active feedback
                let feedback = question.querySelectorAll('aside');
                if (feedback) hideAll(feedback);
                // de-highlight previously highlighted answer
                let selected = question.querySelector('label[highlighted]');
                if (selected) selected.removeAttribute('highlighted');
            }
        }
    }
}

//// run this part **before** run_prettify.js

String.prototype.trimLeft = function () {
    // adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim
    return this.replace(/^[\s\uFEFF\xA0]+/g, '');
};

String.prototype.trimRight = function () {
    // adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim
    return this.replace(/[\s\uFEFF\xA0]+$/g, '');
  };

Node.prototype.ancestor = function(selector) {
    node = this;
    while (node && !node.matches(selector)) node = node.parentNode;
    return node;
}

let node, code;
//
let blocks = document.querySelectorAll('pre.prettyprint');
for (let block of blocks) {
    // force linenums (even if just for correct rendering)
    if (!block.classList.contains('linenums')) {
        block.classList.add('linenums');
        block.setAttribute('mock-linenums', '');
    }

    // remove whitespace between <pre> and <code> tags -> allows indenting
    if (block.firstChild.nodeType == 3 && is_all_ws(block.firstChild))
        block.removeChild(block.firstChild);
    if (block.lastChild.nodeType == 3 && is_all_ws(block.lastChild))
        block.removeChild(block.lastChild);

    //
    let segment = block.querySelector('code');
    // remove trailing whitespace between actual code and the </code> tag
    if (segment.lastChild.nodeType == 3)
        segment.lastChild.textContent = segment.lastChild.textContent.trimRight();
    //
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
            const firstLineIndent = segment.firstChild.textContent.search(/[\S\uFEFF\xA0]/);
            // replace leading indent with indent specified by user
            const replaced = ' '.repeat(firstLineIndent);
            const replacement = ' '.repeat(indent);
            let headingFilter = RegExp('^' + replaced, 'gm');
            for (let node of segment.childNodes)
                if (node.nodeType == 3)
                    node.textContent = node.textContent.replace(headingFilter, replacement);
        }
    }

    // console.log('code: after');
    // console.log(segment.childNodes);
    // console.log('----');
}

function getUrlParams(url) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/location
    // https://www.sitepoint.com/get-url-parameters-with-javascript/

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

//// onload

document.body.onload = function() {
    let params = getUrlParams();
    // add auto-numbered collapsible headings before each step
    handleSteps();
    if (params.expanded == undefined)
        expandAllSteps();
    else if (params.expanded)
        expandStep(params.expanded);
    // add section headers and navigation buttons
    handleSectioning();
    handleNavigation(params.section);
    // create buttons for all hints
    handleGroup(':not(.hint)', '.hint', 'hint');
    addGroupButtons('hint', 'Υπόδειξη');
    let solutions = document.querySelectorAll('.solution');
    for (let solution of solutions) solution.button.innerHTML = 'Λύση';
    // create buttons for all questions, along with answer-checking mechanism
    handleGroup(':not(.question)', '.question', 'question');
    addGroupButtons('question', 'Ερώτηση');
    handleQuestions();
    //
    handleGroup('pre.prettyprint', 'aside', 'sidenote', 'code');
    handleExplanations();
    //
    handleGroup('p', 'aside', 'sidenote');
    handleSidenotes();
    //
    if (params.marginnotes) document.body.classList.add('marginnotes');
    //
    for (let del of document.querySelectorAll('pre del'))
        del.ancestor('pre li').classList.add('del');
    for (let ins of document.querySelectorAll('pre ins'))
        ins.ancestor('pre li').classList.add('ins');
    for (let mark of document.querySelectorAll('pre mark'))
        mark.ancestor('pre li').classList.add('mark');
}
