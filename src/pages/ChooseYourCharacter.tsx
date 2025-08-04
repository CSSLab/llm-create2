import PageTemplate from "../components/shared/pages/page";
import { useNavigate } from "react-router-dom";
import { Button } from "@chakra-ui/react";
import { useContext } from "react";
import { DataContext } from "../App";
import { ArtistCondition } from "../types";

const getRandomArtistCondition = (): ArtistCondition => {
  const values = Object.values(ArtistCondition);
  const randomIndex = Math.floor(Math.random() * values.length);
  return values[randomIndex];
};

const ChooseYourCharacter = () => {
  const navigate = useNavigate();
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { addUserData, addRoleSpecificData } = context;

  const handleArtistSubmit = () => {
    addUserData({ role: "artist" });
    addRoleSpecificData({ condition: getRandomArtistCondition() });
    navigate("/artist/pre-survey");
  };

  const handleAudienceSubmit = () => {
    addUserData({ role: "audience" });
    navigate("/audience/pre-survey");
  };

  return (
    <PageTemplate
      title={"Choose your task"}
      description={
        "For this research, we are recruiting both artist and audience participants. Both will be doing separate tasks."
      }
      background="bg3"
    >
      <div className="w-full h-full flex flex-col md:flex-row space-y-4 md:space-y-0 justify-center items-center">
        <div className="h-max w-full md:w-1/2 md:h-full flex justify-center items-center">
          <Button className="btn-primary px-4" onClick={handleArtistSubmit}>
            Artist
          </Button>
        </div>
        <div className="h-max w-full md:w-1/2 md:h-full flex justify-center items-center">
          <Button
            className="btn-primary bg-dark-grey px-4"
            onClick={handleAudienceSubmit}
          >
            Audience
          </Button>
        </div>
      </div>
    </PageTemplate>
  );
};

export default ChooseYourCharacter;
