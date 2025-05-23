export default function findShiftRange(position: any, value: any, model: any) {
  return model.createRange(
    _findBound(position, value, true, model),
    _findBound(position, value, false, model),
  );
}

function _findBound(position: any, value: any, lookBack: any, model: any) {
  // Get node before or after position (depends on `lookBack` flag).
  // When position is inside text node then start searching from text node.
  let node =
    position.textNode || (lookBack ? position.nodeBefore : position.nodeAfter);

  let lastNode = null;

  while (node && node.getAttribute('shift') == value) {
    lastNode = node;
    node = lookBack ? node.previousSibling : node.nextSibling;
  }

  return lastNode
    ? model.createPositionAt(lastNode, lookBack ? 'before' : 'after')
    : position;
}
