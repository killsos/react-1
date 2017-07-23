/**
 * ReactElementValidator provides a wrapper around a element factory
 * which validates the props passed to the element. This is intended to be
 * used only in DEV and could be replaced by a static type checker for languages
 * that support it.
 * 
 * 对于ReactElement包装
 */

var ReactCurrentOwner = require('ReactCurrentOwner');
var ReactElement = require('ReactElement');

var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

function getDeclarationErrorAddendum() {
  if (ReactCurrentOwner.current) {
    var name = getComponentName(ReactCurrentOwner.current);
    if (name) {
      return '\n\nCheck the render method of `' + name + '`.';
    }
  }
  return '';
}

function getSourceInfoErrorAddendum(elementProps) {
  if (
    elementProps !== null &&
    elementProps !== undefined &&
    elementProps.__source !== undefined
  ) {
    var source = elementProps.__source;
    var fileName = source.fileName.replace(/^.*[\\\/]/, '');
    var lineNumber = source.lineNumber;
    return '\n\nCheck your code at ' + fileName + ':' + lineNumber + '.';
  }
  return '';
}

var ownerHasKeyUseWarning = {};

function getCurrentComponentErrorInfo(parentType) {
  var info = getDeclarationErrorAddendum();

  if (!info) {
    var parentName = typeof parentType === 'string'
      ? parentType
      : parentType.displayName || parentType.name;
    if (parentName) {
      info = `\n\nCheck the top-level render call using <${parentName}>.`;
    }
  }
  return info;
}

function validateExplicitKey(element, parentType) {
  if (!element._store || element._store.validated || element.key != null) {
    return;
  }
  element._store.validated = true;

  var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
  if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
    return;
  }
  ownerHasKeyUseWarning[currentComponentErrorInfo] = true;

  var childOwner = '';
  if (
    element &&
    element._owner &&
    element._owner !== ReactCurrentOwner.current
  ) {
    childOwner = ` It was passed a child from ${getComponentName(element._owner)}.`;
  }

  currentlyValidatingElement = element;
 
  currentlyValidatingElement = null;
}


function validateChildKeys(node, parentType) {
  if (typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      var child = node[i];
      if (ReactElement.isValidElement(child)) {
        validateExplicitKey(child, parentType);
      }
    }
  } else if (ReactElement.isValidElement(node)) {
    if (node._store) {
      node._store.validated = true;
    }
  } else if (node) {
    var iteratorFn =
      (ITERATOR_SYMBOL && node[ITERATOR_SYMBOL]) || node[FAUX_ITERATOR_SYMBOL];
    if (typeof iteratorFn === 'function') {
      if (iteratorFn !== node.entries) {
        var iterator = iteratorFn.call(node);
        var step;
        while (!(step = iterator.next()).done) {
          if (ReactElement.isValidElement(step.value)) {
            validateExplicitKey(step.value, parentType);
          }
        }
      }
    }
  }
}

function validatePropTypes(element) {
  var componentClass = element.type;
  if (typeof componentClass !== 'function') {
    return;
  }
  var name = componentClass.displayName || componentClass.name;
  var propTypes = typeof componentClass.__propTypesSecretDontUseThesePlease ===
    'object'
    ? componentClass.__propTypesSecretDontUseThesePlease
    : componentClass.propTypes;

  if (propTypes) {
    currentlyValidatingElement = element;
    checkPropTypes(propTypes, element.props, 'prop', name, getStackAddendum);
    currentlyValidatingElement = null;
  }
  
}

var ReactElementValidator = {
  createElement: function(type, props, children) {
    var validType = typeof type === 'string' || typeof type === 'function';
    if (!validType) {
      var info = '';
      if (
        type === undefined ||
        (typeof type === 'object' &&
          type !== null &&
          Object.keys(type).length === 0)
      ) {
        info +=
          ' You likely forgot to export your component from the file ' +
          "it's defined in.";
      }

      var sourceInfo = getSourceInfoErrorAddendum(props);
      if (sourceInfo) {
        info += sourceInfo;
      } else {
        info += getDeclarationErrorAddendum();
      }

      info += ReactDebugCurrentFrame.getStackAddendum() || '';
    }

    var element = ReactElement.createElement.apply(this, arguments);
    if (element == null) {
      return element;
    }
    if (validType) {
      for (var i = 2; i < arguments.length; i++) {
        validateChildKeys(arguments[i], type);
      }
    }
    validatePropTypes(element);
    return element;
  },

  createFactory: function(type) {
    var validatedFactory = ReactElementValidator.createElement.bind(null, type);
    validatedFactory.type = type;
    return validatedFactory;
  },

  cloneElement: function(element, props, children) {
    var newElement = ReactElement.cloneElement.apply(this, arguments);
    for (var i = 2; i < arguments.length; i++) {
      validateChildKeys(arguments[i], newElement.type);
    }
    validatePropTypes(newElement);
    return newElement;
  },
};

module.exports = ReactElementValidator;
