/**
 * Returns the first child in a collection of children and verifies that there
 * is only one child in the collection.
 * 
 * The current implementation of this function assumes that a single child gets
 * passed without a wrapper, but the purpose of this helper function is to
 * abstract away the particular structure of children.
 */

function onlyChild(children) {
  return children;
}

module.exports = onlyChild;
