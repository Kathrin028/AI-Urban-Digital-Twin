import { useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

/**
 * Modal – simple portal modal with overlay, ESC close, and close button.
 * Props:
 *   isOpen      – boolean to control visibility
 *   onClose     – function called when modal should close (overlay click, ESC, button)
 *   title       – optional title displayed at top
 *   children    – modal content
 *   className   – additional Tailwind classes for the modal container
 */
const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  // Close on ESC key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`bg-white rounded-lg shadow-lg max-w-lg w-full ${className}`}>
        <div className="flex justify-between items-center p-4 border-b">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Modal;
