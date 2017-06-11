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

function nextSiblingByTag(element, tag) {
    //  Returns the next sibling of an element with a specific tag,
    //  or null, if a different tag is encountered.
    //
    //  Used to iterate over successive elements of the same tag,
    //  without worrying about whitespace (as when using nextSibling).

    tag = tag.toUpperCase();
    var current = element.nextSibling;
    while (true) {
        if (!current) return null;
        if (current.nodeType == 1)
            if (current.nodeName == tag)
                return current;
            else
                return null;
        current = current.nextSibling;
    }
}

function isInstance(element, cls) {
    // checks if an element belongs to a certain class
    // allows for the case when the class attribute contains multiple class names
    return element.className.split(' ').indexOf(cls) >= 0;
}

function nextSiblingByClass(element, cls=element.className) {
    // Returns the next sibling of an element of a specific class,
    // or null, if a different class is encountered.
    //
    // Used to iterate over successive elements of the same class,
    // without worrying about whitespace (as when using nextSibling).

    var current = element.nextSibling;
    while (true) {
        if (!current) return null;
        if (current.nodeType == 1)
            if (isInstance(current,cls))
                return current;
            else
                return null;
        current = current.nextSibling;
    }
}

function classFilter(cls) {
    var filterFunction = function(element) {
        return isInstance(element, cls);
    }
    filterFunction.selector = "." + cls;
    return filterFunction;
}

function tagFilter(tag) {
    var filterFunction = function(element) {
        return element.nodeName == tag;
    }
    filterFunction.selector = tag;
    return filterFunction;
}

function nextSiblingFilter(element, filter) {
    var current = element.nextSibling;
    while (true) {
        if (!current) return null;
        if (current.nodeType == 1)
            if (filter(current))
                return current;
            else
                return null;
        current = current.nextSibling;
    }
}

function group(elements, name) {
    // attention: elements must not be a 'live' collection
    // create a container div for the group
    var container = document.createElement('div');
    container.className = name;
    // iterate over elements and move them into group
    for (element of elements) container.appendChild(element);
    return container;
}

function groupByFilter(first, filter, name) {
    // create a container div for the group
    var container = document.createElement('div');
    container.className = name;
    // find sibling elements and move them in the container div
    var current = first;
    while (current) {
        // find next element before appending current one
        // otherwise the sibling 'connection' between them is lost
        var next = nextSiblingFilter(current, filter);
        container.appendChild(current);
        current = next;
    }
    return container;
}

