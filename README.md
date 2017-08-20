# Websheets -- Programming worksheets for the web

The websheets repository provides an HTML / Javascript / CSS infrastructure for creating interactive worksheets for learning programming.

The websheets infrastructure is being developed within the [Pythonies project](http://pythonies.mysch.gr/), as a means of converting the python-related educational resources (currently available as .pdf's built from [XeLaTeX sources](https://github.com/boukeas/pythonies)) into a more _interactive, online form_.

At the moment, a single websheet is available, serving as a development testbed: [Η Απάντηση](https://boukeas.github.io/websheets/answer.html) (in Greek).

## How to build your own websheet

To start off, you can clone this repository and use the [template](https://boukeas.github.io/websheets/template.html) example, which showcases all the features you can incorporate in your websheets. The rest of the sections describe these features, as well as how to use them.

In a nutshell, you write standard HTML, sometimes following certain conventions or using special classes to provide additional semantics. We have tried to simplify things as much as possible for you. The Javascript code will heavily process your code and _restructure_ it appropriately, while all styling relies _exclusively_ on CSS.

### Document setup

Specify the websheet's language using the `lang` attribute of the `html` element. This will make sure the websheet uses the correct language constants.

    <html lang='el'>

Currently, there is support for english (`en`) and greek (`el`). Anything else defaults to english.

Include the appropriate javascript code in your websheet's `head`:

    <script src="js/websheets.js"></script>

That's it.

### Sectioning

There should be a single `h1` element in the document. This will be used as a title for the websheet.

A websheet is basically divided into _sections_ and each section contains a number of _steps_ the learner should follow. Include sections in `section` elements, with the first child being an `h2` heading to denote the section's title. Use a `div` belonging to the `step` class for each step.

Make sure to mark _every_ paragraph with a `p` tag.

    <h1>Websheet title</h1>

    <section>
        <h2>A title</h2>
        <div class='step'>
            ...
        </div>           
        <div class='step'>
            ...
        </div>
    </section>

    <section>
        <h2>Another title</h2>
        <div class='step'>
            ...
        </div>
        <div class='step'>
            ...
        </div>
    </section>

Note that a `header` element is automatically created for the websheet, using mainly the document's `h1` element. On the other hand, a `footer` element is _not_ automatically created -- it needs to be explicitly included in the websheet's HTML code.

### Code Segments

Including formatted code blocks requires a (standard) combination of `pre` and `code` tags.

    <pre class='prettyprint'>
        <code class='language-python' no-indent>
            Your code here
        </code>
    </pre>

If you don't use the `no-indent` attribute, whitespace will be _exactly_ as it appears in the `pre`-formatted code, which might not be what you want (especially in Python).

The `no-indent` attribute is picked up by the javascript code and stripes the formatted code of any leading whitespace. If you require some amount of indentation in the formatted code, e.g. four spaces, use `indent=4`. The `no-indent` attribute is equivalent to specifying `indent=0`.

#### Explained code

If you need to explain a specific part of the code,  include it in `a` tags and place the explanation directly after the code, in a block-level element (e.g. `div` or `p`) belonging to the `explanation` class.

You don't need to specify which explanation refers to which part of the code: explanations correspond to `a` tags in order of appearance. If you need to have a general explanation that doesn't correspond to marked code, use the `orphan` attribute.

    <pre class='prettyprint'>
        <code class='language-python' no-indent>
            <a>Part</a> of this statement is explained
            Here is <a>another statement</a> to be explained
        </code>
    </pre>
    <div class='explanation'>For the first statement</div>
    <div class='explanation' orphan>A general remark</div>
    <div class='explanation'>For the second statement</div>

#### Inserted, deleted or highlighted code

You can use the standard `ins`, `del` and `mark` tags inside `code`, in order to style code segments that are inserted, deleted or need to be highlighted.

By default, if a line of code contains such a tag, the styling applies _to the whole line_. If you need it applied only to the part of the code that is tagged, use the `inline` class.

### Sidenotes

You can use the standard `aside` tag to include comments and sidenotes.

You can place related `aside`s, next to one another (in succession) and they will be _grouped together_ automatically. Make sure you place the first of each group of `aside`s right _after_ the paragraph they pertain to.

    <p> A paragraph of text.</p>
    <aside>
        A comment pertaining to the paragraph above.
    </aside>
    <aside>
        Another note, to be grouped with the one before.
    </aside>

### Hints and Solutions

If, at some point in your websheet, you need to offer hints to the learner on how to accomplish a particular task, place each hint in a block-level element (e.g. `div` or `p`) belonging to the `hint` class.

Hints that are placed next to each other (in succession) are automatically _grouped together_ and numbered accordingly.

Except from `hint`, you can also use the classes `solution` and `answer` for additional semantics (and appropriate labeling). You must _always_ use `hint`, but make sure you place `solution` or `answer`_first_ in the class list, if you decide to use them.

You can also use the `active` class, if you want a hint to be initially expanded by default.

    <p> Task description for the learner.</p>
    <p class='hint active'>
        Points to general direction of solution.
    </p>
    <p class='hint'>
        <p> A more concrete hint.</p>
    </p>
    <div class='solution hint'>
        <p> Describes how to accomplish the task.</p>
        <p> Provides detailed explanations.</p>
    </div>

Apart from grouping hints together, the javascript code will create _buttons_, with appropriate numbered labels, for expanding and collapsing the hints.

### Questions

There are currently three kinds of questions that can be used in websheets:
1. closed-form questions with a single correct answer
1. closed-form questions where multiple answers can be selected
1. general, open questions

Place each question in a `div` belonging (at least) to the `question` class. Questions that are placed next to each other (in succession) are automatically _grouped together_ and numbered accordingly.

You can also use the `active` class, if you want a question to be initially expanded by default.

Apart from grouping questions together, the javascript code will create _buttons_, with appropriate numbered labels, for expanding and collapsing the questions. It will also turn the questions into proper _forms_ and install a feedback mechanism where necessary.

#### Closed-form questions with a single correct answer

The `div` containing the question should belong to the `question-single` class (in addition to the `question` class).

Following the actual question, you can specify the different answers within standard `label` tags. Specify the single correct answer with the `correct` attribute in the corresponding `label`.

You can provide per-answer feedback within each `label`, using a block-level element belonging to the `feedback` class. Note that when the feedback button is pressed, only the feedback for the checked answer (whether correct or not) will be displayed.

    <div class='question question-single'>
        <p> Question goes here.</p>
        <p> It can be as long or complex as you like.</p>
        <label>
            An option
        </label>
        <label correct>
            The correct answer
        </label>
        <label>
            A horrible answer
            <p class='feedback'>
                Feedback on the horrible answer.
            </p>
        </label>
    </div>

#### Closed-form questions with multiple selectable answers

The `div` containing the question should belong to the `question-multiple` class (in addition to the `question` class).

Following the actual question, you can specify the different answers within standard `label` tags. Specify the answers that should be checked with the `checkable` attribute in the corresponding `label`s.

You can provide per-answer feedback within each `label`, using a block-level element belonging to the `feedback` class. Note that when the feedback button is pressed, feedback for _all_ answers (whether checkable or not) will be displayed.

    <div class='question question-multiple'>
        <p> Question goes here.</p>
        <label checkable>
            An option
        </label>
        <label checkable>
            Another option
        </label>
        <label>
            An option you shouldn't select
            <div class='feedback'>
                <p> Some feedback on the option.</p>
                <p> And then some more.</p>
            </div>
        </label>
    </div>

#### Open questions

The `div` containing the question should simply belong to the `question` class.
No feedback mechanism is installed, but you can provide hints or answers to the
question using the hint mechanism described above.

    <div class='question'>
        <p> Open question goes here.</p>
        <p class='hint'>
            A general remark.
        </p>
        <div class='answer hint'>
            <p> An explanation.</p>
            <p> With many details.</p>
        </div>
    </div>

### Generic grouped elements

The mechanism by which similar elements (such as hints, or questions) can be grouped and interactively expanded using automatically generated buttons is quite useful.

Any block-level elements that belong to the `generic` class and are placed next to each other (in succession) are automatically _grouped together_. Each one of them is separately labeled using their `text` attribute.

    <div class='generic active' text='variables'>
        Anything you need to know about variables.
    </div>
    <div class='generic' text='expressions'>
        Anything you need to know about expressions.
    </div>
