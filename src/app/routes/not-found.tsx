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
        className="text-primary underline-offset-4 hover:underline"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundRoute;
