import { Link } from 'react-router';

import { paths } from '@/config/paths';

const NotFoundRoute = () => {
  return (
    <div className="mt-52 flex flex-col items-center font-semibold">
      <h1>404 - Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <Link
        to={paths.app.dashboard.getHref()}
        replace
        className="mt-4 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 dark:bg-blue-700 dark:shadow-blue-900/30 dark:hover:bg-blue-600"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundRoute;
