import type { SurveyDefinition } from "../types";

export const ArtistPreSurveyQuestions: SurveyDefinition = {
  id: "survey1",
  title: "Artist Pre-Survey",
  sections: [
    {
      id: "section1",
      title: "Demographic Survey",
      questions: [
        {
          id: "q1",
          type: "likertScale",
          question: "I am more creative than ____% of humans",
          scaleMin: 0,
          scaleMax: 10,
          labels: { min: "0%", max: "100%" },
          required: true,
        },
        {
          id: "q2",
          type: "likertScale",
          question: "I engage in creative tasks ____",
          scaleMin: 1,
          scaleMax: 7,
          labels: { min: "Never", max: "Very Frequently" },
          required: true,
        },
      ],
    },
    {
      id: "section2",
      title: "PANAS-SF Pre-Survey Part.1 ",
      description:
        "For the following emotions, indicate the extent you to which feel them at the moment.",
      questions: [
        {
          id: "q3",
          type: "likertScale",
          question: "Active",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
        {
          id: "q4",
          type: "likertScale",
          question: "Determined",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
        {
          id: "q5",
          type: "likertScale",
          question: "Attentive",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
        {
          id: "q7",
          type: "likertScale",
          question: "Inspired",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
      ],
    },
    {
      id: "section3",
      title: "PANAS-SF Pre-Survey Part.2 ",
      description:
        "For the following emotions, indicate the extent you to which feel them at the moment.",
      questions: [
        {
          id: "q8",
          type: "likertScale",
          question: "Alert",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
        {
          id: "q9",
          type: "likertScale",
          question: "Afraid",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
        {
          id: "q10",
          type: "likertScale",
          question: "Nervous",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },

        {
          id: "q11",
          type: "likertScale",
          question: "Upset",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
      ],
    },
    {
      id: "section3",
      title: "PANAS-SF Pre-Survey Part.1 ",
      description:
        "For the following emotions, indicate the extent you to which feel them at the moment.",
      questions: [
        {
          id: "q12",
          type: "likertScale",
          question: "Hostile",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
        {
          id: "q13",
          type: "likertScale",
          question: "Ashamed",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
      ],
    },
  ],
};

export const ArtistPostSurveyQuestions: SurveyDefinition = {
  id: "survey1",
  title: "Customer Feedback Survey",
  sections: [
    {
      id: "section1",
      title: "Demographic Survey",
      questions: [
        {
          id: "q1",
          type: "likertScale",
          question: "I am more creative than ____% of humans",
          scaleMin: 0,
          scaleMax: 10,
          labels: { min: "0%", max: "100%" },
          required: true,
        },
      ],
    },
    {
      id: "section2",
      title: "PANAS-SF Pre-Survey Part.1 ",
      description:
        "For the following emotions, indicate the extent you to which feel them at the moment.",
      questions: [
        {
          id: "q2",
          type: "likertScale",
          question: "Active",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
        {
          id: "q3",
          type: "likertScale",
          question: "Determined",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
        {
          id: "q4",
          type: "likertScale",
          question: "Attentive",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
        {
          id: "q5",
          type: "likertScale",
          question: "Inspired",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
      ],
    },
    {
      id: "section3",
      title: "PANAS-SF Pre-Survey Part.2 ",
      description:
        "For the following emotions, indicate the extent you to which feel them at the moment.",
      questions: [
        {
          id: "q6",
          type: "likertScale",
          question: "Alert",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
        {
          id: "q7",
          type: "likertScale",
          question: "Afraid",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
        {
          id: "q8",
          type: "likertScale",
          question: "Nervous",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },

        {
          id: "q9",
          type: "likertScale",
          question: "Upset",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
      ],
    },
    {
      id: "section4",
      title: "PANAS-SF Pre-Survey Part.1 ",
      description:
        "For the following emotions, indicate the extent you to which feel them at the moment. at the moment.",
      questions: [
        {
          id: "q10",
          type: "likertScale",
          question: "Hostile",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
        {
          id: "q11",
          type: "likertScale",
          question: "Ashamed",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very slightly or not at all", max: "Extremely" },
          required: true,
        },
      ],
    },
    {
      id: "section4",
      title: "Artistic Intentions",
      questions: [
        {
          id: "q12",
          type: "openEnded",
          question:
            "Artist's statement: In a sentence or two, describe the meaning behind your poem.",
          placeholder: "Type your answer here...",
          required: true,
        },
        {
          id: "q13",
          type: "topXRanking",
          question:
            "Select and rank your up to 3 emotion that you would like to convey to the audience.",
          options: [
            "Pride",
            "Joy",
            "Amusement",
            "Pleasure",
            "Relief",
            "Interest",
            "Surprise",
            "Anger",
            "Irritation",
            "Disgust",
            "Sadness",
            "Despair",
            "Fear",
            "Anxiety",
          ],
          maxSelectable: 3,
          required: true,
        },
      ],
    },
    {
      id: "section5",
      title: "Sense of Ownership and Credit Attribution",
      questions: [
        {
          id: "q14",
          type: "likertScale",
          question:
            "How much control did you have over the creative decisions that shaped the final product?",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very little to none", max: "A lot" },
          required: true,
        },
        {
          id: "q15",
          type: "likertScale",
          question:
            "How intentional were you about the creative decisions that you made?",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very little to none", max: "A lot" },
          required: true,
        },
        {
          id: "q16",
          type: "likertScale",
          question: "How much mental effort did you put into this work?",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Very little to none", max: "A lot" },
          required: true,
        },
      ],
    },
    {
      id: "section6",
      title: "Enjoyment",
      questions: [
        {
          id: "q17",
          type: "likertScale",
          question: "Would you want to do this activity again?",
          scaleMin: 1,
          scaleMax: 5,
          labels: { min: "Definitely not", max: "Definitely" },
          required: true,
        },
      ],
    },
    {
      id: "section7",
      title: "AI Assistnace",
      conditions: ["SPARK", "TOTAL_ACCESS", "WRITING"],
      questions: [
        {
          id: "q18",
          type: "multipleChoice",
          question: "During the writing process I felt like",
          options: [
            "I was writing the poem and the artificial intelligence was assisting me",
            "the artificial intelligence was writing the poem and I was assisting",
            "the artificial intelligence and I contributed to the poem equally",
          ],
          required: true,
        },
      ],
    },
    {
      id: "section8",
      title: "Opinion on AI in Creative Spaces",
      questions: [
        {
          id: "q19",
          type: "multipleChoice",
          question:
            "Increased use of AI computer programs in creative tasks makes you feel",
          options: [
            "Equally concerned and excited",
            "More concerned than excited",
            "More excited than concerned",
          ],
          required: true,
        },
        {
          id: "q20",
          type: "openEnded",
          question: "Is there anything else you would like to share with us?",
          placeholder: "Type your answer here...",
          required: false,
        },
      ],
    },

    {
      id: "section9",
      title: "Bugs and feedback",
      questions: [
        {
          id: "q21",
          type: "openEnded",
          question:
            "We’re still improving our design and would love to hear from you. If you noticed any bugs, confusing instructions, or anything else, please let us know!",
          placeholder: "Type your answer here...",
          required: false,
        },
      ],
    },
  ],
};
