import { Button } from '@/components/ui/button';

export const MainErrorFallback = () => {
  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center text-red-500"
      role="alert"
    >
      <h2 className="text-lg font-semibold">Ooops, something went wrong :( </h2>
      <Button
        className="mt-4 bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700 dark:bg-blue-700 dark:shadow-blue-900/30 dark:hover:bg-blue-600"
        onClick={() => window.location.assign(window.location.origin)}
      >
        Refresh
      </Button>
    </div>
  );
};
