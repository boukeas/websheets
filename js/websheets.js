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
    return function(element) {
        return isInstance(element, cls);
    }
}

function tagFilter(tag) {
    return function(element) {
        return element.nodeName == tag;
    }
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

//// functions for hints and solutions

function makeHintButtons(hintgroup) {
    var hintCounter = 0;
    // create div to hold buttons
    var buttons = document.createElement('div');
    buttons.className = 'hint-buttons';
    buttons.active = null;
    for (hint of hintgroup.childNodes) {
        // create hint button
        var button = document.createElement('button');
        button.className = 'hint-button';
        // link to hint
        button.hint = hint;
        // choose properties according to hint class
        if (isInstance(hint, 'solution')) {
            button.innerHTML = 'Λύση';
        } else {
            hintCounter++;
            button.innerHTML = 'Υπόδειξη ' + hintCounter;
        }
        // click event
        button.onclick = function() {
            if (this.hasAttribute('active')) {
                // clicked on active hint » deactivate
                this.removeAttribute('active');
                hide(this.hint);
                this.parentNode.active = null;
            } else {
                if (this.parentNode.active) {
                    // deactivate active hint
                    this.parentNode.active.removeAttribute('active');
                    hide(this.parentNode.active.hint);
                }
                // activate this hint
                this.setAttribute('active', '');
                show(this.hint);
                this.parentNode.active = this;
            }
        }
        buttons.appendChild(button);
    }
    // place the buttons before the hints
    hintgroup.parentNode.insertBefore(buttons, hintgroup.parentNode.firstChild);
}

function handleHints() {
    // moves groups of adjacent hints into 'hint-group' divs,
    // connects the hints together (adds .prev and .next properties),
    // creates buttons into a 'hint-buttons' div, to reveal the hints

    // find the first hint for each group of hints
    var hints = document.querySelectorAll(':not(.hint) + .hint');
    for (var hint of hints) {
        // create a container for the hint group and insert it
        var container = document.createElement('div');
        container.className = 'hint-group-container';
        hint.parentNode.insertBefore(container, hint);
        // move all hints into a hint group div and insert it in the container
        var filter = classFilter(hint.className);
        var hintGroup = groupByFilter(hint, filter, 'hint-group');
        container.appendChild(hintGroup);
        makeHintButtons(hintGroup);
        //
        hideAll(hintGroup.childNodes);
    }
}

//// functions for closed form questions and immediate feedback

/*
function handleQuestions() {
    // create a feedback button
    var feedbackButton = document.createElement('button');
    feedbackButton.className = 'feedback-button';
    feedbackButton.innerHTML = 'Ανατροφοδότηση';
    // find all questions with a single possible answer
    var questions = document.querySelectorAll("div.question-single");
    for (var question of questions) {
        // locate feedback to answers and group into a 'feedback-group' div
        feedbacks = question.querySelectorAll('aside');
        feedbackDiv = group(feedbacks, 'feedback-group');
        // place 'feedback-group' div right before the possible answers
        question.insertBefore(feedbackDiv, question.querySelector('fieldset'));
        // link answers to feedback
        var feedback = feedbackDiv.firstChild;
        var answers = question.querySelectorAll("label");
        for (var answer of answers) {
            // make sure the answer isn't checked
            answer.querySelector('input').checked = false;
            // link segment to explanation (via object properties)
            answer.linked = feedback;
            feedback = feedback.nextSibling;
            //
            answer.onchange = function() {
                feedbackButton.disabled = false;
                hideAll(feedbacks);
                //
                var selected = question.querySelector('label[highlighted]');
                if (selected) selected.removeAttribute('highlighted');
            }
        }
        hideAll(feedbacks);
        feedbackButton.disabled = true;
        // click event
        feedbackButton.onclick = function() {
            // retrieve selected answer and display its associated feedback
            var selected = question.querySelector('input:checked').parentNode;
            selected.setAttribute('highlighted', '');
            console.log(selected);
            show(selected.linked);
            // disable the feedback button
            this.disabled = true;
        }
        question.insertBefore(feedbackButton, question.querySelector('fieldset').nextSibling);
    }
}
*/

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
////

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
            console.log(step);
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
    handleHints();
    //
    handleQuestions();
}
