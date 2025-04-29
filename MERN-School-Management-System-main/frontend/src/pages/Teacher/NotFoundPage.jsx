import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faHome } from '@fortawesome/free-solid-svg-icons';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 fade-in">
      <div className="text-red-500 mb-6">
        <FontAwesomeIcon icon={faExclamationTriangle} size="5x" />
      </div>
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-xl text-gray-600 mb-8 text-center">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary flex items-center">
        <FontAwesomeIcon icon={faHome} className="mr-2" />
        Go to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;