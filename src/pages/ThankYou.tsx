import PageTemplate from "../components/shared/pages/page";

const ThankYou = () => {
  return (
    <PageTemplate background="bg4">
      <div className="w-full h-full flex-col content-center justify-items-center space-y-4">
        <p className="text-h1-dark w-64 md:w-80">Thank you!</p>
        <p className="text-main-dark w-64 md:w-80 text-sm">
          We are grateful for your time and we hope you found this enjoyable!
        </p>
      </div>
    </PageTemplate>
  );
};

export default ThankYou;