function handleGroup(filter, groupname, buttonInnerHtml) {
    // find the first element for each group of elements
    var firstSelector = ':not(' + filter.selector + ') + ' + filter.selector;
    var firsts = document.querySelectorAll(firstSelector);
    for (var first of firsts) {
        // create a container div for the group and place it
        var container = document.createElement('div');
        container.className = groupname + 'group-container';
        first.parentNode.insertBefore(container, first);
        // move all sibling elements into a group div and place it in the container
        var group = groupByFilter(first, filter, groupname + '-group');
        container.appendChild(group);
        hideAll(group.childNodes);
        // create container div for the buttons and place it
        var buttons = document.createElement('div');
        buttons.className = groupname + '-group-buttons';
        buttons.active = null;
        var buttonCounter = 0;
        for (element of group.childNodes) {
            // create button
            var button = document.createElement('button');
            button.className = 'group-button ' + groupname + '-button';
            // link to element
            button.element = element;
            // button content
            buttonCounter++;
            button.innerHTML = buttonInnerHtml + ' ' + buttonCounter;

            /*
            // choose properties according to hint class
            if (isInstance(hint, 'solution')) {
                button.innerHTML = 'Λύση';
            } else {
                hintCounter++;
                button.innerHTML = 'Υπόδειξη ' + hintCounter;
            }
            */
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
        // place the buttons before the hints
        group.parentNode.insertBefore(buttons, group.parentNode.firstChild);
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


//// functions for automatic step handling

function handleSteps() {
    // retrieve all steps
    var steps = document.querySelectorAll('div.step');
    stepindex = 1;
    for (var step of steps) {
        var headingDiv = document.createElement('div');
        headingDiv.className = 'step-heading';
        // make a step heading
        var heading = document.createElement('h3');
        heading.innerHTML = 'Βήμα ' + stepindex;
        // make an expand/collapse button
        var button = document.createElement('button');
        button.className = 'expand-button';
        button.setAttribute('expanded', '');
        button.onclick = function() {
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
        // placement
        headingDiv.appendChild(heading);
        headingDiv.appendChild(button);
        step.parentNode.insertBefore(headingDiv, step);
        stepindex++;
    }
}


//// functions to create and handle navigation buttons for sections

function handleNavigation() {

    // retrieve all sections
    var sections = document.querySelectorAll('section');
    link(sections);

    sectionIndex = 0;
    for (var section of sections) {

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

function handleSectioning() {
    sectionIndex = 1;
    for (var section of document.querySelectorAll('section')) {
        // retrieve the section's heading
        // var heading = nextSiblingByTag(section.firstChild, 'h2');
        var heading = nextSiblingFilter(section.firstChild, tagFilter('H2'));
        // creating the 'section-heading' div and insert it
        var headingDiv = document.createElement('div');
        headingDiv.className = 'section-heading';
        section.insertBefore(headingDiv, section.firstChild);
        // create the subheading with the section's number and insert it
        var subheading = document.createElement(heading ? 'h4' : 'h2');
        var subheadingTxt = document.createTextNode('Ενότητα ' + sectionIndex);
        subheading.appendChild(subheadingTxt);
        headingDiv.appendChild(subheading);
        // now insert the section heading into the div, if it exists
        if (heading) {
            section.title = heading.textContent;
            headingDiv.appendChild(heading);
        } else {
            section.title = subheadingTxt.textContent;
        }
        sectionIndex++;
    }
}

//// functions for code explanations

function toggleAttribute(element, attribute) {
    if (element.hasAttribute(attribute))
        element.removeAttribute(attribute);
    else
        element.setAttribute(attribute, "");
}

function highlightLinked() {
    this.setAttribute('highlighted', "");
    this.linked.setAttribute('highlighted', "");
}

function unhighlightLinked() {
    this.removeAttribute('highlighted');
    this.linked.removeAttribute('highlighted');
}

function handleExplanations() {
    var filter = tagFilter('ASIDE');
    // find all code blocks
    var blocks = document.querySelectorAll("pre > code");
    for (var block of blocks) {
        explanation = nextSiblingFilter(block.parentNode, filter);
        if (explanation) {
            //
            explanationDiv = groupByFilter(explanation, filter, 'explanation-group');
            block.parentNode.parentNode.insertBefore(explanationDiv, block.parentNode);
            explanation = explanationDiv.firstChild;
            // find all code segments in the block which link to an explanation
            var explained = block.querySelectorAll("a");
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
                // explanation = nextSiblingByTag(explanation, 'aside');
                explanation = explanation.nextSibling;
            }
        }
    }
}

//// functions for closed form questions and immediate feedback

function handleQuestions() {
    var filter = tagFilter('ASIDE');
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
    //
    handleSteps();
    //
    handleSectioning();
    //
    handleNavigation();
    //
    handleExplanations();
    //
    // handleHints();
    var hintFilter = classFilter('hint');
    handleGroup(hintFilter, 'hint', 'Υπόδειξη');

    /* for hints: re-implement special button for solution
    // choose properties according to hint class
    if (isInstance(hint, 'solution')) {
        button.innerHTML = 'Λύση';
    } else {
        hintCounter++;
        button.innerHTML = 'Υπόδειξη ' + hintCounter;
    }
    */

    //
    var questionFilter = classFilter('question');
    handleGroup(questionFilter, 'question', 'Ερώτηση');
    handleQuestions();
}
