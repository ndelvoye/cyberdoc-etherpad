'use strict';

const _ = require('ep_etherpad-lite/static/js/underscore');
const cssFiles = ['ep_headings2/static/css/editor.css'];

// All our tags are block elements, so we just return them.
const tags = ['h1', 'h2', 'h3', 'h4', 'code'];
exports.aceRegisterBlockElements = () => tags;

// Bind the event handler to the toolbar buttons
exports.postAceInit = (hookName, context) => {
  const hs = $('#font-style, select.font-style-selection');
  hs.on('change', function () {
    const value = $(this).val();
    const intValue = parseInt(value, 10);
    if (!_.isNaN(intValue)) {
      context.ace.callWithAce((ace) => {
        ace.ace_doInsertHeading(intValue);
      }, 'insertheading', true);
      hs.val('dummy');
    }
  });
};

// On caret position change show the current heading
exports.aceEditEvent = (hookName, call) => {
  // If it's not a click or a key event and the text hasn't changed then do nothing
  const cs = call.callstack;
  if (!(cs.type === 'handleClick') && !(cs.type === 'handleKeyEvent') && !(cs.docTextChanged)) {
    return false;
  }
  // If it's an initial setup event then do nothing..
  if (cs.type === 'setBaseText' || cs.type === 'setup') return false;

  // It looks like we should check to see if this section has this attribute
  setTimeout(() => { // avoid race condition..
    const attributeManager = call.documentAttributeManager;
    const rep = call.rep;
    const activeAttributes = {};
    $('#font-style, select.font-style-selection').val('dummy').niceSelect('update');

    const firstLine = rep.selStart[0];
    const lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
    let totalNumberOfLines = 0;

    _(_.range(firstLine, lastLine + 1)).each((line) => {
      totalNumberOfLines++;
      const attr = attributeManager.getAttributeOnLine(line, 'heading');
      if (!activeAttributes[attr]) {
        activeAttributes[attr] = {};
        activeAttributes[attr].count = 1;
      } else {
        activeAttributes[attr].count++;
      }
    });

    $.each(activeAttributes, (k, attr) => {
      if (attr.count === totalNumberOfLines) {
        // show as active class
        const ind = tags.indexOf(k);
        $('#font-style, select.font-style-selection').val(ind).niceSelect('update');
      }
    });
  }, 250);
};

// Our heading attribute will result in a heaading:h1... :h6 class
exports.aceAttribsToClasses = (hookName, context) => {
  if (context.key === 'heading') {
    return [`heading:${context.value}`];
  }
};

// Here we convert the class heading:h1 into a tag
exports.aceDomLineProcessLineAttributes = (hookName, context) => {
  const cls = context.cls;
  const headingType = /(?:^| )heading:([A-Za-z0-9]*)/.exec(cls);
  if (headingType) {
    let tag = headingType[1];

    // backward compatibility, we used propose h5 and h6, but not anymore
    if (tag === 'h5' || tag === 'h6') tag = 'h4';

    if (_.indexOf(tags, tag) >= 0) {
      const modifier = {
        preHtml: `<${tag}>`,
        postHtml: `</${tag}>`,
        processedMarker: true,
      };
      return [modifier];
    }
  }
  return [];
};

// Once ace is initialized, we set ace_doInsertHeading and bind it to the context
exports.aceInitialized = (hookName, context) => {
  const editorInfo = context.editorInfo;
  // Passing a level >= 0 will set a heading on the selected lines, level < 0 will remove it.
  editorInfo.ace_doInsertHeading = (level) => {
    const {documentAttributeManager, rep} = context;
    if (!(rep.selStart && rep.selEnd)) return;
    if (level >= 0 && tags[level] === undefined) return;
    const firstLine = rep.selStart[0];
    const lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
    _(_.range(firstLine, lastLine + 1)).each((i) => {
      if (level >= 0) {
        documentAttributeManager.setAttributeOnLine(i, 'heading', tags[level]);
      } else {
        documentAttributeManager.removeAttributeOnLine(i, 'heading');
      }
    });
  };
};

exports.aceEditorCSS = () => cssFiles;
