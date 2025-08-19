import PageTemplate from "../components/shared/pages/page";

const UserError = () => {
  return (
    <PageTemplate background="bg4">
      <div className="w-full h-full flex-col content-center justify-items-center space-y-4">
        <div className="w-64 md:w-80 text-left space-y-4">
          <p className="text-h1-dark w-full text-left">
            There seems to be an error
          </p>
          <p className="text-main-dark w-fulltext-sm">
            Unfortunately, this means we can’t use the data from your session
            (unless you were on the thank you page)— but thank you very much for
            your time and participation!
          </p>
        </div>
      </div>
    </PageTemplate>
  );
};

export default UserError;
