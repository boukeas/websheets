//// functions for hiding or revealing elements

function hide(element) {
    // hide the element
    element.style.display = 'none';
}

function hideAll(elements) {
    // hide all elements in the list
    for (var element of elements) hide(element);
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
    // create a container div for the group
    var container = document.createElement('div');
    container.className = name;
    // placement
    current.parentNode.insertBefore(container, current);
    // find sibling elements and move them in the container div
    while (current) {
        // find next element before appending current one
        // otherwise the sibling 'connection' between them is lost
        var next = nextSelectedSibling(current, selector);
        container.appendChild(current);
        current = next;
    }
    return container;
}

function addGroupButtons(name, buttonTxt) {
    var containers = document.querySelectorAll('.' + name + '-container');
    for (var container of containers) {
        // retrieve the group inside the container
        // the buttons will correspond to the children of this group
        var group = container.firstChild;
        hideAll(group.childNodes);
        // create div for the buttons
        var buttons = document.createElement('div');
        buttons.className = name + '-group-buttons';
        buttons.active = null;
        var buttonCounter = 0;
        for (var element of group.childNodes) {
            // create button
            var button = document.createElement('button');
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

    // find the first element for each group of elements
    var firsts = document.querySelectorAll(preselector + ' + ' + selector);
    if (containerName) {
        for (var first of firsts) {
            // move all sibling elements into a group div
            var group = groupSelected(first, selector, groupName + '-group');
            // create a container to hold the group
            var container = document.createElement('div');
            container.className = containerName + '-container';
            group.parentNode.insertBefore(container, group);
            container.appendChild(group);
        }
    } else {
        for (var first of firsts) {
            // move all sibling elements into a group div
            groupSelected(first, selector, groupName + '-group');
        }
    }
}


//// functions to assist li numbering and navigation

function enumerate(elements, start=1) {
    // adds an explicit numerical "value" attribute to the elements
    var value = start;
    for (var element of elements) {
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
    for (var index=1; index < elements.length-1; index++) {
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

function ECStepButtonHandler() {
    if (this.hasAttribute('expanded')) {
        // step is now expanded, so collapse it
        hide(this.parentNode.nextSibling);
        this.removeAttribute('expanded');
    } else {
        // step is now collapsed, so expand it
        show(this.parentNode.nextSibling);
        this.setAttribute('expanded', '');
    }
}

function handleSteps() {
    // Prepends a 'step-heading' div to each 'div.step' element.
    // Each 'step-heading' div contains an auto-numbered 'h3' and
    // an expand/collapse button for the step contents.

    // retrieve all steps
    var steps = document.querySelectorAll('div.step');
    stepindex = 1;
    for (var step of steps) {
        // create the 'step-heading' div
        var headingDiv = document.createElement('div');
        headingDiv.className = 'step-heading';
        // make an auto-numbered h3 heading for the step
        var heading = document.createElement('h3');
        heading.innerHTML = 'Βήμα ' + stepindex;
        // make an expand/collapse button
        var button = document.createElement('button');
        button.className = 'expand-button';
        button.setAttribute('expanded', '');
        button.onclick = ECStepButtonHandler;
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

    sectionIndex = 1;
    for (var section of document.querySelectorAll('section')) {
        // retrieve the section's heading
        var heading = nextSelectedSibling(section.firstChild, 'h2');
        // creating the 'section-heading' div and insert it
        var headingDiv = document.createElement('div');
        headingDiv.className = 'section-heading';
        section.insertBefore(headingDiv, section.firstChild);
        // create the subheading with the section's number and insert it
        var subheading = document.createElement(heading ? 'h4' : 'h2');
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

function handleNavigation() {
    // Adds a 'nav-button' div to the end of each section.
    // Each 'nav-button' div contains a 'prev-button' and a 'next-button'.

    // retrieve all sections
    var sections = document.querySelectorAll('section');
    link(sections);
    sectionIndex = 0;
    for (var section of sections) {
        // create a 'nav-buttons' container for the prev/next navigation buttons
        var buttons = document.createElement('div');
        buttons.className = 'nav-buttons';
        // create the "previous" button
        var prev = document.createElement('button');
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
            section = this.parentNode.parentNode;
            hide(section);
            show(section.prev);
            window.scrollBy(0, section.prev.getBoundingClientRect().top);
        }
        if (!section.prev) prev.disabled = true;

        // create the "next" button
        var next = document.createElement('button');
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
            section = this.parentNode.parentNode;
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
    showSingle(sections, 0);
}


//// functions for code explanations

function highlightLinked() {
    this.setAttribute('highlighted', "");
    this.linked.setAttribute('highlighted', "");
}

function unhighlightLinked() {
    this.removeAttribute('highlighted');
    this.linked.removeAttribute('highlighted');
}

function handleExplanations() {
    // Retrieves all <aside> elements that follow code blocks and groups them
    // into an 'explanation-group' div.
    // It then retrieves all <a> elements inside the code segment and links them
    // to the corresponding 'aside' explanations.

    var containers = document.querySelectorAll('pre.prettyprint + div.code-container');
    for (var container of containers) {
        var block = node_before(container);
        // find all code segments in the block which link to an explanation
        var explained = block.querySelectorAll("a");
        var explanation = container.firstChild.firstChild;
        while (explanation && explanation.hasAttribute('orphan')) explanation = explanation.nextSibling;
        for (var segment of explained) {
            // link segment to explanation (via object properties)
            segment.linked = explanation;
            explanation.linked = segment;
            // attach event listeners to segments and explanations
            explanation.onmouseover = highlightLinked;
            explanation.onmouseout = unhighlightLinked;
            segment.onmouseover = highlightLinked;
            segment.onmouseout = unhighlightLinked;
            // move to next explanation
            explanation = explanation.nextSibling;
            while (explanation && explanation.hasAttribute('orphan'))
                explanation = explanation.nextSibling;
        }
        container.insertBefore(block, container.firstChild);
    }
}

function handleSidenotes() {

    var containers = document.querySelectorAll('p + div.sidenote-container');
    for (var container of containers) {
        var block = node_before(container);
        container.insertBefore(block, container.firstChild);
    }
}

//// functions for closed form questions and immediate feedback

function handleQuestions() {
    // find all closed form questions with a single answer
    var questions = document.querySelectorAll("div.question-single");
    for (var question of questions) {
        // create a feedback button
        var feedbackButton = document.createElement('button');
        feedbackButton.className = 'feedback-button';
        feedbackButton.innerHTML = 'Έλεγχος Απάντησης';
        feedbackButton.disabled = true;
        // onclick event handler
        feedbackButton.onclick = function() {
            // retrieve selected answer and display its associated feedback
            var selected = question.querySelector('input:checked').parentNode;
            selected.setAttribute('highlighted', '');
            if (selected.feedback) show(selected.feedback);
            // disable the feedback button
            this.disabled = true;
        }
        question.appendChild(feedbackButton);
        // retrieve answers (labels) to the question
        var answers = question.querySelectorAll("label");
        for (var answer of answers) {
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
                var feedback = question.querySelectorAll('aside');
                if (feedback) hideAll(feedback);
                // de-highlight previously highlighted answer
                var selected = question.querySelector('label[highlighted]');
                if (selected) selected.removeAttribute('highlighted');
            }
        }
    }
}


//// onload

document.body.onload = function() {
    // add auto-numbered collapsible headings before each step
    handleSteps();
    // add section headers and navigation buttons
    handleSectioning();
    handleNavigation();     // check if navigation button handling should change
    // create buttons for all hints
    handleGroup(':not(.hint)', '.hint', 'hint');
    addGroupButtons('hint', 'Υπόδειξη');
    var solutions = document.querySelectorAll('.solution');
    for (var solution of solutions) solution.button.innerHTML = 'Λύση';
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
}
