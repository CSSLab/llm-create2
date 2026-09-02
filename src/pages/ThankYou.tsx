import PageTemplate from "../components/shared/pages/page";

const ThankYou = () => {
  return (
    <PageTemplate background="bg4" title="">
      <div className="w-full h-full flex-col justify-items-center grid overflow-scroll">
        <div className="max-w-3xl h-full flex flex-col">
          <p className="text-h1-dark text-center mb-2">Thank you!</p>
          <p className="text-main-dark text-sm text-center mb-4">
            We are grateful for your time and we hope you found this enjoyable!
          </p>
          {/* <div className="text-center self-center leading-relaxed flex flex-wrap p-4 bg-white rounded-xl w-max">
            <div className="leading-relaxed flex flex-wrap select-none h-max min-w-[350px] w-[350px]">
              {words.map((word, i) => {
                const isVisible = visibleIndexes.includes(i);
                return (
                  <span
                    key={i}
                    className={`text-sm font-serif transition duration-300 tracking-[0] antialiased [font-optical-sizing:none] [font-variation-settings:'opsz'_0] [text-rendering:geometricPrecision] ${
                      isVisible
                        ? "text-black bg-white"
                        : "text-transparent bg-dark-grey"
                    }`}
                  >
                    {word + "\u00A0"}
                  </span>
                );
              })}
            </div>
          </div> */}
        </div>
      </div>
    </PageTemplate>
  );
};

export default ThankYou;
