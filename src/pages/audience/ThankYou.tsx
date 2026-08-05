import FullPageTemplate from "../../components/shared/pages/fullScrollPage";

const AudienceThankYou = () => (
  <FullPageTemplate background="bg4">
    <div className="grid min-h-[70vh] place-items-center">
      <div className="max-w-2xl text-center">
        <h1 className="mb-3 text-h1-dark">Thank you!</h1>
        <p className="text-main-dark">
          Your responses have been recorded. We are grateful for your time and
          thoughtful attention to the poems.
        </p>
      </div>
    </div>
  </FullPageTemplate>
);

export default AudienceThankYou;
