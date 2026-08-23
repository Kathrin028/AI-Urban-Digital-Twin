
import PropTypes from 'prop-types';
import Navbar from './Navbar';
import Footer from './Footer';
import Container from '../ui/Container';

/**
 * PublicLayout – wraps public pages with Navbar, content slot, and Footer.
 * Props:
 *   children – page content
 */
const PublicLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-grow">
      <Container>{children}</Container>
    </main>
    <Footer />
  </div>
);

PublicLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PublicLayout;
