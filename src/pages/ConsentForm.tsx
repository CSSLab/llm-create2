import PageTemplate from "../components/shared/pages/page";
import { Checkbox } from "@chakra-ui/react";
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../App";
import { toaster } from "../components/ui/toaster";

const ConsentForm = () => {
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { userData, addRoleSpecificData } = context;

  const handleSubmit = () => {
    if (checked) {
      addRoleSpecificData({
        timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
      });
      navigate("/artist/pre-survey");
    } else {
      toaster.create({
        description: "Please give your consent to proceed",
        type: "error",
        duration: 5000,
      });
    }
  };

  return (
    <PageTemplate
      title="University of Toronto Research Project Participation Consent Form"
      nextButton={{ text: "Submit", action: handleSubmit }}
    >
      <div className="w-full h-full flex-row content-center">
        <div className="w-full h-4/5 border border-dark-grey overflow-y-auto rounded-xl bg-white p-4">
          <p className="text-main mb-2">
            Researchers at the <strong>University of Toronto</strong> are
            studying how people’s usage of <em>Artificial Intelligence</em>{" "}
            impacts their creative thinking abilities. Nowadays, people are
            often offloading tedious cognitive tasks to various AI tools to
            boost productivity and save time. Our project investigates the
            implications this has on human creativity.
          </p>
          <p className="text-main mb-2">
            You are invited to participate in this study if you are at least{" "}
            <strong>18 years of age</strong>. As a participant, you will
            repeatedly be asked to come up with a word that is somehow related
            to three seemingly unrelated stimulus words. You will also be asked
            to provide some demographic information and general thoughts on this
            survey. By taking part, you will help us better understand how we
            can guide responsible AI development and usage.
          </p>
          <p className="text-main mb-2">
            There are no potential risks or preparatory requirements for
            completing the study. We will have mechanisms in place to ensure
            that information collected during the study will be kept separate
            from identification, and not disclosed to anyone besides those named
            below.{" "}
            <strong>
              No personally identifiable information will be collected.
            </strong>
          </p>
          {/* <p className="text-main mb-2">
            We expect the survey to take around <strong>7 minutes</strong> to
            complete.If you are a Prolific worker, you will receive the monetary
            amount detailed on Prolific as compensation for your time. If you
            were recruited offline, you will be entered into a draw for 5 USD
            Amazon gift cards. Odds are detailed in the advertisement post, but
            you can expect a winning probability of at least 30%.
          </p> */}
          <p className="text-main mb-2">
            As the results of this evaluation will be of interest to a wide
            number of communities, we are asking your permission to include your
            data in any reports that we publish, in a{" "}
            <u>de-identified, aggregated format</u>. Your participation in this
            research study is voluntary. If you do not give consent, you will
            not be asked to participate any further and your results will not be
            part of the de-identified data used for any published reports.
          </p>
          <p className="text-main mb-2">
            You may decline to participate or withdraw at any time without
            penalty. If you decide to withdraw from the study after
            participating, you may do so any time before the results are
            published.
          </p>
          {/* <p className="text-main mb-2">
            Note that you will be compensated only after you have completed the
            activity and have successfully verified your Prolific ID. Please
            allow 2-3 days for this process.
          </p> */}
          <p className="text-main mb-2">
            For an independent opinion regarding the research and the rights of
            research participants, you may contact the{" "}
            <strong>
              University of Toronto Research Oversight and Compliance Office -
              Human Research Ethics Program
            </strong>{" "}
            via email (<u>ethics.review@utoronto.ca</u>) or phone (
            <u>416-946-3273</u>).
          </p>
          <p className="text-main mb-2">
            The research study you are participating in may be reviewed for
            quality assurance to make sure that the required laws and guidelines
            are followed. If chosen, (a) representative(s) of the Human Research
            Ethics Program (HREP) may access study-related data and/or consent
            materials as part of the review.
          </p>
          <p className="text-main mb-2">
            All information accessed by the HREP will be upheld to the same
            level of confidentiality that has been stated by the research team.
          </p>
          <p className="text-main mb-4">
            The investigator involved in this study is{" "}
            <strong>Ashton Anderson</strong> (<u>ashton@cs.toronto.edu</u>). The
            members of his research team responsible for the experiment
            interface and survey are <strong>Harsh Kumar</strong> (
            <u>harsh@cs.toronto.edu</u>), <strong>Sarah Wang</strong> (
            <u>sarahxp.wang@mail.utoronto.ca</u>), and{" "}
            <strong>Helena Glowacki</strong> (
            <u>helena.glowacki@mail.utoronto.ca</u>). If you have any questions
            or concerns, please contact either Harsh Kumar, Sarah Wang, or
            Helena Glowacki.
          </p>
          <p className="text-main mb-2">
            Please print or save a copy of this form for your records.
          </p>
          <p className="text-main mb-2">
            By clicking to the survey, you agree that:
          </p>
          <ul className="list-disc mb-4 pl-4">
            <li>You have read and understood the information on this sheet;</li>
            <li>You are at least 18 years of age;</li>
            <li>
              You consent to participation and data collection for the
              aforementioned purposes;
            </li>
            <li>You may freely withdraw until the aforementioned date;</li>
            <li>
              You assign to the researchers all copyright of your survey
              contributions for use in all current and future work stemming from
              this project.
            </li>
          </ul>
        </div>
        <div className="w-full h-max flex justify-center py-8">
          <Checkbox.Root
            defaultChecked
            variant={"solid"}
            checked={checked}
            onCheckedChange={(e) => setChecked(!!e.checked)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control className="outline outline-1 outline-grey" />
            <Checkbox.Label className="text-main">
              I agree to this consent form*
            </Checkbox.Label>
          </Checkbox.Root>
        </div>
      </div>
    </PageTemplate>
  );
};

export default ConsentForm;
