import type { PoemSurveyDefinition, SurveyDefinition } from "../types";

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
          type: "range",
          question: "I am more creative than ____% of humans.",
          labels: { min: "0%", max: "100%" },
          required: true,
        },
        {
          id: "q2",
          type: "likertScale",
          question: "I engage in creative tasks ____.",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          required: true,
        },
      ],
    },
    {
      id: "section2",
      title: "SPANE-B Pre-Survey Part.1 ",
      description:
        "Please think about what you are doing and experiencing right now. Then report how much you experienced each of the following feelings, using the scale below.",
      questions: [
        {
          id: "q3",
          type: "likertScale",
          question: "Positive",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          required: true,
        },
        {
          id: "q4",
          type: "likertScale",
          question: "Negative",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q5",
          type: "likertScale",
          question: "Good",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q7",
          type: "likertScale",
          question: "Bad",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q8",
          type: "likertScale",
          question: "Pleasant",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q9",
          type: "likertScale",
          question: "Unpleasant",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q10",
          type: "likertScale",
          question: "Happy",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q11",
          type: "likertScale",
          question: "Sad",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q12",
          type: "likertScale",
          question: "Afraid",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q13",
          type: "likertScale",
          question: "Joyful",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q14",
          type: "likertScale",
          question: "Angry",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q15",
          type: "likertScale",
          question: "Contented",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
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
          type: "range",
          question: "I am more creative than ____% of humans",
          labels: { min: "0%", max: "100%" },
          required: true,
        },
      ],
    },
    {
      id: "section2",
      title: "SPANE-B Post-Survey Part.2 ",
      description:
        "Please think about what you are doing and experiencing right now. Then report how much you experienced each of the following feelings, using the scale below.",
      questions: [
        {
          id: "q2",
          type: "likertScale",
          question: "Positive",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          required: true,
        },
        {
          id: "q3",
          type: "likertScale",
          question: "Negative",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q4",
          type: "likertScale",
          question: "Good",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q5",
          type: "likertScale",
          question: "Bad",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q6",
          type: "likertScale",
          question: "Pleasant",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q7",
          type: "likertScale",
          question: "Unpleasant",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q8",
          type: "likertScale",
          question: "Happy",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q9",
          type: "likertScale",
          question: "Sad",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q10",
          type: "likertScale",
          question: "Afraid",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q11",
          type: "likertScale",
          question: "Joyful",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q12",
          type: "likertScale",
          question: "Angry",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
        {
          id: "q13",
          type: "likertScale",
          question: "Contented",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          sideTitle: true,
          removeValues: true,
          required: true,
        },
      ],
    },
    {
      id: "section4",
      title: "Artistic Intentions",
      questions: [
        {
          id: "q14",
          type: "openEnded",
          question:
            "Artist's statement: In a sentence or two, describe the meaning behind your poem.",
          placeholder: "Type your answer here...",
          required: true,
        },
        {
          id: "q15",
          type: "circularChoice",
          question:
            "Select the emotion that best describes what you would like to convey to the audience.",
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
          required: true,
        },
      ],
    },
    {
      id: "section5",
      title: "Sense of Ownership and Credit Attribution",
      questions: [
        {
          id: "q16",
          type: "likertScale",
          question:
            "How much control did you have over the creative decisions that shaped the final product?",
          options: [
            { label: " ", value: 1 },
            { label: " ", value: 2 },
            { label: " ", value: 3 },
            { label: " ", value: 4 },
            { label: " ", value: 5 },
            { label: " ", value: 6 },
            { label: " ", value: 7 },
            { label: " ", value: 8 },
            { label: " ", value: 9 },
            { label: " ", value: 10 },
          ],
          removeValues: true,
          required: true,
          doNotCollapse: true,
        },
        {
          id: "q17",
          type: "likertScale",
          question:
            "How intentional were you about the creative decisions that you made?",
          options: [
            { label: " ", value: 1 },
            { label: " ", value: 2 },
            { label: " ", value: 3 },
            { label: " ", value: 4 },
            { label: " ", value: 5 },
            { label: " ", value: 6 },
            { label: " ", value: 7 },
            { label: " ", value: 8 },
            { label: " ", value: 9 },
            { label: " ", value: 10 },
          ],
          removeValues: true,
          doNotCollapse: true,
          required: true,
        },
        {
          id: "q18",
          type: "likertScale",
          question: "How much mental effort did you put into this work?",
          options: [
            { label: " ", value: 1 },
            { label: " ", value: 2 },
            { label: " ", value: 3 },
            { label: " ", value: 4 },
            { label: " ", value: 5 },
            { label: " ", value: 6 },
            { label: " ", value: 7 },
            { label: " ", value: 8 },
            { label: " ", value: 9 },
            { label: " ", value: 10 },
          ],
          removeValues: true,
          doNotCollapse: true,
          required: true,
        },
      ],
    },
    {
      id: "section6",
      title: "Enjoyment",
      questions: [
        {
          id: "q19",
          type: "likertScale",
          question: "Would you want to do this activity again?",
          options: [
            { label: "Definitely Not", value: 1 },
            { label: "Probably Not", value: 2 },
            { label: "Might or Might Not", value: 3 },
            { label: "Probably", value: 4 },
            { label: "Definitely", value: 5 },
          ],

          required: true,
        },
      ],
    },

    {
      id: "section7",
      title: "AI Assistance",
      questions: [
        {
          id: "q30",
          type: "multipleChoice",
          question: "During my usual writing process, I feel like",
          options: [
            "I write and artificial intelligence assists me",
            "artificial intelligence writes and I assist",
            "artificial intelligence and I contribute to my writing equally",
            "I do not use artificial intelligence in my writing process",
          ],
          required: true,
        },
      ],
    },

    {
      id: "section7",
      title: "AI Assistance",
      conditions: ["SPARK", "TOTAL_ACCESS", "WRITING"],
      questions: [
        {
          id: "q20",
          type: "multipleChoice",
          question:
            "During the blackout poem writing process in this experiment I felt like",
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
          id: "q21",
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
          id: "q22",
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
          id: "q23",
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

export const AudiencePreSurveyQuestions: SurveyDefinition = {
  id: "survey1",
  title: "Audience Pre-Survey",
  sections: [
    {
      id: "section1",
      title: "Demographic Survey",
      questions: [
        {
          id: "q2",
          type: "likertScale",
          question: "I engage in creative tasks ____.",
          options: [
            { label: "Very Rarely or Never", value: 1 },
            { label: "Rarely", value: 2 },
            { label: "Sometimes", value: 3 },
            { label: "Often", value: 4 },
            { label: "Very Often or Always", value: 5 },
          ],
          required: true,
        },
      ],
    },
    {
      id: "section2",
      title: "Poetry Familiarity",
      description:
        "Please indicate your level of agreement with the following statements:",
      questions: [
        {
          id: "q1",
          type: "likertScale",
          question: "I consider myself a creative person.",
          options: [
            { label: "Strongly Disagree", value: 1 },
            { label: "Disagree", value: 2 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 4 },
            { label: "Strongly Agree", value: 5 },
          ],
          required: true,
          sideTitle: true,
        },
        {
          id: "q3",
          type: "likertScale",
          question: "I consider myself knowledgeable about poetry.",
          options: [
            { label: "Strongly Disagree", value: 1 },
            { label: "Disagree", value: 2 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 4 },
            { label: "Strongly Agree", value: 5 },
          ],
          required: true,
          sideTitle: true,
          removeValues: true,
        },
        {
          id: "q4",
          type: "likertScale",
          question: "I usually understand poetry.",
          options: [
            { label: "Strongly Disagree", value: 1 },
            { label: "Disagree", value: 2 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 4 },
            { label: "Strongly Agree", value: 5 },
          ],
          required: true,
          sideTitle: true,
          removeValues: true,
        },
        {
          id: "q5",
          type: "likertScale",
          question: "I like poetry.             ",
          options: [
            { label: "Strongly Disagree", value: 1 },
            { label: "Disagree", value: 2 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 4 },
            { label: "Strongly Agree", value: 5 },
          ],
          required: true,
          sideTitle: true,
          removeValues: true,
        },
      ],
    },
  ],
};

export const AudiencePoemQuestions: PoemSurveyDefinition = {
  id: "survey1",
  title: "Audience Pre-Survey",
  sections: [
    {
      id: "section1",
      title: "Demographic Survey",
      questions: [
        {
          id: "q1",
          type: "circularChoice",
          question:
            "Select the emotion that best describes what you felt while reading the poem. ",
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
          required: true,
        },
        {
          id: "q2",
          type: "openEnded",
          question:
            "Were there any other emotions you felt while reading the poem? If so, please share them here.",
          placeholder: "Type your answer here...",
          required: false,
        },
        {
          id: "q3",
          type: "circularChoice",
          question:
            "Select the emotion that best describes what you think the poet was trying to convey through the poem.",
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
          required: true,
        },
        {
          id: "q4",
          type: "openEnded",
          question:
            "Were there any other emotions you think the poet was trying to convey through the poem? If so, please share them here.",
          placeholder: "Type your answer here...",
          required: false,
        },
      ],
    },
    {
      id: "section2",
      title: "Poetry Vibes",
      description:
        "Please indicate your level of agreement with the following statements:",
      questions: [
        {
          id: "q5",
          type: "likertScale",
          question: "The poem evoked an emotional response in me.",
          options: [
            { label: "Strongly Disagree", value: 1 },
            { label: "Disagree", value: 2 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 4 },
            { label: "Strongly Agree", value: 5 },
          ],
          required: true,
          sideTitle: true,
        },
        {
          id: "q6",
          type: "likertScale",
          question: "I felt connected to the poet.",
          options: [
            { label: "Strongly Disagree", value: 1 },
            { label: "Disagree", value: 2 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 4 },
            { label: "Strongly Agree", value: 5 },
          ],
          required: true,
          sideTitle: true,
          removeValues: true,
        },
        {
          id: "q7",
          type: "likertScale",
          question:
            "I would be interested in reading more work from this poet.",
          options: [
            { label: "Strongly Disagree", value: 1 },
            { label: "Disagree", value: 2 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 4 },
            { label: "Strongly Agree", value: 5 },
          ],
          required: true,
          sideTitle: true,
          removeValues: true,
        },
      ],
    },
  ],
};

export const AudienceRankingQuestions: SurveyDefinition = {
  id: "survey2",
  title: "Audience Ranking Survey",
  sections: [
    {
      id: "section1",
      title: "Poem Ranking",
      questions: [
        {
          id: "q1",
          type: "dragRank",
          question:
            "Here are the same four blackout poems created from the same passage. Please review them and rank the four poems from most liked (1) to least liked (4).",
          items: [],
          required: true,
        },
        {
          id: "q2",
          type: "dragRank",
          question:
            "Now, reflect on your experience while reading the poems. Below are four blackout poems created from the same passage. Please review them and rank the poems from most emotionally impactful (1) to least emotionally impactful (4).",
          items: [],
          required: true,
        },
        {
          id: "q3",
          type: "dragRank",
          question:
            "Based on the definition of creativity as work that is created as new with emotional content or meaning, please review the four blackout poems below and rank them from most creative (1) to least creative (4).",
          items: [],
          required: true,
        },
      ],
    },
    {
      id: "section2",
      title: "Meaning",
      description:
        "Each poet provided an artist’s statement describing their poem. For each poem, select the statement you believe was written by its artist. If unsure, please explain your reasoning in the text box provided.",
      questions: [
        {
          id: "q4",
          type: "multipleChoice",
          question: "",
          options: [],
          required: true,
        },
      ],
    },
  ],
};

export const AudienceAIQuestionSurvey: SurveyDefinition = {
  id: "survey2",
  title: "Audience AI Survey",
  sections: [
    {
      id: "section1",
      title: "AI Section",
      questions: [],
    },
  ],
};

export const AudiencePostSurveyQuestions: SurveyDefinition = {
  id: "survey3",
  title: "Audience Post-Survey",
  sections: [
    {
      id: "section1",
      title: "Opinion on AI in Creative Spaces",
      questions: [
        {
          id: "q1",
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
          id: "q2",
          type: "openEnded",
          question: "How do you feel about the use of AI in creative work?",
          placeholder: "Type your answer here...",
          required: true,
        },
        {
          id: "q3",
          type: "openEnded",
          question: "Is there anything else you would like to share with us?",
          placeholder: "Type your answer here...",
          required: false,
        },
      ],
    },
  ],
};

export const AudienceReRankingQuestions: SurveyDefinition = {
  id: "survey2",
  title: "Audience Ranking Survey",
  sections: [
    {
      id: "section1",
      title: "Poem Ranking",
      questions: [
        {
          id: "q1",
          type: "dragRank",
          question:
            "Here are the same four blackout poems created from the same passage. Please review them and rank the four poems from most liked (1) to least liked (4).",
          items: [],
          required: true,
        },
        {
          id: "q2",
          type: "dragRank",
          question:
            "Now, reflect on your experience while reading the poems. Below are four blackout poems created from the same passage. Please review them and rank the poems from most emotionally impactful (1) to least emotionally impactful (4).",
          items: [],
          required: true,
        },
        {
          id: "q3",
          type: "dragRank",
          question:
            "Based on the definition of creativity as work that is created as new with emotional content or meaning, please review the four blackout poems below and rank them from most creative (1) to least creative (4).",
          items: [],
          required: true,
        },
      ],
    },
  ],
};
