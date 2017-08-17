# Websheets -- Programming worksheets for the web

The websheets repository provides an HTML / Javascript / CSS infrastructure for creating interactive worksheets for learning programming.

The websheets infrastructure is being developed within the [Pythonies project](http://pythonies.mysch.gr/), as a means of converting the python-related educational resources (now available as .pdf's built from [XeLaTeX sources](https://github.com/boukeas/pythonies)) into a more _interactive, online form_.

## How to build a websheet

To start off, you can use a [template]() example, which showcases all the features you can incorporate in your websheets. The rest of the sections also describe these features, as well as how to use them.

Note that styling relies _exclusively_ on the CSS.

### Including scripts and styling

Here's what you'll need to include in your websheet's `<head>`:

    <link rel="stylesheet" type="text/css" href="css/fonts.css">
    <link rel="stylesheet" type="text/css" href="css/prettify.css">
    <link rel="stylesheet" type="text/css" href="css/websheets.css">
    <script src="js/whitespace.js"></script>
    <script src="js/websheets.js"></script>
    <script src="js/prettify.js"></script>

The `prettify.js` and `prettify.css` files come from [google's code-prettify repository](https://github.com/google/code-prettify) and handle the way the code segments are rendered.

The `whitespace.js` file contains code from [Mozilla's Developer Network](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace_in_the_DOM).

Naturally, you can modify `websheets.css` to suit your own needs and also use your own `fonts.css`.

You must also place this code, right before the end of your `</body>`:

    <script>
        document.body.onload = function() {
            pre();
            PR.prettyPrint();
            post();
        }
    </script>

### Sectioning

There should be a single `<h1>` element in the document. This will be used as a title for the websheet.

A websheet is divided into _sections_ and each section contains a number of _steps_ the learner should follow. Include sections in `<section>` elements, with the first
child being an `<h2>` heading to denote the section's title. Use `<div class='step'>` for each step.

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

Make sure to mark _every_ paragraph with a `<p>` tag.

### Code Segments

Including formatted code blocks requires a (standard) combination of `<pre>` and `<code>` tags.

    <pre class='prettyprint'>
        <code class='language-python' no-indent>
            Your code here
        </code>
    </pre>

If you don't use the `no-indent` attribute, whitespace will be _exactly_ as it appears in the `<pre>`-formatted code, which might not be what you want (especially in Python).

The `no-indent` attribute is picked up by the javascript code and stripes the formatted code of any leading whitespace. If you require some amount of indentation in the formatted code, e.g. four spaces, use `indent=4`. The `no-indent` attribute is equivalent to specifying `indent=0`.

#### Explained code

If you need to explain a specific part of the code,  include it in `<a>` tags and place the explanation directly after the code, in a `<div class=explanation>`.

You don't need to specify which explanation refers to which part of the code: explanations correspond to `<a>` tags in order of appearance. If you need to have a general explanation that doesn't correspond to marked code, use the `orphan` attribute.

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

You can use the standard `<ins>`, `<del>` and `<mark>` tags inside code, in order to style code segments that are inserted, deleted or need to be highlighted.

By default, if a line of code contains such a tag, the styling applies to the whole line. If you need it applied only to the part of the code that is tagged, use the `inline` class.

### Sidenotes

You can use the standard `<aside>` tag to include comments and sidenotes.

You can place related `<aside>`s, next to one another (in succession) and they will be _grouped together_ automatically. Make sure you place the first of each group of `<aside>`s right _after_ the paragraph they pertain to.

    <p> A paragraph of text.</p>
    <aside>
        A comment pertaining to the paragraph above.
    </aside>
    <aside>
        Another note, to be grouped with the one before.
    </aside>

### Hints and Solutions

If, at some point in your websheet, you need to offer hints to the learner on how to accomplish a particular task, place each hint in a `<div class='hint'>`.

Hints that are placed next to each other (in succession) are automatically _grouped together_ and numbered accordingly.

Except from `hint`, you can also use the classes `solution` and `answer` for additional semantics (and appropriate labeling). You must _always_ use `hint`, but make sure you place `solution` or `answer`_first_ in the class list, if you decide to use them.

You can also use the `active` class, if you want a hint to be initially expanded by default.

    <p> Task description for the learner.</p>
    <div class='hint active'>
        <p> Points to general direction of solution.</p>
    </div>
    <div class='hint'>
        <p> A more concrete hint.</p>
    </div>
    <div class='solution hint'>
        <p> Describes how to accomplish the task.</p>
    </div>

Apart from grouping hints together, the javascript code will create _buttons_, with appropriate numbered labels, for expanding and collapsing the hints.

### Questions

### Generic grouped elements
