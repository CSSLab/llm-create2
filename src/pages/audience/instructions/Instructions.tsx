// import { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import HalfPageTemplate from '../components/shared/pages/halfPage';
// import { Button, Input } from '@chakra-ui/react';
import { Icon } from "@chakra-ui/react";
import PageTemplate from "../../../components/shared/pages/page";
import { useNavigate } from "react-router-dom";
import { MdOutlineAccessTime } from "react-icons/md";

const AudienceInstructions = () => {
  const navigate = useNavigate();

  const handleSubmit = () => {
    navigate("/audience/step-1");
  };

  return (
    <PageTemplate
      title="Your Task"
      background="bg2"
      nextButton={{ text: "Next", action: handleSubmit }}
    >
      <div className="w-full h-full flex-col space-y-6">
        <p className="text-main mb-2">
          The goal of this experiment is for you to read{" "}
          <strong>three blackout poems</strong>.
        </p>
        <div>
          <p className="text-main mb-2">The task involves two steps:</p>
          <ul className="list-disc mb-4 pl-6 space-y-4">
            <li className="text-main">
              <strong>Step 1: Reading</strong>
              <div className="flex flex-row items-center space-x-2">
                <Icon className="w-4 h-4 fill-grey">
                  <MdOutlineAccessTime />
                </Icon>
                <p className="text-main text-grey">4 minutes</p>
              </div>
              <p className="text-main">
                You will be given the three pieces. This is a time for you to
                read through all the works and form your initial thoughts.
              </p>
            </li>
            <li className="text-main">
              <strong>Step 2: Share your thoughts</strong>
              <div className="flex flex-row items-center space-x-2">
                <Icon className="w-4 h-4 fill-grey">
                  <MdOutlineAccessTime />
                </Icon>
                <p className="text-main text-grey"> ~4 minutes per poem </p>
              </div>
              <p className="text-main">
                For each poem, you will fill out a quick survey letting us know
                what you think of the work.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </PageTemplate>
  );
};

export default AudienceInstructions;
