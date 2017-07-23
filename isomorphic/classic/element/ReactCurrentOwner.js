import type {ReactInstance} from 'ReactInstanceType'
import type {Fiber} from 'ReactFiber';

/**
 * Keeps track of the current owner.
 *
 * The current owner is the component who should own any components that are
 * currently being constructed.
 */
var ReactCurrentOwner = {current: (null: null | ReactInstance | Fiber)};

module.exports = ReactCurrentOwner;
