import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  children: PropTypes.node.isRequired,
};

class Fixture extends React.Component {
  render() {
    const {children} = this.props;

    return (
      <div className="test-fixture">
        {children}
      </div>
    );
  }
}

Fixture.propTypes = propTypes;

export default Fixture;