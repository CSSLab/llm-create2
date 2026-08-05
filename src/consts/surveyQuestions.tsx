import type { SurveyDefinition } from "../types";
import { GENEVA_EMOTION_FAMILIES } from "./genevaEmotionWheel";

const agreement5 = [
  { label: "Strongly disagree", value: 1 },
  { label: "Disagree", value: 2 },
  { label: "Neither agree nor disagree", value: 3 },
  { label: "Agree", value: 4 },
  { label: "Strongly agree", value: 5 },
];

const frequency5 = [
  { label: "Never", value: 1 },
  { label: "Rarely", value: 2 },
  { label: "Sometimes", value: 3 },
  { label: "Often", value: 4 },
  { label: "Very often", value: 5 },
];

const existingCreativeFrequency5 = [
  { label: "Very rarely or never", value: 1 },
  { label: "Rarely", value: 2 },
  { label: "Sometimes", value: 3 },
  { label: "Often", value: 4 },
  { label: "Very often or always", value: 5 },
];

const notAtAllToCompletely7 = [
  { label: "1 · Not at all", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7 · Completely", value: 7 },
];

const notAtAllToVeryMuch7 = [
  { label: "1 · Not at all", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7 · Very much", value: 7 },
];

const agreement10 = Array.from({ length: 10 }, (_, index) => ({
  label:
    index === 0
      ? "1 · Strongly disagree"
      : index === 9
        ? "10 · Strongly agree"
        : String(index + 1),
  value: index + 1,
}));

export const ArtistPreSurveyQuestions: SurveyDefinition = {
  id: "artist-pre-survey-v2",
  title: "Creator baseline survey",
  sections: [
    {
      id: "baseline",
      title: "Before you begin",
      description:
        "These brief questions ask about your usual creative activities and experience.",
      questions: [
        {
          id: "creative_self_perception",
          type: "likertScale",
          question: "I consider myself a creative person.",
          options: agreement5,
          required: true,
        },
        {
          id: "creative_engagement",
          type: "likertScale",
          question: "How often do you engage in creative activities?",
          options: existingCreativeFrequency5,
          required: true,
        },
        {
          id: "poetry_engagement",
          type: "likertScale",
          question: "How often do you read poetry?",
          options: frequency5,
          required: true,
        },
        {
          id: "blackout_poetry_familiarity",
          type: "multipleChoice",
          question: "Before today, how familiar were you with blackout poetry?",
          options: [
            "Never heard of it",
            "Heard of it",
            "Seen examples",
            "Made one before",
          ],
          required: true,
        },
      ],
    },
  ],
};

export const ArtistPostSurveyQuestions: SurveyDefinition = {
  id: "artist-post-survey-v3",
  title: "Creator post-task survey",
  sections: [
    {
      id: "felt-emotion",
      title: "Your experience while creating",
      questions: [
        {
          id: "felt_emotion",
          type: "emotionWheel",
          question:
            "While creating this poem, which emotion, if any, did you feel most strongly?",
          options: [...GENEVA_EMOTION_FAMILIES],
          intensityLevels: 5,
          includeNoEmotion: true,
          required: true,
        },
      ],
    },
    {
      id: "intended-expression",
      title: "What you wanted the poem to express",
      questions: [
        {
          id: "final_intended_meaning",
          type: "openEnded",
          question:
            "In one or two sentences, what did you want the final poem to express or mean? Please use your own words rather than quoting lines from the poem.",
          placeholder: "Describe the final meaning in your own words...",
          softWordTarget: { min: 10, max: 60 },
          required: true,
        },
        {
          id: "intended_emotion",
          type: "emotionWheel",
          question:
            "Which emotion, if any, did you most want the poem to convey to a reader?",
          options: [...GENEVA_EMOTION_FAMILIES],
          intensityLevels: 5,
          includeNoEmotion: true,
          required: true,
        },
        {
          id: "expressive_realization",
          type: "likertScale",
          question:
            "To what extent does the final poem express what you wanted it to express?",
          options: notAtAllToCompletely7,
          required: true,
        },
      ],
    },
    {
      id: "creativity-support",
      title: "Creativity support",
      description:
        "For both items, use 1 = strongly disagree and 10 = strongly agree.",
      questions: [
        {
          id: "csi_able_to_be_creative",
          type: "likertScale",
          question: "I was able to be creative while completing this activity.",
          options: agreement10,
          required: true,
        },
        {
          id: "csi_tools_allowed_expression",
          type: "likertScale",
          question:
            "The tools available during the activity allowed me to express myself.",
          options: agreement10,
          required: true,
        },
      ],
    },
    {
      id: "psychological-ownership",
      title: "Connection to the final poem",
      description: "Use 1 = not at all and 7 = very much.",
      questions: [
        {
          id: "ownership_own_work",
          type: "likertScale",
          question: "How much does the final poem feel like your own work?",
          options: notAtAllToVeryMuch7,
          required: true,
        },
        {
          id: "ownership_responsibility",
          type: "likertScale",
          question: "How responsible do you feel for the final poem?",
          options: notAtAllToVeryMuch7,
          required: true,
        },
        {
          id: "ownership_personal_connection",
          type: "likertScale",
          question: "How personally connected do you feel to the final poem?",
          options: notAtAllToVeryMuch7,
          required: true,
        },
        {
          id: "ownership_emotional_connection",
          type: "likertScale",
          question: "How emotionally connected do you feel to the final poem?",
          options: notAtAllToVeryMuch7,
          required: true,
        },
      ],
    },
    {
      id: "agency-effort",
      title: "Agency and effort",
      questions: [
        {
          id: "creative_control",
          type: "likertScale",
          question:
            "How much control did you have over the creative decisions that shaped the final poem?",
          options: [
            { label: "None", value: 1 },
            { label: "A little", value: 2 },
            { label: "Some", value: 3 },
            { label: "A lot", value: 4 },
            { label: "A great deal", value: 5 },
          ],
          required: true,
        },
        {
          id: "creative_intentionality",
          type: "likertScale",
          question: "How intentional were you about the creative decisions you made?",
          options: [
            { label: "Not at all", value: 1 },
            { label: "Slightly", value: 2 },
            { label: "Moderately", value: 3 },
            { label: "Very", value: 4 },
            { label: "Extremely", value: 5 },
          ],
          required: true,
        },
        {
          id: "mental_effort",
          type: "likertScale",
          question: "How much mental effort did you put into creating this poem?",
          options: [
            { label: "None", value: 1 },
            { label: "A little", value: 2 },
            { label: "Some", value: 3 },
            { label: "A lot", value: 4 },
            { label: "A great deal", value: 5 },
          ],
          required: true,
        },
      ],
    },
    {
      id: "outside-tools",
      title: "Outside tools",
      questions: [
        {
          id: "used_outside_tool",
          type: "multipleChoice",
          question:
            "Did you use any website, AI system, writing assistant, or other outside tool during the activity?",
          options: ["No", "Yes"],
          required: true,
        },
        {
          id: "outside_tool_description",
          type: "openEnded",
          question: "Please briefly describe the outside tool or tools you used.",
          placeholder: "Tool name and how you used it...",
          showWhen: { questionId: "used_outside_tool", equals: "Yes" },
          required: true,
        },
      ],
    },
    {
      id: "exploratory-operational",
      title: "Final questions",
      questions: [
        {
          id: "prior_generative_ai_creative_writing",
          type: "likertScale",
          question:
            "How often have you used generative AI to help with creative writing?",
          options: frequency5,
          required: true,
        },
        {
          id: "would_repeat_activity",
          type: "likertScale",
          question: "Would you want to do this activity again?",
          options: [
            { label: "Definitely not", value: 1 },
            { label: "Probably not", value: 2 },
            { label: "Might or might not", value: 3 },
            { label: "Probably", value: 4 },
            { label: "Definitely", value: 5 },
          ],
          required: true,
        },
        {
          id: "ai_attitude",
          type: "multipleChoice",
          question:
            "Increased use of AI computer programs in creative tasks makes you feel…",
          options: [
            "Equally concerned and excited",
            "More concerned than excited",
            "More excited than concerned",
          ],
          required: true,
        },
        {
          id: "additional_comments",
          type: "openEnded",
          question: "Is there anything else you would like to share with us?",
          placeholder: "Optional comments...",
          required: false,
        },
        {
          id: "bugs_and_feedback",
          type: "openEnded",
          question:
            "If you noticed any bugs, confusing instructions, or anything else we should improve, please let us know.",
          placeholder: "Optional feedback...",
          required: false,
        },
      ],
    },
  ],
};

const agreement7 = [
  { label: "1 · Strongly disagree", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4 · Neither agree nor disagree", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7 · Strongly agree", value: 7 },
];

const audienceLiking7 = [
  { label: "1 · Not at all", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7 · Very much", value: 7 },
];

export const AudiencePoemQuestions: SurveyDefinition = {
  id: "audience-poem-reception-v1",
  title: "Your response to this poem",
  sections: [
    {
      id: "interpretation",
      title: "Your interpretation",
      questions: [
        {
          id: "open_interpretation",
          type: "openEnded",
          question:
            "In one or two sentences, what do you think this poem is expressing or about?",
          placeholder: "Share your interpretation in one or two sentences...",
          softWordTarget: { min: 8, max: 60 },
          required: true,
        },
      ],
    },
    {
      id: "felt-emotion",
      title: "What you felt",
      questions: [
        {
          id: "felt_emotion",
          type: "emotionWheel",
          question:
            "Which emotion, if any, did you feel most strongly while reading this poem?",
          options: [...GENEVA_EMOTION_FAMILIES],
          intensityLevels: 5,
          includeNoEmotion: true,
          required: true,
        },
      ],
    },
    {
      id: "communicated-emotion",
      title: "What the creator communicated",
      questions: [
        {
          id: "perceived_emotion",
          type: "emotionWheel",
          question:
            "Which emotion, if any, do you think the creator most wanted this poem to convey?",
          intensityPrompt:
            "How strongly did the poem convey this emotion? Choose an intensity from 1 near the centre to 5 at the outside.",
          options: [...GENEVA_EMOTION_FAMILIES],
          intensityLevels: 5,
          includeNoEmotion: true,
          required: true,
        },
      ],
    },
    {
      id: "understanding-and-connection",
      title: "Understanding and connection",
      questions: [
        {
          id: "subjective_understanding",
          type: "likertScale",
          question:
            "I felt that I understood what the creator wanted this poem to express.",
          options: agreement7,
          required: true,
        },
        {
          id: "creator_connection",
          type: "iosCloseness",
          question:
            "Select the pair of circles that best represents how connected you felt to the person who created this poem while reading it.",
          labels: { self: "You", other: "Creator" },
          required: true,
        },
      ],
    },
    {
      id: "evaluation",
      title: "Your overall response",
      questions: [
        {
          id: "liking",
          type: "likertScale",
          question: "How much did you like this poem?",
          options: audienceLiking7,
          required: true,
        },
        {
          id: "continued_interest",
          type: "likertScale",
          question:
            "I would be interested in reading another poem by this creator.",
          options: agreement7,
          required: true,
        },
      ],
    },
  ],
};

export const AudiencePostSurveyQuestions: SurveyDefinition = {
  id: "audience-background-v1",
  title: "About you",
  sections: [
    {
      id: "ai-background",
      title: "Your experience with AI",
      questions: [
        {
          id: "creative_writing_ai_frequency",
          type: "likertScale",
          question:
            "How often do you use generative AI for creative writing?",
          options: frequency5,
          required: true,
        },
        {
          id: "ai_attitude",
          type: "multipleChoice",
          question:
            "Increased use of AI computer programs in creative tasks makes you feel:",
          options: [
            "Equally concerned and excited",
            "More concerned than excited",
            "More excited than concerned",
          ],
          required: true,
        },
        {
          id: "optional_comments",
          type: "openEnded",
          question: "Is there anything else you would like to share with us?",
          placeholder: "Optional comments...",
          required: false,
        },
      ],
    },
  ],
};

export const AUDIENCE_CREATIVITY_OPTIONS = [
  { label: "1 · Not at all creative", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7 · Extremely creative", value: 7 },
];
