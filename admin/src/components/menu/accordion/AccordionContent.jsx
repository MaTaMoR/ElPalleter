import React from 'react';
import PropTypes from 'prop-types';
import styles from './AccordionContent.module.css';

const AccordionContent = ({ isExpanded, children }) => {
  return (
    <div
      className={`${styles.contentWrapper} ${isExpanded ? styles.expanded : ''}`}
    >
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

AccordionContent.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  children: PropTypes.node
};

export default AccordionContent;
